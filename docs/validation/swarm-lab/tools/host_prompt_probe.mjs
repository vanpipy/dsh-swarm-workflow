/**
 * Probe the INSTALLED bundle on the REAL host runtime.
 *
 * The plugin is not trusted on the strength of its own unit tests: this script
 * loads the copy the profile actually installed, applies it to the host's own
 * cordis runtime, and prints what the host would inject into a Coordinator
 * prompt, a worker prompt, the skill registration and the /swarm command.
 *
 * Run:
 *   $env:ELECTRON_RUN_AS_NODE="1"
 *   & "D:\software\dsh\DeepSeek Harness.exe" tools\host_prompt_probe.mjs
 *
 * Exit code 0 means every check passed.
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const PROFILE_BUNDLE = 'C:/Users/leroy/.dsh/profiles/desktop/node_modules/dsh-swarm-workflow/index.js'
const CORDIS_CANDIDATES = [
  'D:/software/dsh/resources/app.asar/node_modules/@deepseek-ai/cordis/lib/index.js',
  'C:/Program Files/DeepSeek Harness/resources/app.asar/node_modules/@deepseek-ai/cordis/lib/index.js',
]

// The tools this session's registry lists. The probe cannot read the live
// registry of a running GUI session, so it stands in for it; the plugin probes
// the same service the same way.
const LIVE_TOOLS = [
  'subagent', 'subagent_fork', 'workflow', 'spawn_teammate',
  'send_message', 'interrupt_agent', 'list_agents', 'wait_agent',
  'team_task_create', 'team_task_get', 'team_task_list', 'team_task_update',
  'create_goal', 'get_goal', 'update_goal', 'todo_write', 'ask_user_question',
  'schedule_create', 'list_subagent_models', 'skill',
  'job_list', 'job_output', 'job_kill', 'plugin_manager', 'present',
  'swarm_task', 'swarm_child',
]

let failures = 0
function check(label, ok, detail = '') {
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ` -> ${detail}` : ''}`)
}

async function loadCordis() {
  for (const candidate of CORDIS_CANDIDATES) {
    if (!existsSync(candidate)) continue
    const url = `file:///${candidate.replace(/\\/g, '/')}`
    try {
      const module = await import(url)
      if (typeof module?.Context === 'function') return { module, path: url }
    } catch {
      // Not this one; try the next candidate.
    }
  }
  return null
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 10))

const cordis = await loadCordis()
if (cordis === null) {
  console.log('FAIL the host cordis runtime was not found on this machine')
  process.exit(1)
}
console.log(`host runtime : ${cordis.path}`)
console.log(`bundle       : file:///${PROFILE_BUNDLE}`)

const bundle = await import(`file:///${PROFILE_BUNDLE}`)
check('the installed bundle exports the v2 composition API',
  typeof bundle.composeCoordinatorPrompt === 'function' &&
  typeof bundle.composeWorkerPrompt === 'function' &&
  typeof bundle.parseRuntimeNote === 'function' &&
  typeof bundle.renderPrompt === 'function')

const sections = []
const skills = []
const registeredTools = []
const commands = []

const ctx = new cordis.module.Context()
ctx.provide('systemPrompt', { section: (definition) => { sections.push(definition); return () => {} } })
ctx.provide('agents', { list: () => [], get: () => undefined, roots: () => [{ id: 'root-1' }], isOwnedBy: () => false })
ctx.provide('skills', { register: (definition) => { skills.push(definition); return () => {} } })
ctx.provide('tools', {
  register: (definition) => { registeredTools.push(definition.name); return () => {} },
  schemas: () => LIVE_TOOLS.map((name) => ({ name })),
})
ctx.provide('commands', { register: (definition) => { commands.push(definition); return () => {} } })
ctx.provide('agentTeams', { tryMembership: () => undefined })
ctx.provide('worktrees', { create: async () => ({}) })
ctx.provide('subagents', { listChildren: async () => [] })

ctx.plugin({ inject: bundle.inject, apply: bundle.apply })
await tick()

check('the bundle registered the system prompt section', sections.length === 1, `${sections.length} section(s)`)
check('the bundle registered the three swarm primitives',
  registeredTools.slice().sort().join(',') === 'swarm_child,swarm_task,swarm_worktree',
  registeredTools.join(', '))
check('the bundle registered the /swarm command', commands.length === 1 && commands[0].name === 'swarm')

const section = sections[0]
const coordinator = section.text({ agent: { id: 'root-1' } })
const worker = section.text({ agent: { id: 'lane-1' } })

console.log('')
console.log('=== coordinator prompt ===')
console.log(`characters: ${coordinator.length}   lines: ${coordinator.split('\n').length}`)
for (const anchor of [
  '## Host identity',
  '## Surface map: Jcode to DeepSeek Harness',
  '## Where the work is written down on this host',
  '## Independent verification on this host',
  '## Live capabilities of this session',
  '## The Coordinator on this host',
  '# Global Execution Policy',
  '## 12. Swarm Orchestration',
  'Requirements belong to a todo lane',
  '## Host capabilities — probed live',
]) check(`the coordinator prompt carries "${anchor}"`, coordinator.includes(anchor))

console.log('')
console.log('=== worker prompt ===')
console.log(`characters: ${worker.length}   lines: ${worker.split('\n').length}`)
for (const anchor of [
  '## The worker lane on this host',
  '## 11. Policy and Tool Boundaries',
  '## 8. Assignment and Reporting Contract',
  '## 12. Requirement Matching',
  '## 13. Requirement Handover',
]) check(`the worker prompt carries "${anchor}"`, worker.includes(anchor))
check('the worker prompt does not carry the orchestration manual', !worker.includes('## 12. Swarm Orchestration'))
check('the worker prompt does not carry the coordinator section', !worker.includes('## The Coordinator on this host'))

console.log('')
check('no marker survives in the coordinator prompt', !coordinator.includes('<!-- swarm:'))
check('no marker survives in the worker prompt', !worker.includes('<!-- swarm:'))
check('no marker survives in the skill content', !skills[0].content.includes('<!-- swarm:'))
check('the capability block reports the probed live state',
  coordinator.includes('## Host capabilities — probed live') && worker.includes('## Host capabilities — probed live'))

console.log('')
console.log('=== skill registration ===')
check('the bundle registers the swarm skill and the craft skills', skills.length === 10, `${skills.length} registration(s)`)
console.log(`name        : ${skills[0].name}`)
console.log(`description : ${skills[0].description}`)
console.log(`content     : ${skills[0].content.length} characters`)
check('the skill description names the runtime note',
  skills[0].description.startsWith('On this host the runtime is DeepSeek Harness, not Jcode'))
check('the skill description keeps the user text after the host note',
  skills[0].description.includes('Engineering execution methods for Jcode Swarm workers.'))
check('the skill content carries the runtime note first',
  skills[0].content.includes('# Runtime note — this host is DeepSeek Harness, not Jcode'))
check('the skill content carries the user skill text',
  skills[0].content.includes('# Swarm Engineering Skill') && skills[0].content.includes('## 13. Requirement Handover'))
check('the craft skills are registered beside it',
  skills.slice(1).map((skill) => skill.name).join(',') ===
    'swarm-craft-shared,swarm-craft-developer,swarm-craft-tester,swarm-craft-reviewer,swarm-craft-python,'
    + 'swarm-craft-java,swarm-craft-go,swarm-craft-typescript,swarm-craft-rust',
  skills.slice(1).map((skill) => skill.name).join(','))
check('no craft registration carries a marker', skills.slice(1).every((skill) => !skill.content.includes('<!-- swarm:')))
check('no craft registration carries an unresolved token', skills.slice(1).every((skill) => !skill.content.includes('{{swarm:')))

console.log('')
console.log('=== /swarm command ===')
const printed = commands[0].handler({ agent: { id: 'root-1' } })
console.log(printed.text)
check('the command output carries the probed-live header', printed.text.includes('## Host capabilities — probed live'))
check('the command output names the runtime note', printed.text.includes('runtime note'))

console.log('')
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
