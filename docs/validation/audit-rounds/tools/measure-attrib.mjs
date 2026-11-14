// Probe the Coordinator's own session log: are the native teammates' tool calls inside it?
// Usage: measure-attrib.mjs <log> <startEpochMs>
import { readFileSync } from 'node:fs'
import { zstdDecompressSync } from 'node:zlib'

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

const path = process.argv[2]
const start = Number(process.argv[3])
const entries = []
for (const line of decode(path).split('\n')) {
  if (!line.trim()) continue
  try { entries.push(JSON.parse(line)) } catch {}
}

const types = {}
const keys = new Set()
const calls = []
for (const e of entries) {
  types[e.type] = (types[e.type] ?? 0) + 1
  for (const k of Object.keys(e)) keys.add(k)
  if (e.type === 'tool/call') {
    const d = e.data ?? {}
    calls.push({
      t: e.time ?? 0,
      name: d.name,
      agent: d.agent ?? d.agentId ?? d.owner ?? d.sessionId ?? '',
      extra: Object.keys(d).filter((k) => !['name', 'arguments'].includes(k)),
    })
  }
}
console.log('entry types:', JSON.stringify(types))
console.log('entry keys:', [...keys].join(','))
const inWindow = calls.filter((c) => c.t >= start)
console.log('tool/call in window:', inWindow.length)
const byAgent = {}
for (const c of inWindow) byAgent[String(c.agent)] = (byAgent[String(c.agent)] ?? 0) + 1
console.log('by agent field:', JSON.stringify(byAgent))
const extraKeys = new Set()
for (const c of inWindow) for (const k of c.extra) extraKeys.add(k)
console.log('data keys seen on tool/call:', [...extraKeys].join(','))
const byName = {}
for (const c of inWindow) byName[c.name] = (byName[c.name] ?? 0) + 1
console.log('by name:', JSON.stringify(byName))
