import { renderPrompt } from 'file:///D:/project/dsh-plugins/swarm-workflow/index.js'
import { readFileSync } from 'node:fs'

const ALL = ['subagent','subagent_fork','workflow','spawn_teammate','send_message','interrupt_agent','list_agents','wait_agent','team_task_create','team_task_update','team_task_get','team_task_list','create_goal','get_goal','update_goal','todo_write','ask_user_question','schedule_create']
const worker = readFileSync('D:/project/dsh-plugins/swarm-workflow/swarm-worker-prompt.md', 'utf8')
const out = renderPrompt(worker, ALL, { command: true })
const checks = {
  has_section16_pointer: out.includes('Its §16 binds the Reviewer'),
  has_section17_pointer: out.includes('Its §17 says where the requirements live'),
  has_capability_block: out.includes('## Host capabilities'),
  has_tools_count: /Tools visible to this agent: \d+/.test(out),
  no_id_tokens: !/\bC\d+\b/.test(out),
  no_marker_leak: !out.includes('swarm:capabilities') && !out.includes('swarm:requires'),
  no_raw_marker: !/<!--\s*swarm:/.test(out),
}
console.log(JSON.stringify(checks, null, 2))
const m = out.split('\n').find(l => l.includes('Its §16'))
console.log('LINE12:', (m||'').slice(0, 220))
const toolLine = out.split('\n').find(l => l.includes('Tools visible to this agent'))
console.log('TOOLS:', toolLine)
console.log('IDTOKENS:', (out.match(/\bC\d+\b/g)||[]).join(','))