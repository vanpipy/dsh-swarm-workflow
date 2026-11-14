// Render both prompt variants with the live renderPrompt and check the current wording.
import { renderPrompt } from 'file:///D:/project/dsh-plugins/swarm-workflow/index.js'
import { readFileSync } from 'node:fs'

const ALL = ['subagent','subagent_fork','workflow','spawn_teammate','send_message','interrupt_agent','list_agents','wait_agent','team_task_create','team_task_update','team_task_get','team_task_list','create_goal','get_goal','update_goal','todo_write','ask_user_question','schedule_create']
const MINIMAL = ['subagent','todo_write']

const worker = readFileSync('D:/project/dsh-plugins/swarm-workflow/swarm-worker-prompt.md', 'utf8')
const coordinator = readFileSync('D:/project/dsh-plugins/swarm-workflow/swarm-prompt.md', 'utf8')

const w = renderPrompt(worker, ALL, { command: true })
const c = renderPrompt(coordinator, ALL, { command: true })
const wMin = renderPrompt(worker, MINIMAL, { command: false })

const checks = {
  worker_16_scope: w.includes('§16 binds you whenever your assignment carries requirements'),
  worker_17_pointer: w.includes('§17'),
  worker_no_old_scope: !w.includes('Its §16 binds the Reviewer'),
  coordinator_16_17: c.includes("The skill's §16 and §17 are yours as well as the lanes'."),
  coordinator_14_pointer: c.includes('numbering the criteria in every brief'),
  no_id_tokens: !/\bC\d+\b/.test(w) && !/\bC\d+\b/.test(c),
  no_marker_leak: !/swarm:(capabilities|requires)/.test(w + c),
  no_raw_marker: !/<!--\s*swarm:/.test(w + c),
  worker_capability_block: w.includes('## Host capabilities — probed live'),
  minimal_drops_board_bullet: !wMin.includes('spawn_teammate'),
  minimal_absent_line: wMin.includes('Absent in this session'),
}
console.log(JSON.stringify(checks, null, 2))
for (const line of w.split('\n')) if (line.includes('§16') || line.includes('§17')) console.log('WORKER |', line.slice(0, 240))
for (const line of c.split('\n')) if (line.includes('§16') || line.includes('§17')) console.log('COORD  |', line.slice(0, 240))
console.log('IDTOKENS:', (w.match(/\bC\d+\b/g) || []).join(','), (c.match(/\bC\d+\b/g) || []).join(','))
