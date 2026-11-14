import { renderPrompt } from 'file:///D:/project/dsh-plugins/swarm-workflow/index.js'
import { readFileSync } from 'node:fs'
const MINIMAL = ['subagent','todo_write']
const worker = readFileSync('D:/project/dsh-plugins/swarm-workflow/swarm-worker-prompt.md','utf8')
const out = renderPrompt(worker, MINIMAL, { command: false })
for (const line of out.split('\n')) if (/spawn_teammate|team_task/.test(line)) console.log('LINE:', line.slice(0,300))
console.log('--- the worker source lines with the markers ---')
for (const line of worker.split('\n')) if (/swarm:requires/.test(line)) console.log('SRC:', line.slice(0,200))
