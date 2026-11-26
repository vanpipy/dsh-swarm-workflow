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
 * `list_subagent_models` is in the list because the host ships the model
 * listing even though a session registers it only when its tool bundle
 * carries it, and the note gates that bullet on it.
 * The list also carries every surface the live capability block probes, so a
 * full host prints no absent line.
 */
const ALL = [
  'subagent', 'subagent_fork', 'workflow', 'spawn_teammate', 'send_message', 'interrupt_agent',
  'list_agents', 'list_subagent_models', 'wait_agent', 'team_task_create', 'team_task_get', 'team_task_list',
  'team_task_update', 'create_goal', 'get_goal', 'update_goal', 'todo_write',
  'ask_user_question', 'schedule_create', 'schedule_list', 'schedule_update', 'schedule_delete',
  'job_output', 'job_kill', 'job_list', 'skill',
  // The plugin registers these three itself, so a live host has them in the
  // registry the moment the bundle is applied.
  'swarm_worktree', 'swarm_task', 'swarm_child',
]
/** A host that offers almost nothing: one delegation surface and the ledger. */
const MINIMAL = ['subagent', 'todo_write']

let failures = 0
let checks = 0
/**
 * Record one check. A missing export is a failure of this suite, not a crash.
 * @param {string} label - what the check proves.
 * @param {Function} fn - returns true when the check holds.
 */
const check = (label, fn) => {
  checks += 1
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

// --- The sections a composed view is made of --------------------------------
// A view is a composition of files, and the only way to know whether it still
// carries them is to compare it with the files it is composed from. The
// expectation is derived from those files — the note's blocks for an
// audience, the policy, the brief, the skill sections the bundle names — so a
// view that loses a section of any of them fails here.
//
// Pinning endpoints does not: a policy truncated to its last two sections
// still has both of the old endpoints, so the old checks passed. The shape of
// the policy is therefore read from the runtime note, which states how many
// sections a worker gets and which section stays with the Coordinator, and the
// bundle's cut is checked against that statement.

/**
 * The headings of a text, in the order they appear.
 * @param {string} text - the text to read.
 * @returns {string[]} the heading titles.
 */
const headings = (text) => text
  .split(/\r?\n/)
  .map((line) => /^#{1,6}\s+(.+?)\s*$/u.exec(line))
  .filter((match) => match !== null)
  .map((match) => match[1])

/**
 * The headings of the note blocks written for one audience.
 * @param {string} scope - the audience, `coordinator` or `worker`.
 * @returns {string[]} the heading titles of those blocks.
 */
const noteHeadings = (scope) => bundle.parseRuntimeNote(note)
  .filter((block) => block.scopes.includes(scope))
  .flatMap((block) => headings(block.text))

/**
 * The number a section title starts with.
 * @param {string} title - a heading title.
 * @returns {number|null} the leading number, or null when the title has none.
 */
const sectionNumber = (title) => {
  const match = /^(\d+(?:\.\d+)*)/u.exec(title)
  return match === null ? null : Number(match[1].split('.')[0])
}

/**
 * The shape of the policy, as the runtime note states it.
 * @returns {{worker: number[], coordinatorOnly: number, coordinatorOnlyTitle: string}} the shape.
 */
const policyShape = () => {
  // The note wraps its sentences, so the statements are read from a copy whose
  // line breaks are spaces.
  const prose = note.replace(/\s+/gu, ' ')
  const range = /sections\s+(\d+)\s+to\s+(\d+)\s+into every worker/u.exec(prose)
  if (range === null) throw new Error('the runtime note no longer states which sections of the policy a worker gets')
  const only = /Section\s+(\d+),\s*([^,]+?),\s+is the Coordinator's operating manual/u.exec(prose)
  if (only === null) throw new Error('the runtime note no longer states which section of the policy stays with the Coordinator')
  const worker = []
  for (let number = Number(range[1]); number <= Number(range[2]); number += 1) worker.push(number)
  return {
    worker,
    coordinatorOnly: Number(only[1]),
    coordinatorOnlyTitle: only[2].trim().replace(/\*+$/u, ''),
  }
}

/**
 * The heading the policy ends with for a worker.
 * @returns {string} the heading title.
 */
const workerPolicyEnd = () => {
  const shape = policyShape()
  const last = shape.worker[shape.worker.length - 1]
  const title = headings(overlay).find((heading) => sectionNumber(heading) === last)
  if (title === undefined) throw new Error(`the policy has no section ${last}`)
  return title
}

/**
 * The headings of the policy a worker gets: the policy up to the bundle's cut.
 * @returns {string[]} the heading titles.
 */
const workerPolicyHeadings = () => {
  const cut = sectionNumber(bundle.WORKER_OVERLAY_CUT)
  const kept = []
  for (const title of headings(overlay)) {
    const number = sectionNumber(title)
    if (number !== null && number >= cut) break
    kept.push(title)
  }
  return kept
}

/**
 * Where a heading sits in a text.
 * @param {string} text - the text to read.
 * @param {string} title - the heading title.
 * @returns {number} the offset of the heading, or -1 when it is not there.
 */
const headingAt = (text, title) => {
  const lines = text.split(/\r?\n/)
  const index = lines.findIndex((line) => {
    const match = /^#{1,6}\s+(.+?)\s*$/u.exec(line)
    return match !== null && match[1] === title
  })
  if (index === -1) return -1
  return lines.slice(0, index).join('\n').length
}

/**
 * The first line of the brief that carries its text.
 * @returns {string} the line.
 */
const briefAnchor = () => {
  const lines = brief.split(/\r?\n/)
  let inComment = false
  for (const line of lines) {
    if (line.startsWith('<!--')) { inComment = true; continue }
    if (inComment) { if (line.includes('-->')) inComment = false; continue }
    if (line.trim() === '') continue
    return line
  }
  throw new Error('the brief carries no text')
}

/**
 * The policy sections a view carries.
 *
 * The sections of the policy are the headings the view shares with the
 * policy file; the skill sections a worker also gets carry other numbers.
 * @param {string} view - the composed prompt.
 * @returns {number[]} the section numbers, in the order they appear.
 */
const policySectionsIn = (view) => {
  const titles = new Set(headings(overlay))
  return headings(view)
    .filter((title) => titles.has(title))
    .map(sectionNumber)
    .filter((number) => number !== null)
}

/**
 * Compare the sections of a composed view with the sections it is composed from.
 * @param {string} view - the composed prompt.
 * @param {Set<string>} expected - the sections the source files carry.
 * @returns {string} the difference, empty when the view carries exactly them.
 */
const sectionDiff = (view, expected) => {
  const actual = new Set(headings(view))
  const missing = [...expected].filter((title) => !actual.has(title))
  const extra = [...actual].filter((title) => !expected.has(title))
  return [
    ...missing.map((title) => `missing: ${title}`),
    ...extra.map((title) => `unexpected: ${title}`),
  ].join(' | ')
}

const CAPABILITY_HEADING = 'Host capabilities — probed live'

const expectedCoordinatorSections = new Set([
  ...noteHeadings('coordinator'),
  ...headings(overlay),
  ...headings(brief),
  CAPABILITY_HEADING,
])

// The skill's sections are numbered on their own, so a worker's prompt carries
// a policy section 8 and a skill section 8. The bundle labels the skill's
// heading with the document it belongs to, so the expectation is derived the
// same way the view is built rather than written out a second time.
const labelledSkillHeadings = (title) => {
  const section = call('extractSection', skill, title)
  if (section === null) throw new Error(`the skill has no section "${title}"`)
  return headings(call('labelSkillSection', section))
}

/**
 * The title a section of the shipped policy carries.
 * @param {string} number - the section number.
 * @returns {string} the title, without its number.
 */
const policySectionTitle = (number) => {
  const found = headings(overlay).find((title) => title.startsWith(`${number}. `))
  if (found === undefined) throw new Error(`the policy has no section ${number}`)
  return found.replace(`${number}. `, '')
}

/**
 * The number a section title carries.
 * @param {string} title - the section title.
 * @returns {string} the number.
 */
const sectionNumberOf = (title) => title.split('.')[0]

const expectedWorkerSections = new Set([
  ...noteHeadings('worker'),
  ...workerPolicyHeadings(),
  ...bundle.WORKER_SKILL_SECTIONS.flatMap((title) => labelledSkillHeadings(title)),
  CAPABILITY_HEADING,
])

// --- 1. The Coordinator view ------------------------------------------------
check('coordinator: the view carries exactly the sections of the files it is composed from', () => {
  const diff = sectionDiff(coord, expectedCoordinatorSections)
  if (diff !== '') throw new Error(diff)
  return true
})
check('coordinator: the policy in the view has every section the note says it has', () => {
  const shape = policyShape()
  const numbers = new Set(policySectionsIn(coord))
  const missing = [...shape.worker, shape.coordinatorOnly].filter((number) => !numbers.has(number))
  if (missing.length > 0) throw new Error(`the policy in the view is missing section ${missing.join(', ')}`)
  return true
})
check('coordinator: the whole brief is in it', () => coord.includes('Requirements belong to a task on the shared board'))
check('coordinator: the note comes first, then the policy, then the brief', () => {
  const noteAt = headingAt(coord, noteHeadings('coordinator')[0])
  const policyAt = headingAt(coord, workerPolicyEnd())
  const briefAt = coord.indexOf(briefAnchor())
  return noteAt >= 0 && policyAt > noteAt && briefAt > policyAt
})

// --- 2. The worker view -----------------------------------------------------
check('worker: the view carries exactly the sections of the files it is composed from', () => {
  const diff = sectionDiff(work, expectedWorkerSections)
  if (diff !== '') throw new Error(diff)
  return true
})
check('worker: the policy in the view has every section the note gives a worker', () => {
  const shape = policyShape()
  const numbers = new Set(policySectionsIn(work))
  const missing = shape.worker.filter((number) => !numbers.has(number))
  if (missing.length > 0) throw new Error(`the policy in the view is missing section ${missing.join(', ')}`)
  return true
})
check('worker: the section that stays with the Coordinator is not in the view', () => {
  const shape = policyShape()
  if (headings(work).includes(shape.coordinatorOnlyTitle)) {
    throw new Error(`section ${shape.coordinatorOnly} "${shape.coordinatorOnlyTitle}" belongs to the Coordinator`)
  }
  return true
})
check('worker: the bundle cuts the policy where the note says the Coordinator takes over', () => {
  const shape = policyShape()
  const cut = bundle.WORKER_OVERLAY_CUT
  const number = sectionNumber(cut)
  if (number !== shape.coordinatorOnly || !cut.endsWith(shape.coordinatorOnlyTitle)) {
    throw new Error(`the bundle cuts the policy at "${cut}", the note gives the Coordinator section ${shape.coordinatorOnly} "${shape.coordinatorOnlyTitle}"`)
  }
  return true
})
check('worker: the assignment contract body is in it', () => work.includes('Each worker must understand the assignment before execution'))
check('worker: the matching section body is in it', () => work.includes('Two checks: does the check discriminate'))
check('worker: the handover section body is in it', () => work.includes('.swarm/requirements/<work-item>.md'))
check('worker: the skill sections come in the order the bundle names them', () => {
  const positions = bundle.WORKER_SKILL_SECTIONS.map((title) => work.indexOf(`## ${labelledSkillHeadings(title)[0]}`))
  return positions.every((position) => position >= 0) &&
    positions.every((position, index) => index === 0 || position > positions[index - 1])
})
check('worker: the note comes first, then the policy, then the skill', () => {
  const noteAt = headingAt(work, noteHeadings('worker')[0])
  const policyAt = headingAt(work, workerPolicyEnd())
  const skillAt = headingAt(work, labelledSkillHeadings(bundle.WORKER_SKILL_SECTIONS[0])[0])
  return noteAt >= 0 && policyAt > noteAt && skillAt > policyAt
})

// The policy and the skill number their sections independently, so a worker's
// prompt carries a policy section 8 and a skill section 8, and the skill's
// section 12 follows a policy whose own section 12 never reached the worker.
// A number that names two sections is only usable when the view says which
// document each number belongs to: the skill's headings carry the document,
// and the note names both numbers in words.
check('worker: every skill section heading names the document it belongs to', () =>
  bundle.WORKER_SKILL_SECTIONS.every((title) => {
    const heading = labelledSkillHeadings(title)[0]
    return heading.startsWith('Skill §') && work.includes(`## ${heading}`)
  }))
check('worker: the policy headings keep their own numbers', () =>
  work.includes(`## 8. ${policySectionTitle(8)}`) &&
  !work.includes(`## Skill §8. ${policySectionTitle(8)}`))
check('worker: a number that names two sections names the document of each', () => {
  const shared = bundle.WORKER_SKILL_SECTIONS
    .map((title) => sectionNumberOf(title))
    .filter((number) => headings(overlay).some((title) => title.startsWith(`${number}. `)))
  return shared.length > 0 && shared.every((number) => work.includes(policySectionTitle(number)))
})
check('worker: the note names the skill sections it labels', () =>
  bundle.WORKER_SKILL_SECTIONS.every((title) => {
    const number = sectionNumberOf(title)
    const name = title.replace(`${number}. `, '')
    return work.includes(`skill §${number} (${name})`)
  }))
check('worker: the note says where the policy stops', () => {
  const cut = bundle.WORKER_OVERLAY_CUT
  const number = sectionNumberOf(cut)
  return work.includes(`it stops before section ${number} (${cut.replace(`${number}. `, '')})`)
})
check('coordinator: the worker note is not in the coordinator view', () =>
  !coord.includes("the swarm-engineering skill's own sections"))

// The Coordinator-only prose of the policy does not reach a worker. The bundle
// cuts the policy at the section the note says stays with the Coordinator, so
// every line from that heading onward is the Coordinator's. A line of it that
// the worker's own note and skill do not carry is Coordinator-only prose, and
// the worker view must not contain it: the heading can stay out of the view
// while its body leaks in, and only the body tells the difference. The
// passages are derived from the shipped policy file rather than written here,
// so the rule keeps holding when the wording changes.

/**
 * A text folded into one line: every run of whitespace becomes one space, so a
 * passage is compared with a view as it is rendered.
 * @param {string} text - the text to fold.
 * @returns {string} the folded text.
 */
const foldSpaces = (text) => text.replace(/\s+/gu, ' ').trim()

/**
 * The Coordinator-only region of the policy: the text from the heading the
 * bundle cuts at to the end of the file.
 * @returns {string} the region.
 */
const coordinatorPolicyRegion = () => {
  const shape = policyShape()
  const lines = overlay.split(/\r?\n/)
  const index = lines.findIndex((line) => {
    const match = /^#{1,6}\s+(.+?)\s*$/u.exec(line)
    return match !== null && sectionNumber(match[1]) === shape.coordinatorOnly
  })
  if (index === -1) throw new Error(`the policy has no section ${shape.coordinatorOnly}`)
  return lines.slice(index).join('\n')
}

/**
 * The prose lines of a region.
 *
 * A heading, a comment and a table rule are structure rather than prose, and a
 * line that carries less than a clause is too short to be distinctive.
 * @param {string} region - the region to read.
 * @returns {string[]} the prose lines, trimmed.
 */
const proseLines = (region) => region.split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => {
    if (line === '' || line.startsWith('#') || line.startsWith('<!--')) return false
    if (!/[A-Za-z]/u.test(line)) return false
    if (line.split(/\s+/u).length < 3) return false
    return foldSpaces(line).length >= 24
  })

/**
 * The text a worker legitimately reads besides the policy: the worker blocks of
 * the runtime note and the skill sections the bundle hands a worker.
 * @returns {string} the text.
 */
const workerOwnedText = () => [
  ...bundle.parseRuntimeNote(note)
    .filter((block) => block.scopes.includes('worker'))
    .map((block) => block.text),
  ...bundle.WORKER_SKILL_SECTIONS.map((title) => call('extractSection', skill, title) ?? ''),
].join('\n')

/**
 * The Coordinator-only passages of the policy: the prose of the region the
 * bundle cuts at, minus the passages the worker's own note and skill carry.
 * @returns {string[]} the passages, folded to one line each.
 */
const coordinatorOnlyPassages = (() => {
  const owned = foldSpaces(workerOwnedText())
  const seen = new Set()
  const passages = []
  for (const line of proseLines(coordinatorPolicyRegion())) {
    const passage = foldSpaces(line)
    if (owned.includes(passage)) continue
    if (seen.has(passage)) continue
    seen.add(passage)
    passages.push(passage)
  }
  return passages
})()

/**
 * The Coordinator-only passages a view carries.
 * @param {string} view - the composed prompt.
 * @returns {string[]} the passages, in the order the policy lists them.
 */
const passagesIn = (view) => {
  const text = foldSpaces(view)
  return coordinatorOnlyPassages.filter((passage) => text.includes(passage))
}

for (const [label, view] of [['the full-host view', work], ['the minimal-host view', worker(MINIMAL)]]) {
  check(`worker: no Coordinator-only prose reaches ${label} (${coordinatorOnlyPassages.length} passages inspected)`, () => {
    // The check has to be able to fail: a view that carries one of the
    // Coordinator-only passages has to be reported, so the probe below puts one
    // into a copy of the view and the check has to notice it.
    if (coordinatorOnlyPassages.length === 0) {
      throw new Error('the policy carries no Coordinator-only prose to look for')
    }
    if (passagesIn(`${view}\n${coordinatorOnlyPassages[0]}`).length === 0) {
      throw new Error('the check does not notice Coordinator-only prose in a view')
    }
    const leaked = passagesIn(view)
    if (leaked.length > 0) {
      throw new Error(`the view carries ${leaked.length} Coordinator-only passage(s): ${leaked.map((passage) => `"${passage.slice(0, 110)}"`).join(' | ')}`)
    }
    return true
  })
}

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

// The full-host model is the lens every check above reads the note through, so
// it has to carry every surface the note gates a bullet on. A gated surface
// the model lacks makes the bullet disappear, and the model then claims to be
// a full host that is not full.
/**
 * The surfaces the note gates a bullet on.
 * @param {string} text - the note.
 * @returns {string[]} the distinct surface names.
 */
const gatedSurfaces = (text) => [...new Set(
  [...text.matchAll(/<!--\s*swarm:requires\s+([^\s>]+)\s*-->/gu)].map((match) => match[1]),
)]

check('gating: the full-host model carries every surface the note gates on', () => {
  const missing = gatedSurfaces(note).filter((name) => !ALL.includes(name))
  if (missing.length > 0) throw new Error(`the model does not carry: ${missing.join(', ')}`)
  // The check has to be able to fail: a note that gates a surface the model
  // does not carry has to be reported, so the probe below adds such a surface
  // to a copy of the note and the check has to notice it.
  const probe = `${note}\n<!-- swarm:requires not_a_real_surface -->\n`
  const undetected = gatedSurfaces(probe).filter((name) => !ALL.includes(name))
  if (!undetected.includes('not_a_real_surface')) {
    throw new Error('the check does not notice a gated surface the model does not carry')
  }
  return true
})

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
  thin.includes(call('labelSkillSection', '## 8. Assignment and Reporting Contract')) &&
  thin.includes(call('labelSkillSection', '## 12. Requirement Matching')))
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
// The expected heading comes from the bundle's own labelling of the same CRLF
// text, so the check states what the view must carry without a second copy of
// the label format.
const crlfHeading = (title) => call('labelSkillSection', crlf(`## ${title}`))
const crlfSkill = crlf(skill)
const crlfOverlay = crlf(overlay)
const crlfNote = crlf(note)
const crlfWorker = call('composeWorkerPrompt', { note, overlay: crlfOverlay, skill: crlfSkill, names: ALL, options: {} })
const crlfWorkerAll = call('composeWorkerPrompt', { note: crlfNote, overlay: crlfOverlay, skill: crlfSkill, names: ALL, options: {} })

check('crlf: the worker view keeps the requirement handover section', () =>
  crlfWorker.includes(crlfHeading('13. Requirement Handover')))
check('crlf: the worker view keeps the assignment contract section', () =>
  crlfWorker.includes(crlfHeading('8. Assignment and Reporting Contract')))
check('crlf: the worker view keeps the requirement matching section', () =>
  crlfWorker.includes(crlfHeading('12. Requirement Matching')))
check('crlf: the worker view still cuts the orchestration section', () =>
  !crlfWorker.includes('## 12. Swarm Orchestration'))
check('crlf: the worker view leaves no plugin marker', () => !crlfWorker.includes('<!-- swarm:'))
check('crlf: the worker view leaves no raw token', () =>
  CRAFT.every((craft) => !crlfWorker.includes(craft.token)))
check('crlf: the worker view still names the craft files by their resolved paths', () =>
  CRAFT.every((craft) => crlfWorker.includes(craftPath(craft)) &&
    craftPathLines(crlfWorker, craft.name).length > 0))
check('crlf: a note with CRLF endings keeps the same sections', () =>
  crlfWorkerAll.includes(crlfHeading('13. Requirement Handover')) &&
  crlfWorkerAll.includes(crlfHeading('8. Assignment and Reporting Contract')) &&
  crlfWorkerAll.includes(crlfHeading('12. Requirement Matching')))
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
// nothing. Every craft skill is in the list: a language skill missing from the
// note is a lane told to read a file it cannot reach.
const CRAFT_SKILLS = [
  'swarm-craft-shared', 'swarm-craft-developer', 'swarm-craft-tester',
  'swarm-craft-reviewer', 'swarm-craft-python', 'swarm-craft-java',
  'swarm-craft-go', 'swarm-craft-typescript', 'swarm-craft-rust',
]
check('craft: the coordinator view names the registered craft skills', () =>
  CRAFT_SKILLS.every((name) => coord.includes(name)))
check('craft: the worker view names the registered craft skills', () =>
  CRAFT_SKILLS.every((name) => work.includes(name)))
check('craft: the registered skill names the craft skills', () =>
  registeredSkill !== undefined && CRAFT_SKILLS.every((name) => registeredSkill.content.includes(name)))
check('craft: the host registers every craft skill under the name the note names', () =>
  CRAFT_SKILLS.every((name) => skillRegistrations.some((registration) => registration.name === name)))

// The craft bullet is the line a lane acts on: it names the skills to load and
// the files behind them. The note lists the nine further up, so a check over
// the whole view passes even when the bullet names five — which is how a Go
// lane came to be told to read the Python pieces.
const craftBullet = (view, lead) => view.split(/\r?\n/).find((line) => line.startsWith(lead))
for (const [label, view, lead] of [
  ['coordinator', coord, '- The craft guidance every lane works by'],
  ['worker', work, '- The craft guidance your role works by'],
]) {
  const bullet = craftBullet(view, lead)
  check(`craft: the ${label} craft bullet names every craft skill`, () =>
    bullet !== undefined && CRAFT_SKILLS.every((name) => bullet.includes(name)))
  check(`craft: the ${label} craft bullet names every craft file`, () =>
    bullet !== undefined && CRAFT.every((craft) => bullet.includes(craftPath(craft))))
}

// --- 13. The Jcode surfaces the views name are mapped ------------------------
// The shipped text names Jcode commands, settings, flags and config paths.
// This host has none of them, so every surface a view names has to appear in
// the surface map, and the worker view, which carries no map, must name none
// at all: a lane that reads `swarm list` has nothing here to run.
const mapStart = note.indexOf('## Surface map: Jcode to DeepSeek Harness')
const mapEnd = note.indexOf('<!-- swarm:note', mapStart)
const mapCells = note.slice(mapStart, mapEnd).split(/\r?\n/)
  .filter((line) => line.startsWith('| '))
  .map((line) => line.split('|')[1] ?? '')
/**
 * The shapes a Jcode surface takes in the shipped text.
 *
 * A command is named in backticks; the same words in prose ("the server-level
 * swarm plan") are not a command. The setting forms are Jcode's own config
 * keys, the flags are Jcode's session flags, and the paths are the files
 * Jcode reads its override from.
 * @type {RegExp[]}
 */
const SURFACE_PATTERNS = [
  /`(?:swarm|jcode)(?: [a-z][a-z_-]*)+`/gu,
  /`\[agents\] [a-z_]+`/gu,
  /`agents\.[a-z_]+`/gu,
  /`\[(?:auto)?(?:review|judge)\] enabled`/gu,
  /(?:~|\.)\/\.jcode\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*/gu,
]
/**
 * Every Jcode surface a text names.
 * @param {string} text - the text to scan.
 * @returns {string[]} the distinct surface names.
 */
const jcodeSurfaces = (text) => [...new Set(SURFACE_PATTERNS.flatMap((pattern) =>
  [...text.matchAll(pattern)].map((match) => match[0].replace(/`/g, ''))))]
/**
 * Whether the surface map names a surface.
 * @param {string} surface - the surface name.
 * @returns {boolean} true when a map cell carries it.
 */
const mapped = (surface) => mapCells.some((cell) => cell.includes(`\`${surface}\``))

check('R2 the worker view names no Jcode surface', () => jcodeSurfaces(work).length === 0)
check('R2 every Jcode surface the coordinator view names is mapped', () =>
  jcodeSurfaces(coord).every(mapped))
check('R2 every Jcode surface the skill view names is mapped', () =>
  registeredSkill !== undefined && jcodeSurfaces(registeredSkill.content).every(mapped))

// --- 14. The shipped policy names no Jcode surface ---------------------------
// The canonical text names the `swarm` tool, the settings around it and the
// Jcode CLI. The adapted text names this host's surfaces instead, so a Jcode
// token left in the shipped policy is a passage that was never adapted. The
// host note may name them: the note is where the map of every replacement
// lives, and it is not part of the shipped policy.
const JCODE_TOKENS = [
  /\bJcode\b/,
  /\bjcode\b/,
  /`swarm (?:await_members|list_models|list|message|stop|summary|spawn|launch)`/,
  /\/(?:auto)?(?:review|judge)\b/,
  /`\[agents\]/,
  /~?\/\.jcode\//,
  /scratch\//,
  /\btodo lane\b/,
  /`details`/,
  /\broot session\b/,
  /\bforce\b/,
]
for (const [name, text] of [['prompt-overlay.md', overlay], ['swarm-prompt.md', brief], ['swarm-engineering.md', skill]]) {
  const hit = JCODE_TOKENS.find((pattern) => pattern.test(text))
  check(`R6 ${name} names no Jcode surface`, () => hit === undefined)
}

console.log(`SUITE CHECKS: ${checks}`)
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
