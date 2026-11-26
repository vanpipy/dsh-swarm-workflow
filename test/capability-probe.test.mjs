// The live capability block: what this session can actually call.
//
// The block is the one part of the prompt that is probed against the real
// registry, so it makes two claims: a surface the registry shows is available
// now, and a surface it does not show must not be planned around. A surface
// the runtime note names but the block never probes is a claim that decays
// silently - the note keeps promising it and nothing reports on it.
//
// So the block is driven here with a fake registry: every surface the note
// names is checked to be reported, present or absent, and the bundle's own
// three primitives are checked not to be advertised as host surfaces.
import * as bundle from '../index.js'

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
 * The surfaces the runtime note names and the block has to report on.
 * @type {string[]}
 */
const NAMED_SURFACES = [
  'wait_agent', 'list_agents', 'send_message', 'interrupt_agent',
  'job_output', 'job_kill', 'job_list', 'list_subagent_models',
  'get_goal', 'update_goal',
  'team_task_get', 'team_task_list', 'team_task_update',
  'schedule_list', 'schedule_update', 'schedule_delete',
]

/**
 * The group table the block is rendered from.
 * @returns {object[]} the groups.
 */
const groups = () => {
  const table = bundle.CAPABILITY_GROUPS
  if (!Array.isArray(table)) throw new Error('the bundle does not export CAPABILITY_GROUPS')
  return table
}

/**
 * Every tool the group table names.
 * @returns {string[]} the tool names.
 */
const groupTools = () => groups().flatMap(({ items }) => items.map((item) => item.tool))

/**
 * The absent line of a block, or '' when the block has none.
 * @param {string} block - the rendered block.
 * @returns {string} the absent line.
 */
const absentLine = (block) =>
  block.split('\n').find((line) => line.startsWith('- **Absent in this session:**')) ?? ''

/**
 * The tool names the absent line names.
 * @param {string} block - the rendered block.
 * @returns {string[]} the missing tool names.
 */
const absentNames = (block) => {
  const line = absentLine(block)
  if (line === '') return []
  const body = line.slice('- **Absent in this session:** '.length).split(' — ')[0]
  return [...body.matchAll(/`([^`]+)`/g)].map((match) => match[1])
}

/**
 * The group bullets of a block: the lines that report present surfaces.
 * The count line and the absent line are not group bullets.
 * @param {string} block - the rendered block.
 * @returns {object[]} the bullets, each with its label and its text.
 */
const groupBullets = (block) => block.split('\n')
  .map((line) => /^- \*\*([^*]+):\*\*\s*(.*)$/.exec(line))
  .filter((match) => match !== null)
  .filter((match) => match[1] !== 'Tools this agent\'s registry lists')
  .filter((match) => !match[1].startsWith('Absent in this session'))
  .map((match) => ({ label: match[1], text: match[2] }))

// --- 1. the group table ---------------------------------------------------------
check('the group table probes every surface the note names', () => {
  const tools = groupTools()
  const missing = NAMED_SURFACES.filter((tool) => !tools.includes(tool))
  if (missing.length > 0) throw new Error(`not probed: ${missing.join(', ')}`)
  return true
})

check("the bundle's own tools are not host surfaces", () => {
  const own = bundle.SWARM_TOOL_NAMES ?? []
  const clash = own.filter((tool) => groupTools().includes(tool))
  if (clash.length > 0) throw new Error(`host group names the bundle's own: ${clash.join(', ')}`)
  return true
})

check('every surface is probed once', () => {
  const tools = groupTools()
  const repeated = tools.filter((tool, index) => tools.indexOf(tool) !== index)
  if (repeated.length > 0) throw new Error(`probed twice: ${repeated.join(', ')}`)
  return true
})

check('every group names its area and holds a surface', () =>
  groups().every(({ group, items }) =>
    typeof group === 'string' && group.length > 0 && Array.isArray(items) && items.length > 0))

// --- 2. a host that offers every probed surface ---------------------------------
const fullNames = groupTools()
const full = call('capabilityBlock', fullNames)

check('the block keeps its probed-live header', () =>
  full.startsWith('## Host capabilities — probed live'))

check('a full host prints one bullet per group', () =>
  groupBullets(full).length === groups().length)

check('every group appears in the block', () =>
  groups().every(({ group }) => groupBullets(full).some((bullet) => bullet.label === group)))

check('every probed surface is reported present', () => {
  const missing = NAMED_SURFACES.filter((tool) => !full.includes(`\`${tool}\``))
  if (missing.length > 0) throw new Error(`not reported: ${missing.join(', ')}`)
  return true
})

check('a full host prints no absent line', () => absentLine(full) === '')

check("the registry's own count is reported", () =>
  full.includes(`**Tools this agent's registry lists:** ${fullNames.length}`))

// --- 3. a host that offers none of them ------------------------------------------
const empty = call('capabilityBlock', [])

check('a missing surface is named absent', () => {
  const named = absentNames(empty)
  const missing = NAMED_SURFACES.filter((tool) => !named.includes(tool))
  if (missing.length > 0) throw new Error(`not named absent: ${missing.join(', ')}`)
  return true
})

check('the absent line names every missing surface once', () => {
  const named = absentNames(empty)
  const repeated = named.filter((tool, index) => named.indexOf(tool) !== index)
  if (repeated.length > 0) throw new Error(`named twice: ${repeated.join(', ')}`)
  return true
})

check('the absent line keeps its wording', () =>
  absentLine(empty).endsWith('— not in this agent\'s registry; do not plan around these.'))

check('a group with no present surface prints no bullet', () => groupBullets(empty).length === 0)

// --- 4. a host that offers only some of them -------------------------------------
const partialNames = ['subagent', 'subagent_fork', 'workflow', 'spawn_teammate', 'todo_write', 'ask_user_question']
const partial = call('capabilityBlock', partialNames)

check('a missing surface is never reported present', () => {
  const reported = groupBullets(partial).map((bullet) => bullet.text).join('\n')
  const leaked = NAMED_SURFACES.filter((tool) => reported.includes(`\`${tool}\``))
  if (leaked.length > 0) throw new Error(`reported present: ${leaked.join(', ')}`)
  return true
})

check('the absent line names every surface the registry lacks', () => {
  const named = absentNames(partial)
  const missing = groupTools().filter((tool) => !partialNames.includes(tool))
  const notNamed = missing.filter((tool) => !named.includes(tool))
  if (notNamed.length > 0) throw new Error(`not named absent: ${notNamed.join(', ')}`)
  return true
})

check('the absent line names nothing the registry shows', () => {
  const named = absentNames(partial)
  const leaked = partialNames.filter((tool) => named.includes(tool))
  if (leaked.length > 0) throw new Error(`named absent although present: ${leaked.join(', ')}`)
  return true
})

check('a bullet is printed only for a group with a present surface', () => {
  const expected = groups().filter(({ items }) =>
    items.some((item) => partialNames.includes(item.tool))).length
  return groupBullets(partial).length === expected
})

check('the count line reports the registry size, not the table size', () =>
  partial.includes(`**Tools this agent's registry lists:** ${partialNames.length}`))

// --- 5. the bundle's own primitives ----------------------------------------------
const ownNames = bundle.SWARM_TOOL_NAMES ?? []
const ownOnly = call('capabilityBlock', ownNames)

check("the bundle's own tools are never advertised as host surfaces", () => {
  const reported = groupBullets(ownOnly).map((bullet) => bullet.text).join('\n')
  const leaked = ownNames.filter((tool) => reported.includes(`\`${tool}\``))
  if (leaked.length > 0) throw new Error(`advertised as host surfaces: ${leaked.join(', ')}`)
  return true
})

check("the bundle's own tools are not claimed by the host table", () => {
  // The bundle's own primitives are reported by the prompt bullets that
  // mention them, so the host table must claim them neither way: not as
  // present and not as absent.
  const named = absentNames(ownOnly)
  const leaked = ownNames.filter((tool) => named.includes(tool))
  if (leaked.length > 0) throw new Error(`claimed as host surfaces: ${leaked.join(', ')}`)
  return true
})

// --- 6. the unprobed registry ----------------------------------------------------
check('an unprobed registry still says it was not probed', () =>
  call('capabilityBlock', undefined).startsWith('## Host capabilities — not probed'))

console.log(`SUITE CHECKS: ${checks}`)
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
