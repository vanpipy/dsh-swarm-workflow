// Print the tail of a DSH session log (zstd frames) - types, tool names, short snippets.
// Run: "D:\software\dsh\DeepSeek Harness.exe" tail-log.mjs <session-dir> [n]
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { zstdDecompressSync } from 'node:zlib';

const dir = process.argv[2];
const want = Number(process.argv[3] ?? 40);
const file = join(dir, 'session.v4.jsonl.zstd');
const buf = readFileSync(file);

const MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd]);
let text = '';
let offset = 0;
while (offset < buf.length - 4) {
  const idx = buf.indexOf(MAGIC, offset);
  if (idx === -1) break;
  try {
    text += zstdDecompressSync(buf.subarray(idx)).toString('utf8') + '\n';
  } catch {
    // not a frame boundary - skip
  }
  offset = idx + 4;
}

const lines = text.split('\n').filter((l) => l.trim().startsWith('{'));
const parsed = [];
for (const l of lines) {
  try { parsed.push(JSON.parse(l)); } catch { /* skip */ }
}
const out = parsed.slice(-want);
for (const e of out) {
  const d = e.data ?? {};
  let extra = '';
  if (e.type === 'tool/call') extra = `${d.name} ${JSON.stringify(d.arguments ?? {}).slice(0, 150)}`;
  else if (e.type === 'assistant/message' || e.type === 'user/message') {
    const c = d.content ?? d.text ?? d.message ?? '';
    extra = JSON.stringify(c).slice(0, 200);
  } else if (e.type === 'tool/result') extra = JSON.stringify(d).slice(0, 160);
  console.log(`${e.seq}\t${new Date(e.time).toISOString().slice(11, 19)}\t${e.type}\t${extra}`);
}
