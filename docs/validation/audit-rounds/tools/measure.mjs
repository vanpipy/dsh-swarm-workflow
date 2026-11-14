// Measure a DSH agent session log: tool calls, wall-clock, duplication, prompt size.
import { readFileSync } from 'node:fs'
import { zstdDecompressSync } from 'node:zlib'

const MUTATING = new Set(['edit', 'write', 'pwsh', 'job_kill', 'schedule_create', 'schedule_delete', 'schedule_update', 'update_goal', 'create_goal', 'team_task_update', 'team_task_create', 'plugin_manager', 'mnemon_runtime_memory', 'mnemon_remember', 'mnemon_document_manage', 'mnemon_document_create'])

function decode(path) {
  const buf = readFileSync(path)
  const MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])
  let offset = 0
  const chunks = []
  while (offset < buf.length - 4) {
    const idx = buf.indexOf(MAGIC, offset)
    if (idx === -1) break
    try { chunks.push(zstdDecompressSync(buf.subarray(idx)).toString('utf8')) } catch {}
    offset = idx + 4
  }
  return chunks.join('\n')
}

function measure(path) {
  const entries = []
  for (const line of decode(path).split('\n')) {
    if (!line.trim()) continue
    try { entries.push(JSON.parse(line)) } catch {}
  }
  const tools = []
  let first = Infinity
  let last = 0
  let sysChars = 0
  let assistant = 0
  let steps = 0
  let id = ''
  let origin = ''
  let label = ''
  let model = ''
  let parent = ''
  for (const e of entries) {
    const t = e.time ?? 0
    if (t) { if (t < first) first = t; if (t > last) last = t }
    if (e.type === 'tool/call') tools.push({ name: e.data?.name, args: e.data?.arguments ?? '', t })
    else if (e.type === 'assistant/message') assistant += 1
    else if (e.type === 'step/start') steps += 1
    else if (e.type === 'system/message') {
      const c = e.data?.message?.content ?? []
      for (const part of c) if (part.type === 'text') sysChars += part.text.length
    } else if (e.type === 'session') { id = e.id; origin = e.origin ?? ''; parent = e.parentSession ?? '' }
    else if (e.type === 'subagent/descriptor') { label = e.data?.label ?? ''; model = e.data?.agentModel ?? '' }
  }
  const seen = new Map()
  let dupes = 0
  for (const c of tools) {
    const key = c.name + ' ' + c.args
    const n = (seen.get(key) ?? 0) + 1
    seen.set(key, n)
    if (n > 1) dupes += 1
  }
  const byName = {}
  for (const c of tools) byName[c.name] = (byName[c.name] ?? 0) + 1
  const mutating = tools.filter((c) => MUTATING.has(c.name)).length
  const timeline = tools.map((c) => ({ min: Math.round((c.t - first) / 60000), name: c.name, t: c.t }))
  return { id, origin, label, model, parent, wallSec: Math.round((last - first) / 1000), firstTime: first, lastTime: last, tools: tools.length, mutating, readOnly: tools.length - mutating, dupes, assistant, steps, sysChars, byName, timeline }
}

for (const path of process.argv.slice(2)) {
  try { console.log(JSON.stringify(measure(path))) } catch (e) { console.log(JSON.stringify({ path, error: String(e) })) }
}