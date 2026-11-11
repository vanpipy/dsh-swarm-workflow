// Coordinator verification for F1, F3 and F4 (fix round).
//
// The scenarios run against the host's REAL runtime when this machine has one
// (see lib/host-cordis.mjs) and always against the local model in
// lib/cordis-model.mjs, so the bundle's registration logic is tested wherever
// the suite runs. Read-only: nothing is written outside this directory.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
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
 * Run one check whose value is computed by a function, so a missing export
 * or a thrown error fails the check instead of the whole suite.
 * @param {string} label - what the check proves.
 * @param {Function} compute - returns the value to compare.
 * @param {any} expected - the expected value.
 */
function checkResult(label, compute, expected) {
  let actual
  try {
    actual = compute()
  } catch (error) {
    failures += 1
    console.log(`FAIL ${label} -> threw: ${error.message}`)
    return
  }
  check(label, actual, expected)
}

/**
 * Read one file of the bundle.
 * @param {string} relative - the path relative to the bundle root.
 * @returns {string} the file content.
 */
function readBundle(relative) {
  return readFileSync(fileURLToPath(new URL(`../${relative}`, import.meta.url)), 'utf8')
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

// --- V1: parseRuntimeNote reads the scope blocks of the host note -----------
// The plugin ships the user's text and keeps every host-specific fact in
// runtime-note.md, in blocks that say who they are for.
{
  const note = readBundle('runtime-note.md')
  const marker = /^\s*<!--\s*swarm:note\s+([a-z\s]+)-->\s*$/gm
  const markers = [...note.matchAll(marker)]

  checkResult('V1 the host note has scope blocks', () => markers.length > 0, true)
  checkResult('V1 every scope block in the file becomes a block', () => bundle.parseRuntimeNote(note).length, markers.length)
  checkResult('V1 the blocks come back in file order', () => {
    const blocks = bundle.parseRuntimeNote(note)
    const positions = blocks.map((block) => {
      const firstLine = block.text.split('\n').map((line) => line.trim()).find((line) => line !== '')
      return note.indexOf(firstLine)
    })
    return positions.every((position, index) =>
      position >= 0 && (index === 0 || position > positions[index - 1]))
  }, true)
  checkResult('V1 the first block is scoped for every audience', () => {
    const scopes = bundle.parseRuntimeNote(note)[0].scopes
    return ['coordinator', 'worker', 'skill'].every((scope) => scopes.includes(scope))
  }, true)
  checkResult('V1 one block is scoped for the coordinator only', () =>
    bundle.parseRuntimeNote(note).some((block) => block.scopes.length === 1 && block.scopes[0] === 'coordinator'), true)
  checkResult('V1 one block is scoped for the worker only', () =>
    bundle.parseRuntimeNote(note).some((block) => block.scopes.length === 1 && block.scopes[0] === 'worker'), true)
  checkResult('V1 one block is scoped for the skill only', () =>
    bundle.parseRuntimeNote(note).some((block) => block.scopes.length === 1 && block.scopes[0] === 'skill'), true)
  checkResult('V1 the text before the first marker is not a block', () =>
    bundle.parseRuntimeNote(note).every((block) => !block.text.includes('This file is the boundary')), true)
  checkResult('V1 no block carries a marker line', () =>
    bundle.parseRuntimeNote(note).every((block) => !block.text.includes('swarm:note')), true)
}

// --- V2: parseRuntimeNote on a small inline fixture --------------------------
{
  // The marker regex needs at least one whitespace character after
  // `swarm:note`, and the capture group cannot be empty, so the marker with no
  // words carries two spaces. Both the strict and the lenient reading of the
  // marker agree on it: a block with no scope words.
  const fixture = [
    '<!-- a leading comment that is not a block -->',
    '',
    '<!-- swarm:note coordinator worker -->',
    'first block, first line',
    'first block, second line',
    '',
    '<!-- swarm:note skill -->',
    'second block',
    '',
    '<!-- swarm:note  -->',
    'third block',
    'the last line of the file',
  ].join('\n')

  checkResult('V2 the fixture yields three blocks', () => bundle.parseRuntimeNote(fixture).length, 3)
  checkResult('V2 a two-word marker yields both scopes', () => bundle.parseRuntimeNote(fixture)[0].scopes, ['coordinator', 'worker'])
  checkResult('V2 the first block carries its own text', () => {
    const text = bundle.parseRuntimeNote(fixture)[0].text
    return text.includes('first block, first line') && text.includes('first block, second line')
  }, true)
  checkResult('V2 the second block is scoped skill only', () => bundle.parseRuntimeNote(fixture)[1].scopes, ['skill'])
  checkResult('V2 a block stops before the next marker', () =>
    bundle.parseRuntimeNote(fixture)[1].text.includes('second block') &&
    !bundle.parseRuntimeNote(fixture)[1].text.includes('first block'), true)
  checkResult('V2 a marker with no words yields an empty scope list', () => bundle.parseRuntimeNote(fixture)[2].scopes, [])
  checkResult('V2 the last block runs to the end of the file', () =>
    bundle.parseRuntimeNote(fixture)[2].text.includes('the last line of the file'), true)
  checkResult('V2 the leading comment is not a block', () =>
    bundle.parseRuntimeNote(fixture).every((block) => !block.text.includes('a leading comment')), true)
}

// --- V3: extractSection takes one heading section, verbatim ------------------
{
  const overlay = readBundle('prompt-overlay.md')
  const skill = readBundle('skills/swarm-engineering.md')

  checkResult('V3 a section starts with its own heading', () =>
    bundle.extractSection(skill, '13. Requirement Handover').startsWith('## 13. Requirement Handover'), true)
  checkResult('V3 a section carries the user prose under it', () =>
    bundle.extractSection(skill, '13. Requirement Handover').includes('A worker cites the requirement as'), true)
  checkResult('V3 a section stops before the next section of the same level', () =>
    !bundle.extractSection(skill, '13. Requirement Handover').includes('## 14. Native Verification Surfaces'), true)
  checkResult('V3 the assignment contract stops before definition of success', () =>
    !bundle.extractSection(skill, '8. Assignment and Reporting Contract').includes('## 9. Definition of Success'), true)
  checkResult('V3 the assignment contract carries its own body', () =>
    bundle.extractSection(skill, '8. Assignment and Reporting Contract').includes('Each worker must understand the assignment before execution'), true)
  checkResult('V3 the orchestration section starts where it was asked for', () => {
    const section = bundle.extractSection(overlay, '12. Swarm Orchestration')
    return section.startsWith('## 12. Swarm Orchestration') && !section.includes('## 1. Mission and Ownership')
  }, true)
  checkResult('V3 the orchestration section keeps its subsections', () =>
    bundle.extractSection(overlay, '12. Swarm Orchestration').includes('### 12.5 Assignment Brief'), true)
  checkResult('V3 a section of the same level ends the one before it', () => {
    const section = bundle.extractSection(skill, '2. Common Engineering Principles')
    return !section.includes('## 2.7') && section.includes('### 2.1 Work Within the Assignment')
  }, true)
  checkResult('V3 a heading that is not there yields null', () =>
    bundle.extractSection(skill, '99. No Such Section'), null)
  checkResult('V3 a title is matched without regard to case', () =>
    bundle.extractSection(skill, '13. requirement handover').startsWith('## 13. Requirement Handover'), true)
  checkResult('V3 a title is matched with the number prefix stripped', () =>
    bundle.extractSection(skill, 'Requirement Handover').startsWith('## 13. Requirement Handover'), true)
}

// --- V4: extractUntil takes everything before the heading --------------------
{
  const overlay = readBundle('prompt-overlay.md')
  const skill = readBundle('skills/swarm-engineering.md')

  checkResult('V4 everything before the heading is kept', () =>
    bundle.extractUntil(overlay, '12. Swarm Orchestration').includes('## 11. Policy and Tool Boundaries'), true)
  checkResult('V4 the heading itself is not included', () =>
    !bundle.extractUntil(overlay, '12. Swarm Orchestration').includes('## 12. Swarm Orchestration'), true)
  checkResult('V4 the text before the first heading is kept', () =>
    bundle.extractUntil(overlay, '12. Swarm Orchestration').includes('# Global Execution Policy'), true)
  checkResult('V4 a heading that is not there yields null', () =>
    bundle.extractUntil(skill, '99. No Such Section'), null)
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
