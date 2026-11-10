// Coordinator verification for F1, F3 and F4 (fix round).
//
// The scenarios run against the host's REAL runtime when this machine has one
// (see lib/host-cordis.mjs) and always against the local model in
// lib/cordis-model.mjs, so the bundle's registration logic is tested wherever
// the suite runs. Read-only: nothing is written outside this directory.
import * as bundle from '../index.js'
import { ModelContext } from './lib/cordis-model.mjs'
import { loadHostCordis } from './lib/host-cordis.mjs'

const tick = () => new Promise((resolve) => setTimeout(resolve, 80))
let failures = 0
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label} -> ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

/**
 * The host a scenario runs on: the services the bundle needs, and a registry
 * that reports the tools it holds.
 * @param {object} registered - collects the names of the tools the bundle registers.
 * @param {Array<object>} sections - collects the prompt sections the bundle adds.
 * @returns {object} the host context.
 */
function hostServices(registered, sections = []) {
  return {
    systemPrompt: { section: (definition) => { sections.push(definition); return () => {} } },
    agents: { list: () => [], get: () => undefined, roots: () => [], isOwnedBy: () => false },
    skills: { register: () => () => {} },
    tools: {
      register: (definition) => { registered.push(definition.name); return () => {} },
      schemas: () => [{ name: 'subagent' }, { name: 'spawn_teammate' }],
    },
  }
}

const teams = { tryMembership: () => undefined }
const worktrees = { create: async () => ({}) }
const subagents = { listChildren: async () => [] }

/**
 * The scenarios every host runs.
 * @param {Function} makeHost - builds a host context.
 * @param {string} label - the name of the host, for the check labels.
 * @returns {Promise<void>} resolves when the scenarios are done.
 */
async function scenarios(makeHost, label) {
  const prefix = (text) => `[${label}] ${text}`

  // --- A: every service present before the plugin is applied -----------------
  {
    const registered = []
    const ctx = makeHost(registered)
    ctx.provide('agentTeams', teams)
    ctx.provide('worktrees', worktrees)
    ctx.provide('subagents', subagents)
    ctx.provide('commands', { register: () => () => {} })
    ctx.plugin({ inject: bundle.inject, apply: bundle.apply })
    await tick()
    check(prefix('A services-before-apply registers all three primitives'), registered.slice().sort(), ['swarm_child', 'swarm_task', 'swarm_worktree'])
  }

  // --- B: the services appear AFTER the plugin was applied -------------------
  {
    const registered = []
    const ctx = makeHost(registered)
    ctx.plugin({ inject: bundle.inject, apply: bundle.apply })
    await tick()
    check(prefix('B nothing registered before the service arrives'), registered.slice(), [])
    ctx.provide('agentTeams', teams)
    ctx.provide('worktrees', worktrees)
    ctx.provide('subagents', subagents)
    await tick()
    check(prefix('B the late services register their primitives'), registered.slice().sort(), ['swarm_child', 'swarm_task', 'swarm_worktree'])
  }

  // --- C: one late service registers exactly one primitive -------------------
  {
    const registered = []
    const ctx = makeHost(registered)
    ctx.plugin({ inject: bundle.inject, apply: bundle.apply })
    await tick()
    ctx.provide('agentTeams', teams)
    await tick()
    check(prefix('C a late agentTeams registers only swarm_task'), registered.slice(), ['swarm_task'])
  }

  // --- D: a host that never provides a service registers none ----------------
  {
    const registered = []
    const ctx = makeHost(registered)
    ctx.plugin({ inject: bundle.inject, apply: bundle.apply })
    await tick()
    ctx.provide('commands', { register: () => () => {} })
    await tick()
    check(prefix('D no service means no primitive'), registered.slice(), [])
  }

  // --- E: the command registers late and the prompt then advertises it -------
  {
    const registered = []
    const sections = []
    const commands = []
    const ctx = makeHost(registered, sections)
    ctx.plugin({ inject: bundle.inject, apply: bundle.apply })
    await tick()
    const section = sections[0]
    const before = section.text({ agent: { id: 'a1' } })
    check(prefix('E the prompt hides /swarm before the command exists'), before.includes('**`/swarm`**'), false)
    ctx.provide('commands', { register: (definition) => { commands.push(definition); return () => {} } })
    await tick()
    check(prefix('E the late command registry registers the command'), commands.map((command) => command.name), ['swarm'])
    const after = section.text({ agent: { id: 'a1' } })
    check(prefix('E the prompt advertises /swarm once the command exists'), after.includes('**`/swarm`**'), true)
    // F3: the command prints the block the prompt shows.
    const printed = commands[0].handler({ agent: { id: 'a1' } })
    check(prefix('F3 the command output carries the /swarm line'), printed.text.includes('**`/swarm`**'), true)
    check(prefix('F3 the command output carries the probed-live header'), printed.text.includes('## Host capabilities — probed live'), true)
  }
}

// --- F4: a marker that spans two lines leaves no fragment --------------------
{
  const raw = [
    '- first line <!-- swarm:requires subagent,',
    '  subagent_fork -->',
    '- second line',
  ].join('\n')
  const rendered = bundle.renderPrompt(raw, ['subagent', 'subagent_fork'], {})
  check('F4 no marker text survives', rendered.includes('swarm:requires'), false)
  check('F4 no fragment survives', rendered.includes('subagent_fork -->'), false)
  check('F4 a readable two-line marker keeps its bullet', rendered.includes('first line'), true)
  check('F4 the rest of the document survives', rendered.includes('- second line'), true)
}

// --- F4b: an unreadable two-line marker drops its bullet, not the document ---
{
  const raw = [
    '- first line <!-- swarm:requires subagent',
    '  subagent_fork -->',
    '- second line',
  ].join('\n')
  const rendered = bundle.renderPrompt(raw, ['subagent', 'subagent_fork'], {})
  check('F4b no marker text survives', rendered.includes('swarm:requires'), false)
  check('F4b no fragment survives', rendered.includes('subagent_fork -->'), false)
  check('F4b an unreadable marker drops its bullet', rendered.includes('first line'), false)
  check('F4b the rest of the document survives', rendered.includes('- second line'), true)
}

// --- F4b: an unclosed marker does not eat the rest of the document ------------
{
  const raw = [
    '- first line <!-- swarm:requires subagent',
    '- second line stays',
  ].join('\n')
  const rendered = bundle.renderPrompt(raw, ['subagent'], {})
  check('F4b an unclosed marker does not delete the document', rendered.includes('second line stays'), true)
  check('F4b an unclosed marker leaves no marker text', rendered.includes('swarm:requires'), false)
}

const host = await loadHostCordis()
if (host !== null) {
  console.log(`host runtime: ${host.path}`)
  await scenarios((registered, sections) => {
    const ctx = new host.module.Context()
    for (const [name, service] of Object.entries(hostServices(registered, sections))) ctx.provide(name, service)
    return ctx
  }, 'host runtime')
} else {
  console.log('host runtime: not found on this machine - the local model runs the scenarios instead')
}
await scenarios((registered, sections) => {
  const ctx = new ModelContext()
  for (const [name, service] of Object.entries(hostServices(registered, sections))) ctx.provide(name, service)
  return ctx
}, 'local model')

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exitCode = failures === 0 ? 0 : 1
