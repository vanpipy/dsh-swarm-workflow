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
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as bundle from '../index.js'

/**
 * Read one file of the bundle.
 * @param {string} relative - path relative to the bundle root.
 * @returns {string} the file content.
 */
const read = (relative) => readFileSync(fileURLToPath(new URL(`../${relative}`, import.meta.url)), 'utf8')

const note = read('runtime-note.md')
const overlay = read('prompt-overlay.md')
const brief = read('swarm-prompt.md')
const skill = read('skills/swarm-engineering.md')

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

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
