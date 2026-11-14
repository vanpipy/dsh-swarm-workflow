// The composed prompts: what the plugin assembles for the Coordinator and for
// a worker.
//
// The bundle ships the user's own text and keeps every host fact in
// runtime-note.md. The plugin composes a VIEW of those files at prompt
// assembly time:
//
//   - the Coordinator gets the runtime-note blocks scoped `coordinator`, then
//     the whole global execution policy (prompt-overlay.md), then the whole
//     delegation brief (swarm-prompt.md);
//   - a worker gets the runtime-note blocks scoped `worker`, then the policy
//     up to (excluding) section 12, then the skill's sections 8, 12 and 13.
//
// Both views are rendered by renderPrompt(), so the live capability block
// replaces its marker in place, and a bullet whose tool this host does not
// offer is dropped.
//
// The inputs are the real files on disk: a shipped file that changes under
// this suite is a change the composition has to survive.
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as bundle from '../index.js'
import { ModelContext } from './lib/cordis-model.mjs'

/**
 * Read one file of the bundle.
 * @param {string} relative - path relative to the bundle root.
 * @returns {string} the file content.
 */
const read = (relative) => readFileSync(fileURLToPath(new URL(`../${relative}`, import.meta.url)), 'utf8')

const note = read('runtime-note.md')
const overlay = read('prompt-overlay.md')
const brief = read('swarm-prompt.md')
const skill = read('skills/swarm-engineering/swarm-engineering.md')

/**
 * Every surface this host offers, so no gated bullet is dropped.
 * `skill` is in the list because the plugin registers the role-methods skill
 * and the note gates that bullet on it.
 */
const ALL = [
  'subagent', 'subagent_fork', 'workflow', 'spawn_teammate', 'send_message', 'interrupt_agent',
  'list_agents', 'wait_agent', 'team_task_create', 'team_task_get', 'team_task_list',
  'team_task_update', 'create_goal', 'get_goal', 'update_goal', 'todo_write',
  'ask_user_question', 'schedule_create', 'skill',
  // The plugin registers these three itself, so a live host has them in the
  // registry the moment the bundle is applied.
  'swarm_worktree', 'swarm_task', 'swarm_child',
]
/** A host that offers almost nothing: one delegation surface and the ledger. */
const MINIMAL = ['subagent', 'todo_write']

let failures = 0
/**
 * Record one check. A missing export is a failure of this suite, not a crash.
 * @param {string} label - what the check proves.
 * @param {Function} fn - returns true when the check holds.
 */
const check = (label, fn) => {
  let ok
  try {
    ok = fn() === true
  } catch (error) {
    failures += 1
    console.log(`FAIL  ${label} -> ${error.message}`)
    return
  }
  if (!ok) { failures += 1; console.log(`FAIL  ${label}`) } else { console.log(`ok    ${label}`) }
}

/**
 * Call one of the bundle's exported helpers.
 * @param {string} name - the exported name.
 * @param {...any} args - the arguments to pass.
 * @returns {any} what the helper returns.
 */
const call = (name, ...args) => {
  const fn = bundle[name]
  if (typeof fn !== 'function') throw new Error(`the bundle does not export ${name}`)
  return fn(...args)
}

/**
 * Compose the Coordinator view.
 * @param {string[]} names - the probed tool names, or undefined for no probe.
 * @param {object} options - the render options.
 * @returns {string} the composed prompt.
 */
const coordinator = (names, options = {}) =>
  call('composeCoordinatorPrompt', { note, overlay, brief, names, options })

/**
 * Compose the worker view.
 * @param {string[]} names - the probed tool names, or undefined for no probe.
 * @param {object} options - the render options.
 * @returns {string} the composed prompt.
 */
const worker = (names, options = {}) =>
  call('composeWorkerPrompt', { note, overlay, skill, names, options })

const coord = coordinator(ALL)
const work = worker(ALL)

// --- the host the bundle is applied to ---------------------------------------
// The registered skill and the `/swarm` output are not composed by a helper
// the bundle exports: they are what the plugin registers when it is applied.
// So the bundle is applied here, to a small model of the host's services, and
// the registrations it makes are captured. A change to the bundle that drops
// the method from either registration is what these captures notice.
const skillRegistrations = []
const commandRegistrations = []
const host = new ModelContext()
host.provide('systemPrompt', { section: () => () => {} })
host.provide('agents', { list: () => [], get: () => undefined, roots: () => [], isOwnedBy: () => false })
host.provide('skills', { register: (definition) => { skillRegistrations.push(definition); return () => {} } })
host.provide('tools', { register: () => () => {}, schemas: () => ALL.map((name) => ({ name })) })
host.provide('commands', { register: (definition) => { commandRegistrations.push(definition); return () => {} } })
host.plugin({ inject: bundle.inject, apply: bundle.apply })

/** The skill the plugin registered, with the note's skill blocks in front of it. */
const registeredSkill = skillRegistrations[0]
/** The `/swarm` command the plugin registered. */
const swarmCommand = commandRegistrations.find((definition) => definition.name === 'swarm')
/** What `/swarm` prints on this host. */
const swarmOutput = swarmCommand === undefined ? '' : String(swarmCommand.handler({ agent: { id: 'a1' } }).text)

// --- the craft wiring --------------------------------------------------------
// The craft guidance is files the bundle ships, not text it composes: the note
// names them through the tokens `{{swarm:shared}}`, `{{swarm:developer}}`,
// `{{swarm:tester}}`, `{{swarm:reviewer}}`, `{{swarm:python}}`,
// `{{swarm:java}}`, `{{swarm:go}}`, `{{swarm:typescript}}` and `{{swarm:rust}}`, and the
// plugin resolves each token to the absolute path of the file that ships with
// the loaded bundle. A lane then reads the file at that path, so the path has
// to be the real one, and no token may ever reach a prompt.
const CRAFT = [
  { key: 'shared', path: 'swarm-engineering/shared.md', name: 'shared.md', token: '{{swarm:shared}}' },
  { key: 'developer', path: 'swarm-engineering/developer.md', name: 'developer.md', token: '{{swarm:developer}}' },
  { key: 'tester', path: 'swarm-engineering/tester.md', name: 'tester.md', token: '{{swarm:tester}}' },
  { key: 'reviewer', path: 'swarm-engineering/reviewer.md', name: 'reviewer.md', token: '{{swarm:reviewer}}' },
  { key: 'python', path: 'swarm-engineering/languages/python.md', name: 'python.md', token: '{{swarm:python}}' },
  { key: 'java', path: 'swarm-engineering/languages/java.md', name: 'java.md', token: '{{swarm:java}}' },
  { key: 'go', path: 'swarm-engineering/languages/go.md', name: 'go.md', token: '{{swarm:go}}' },
  { key: 'typescript', path: 'swarm-engineering/languages/typescript.md', name: 'typescript.md', token: '{{swarm:typescript}}' },
  { key: 'rust', path: 'swarm-engineering/languages/rust.md', name: 'rust.md', token: '{{swarm:rust}}' },
]
/**
 * The path of a craft file, resolved the way the plugin resolves it.
 * @param {object} craft - one entry of CRAFT.
 * @returns {string} the absolute path.
 */
const craftPath = (craft) => fileURLToPath(new URL(`../skills/${craft.path}`, import.meta.url))
/**
 * The lines of a text that name a craft file by an absolute path.
 * @param {string} text - the text to scan.
 * @param {string} name - the file name to look for.
 * @returns {string[]} the matching lines.
 */
const craftPathLines = (text, name) => text.split(/\r?\n/).filter((line) => {
  // A path in prose is often wrapped in backticks and closed with a full
  // stop; the line still names the file. The path has to be absolute: a
  // drive letter, or a leading slash, at the start of the path and not in
  // the middle of a relative one.
  const trimmed = line.trim().replace(/[.`'"]+$/u, '')
  return trimmed.endsWith(name) && /(?<![^\s`'"])(?:[A-Za-z]:[\\/]|\/)[^\s`'"]*$/.test(trimmed)
})

// --- 1. The Coordinator view ------------------------------------------------
check('coordinator: the host note is in it', () => coord.includes('## Host identity'))
check('coordinator: the surface map is in it', () => coord.includes('## Surface map: Jcode to DeepSeek Harness'))
check('coordinator: the requirement handover is in it', () => coord.includes('## Requirement handover on this host'))
check('coordinator: the verification path is in it', () => coord.includes('## Independent verification on this host'))
check('coordinator: the live capability section is in it', () => coord.includes('## Live capabilities of this session'))
check('coordinator: the coordinator lane note is in it', () => coord.includes('## The Coordinator on this host'))
check('coordinator: the whole policy is in it', () => coord.includes('## 11. Policy and Tool Boundaries'))
check('coordinator: the orchestration section is in it', () => coord.includes('## 12. Swarm Orchestration'))
check('coordinator: the whole brief is in it', () => coord.includes('Requirements belong to a todo lane'))
check('coordinator: the capability block is in it', () => coord.includes('## Host capabilities — probed live'))
check('coordinator: the worker lane note is not in it', () => !coord.includes('## The worker lane on this host'))
check('coordinator: the skill lane note is not in it', () => !coord.includes('## The skill on this host'))
check('coordinator: the note comes first, then the policy, then the brief', () => {
  const note = coord.indexOf('## Host identity')
  const policy = coord.indexOf('## 11. Policy and Tool Boundaries')
  const brief = coord.indexOf('Requirements belong to a todo lane')
  return note < policy && policy < brief
})

// --- 2. The worker view -----------------------------------------------------
check('worker: the worker lane note is in it', () => work.includes('## The worker lane on this host'))
check('worker: the policy up to section 12 is in it', () => work.includes('## 11. Policy and Tool Boundaries'))
check('worker: the assignment contract is in it', () => work.includes('## 8. Assignment and Reporting Contract'))
check('worker: the requirement matching section is in it', () => work.includes('## 12. Requirement Matching'))
check('worker: the requirement handover section is in it', () => work.includes('## 13. Requirement Handover'))
check('worker: the orchestration section is not in it', () => !work.includes('## 12. Swarm Orchestration'))
check('worker: the orchestration subsections are not in it', () => !work.includes('### 12.5 Assignment Brief'))
check('worker: the coordinator lane note is not in it', () => !work.includes('## The Coordinator on this host'))
check('worker: the surface map is not in it', () => !work.includes('## Surface map: Jcode to DeepSeek Harness'))
check('worker: the assignment contract body is in it', () => work.includes('Each worker must understand the assignment before execution'))
check('worker: the matching section body is in it', () => work.includes('Two checks, not one'))
check('worker: the handover section body is in it', () => work.includes('Jcode has no separate requirements file'))
check('worker: the skill sections come in the order 8, 12, 13', () => {
  const eight = work.indexOf('## 8. Assignment and Reporting Contract')
  const twelve = work.indexOf('## 12. Requirement Matching')
  const thirteen = work.indexOf('## 13. Requirement Handover')
  return eight < twelve && twelve < thirteen
})
check('worker: the note comes first, then the policy, then the skill', () => {
  const note = work.indexOf('## Host identity')
  const policy = work.indexOf('## 11. Policy and Tool Boundaries')
  const sections = work.indexOf('## 8. Assignment and Reporting Contract')
  return note < policy && policy < sections
})

// --- 3. Capability gating ---------------------------------------------------
check('gating: the todo ledger bullet is kept on a full host', () =>
  coord.includes('the round ledger: one row per round'))
check('gating: the teammate bullet is kept on a full host', () =>
  coord.includes('a durable native teammate: it keeps its context'))
check('gating: the session goal bullet is kept on a full host', () =>
  coord.includes('the session goal, which is your own persistence'))
check('gating: the native team bullet is kept on a full host', () => coord.includes('the native team'))
check('gating: the human-decision bullet is kept on a full host', () =>
  coord.includes('put an open product decision in front of the human'))
check('gating: the board bullet is kept on a full host', () =>
  coord.includes('the shared board, and the place a requirement lives'))
check('gating: the worker skill bullet is kept on a full host', () =>
  work.includes('`swarm-engineering` skill is registered for you'))

const coordMin = coordinator(MINIMAL)
const workMin = worker(MINIMAL)
check('gating: the todo ledger bullet survives a minimal host', () =>
  coordMin.includes('the round ledger: one row per round'))
check('gating: the teammate bullet is gone on a minimal host', () =>
  !coordMin.includes('a durable native teammate: it keeps its context'))
check('gating: the session goal bullet is gone on a minimal host', () =>
  !coordMin.includes('the session goal, which is your own persistence'))
check('gating: the native team bullet is gone on a minimal host', () => !coordMin.includes('the native team'))
check('gating: the human-decision bullet is gone on a minimal host', () =>
  !coordMin.includes('put an open product decision in front of the human'))
check('gating: the board bullet is gone on a minimal host', () =>
  !coordMin.includes('the shared board, and the place a requirement lives'))
check('gating: the worker board bullet is gone on a minimal host', () =>
  !workMin.includes('The shared board holds your assignment'))
check('gating: the worker skill bullet is gone on a minimal host', () =>
  !workMin.includes('`swarm-engineering` skill is registered for you'))
// Weaker, and deliberately so: the surface map is prose, not a gated bullet, so
// it stays in the coordinator view on any host. It is also the one place where
// the word `interrupt_agent` survives gating, which is why the checks above
// assert on the bullet's own phrase instead of on the tool name.
check('gating: the surface map stays in the coordinator view on a minimal host', () =>
  coordMin.includes('## Surface map: Jcode to DeepSeek Harness'))

// --- 4. No plugin mechanics survive in either view --------------------------
check('gating: no plugin marker survives in the coordinator view', () =>
  !coord.includes('<!-- swarm:') && !coordMin.includes('<!-- swarm:'))
check('gating: no plugin marker survives in the worker view', () =>
  !work.includes('<!-- swarm:') && !workMin.includes('<!-- swarm:'))
check('gating: no gating fragment survives in the coordinator view', () =>
  !coord.includes('swarm:requires') && !coordMin.includes('swarm:requires'))
check('gating: no gating fragment survives in the worker view', () =>
  !work.includes('swarm:requires') && !workMin.includes('swarm:requires'))

// --- 5. The absent-tool line follows the probe ------------------------------
/**
 * The line the capability block prints about the surfaces this host lacks.
 * @param {string} text - a composed prompt.
 * @returns {string} the absent line, or an empty string.
 */
const absentLine = (text) =>
  text.split('\n').find((line) => line.startsWith('- **Absent in this session:**')) ?? ''

check('gating: a minimal host prints the absent-tool line', () => absentLine(coordMin) !== '')
check('gating: the absent-tool line names a withheld surface', () =>
  absentLine(coordMin).includes('`subagent_fork`'))
check('gating: the absent-tool line does not name a present surface', () =>
  !absentLine(coordMin).includes('`todo_write`'))
check('gating: a full host prints no absent-tool line', () => absentLine(coord) === '')

// --- 6. The capability block is injected where the note put it --------------
check('capabilities: the block appears exactly once in the coordinator view', () =>
  coord.split('## Host capabilities — probed live').length - 1 === 1)
check('capabilities: the block sits inside the live-capabilities section', () => {
  const live = coord.indexOf('## Live capabilities of this session')
  const block = coord.indexOf('## Host capabilities — probed live')
  const next = coord.indexOf('## The Coordinator on this host')
  return live < block && block < next
})
check('capabilities: the block sits inside the live-capabilities section of the worker view', () => {
  const live = work.indexOf('## Live capabilities of this session')
  const block = work.indexOf('## Host capabilities — probed live')
  const next = work.indexOf('## The worker lane on this host')
  return live < block && block < next
})

// --- 7. The /swarm line follows the command registry ------------------------
const coordCmd = coordinator(ALL, { command: true })
const workCmd = worker(ALL, { command: true })
check('command: the coordinator view carries the /swarm line', () => coordCmd.includes('`/swarm`**'))
check('command: the worker view carries the /swarm line', () => workCmd.includes('`/swarm`**'))
check('command: the coordinator view hides the /swarm line by default', () => !coord.includes('`/swarm`**'))
check('command: the worker view hides the /swarm line by default', () => !work.includes('`/swarm`**'))
check('command: the /swarm output names the craft files by their resolved paths', () =>
  CRAFT.every((craft) => swarmOutput.includes(craftPath(craft))))
check('command: the /swarm output carries no raw token', () =>
  CRAFT.every((craft) => !swarmOutput.includes(craft.token)))

// --- 8. Idempotence and the not-probed variant ------------------------------
check('idempotent: the coordinator view composes to the same bytes twice', () =>
  coordinator(ALL) === coord)
check('idempotent: the worker view composes to the same bytes twice', () => worker(ALL) === work)
const coordRaw = coordinator(undefined)
check('not probed: the coordinator view says the registry was not probed', () =>
  coordRaw.includes('## Host capabilities — not probed'))
check('not probed: the coordinator view keeps every bullet', () =>
  coordRaw.includes('the session goal, which is your own persistence') &&
  coordRaw.includes('a durable native teammate: it keeps its context'))
check('not probed: the worker view says the registry was not probed', () =>
  worker(undefined).includes('## Host capabilities — not probed'))

// --- 9. A missing skill section is reported, not silently dropped ------------
const thinSkill = [
  '## 8. Assignment and Reporting Contract',
  '',
  'Contract body.',
  '',
  '## 12. Requirement Matching',
  '',
  'Matching body.',
  '',
].join('\n')
const thin = worker(ALL, {}) && call('composeWorkerPrompt', { note, overlay, skill: thinSkill, names: ALL, options: {} })
check('missing section: the composition still returns text', () => typeof thin === 'string' && thin.length > 0)
check('missing section: the sections that are present are kept', () =>
  thin.includes('## 8. Assignment and Reporting Contract') && thin.includes('## 12. Requirement Matching'))
check('missing section: the missing section is named in the result', () => thin.includes('Requirement Handover'))

// --- 10. The craft wiring -----------------------------------------------------
// The craft guidance is named, not composed: the note carries a token per craft
// file, and the plugin replaces every token with the absolute path of the file
// that ships with the loaded bundle. A lane reads the file at that path, so the
// path has to be the real one, and no token may ever reach a prompt.
check('craft: the coordinator view carries the craft section', () =>
  coord.includes('## The craft guidance on this host'))
check('craft: the worker view carries the craft section', () =>
  work.includes('## The craft guidance on this host'))
for (const craft of CRAFT) {
  check(`craft: the coordinator view names ${craft.name} by its resolved path`, () =>
    coord.includes(craftPath(craft)) && craftPathLines(coord, craft.name).length > 0)
  check(`craft: the worker view names ${craft.name} by its resolved path`, () =>
    work.includes(craftPath(craft)) && craftPathLines(work, craft.name).length > 0)
  check(`craft: the coordinator view carries no raw ${craft.token} token`, () =>
    !coord.includes(craft.token))
  check(`craft: the worker view carries no raw ${craft.token} token`, () =>
    !work.includes(craft.token))
  check(`craft: the resolved path of ${craft.name} is a file that exists`, () =>
    existsSync(craftPath(craft)))
}
check('craft: the skill was registered', () => registeredSkill !== undefined)
check('craft: the registered skill carries the craft section', () =>
  registeredSkill !== undefined && registeredSkill.content.includes('## The craft guidance on this host'))
for (const craft of CRAFT) {
  check(`craft: the registered skill names ${craft.name} by its resolved path`, () =>
    registeredSkill !== undefined && registeredSkill.content.includes(craftPath(craft)) &&
    craftPathLines(registeredSkill.content, craft.name).length > 0)
  check(`craft: the registered skill carries no raw ${craft.token} token`, () =>
    registeredSkill !== undefined && !registeredSkill.content.includes(craft.token))
}

// A token the bundle does not know stays visible: the gap belongs in the
// prompt, where a lane can see it, not in a silently empty string.
const unknownNote = note.replace(/\{\{swarm:(?:shared|developer|tester|reviewer|python)\}\}/g, '{{swarm:unknown}}')
const unknownView = call('composeWorkerPrompt', { note: unknownNote, overlay, skill, names: ALL, options: {} })
check('craft: an unknown token stays visible in the worker view', () =>
  unknownView.includes('{{swarm:unknown}}'))

// A craft file that is not in the bundle yields a notice that names it, not a
// path that opens nothing. The bundle is copied to a temporary directory
// without the craft files, so the copy resolves its tokens against its own
// empty skills directory.
const sandbox = mkdtempSync(join(tmpdir(), 'swarm-craft-missing-'))
copyFileSync(fileURLToPath(new URL('../index.js', import.meta.url)), join(sandbox, 'swarm-bundle.mjs'))
const missingBundle = await import(pathToFileURL(join(sandbox, 'swarm-bundle.mjs')).href)
const missingView = missingBundle.composeWorkerPrompt({ note, overlay, skill, names: ALL, options: {} })
rmSync(sandbox, { recursive: true, force: true })
/**
 * The notice a missing craft file yields.
 *
 * The notice names the file by its path inside the bundle, so a reader can
 * see both which file is missing and where it belongs.
 * @param {object} craft - one entry of CRAFT.
 * @returns {string} the notice, exactly as the bundle writes it.
 */
const missingNotice = (craft) => `**the file \`skills/${craft.path}\` is missing from this bundle**`
check('craft: a missing craft file yields a notice that names it', () =>
  CRAFT.every((craft) => missingView.includes(missingNotice(craft))))
check('craft: a missing craft file yields no path', () =>
  CRAFT.every((craft) => !missingView.includes(craftPath(craft)) &&
    craftPathLines(missingView, craft.name).length === 0))

// --- 11. A CRLF checkout composes the same way -------------------------------
// The shipped files are text, and a checkout can hold them with CRLF endings.
// A heading line that ends in CR is still a heading: the worker's sections are
// cut by heading, and a heading the bundle cannot see is a section the bundle
// no longer has — the worker is then told to read a section that is not there.
const crlf = (text) => text.replace(/\r?\n/g, '\r\n')
const crlfSkill = crlf(skill)
const crlfOverlay = crlf(overlay)
const crlfNote = crlf(note)
const crlfWorker = call('composeWorkerPrompt', { note, overlay: crlfOverlay, skill: crlfSkill, names: ALL, options: {} })
const crlfWorkerAll = call('composeWorkerPrompt', { note: crlfNote, overlay: crlfOverlay, skill: crlfSkill, names: ALL, options: {} })

check('crlf: the worker view keeps the requirement handover section', () =>
  crlfWorker.includes('## 13. Requirement Handover'))
check('crlf: the worker view keeps the assignment contract section', () =>
  crlfWorker.includes('## 8. Assignment and Reporting Contract'))
check('crlf: the worker view keeps the requirement matching section', () =>
  crlfWorker.includes('## 12. Requirement Matching'))
check('crlf: the worker view still cuts the orchestration section', () =>
  !crlfWorker.includes('## 12. Swarm Orchestration'))
check('crlf: the worker view leaves no plugin marker', () => !crlfWorker.includes('<!-- swarm:'))
check('crlf: the worker view leaves no raw token', () =>
  CRAFT.every((craft) => !crlfWorker.includes(craft.token)))
check('crlf: the worker view still names the craft files by their resolved paths', () =>
  CRAFT.every((craft) => crlfWorker.includes(craftPath(craft)) &&
    craftPathLines(crlfWorker, craft.name).length > 0))
check('crlf: a note with CRLF endings keeps the same sections', () =>
  crlfWorkerAll.includes('## 13. Requirement Handover') &&
  crlfWorkerAll.includes('## 8. Assignment and Reporting Contract') &&
  crlfWorkerAll.includes('## 12. Requirement Matching'))
check('crlf: a note with CRLF endings still names the craft files', () =>
  CRAFT.every((craft) => crlfWorkerAll.includes(craftPath(craft)) &&
    craftPathLines(crlfWorkerAll, craft.name).length > 0))
check('crlf: no section is reported missing', () =>
  !crlfWorker.includes('no longer contains the section') &&
  !crlfWorkerAll.includes('no longer contains the section'))

// The gate itself, on a CRLF line: a bullet whose marker names a tool this
// host has stays, a bullet that names a tool it does not have goes, and the
// plain line next to it stays either way.
const gatedNote = [
  '<!-- swarm:note worker -->',
  '',
  '# A synthetic host note',
  '',
  '- the plain neighbour survives',
  '- needs the tool <!-- swarm:requires spawn_teammate -->',
  '',
].join('\r\n')
const gateWith = call('composeWorkerPrompt', { note: gatedNote, overlay, skill, names: ALL, options: {} })
const gateWithout = call('composeWorkerPrompt', {
  note: gatedNote,
  overlay,
  skill,
  names: ALL.filter((name) => name !== 'spawn_teammate'),
  options: {},
})
check('crlf gate: the bullet whose tool this host has is kept', () => gateWith.includes('needs the tool'))
check('crlf gate: the bullet whose tool this host lacks is dropped', () => !gateWithout.includes('needs the tool'))
check('crlf gate: the plain neighbour survives either way', () =>
  gateWith.includes('the plain neighbour survives') && gateWithout.includes('the plain neighbour survives'))
check('crlf gate: the marker itself never reaches the view', () =>
  !gateWith.includes('<!-- swarm:') && !gateWithout.includes('<!-- swarm:'))

// --- 12. The craft skills are named where a lane can find them ----------------
// Each craft file is registered with the host as a skill of its own, so a lane
// asks for the craft by name instead of by path. The note has to name them, in
// both the Coordinator's and the worker's view, or the name a brief uses names
// nothing.
const CRAFT_SKILLS = [
  'swarm-craft-shared', 'swarm-craft-developer', 'swarm-craft-tester',
  'swarm-craft-reviewer', 'swarm-craft-python',
]
check('craft: the coordinator view names the registered craft skills', () =>
  CRAFT_SKILLS.every((name) => coord.includes(name)))
check('craft: the worker view names the registered craft skills', () =>
  CRAFT_SKILLS.every((name) => work.includes(name)))
check('craft: the registered skill names the craft skills', () =>
  registeredSkill !== undefined && CRAFT_SKILLS.every((name) => registeredSkill.content.includes(name)))
check('craft: the host registers every craft skill under the name the note names', () =>
  CRAFT_SKILLS.every((name) => skillRegistrations.some((registration) => registration.name === name)))

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
