// Coordinator verification for F1, F3 and F4 (fix round).
//
// The scenarios run against the host's REAL runtime when this machine has one
// (see lib/host-cordis.mjs) and always against the local model in
// lib/cordis-model.mjs, so the bundle's registration logic is tested wherever
// the suite runs. Read-only: nothing is written outside this directory.
//
// Scenarios G, H and I cover the cold boot: the tool registry arrives after
// the plugin was applied, or is provided by a sibling bundle that is still
// loading, or never arrives at all. The registry is read strictly, so a
// bundle that sampled it once would drop every primitive for the session.
import { cpSync, mkdtempSync, readFileSync, rmSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as bundle from '../index.js'
import { ModelContext } from './lib/cordis-model.mjs'
import { asarCandidates, loadHostCordis } from './lib/host-cordis.mjs'

const tick = () => new Promise((resolve) => setTimeout(resolve, 80))
let failures = 0
let checks = 0
function check(label, actual, expected) {
  checks += 1
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
    checks += 1
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
 * The headings of a text, in the order they appear.
 * @param {string} text - the text to read.
 * @returns {string[]} the heading titles.
 */
function headings(text) {
  return text
    .split(/\r?\n/)
    .map((line) => /^#{1,6}\s+(.+?)\s*$/u.exec(line))
    .filter((match) => match !== null)
    .map((match) => match[1])
}

/**
 * The number a section title starts with.
 * @param {string} title - a heading title.
 * @returns {number|null} the leading number, or null when the title has none.
 */
function sectionNumber(title) {
  const match = /^(\d+(?:\.\d+)*)/u.exec(title)
  return match === null ? null : Number(match[1].split('.')[0])
}

/**
 * The host a scenario runs on: the services the bundle needs, and a registry
 * that reports the tools it holds.
 * @param {object} registered - collects the names of the tools the bundle registers.
 * @param {Array<object>} sections - collects the prompt sections the bundle adds.
 * @param {object} [options] - the scenario's options.
 * @param {boolean} [options.tools] - whether the host exposes a tool registry at all.
 * @param {object} [options.skills] - the skill registry the host exposes.
 * @returns {object} the host context.
 */
function hostServices(registered, sections = [], options = {}) {
  const services = {
    systemPrompt: { section: (definition) => { sections.push(definition); return () => {} } },
    agents: { list: () => [], get: () => undefined, roots: () => [], isOwnedBy: () => false },
    skills: options.skills ?? { register: () => () => {} },
  }
  if (options.tools !== false) {
    services.tools = {
      register: (definition) => { registered.push(definition.name); return () => {} },
      schemas: () => [{ name: 'subagent' }, { name: 'spawn_teammate' }],
    }
  }
  return services
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

  // --- G: the tool registry arrives after the plugin was applied ---------------
  // The registry is read strictly: a service whose provider is not active yet
  // reads as absent. A cold boot that sampled the registry once would skip the
  // whole registration and drop every primitive for the session.
  {
    const registered = []
    const ctx = makeHost(registered, [], { tools: false })
    ctx.provide('agentTeams', teams)
    ctx.provide('worktrees', worktrees)
    ctx.provide('subagents', subagents)
    ctx.plugin({ inject: bundle.inject, apply: bundle.apply })
    await tick()
    check(prefix('G nothing is registered before the tool registry arrives'), registered.slice(), [])
    ctx.provide('tools', hostServices(registered).tools)
    await tick()
    check(prefix('G a late tool registry still registers every primitive'), registered.slice().sort(), ['swarm_child', 'swarm_task', 'swarm_worktree'])
  }

  // --- H: the tool registry is provided by a sibling that is still booting ----
  // This is the cold boot the registry really comes from: another bundle
  // provides it, and that bundle has not finished loading when this plugin is
  // applied.
  {
    const registered = []
    const ctx = makeHost(registered, [], { tools: false })
    ctx.provide('agentTeams', teams)
    ctx.provide('worktrees', worktrees)
    ctx.provide('subagents', subagents)
    ctx.plugin({
      inject: ['lateToolRegistry'],
      apply: (childCtx) => { childCtx.provide('tools', hostServices(registered).tools) },
    })
    ctx.plugin({ inject: bundle.inject, apply: bundle.apply })
    await tick()
    check(prefix('H a booting tool registry registers no primitive'), registered.slice(), [])
    ctx.provide('lateToolRegistry', {})
    await tick()
    check(prefix('H the primitives register once the registry is really there'), registered.slice().sort(), ['swarm_child', 'swarm_task', 'swarm_worktree'])
  }

  // --- I: every service but the registry means no primitive ------------------
  // The registry is where a tool is put. Without it there is nowhere to put
  // one, so a primitive must not register.
  {
    const registered = []
    const ctx = makeHost(registered, [], { tools: false })
    ctx.provide('agentTeams', teams)
    ctx.provide('worktrees', worktrees)
    ctx.provide('subagents', subagents)
    ctx.plugin({ inject: bundle.inject, apply: bundle.apply })
    await tick()
    check(prefix('I no tool registry means no primitive'), registered.slice(), [])
  }

  // --- J: the host's tool registry refuses a tool ----------------------------
  // A host can refuse a tool: the registry throws. The bundle then owes three
  // things, and this scenario holds it to all three. The refused tool is not
  // left half-registered, the other primitives still register, and the refusal
  // is reported instead of swallowed.
  {
    const registered = []
    const refused = []
    const warnings = []
    const originalWarn = console.warn
    console.warn = (...args) => { warnings.push(args.map((arg) => String(arg)).join(' ')) }
    try {
      const ctx = makeHost(registered, [], { tools: false })
      ctx.provide('agentTeams', teams)
      ctx.provide('worktrees', worktrees)
      ctx.provide('subagents', subagents)
      ctx.provide('tools', {
        register: (definition) => {
          if (definition.name === 'swarm_task') {
            refused.push(definition.name)
            throw new Error('this host refuses the task primitive')
          }
          registered.push(definition.name)
          return () => {}
        },
        schemas: () => [{ name: 'subagent' }, { name: 'spawn_teammate' }],
      })
      ctx.plugin({ inject: bundle.inject, apply: bundle.apply })
      await tick()
    } finally {
      console.warn = originalWarn
    }
    check(prefix('J the refusing registry was asked for the refused tool'), refused.slice(), ['swarm_task'])
    check(prefix('J the refused tool is not registered'), registered.includes('swarm_task'), false)
    check(prefix('J the other primitives still register'), registered.slice().sort(), ['swarm_child', 'swarm_worktree'])
    check(prefix('J the refusal is reported'), warnings.some((line) => line.includes('swarm_task') && line.includes('refused')), true)
  }

  // --- K: the host's skill registry refuses a skill --------------------------
  // A host can refuse a skill the way it can refuse a tool: the registry
  // throws. The bundle then owes four things, and this scenario holds it to
  // all four. The refused skill is not left half-registered, the other skills
  // still register, the prompt still composes, and the refusal is reported
  // once — a failure that keeps happening is one failure, not one report per
  // render.
  {
    const registered = []
    const sections = []
    const refused = []
    const warnings = []
    const originalWarn = console.warn
    console.warn = (...args) => { warnings.push(args.map((arg) => String(arg)).join(' ')) }
    try {
      const ctx = makeHost(registered, sections, {
        skills: {
          register: (definition) => {
            if (definition.name === 'swarm-craft-python') {
              refused.push(definition.name)
              throw new Error('this host refuses the craft skill')
            }
            registered.push(definition.name)
            return () => {}
          },
        },
      })
      ctx.provide('agentTeams', teams)
      ctx.provide('worktrees', worktrees)
      ctx.provide('subagents', subagents)
      ctx.plugin({ inject: bundle.inject, apply: bundle.apply })
      await tick()
      const section = sections[0]
      const prompt = section.text({ agent: { id: 'a1' } })
      await tick()
      const reports = () => warnings.filter((line) => line.includes('swarm-craft-python')).length
      // The catalog is rebuilt on every render, so a host that keeps refusing
      // is asked again on every render. The refusal is still one refusal.
      section.text({ agent: { id: 'a1' } })
      section.text({ agent: { id: 'a1' } })
      await tick()
      check(prefix('K the prompt still composes when a skill is refused'), typeof prompt === 'string' && prompt.length > 0, true)
      check(prefix('K the refused skill is not registered'), registered.includes('swarm-craft-python'), false)
      check(prefix('K the other skills still register'), registered.includes('swarm-engineering') && registered.includes('swarm-craft-shared'), true)
      check(prefix('K the refusal is reported'), warnings.some((line) => line.includes('swarm-craft-python') && line.includes('refused')), true)
      check(prefix('K a continuing refusal is reported once'), reports(), 1)
      check(prefix('K the refused skill is tried again on the next render'), refused.length > 1, true)
    } finally {
      console.warn = originalWarn
    }
  }

  // --- L: the catalog cannot be re-synchronized -------------------------------
  // A host can accept a skill and then fail to release it. The bundle releases
  // the skills it registered when their files change, and a host disposer that
  // throws must not take the prompt down with it: the failure has to be
  // reported, and the prompt has to keep composing.
  //
  // The bundle cannot be changed to make this happen, so the COPY is changed:
  // the bundle runs from a sandbox, the file that moves is the sandbox's own,
  // and the shipped files are never touched.
  {
    const sandbox = mkdtempSync(join(tmpdir(), 'swarm-sync-failure-'))
    try {
      const root = fileURLToPath(new URL('..', import.meta.url))
      cpSync(join(root, 'index.js'), join(sandbox, 'swarm-bundle.mjs'))
      cpSync(join(root, 'runtime-note.md'), join(sandbox, 'runtime-note.md'))
      cpSync(join(root, 'prompt-overlay.md'), join(sandbox, 'prompt-overlay.md'))
      cpSync(join(root, 'swarm-prompt.md'), join(sandbox, 'swarm-prompt.md'))
      cpSync(join(root, 'skills'), join(sandbox, 'skills'), { recursive: true })
      const copy = await import(pathToFileURL(join(sandbox, 'swarm-bundle.mjs')).href)
      const sections = []
      const warnings = []
      const originalWarn = console.warn
      console.warn = (...args) => { warnings.push(args.map((arg) => String(arg)).join(' ')) }
      try {
        const ctx = makeHost([], sections, {
          skills: { register: () => () => { throw new Error('this host cannot release a skill') } },
        })
        ctx.plugin({ inject: copy.inject, apply: copy.apply })
        await tick()
        const section = sections[0]
        // The first render registers the skills and collects their disposers.
        const before = section.text({ agent: { id: 'a1' } })
        // The sandbox's own copy of the note moves, so the next render sees a
        // changed stamp and releases the skills before it registers them again.
        const note = join(sandbox, 'runtime-note.md')
        const moved = new Date(Date.now() + 10000)
        utimesSync(note, moved, moved)
        const after = section.text({ agent: { id: 'a1' } })
        const again = section.text({ agent: { id: 'a1' } })
        const reports = () => warnings.filter((line) => line.includes('could not be synchronized')).length
        check(prefix('L the prompt composes before the catalog is released'), typeof before === 'string' && before.length > 0, true)
        check(prefix('L the prompt still composes when the catalog cannot be released'), typeof after === 'string' && after.length > 0, true)
        check(prefix('L the catalog failure is reported'), warnings.some((line) => line.includes('could not be synchronized') && line.includes('this host cannot release a skill')), true)
        check(prefix('L a continuing catalog failure is reported once'), reports(), 1)
        check(prefix('L the prompt keeps composing after the failed release'), typeof again === 'string' && again.length > 0, true)
      } finally {
        console.warn = originalWarn
      }
    } finally {
      rmSync(sandbox, { recursive: true, force: true })
    }
  }

  // --- M: the host refuses the /swarm command --------------------------------
  // A host can refuse a command the way it can refuse a tool or a skill: the
  // registry throws. The bundle then owes four things, and this scenario holds
  // it to all four. The command stays unregistered, the prompt still composes
  // and never advertises a command that is not there, the refusal is reported
  // by name, and a refusal that keeps happening is reported once.
  {
    const registered = []
    const sections = []
    const attempts = []
    const warnings = []
    const originalWarn = console.warn
    console.warn = (...args) => { warnings.push(args.map((arg) => String(arg)).join(' ')) }
    try {
      const ctx = makeHost(registered, sections)
      ctx.provide('agentTeams', teams)
      ctx.provide('worktrees', worktrees)
      ctx.provide('subagents', subagents)
      ctx.provide('commands', {
        register: () => {
          attempts.push('swarm')
          throw new Error('this host refuses the swarm command')
        },
      })
      ctx.plugin({ inject: bundle.inject, apply: bundle.apply })
      await tick()
      const section = sections[0]
      const prompt = section.text({ agent: { id: 'a1' } })
      await tick()
      // The command is asked for again on the next render: a host that refuses
      // it may have been busy. The refusal is still one refusal.
      section.text({ agent: { id: 'a1' } })
      await tick()
      const reports = () => warnings.filter((line) => line.includes('refused to register the command')).length
      check(prefix('M the prompt still composes when the command is refused'), typeof prompt === 'string' && prompt.length > 0, true)
      check(prefix('M the prompt does not advertise a command that is not there'), prompt.includes('**`/swarm`**'), false)
      check(prefix('M the refusal is reported'), warnings.some((line) => line.includes('refused to register the command') && line.includes('"swarm"') && line.includes('this host refuses the swarm command')), true)
      check(prefix('M a continuing refusal is reported once'), reports(), 1)
      check(prefix('M the refused command is tried again on the next render'), attempts.length > 1, true)
    } finally {
      console.warn = originalWarn
    }
  }

  // --- N: the host refuses once and then accepts ----------------------------
  // A refusal is not a verdict: the host may have been busy. The bundle asks
  // again on the next render, and once the command is there it stays there
  // exactly once — a command registered twice is a second copy of a command
  // that already works.
  {
    const registered = []
    const sections = []
    const attempts = []
    const warnings = []
    const originalWarn = console.warn
    console.warn = (...args) => { warnings.push(args.map((arg) => String(arg)).join(' ')) }
    try {
      const ctx = makeHost(registered, sections)
      ctx.provide('agentTeams', teams)
      ctx.provide('worktrees', worktrees)
      ctx.provide('subagents', subagents)
      ctx.provide('commands', {
        register: () => {
          attempts.push('swarm')
          if (attempts.length === 1) throw new Error('this host was busy')
          return () => {}
        },
      })
      ctx.plugin({ inject: bundle.inject, apply: bundle.apply })
      await tick()
      const section = sections[0]
      const prompt = section.text({ agent: { id: 'a1' } })
      await tick()
      // A second render must not register the command a second time.
      section.text({ agent: { id: 'a1' } })
      await tick()
      check(prefix('N the refusal is reported before the retry'), warnings.some((line) => line.includes('refused to register the command')), true)
      check(prefix('N the command is registered after the refusal'), attempts.length >= 2, true)
      check(prefix('N the prompt advertises /swarm once the command is there'), prompt.includes('**`/swarm`**'), true)
      check(prefix('N the command is registered exactly once'), attempts.length, 2)
    } finally {
      console.warn = originalWarn
    }
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
  const skill = readBundle('skills/swarm-engineering/swarm-engineering.md')

  checkResult('V3 a section starts with its own heading', () =>
    bundle.extractSection(skill, '13. Requirement Handover').startsWith('## 13. Requirement Handover'), true)
  checkResult('V3 a section carries the user prose under it', () =>
    bundle.extractSection(skill, '13. Requirement Handover').includes('A worker cites the requirement as'), true)
  // The next section is named by the skill itself, so the check does not pin a
  // title another lane may rename: what must not survive the extract is a
  // heading of the next section number, at any level.
  checkResult('V3 a section stops before the next section of the same level', () => {
    const section = bundle.extractSection(skill, '13. Requirement Handover')
    return !headings(section).some((title) => sectionNumber(title) === 14)
  }, true)
  checkResult('V3 the assignment contract stops before definition of success', () => {
    const section = bundle.extractSection(skill, '8. Assignment and Reporting Contract')
    return !headings(section).some((title) => sectionNumber(title) === 9)
  }, true)
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
    // The shipped skill nests its code-health section one tier deeper
    // (`### 2.7`), so the section runs to the next heading of its own level,
    // which is `## 3. Developer Role`, and the deeper section stays inside.
    return !section.includes('## 3. Developer Role') &&
      section.includes('### 2.1 Work Within the Assignment') &&
      section.includes('### 2.7 Code Health and Change Risk Assessment')
  }, true)
  checkResult('V3 a subsection of a deeper level stays inside its section', () =>
    bundle.extractSection(skill, '2. Common Engineering Principles').includes('#### 2.7.1 Keep the Assessments Separate'), true)
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
  const skill = readBundle('skills/swarm-engineering/swarm-engineering.md')

  checkResult('V4 everything before the heading is kept', () =>
    bundle.extractUntil(overlay, '12. Swarm Orchestration').includes('## 11. Policy and Tool Boundaries'), true)
  checkResult('V4 the heading itself is not included', () =>
    !bundle.extractUntil(overlay, '12. Swarm Orchestration').includes('## 12. Swarm Orchestration'), true)
  checkResult('V4 the text before the first heading is kept', () =>
    bundle.extractUntil(overlay, '12. Swarm Orchestration').includes('# Global Execution Policy'), true)
  checkResult('V4 a heading that is not there yields null', () =>
    bundle.extractUntil(skill, '99. No Such Section'), null)
}

// The real-runtime arm runs when this machine has an installed host: the
// packed asar is read, cordis and its kit are extracted into the OS temp
// directory, and the scenarios run against them. When there is no host, the
// arm is SKIPPED and says so - an arm that did not run must never read as an
// arm that passed.
const host = await loadHostCordis()
let hostArm = 'SKIPPED (no host runtime found on this machine)'
if (host !== null) {
  hostArm = `ran (${host.source})`
  console.log(`host runtime: ${host.moduleId} (the host's own copy, extracted from its container; the extraction is temporary and goes when the run ends)`)
  console.log(`host runtime source: ${host.source}`)
  await scenarios((registered, sections, options) => {
    const ctx = new host.module.Context()
    for (const [name, service] of Object.entries(hostServices(registered, sections, options))) ctx.provide(name, service)
    return ctx
  }, 'host runtime')
} else {
  console.log('host runtime: NOT FOUND - the [host runtime] arm is SKIPPED, not passed')
  console.log(`host runtime: looked at ${asarCandidates().join(', ')}`)
  console.log('host runtime: set DSH_APP_ASAR or DSH_INSTALL_ROOT to point the suite at an installed host')
}
await scenarios((registered, sections, options) => {
  const ctx = new ModelContext()
  for (const [name, service] of Object.entries(hostServices(registered, sections, options))) ctx.provide(name, service)
  return ctx
}, 'local model')

console.log(`SUITE ARM: host runtime = ${hostArm}`)
console.log(`SUITE CHECKS: ${checks}`)
if (failures === 0) {
  if (host === null) {
    console.log(`HOST RUNTIME ARM SKIPPED - NOT VERIFIED (no host runtime found on this machine) - ${checks} checks passed, the host runtime was not exercised`)
  } else {
    console.log(`ALL CHECKS PASSED (${checks} checks) - host runtime arm: ${hostArm} - local model arm: ran`)
  }
} else {
  console.log(`${failures} CHECK(S) FAILED - host runtime arm: ${hostArm} - local model arm: ran`)
}
process.exitCode = failures === 0 ? 0 : 1
