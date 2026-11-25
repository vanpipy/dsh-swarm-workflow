// The bundle's own text files must not be damaged.
//
// Three kinds of damage are invisible to every other suite in this bundle:
//   - bytes that are not valid UTF-8,
//   - the replacement character U+FFFD, left behind by a decoder that gave up,
//   - the em-dash mojibake signature U+9225, which is an em dash read as
//     CP936 and written back out as UTF-8.
//
// The policy suites compare the three policy files and the nine craft files
// with the canonical, so damage in those files is caught. Nothing compares
// docs/host-adaptation.md or README.md, so damage there is invisible. This
// suite reads the bundle's text files and fails on damage.
//
// The scope is the bundle's text files, minus the three directories that hold
// no shipped content (.git, node_modules, .swarm). U+FFFD is allowed under
// docs/validation/, where the historical reports quote damaged text as
// evidence. The CJK text in locale/zh.json is ordinary content: it is scanned
// like every other file, and it is not damage.
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative, sep } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))

/** The file extensions the scan reads. */
const TEXT_EXTENSIONS = ['.md', '.mjs', '.js', '.json', '.ps1', '.yml', '.yaml', '.txt']
/** The directories that hold no shipped content. */
const SKIP_DIRECTORIES = ['.git', 'node_modules', '.swarm']
/** The directory where U+FFFD is documented evidence rather than damage. */
const QUOTED_EVIDENCE = 'docs/validation'
/** The replacement character a decoder leaves behind. */
const REPLACEMENT = '\ufffd'
/** An em dash read as CP936 and written back out as UTF-8. */
const MOJIBAKE = '\u9225'
/** The files the scan has to reach: no other check compares them. */
const MUST_SCAN = [
  'README.md',
  'docs/host-adaptation.md',
  'prompt-overlay.md',
  'swarm-prompt.md',
  'runtime-note.md',
  'index.js',
  'package.json',
  'locale/zh.json',
]

let failures = 0
let checks = 0

/**
 * Record one check.
 * @param {string} label - what the check proves.
 * @param {() => boolean} fn - returns true when the check holds.
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
 * The bundle's text files, as paths relative to the bundle root.
 * @returns {string[]} the paths.
 */
function scanFiles() {
  const found = []
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.includes(entry.name)) walk(join(directory, entry.name))
        continue
      }
      if (!entry.isFile()) continue
      const dot = entry.name.lastIndexOf('.')
      if (dot < 1) continue
      if (!TEXT_EXTENSIONS.includes(entry.name.slice(dot).toLowerCase())) continue
      found.push(relative(root, join(directory, entry.name)).split(sep).join('/'))
    }
  }
  walk(root)
  return found.sort()
}

/**
 * The first byte that is not part of a valid UTF-8 sequence.
 * @param {Buffer} bytes - the content of one file.
 * @returns {number} the offset, or -1 when the bytes are valid UTF-8.
 */
function firstInvalidByte(bytes) {
  let index = 0
  while (index < bytes.length) {
    const lead = bytes[index]
    let length = 1
    if (lead >= 0xc2 && lead <= 0xdf) length = 2
    else if (lead >= 0xe0 && lead <= 0xef) length = 3
    else if (lead >= 0xf0 && lead <= 0xf4) length = 4
    else if (lead >= 0x80) return index
    for (let step = 1; step < length; step += 1) {
      if ((bytes[index + step] & 0xc0) !== 0x80) return index
    }
    index += length
  }
  return -1
}

const files = scanFiles()
const content = new Map()
for (const file of files) {
  const bytes = readFileSync(join(root, ...file.split('/')))
  const offset = firstInvalidByte(bytes)
  content.set(file, { text: offset < 0 ? bytes.toString('utf8') : null, offset })
}

const scanned = new Set(files)
const missing = MUST_SCAN.filter((file) => !scanned.has(file))
const scopeProblems = []
if (missing.length > 0) scopeProblems.push(`not scanned: ${missing.join(', ')}`)
if (files.length <= 50) scopeProblems.push(`only ${files.length} files were scanned`)
check(
  scopeProblems.length === 0
    ? `the scan reaches every text file of the bundle (${files.length} files), including the ones no other check compares`
    : `the scan reaches every text file of the bundle -> ${scopeProblems.join('; ')}`,
  () => scopeProblems.length === 0,
)

const invalid = files.filter((file) => content.get(file).offset >= 0)
check(
  invalid.length === 0
    ? 'every scanned file is valid UTF-8'
    : `every scanned file is valid UTF-8 -> ${invalid.map((file) => `${file} (invalid byte at offset ${content.get(file).offset})`).join('; ')}`,
  () => invalid.length === 0,
)

const replaced = files.filter((file) => {
  const text = content.get(file).text
  return text !== null && text.includes(REPLACEMENT) && !file.startsWith(`${QUOTED_EVIDENCE}/`)
})
check(
  replaced.length === 0
    ? `no scanned file carries the replacement character U+FFFD outside ${QUOTED_EVIDENCE}/`
    : `no scanned file carries the replacement character U+FFFD outside ${QUOTED_EVIDENCE}/ -> ${replaced.join(', ')}`,
  () => replaced.length === 0,
)

const mangled = files.filter((file) => {
  const text = content.get(file).text
  return text !== null && text.includes(MOJIBAKE)
})
check(
  mangled.length === 0
    ? 'no scanned file carries the em-dash mojibake signature (U+9225, the bytes e9 88 a5)'
    : `no scanned file carries the em-dash mojibake signature (U+9225, the bytes e9 88 a5) -> ${mangled.join(', ')}`,
  () => mangled.length === 0,
)

console.log(`encoding: ${files.length} text files scanned; U+FFFD is allowed under ${QUOTED_EVIDENCE}/, where the historical reports quote damaged text as evidence`)
console.log(`SUITE CHECKS: ${checks}`)
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
