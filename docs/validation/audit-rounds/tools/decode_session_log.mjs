import { readFileSync, writeFileSync } from 'node:fs'
import { zstdDecompressSync } from 'node:zlib'

const path = process.argv[2]
const outPath = process.argv[3]
const buf = readFileSync(path)
const MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])

let offset = 0
let frames = 0
let chars = 0
const chunks = []
while (offset < buf.length - 4) {
  const idx = buf.indexOf(MAGIC, offset)
  if (idx === -1) break
  try {
    const text = zstdDecompressSync(buf.subarray(idx)).toString('utf8')
    frames += 1
    chars += text.length
    chunks.push(text)
  } catch {
    // not a frame boundary — skip
  }
  offset = idx + 4
}

writeFileSync(outPath, chunks.join('\n'), 'utf8')
console.log(`frames decoded: ${frames}, chars: ${chars}, out: ${outPath}`)
