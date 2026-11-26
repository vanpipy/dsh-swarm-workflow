// test/host-surface.test.mjs
//
// The host note must name the host's model-facing tools, and every tool it
// does not name must sit in the exception list below with a reason. The
// names come from the host's own source — the packed asar — never from a
// hand-written list, so a host that ships a new tool breaks this suite until
// the note names it or the exception list explains why it does not.
//
// The reverse direction runs too: a tool the note's own tool section names
// must exist in the host's inventory, so the note cannot advertise a tool
// this host does not have.
//
// The asar is not on every machine. When it is missing, the checks that need
// it are SKIPPED and the skip is printed; a skip is never reported as a pass.

import { readFileSync, existsSync, readdirSync, openSync, closeSync, readSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readAsarHeader } from './lib/asar.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const bundleRoot = join(here, '..')
const NOTE_PATH = join(bundleRoot, 'runtime-note.md')
const note = readFileSync(NOTE_PATH, 'utf8')

let checks = 0
let failures = 0
const check = (label, ok, detail = '') => {
  checks += 1
  if (ok) {
    console.log(`PASS ${label}`)
    return
  }
  failures += 1
  console.log(`FAIL ${label}${detail ? ` - ${detail}` : ''}`)
}

/**
 * The tools this note does not name, each with the reason it is absent.
 * A name may only be missing from the note when it sits here with a reason.
 */
const EXCEPTIONS = {
  ralph:
    'the host ships a loop tool for a repeatable objective; it overlaps the bundle\'s own goal-round mechanism (create_goal), and the note names that instead',
  session_search:
    'the session query service is installed in this profile, but the tool bundle that exposes it (dsh-tool-session-query) is not, so no session-search tool exists here',
  session_trace:
    'same reason as session_search: the session query service is installed, the tool bundle that exposes it is not',
  session_event_read:
    'same reason as session_search: the session query service is installed, the tool bundle that exposes it is not',
  session_event_search:
    'same reason as session_search: the session query service is installed, the tool bundle that exposes it is not',
  session_event_trace:
    'same reason as session_search: the session query service is installed, the tool bundle that exposes it is not',
  str_replace_editor:
    'an editor variant of the file tools the note already names (read, write, edit)',
  terminal_open:
    'the host\'s terminal bundle is not installed in this profile, so no terminal tool exists here',
  terminal_read:
    'same reason as terminal_open: the host\'s terminal bundle is not installed in this profile',
  terminal_send:
    'same reason as terminal_open: the host\'s terminal bundle is not installed in this profile',
  terminal_close:
    'same reason as terminal_open: the host\'s terminal bundle is not installed in this profile',
  terminal_list:
    'same reason as terminal_open: the host\'s terminal bundle is not installed in this profile',
  terminal_signal:
    'same reason as terminal_open: the host\'s terminal bundle is not installed in this profile',
}

/** The tools this bundle adds. They are not host surfaces, so the note says so. */
const BUNDLE_OWN_TOOLS = new Set(['swarm_task', 'swarm_child', 'swarm_worktree'])

/** The asar, when this machine has one. */
const ASAR_CANDIDATES = [
  process.env.DSH_ASAR_PATH,
  'D:\\software\\dsh\\resources\\app.asar',
  'C:\\Program Files\\DeepSeek\\resources\\app.asar',
  'C:\\Program Files\\DeepSeek Harness\\resources\\app.asar',
].filter(Boolean)
const asarPath = ASAR_CANDIDATES.find((candidate) => existsSync(candidate)) ?? null

/** Every backticked token in the note that reads like a tool name. */
const namedNames = (text) =>
  new Set(
    [...text.matchAll(/`([^`\n]+)`/g)]
      .map((match) => match[1])
      .filter((token) => /^[a-z][a-z0-9_]*$/.test(token)),
  )

/** The names the note's own tool section carries. */
const toolSection = (() => {
  const start = note.indexOf("## The host's model-facing tools")
  if (start === -1) return ''
  const slice = note.slice(start)
  const end = slice.indexOf('\n<!-- swarm:note')
  return end === -1 ? slice : slice.slice(0, end)
})()

/** The host's model-facing tools, read out of the host's own source. */
function readHostInventory() {
  const { header, base } = readAsarHeader(asarPath)
  const fd = openSync(asarPath, 'r')
  const files = []
  const walk = (node, prefix) => {
    for (const [name, entry] of Object.entries(node.files ?? {})) {
      const path = prefix ? `${prefix}/${name}` : name
      if (entry.files) walk(entry, path)
      else files.push({ path, entry })
    }
  }
  walk(header, '')
  const read = (path) => {
    const found = files.find((file) => file.path === path)
    if (!found || found.entry.offset === undefined) return ''
    const buffer = Buffer.alloc(found.entry.size)
    readSync(fd, buffer, 0, found.entry.size, base + Number(found.entry.offset))
    return buffer.toString('utf8')
  }
  const scoped = files.filter((file) => file.path.startsWith('dsh/node_modules/@deepseek-ai/'))

  // A tool is registered with defineTool({ name: … }). The name is usually a
  // literal; four of the host's tools bind it to a constant instead, so the
  // constant is resolved in the same file: `const NAME = "literal"`, or a
  // destructured config key whose schema carries a default.
  const tools = new Set()
  const add = (name) => {
    if (/^[a-z][a-z0-9_]*$/.test(name)) tools.add(name)
  }
  for (const file of scoped) {
    if (!file.path.endsWith('.js')) continue
    const source = read(file.path)
    const pattern = /defineTool\(\s*\{\s*name\s*:\s*([^,\n]+)/g
    let match
    while ((match = pattern.exec(source)) !== null) {
      const value = match[1].trim()
      if (/^['"`]/.test(value)) {
        add(value.replace(/^['"`]/, '').replace(/['"`]$/, ''))
        continue
      }
      const identifier = value.replace(/[^A-Za-z0-9_]/g, '')
      const constant = new RegExp(`const\\s+${identifier}\\s*=\\s*([^;\\n]+)`).exec(source)
      if (constant) {
        const literal = /['"`]([a-z][a-z0-9_]*)['"`]/.exec(constant[1])
        if (literal) {
          add(literal[1])
          continue
        }
      }
      const schema = new RegExp(
        `${identifier}\\s*:\\s*z\\.[^,\\n]*\\.default\\(\\s*['"\`]([a-z][a-z0-9_]*)['"\`]`,
      ).exec(source)
      if (schema) add(schema[1])
    }
  }
  // A shipped patch renames one of them, so the patch files are read too.
  for (const file of scoped) {
    if (!/\.(yml|yaml)$/.test(file.path)) continue
    const pattern = /^[ \t]*toolName[ \t]*:[ \t]*["']?([a-z][a-z0-9_]*)["']?[ \t]*$/gm
    let match
    while ((match = pattern.exec(read(file.path))) !== null) add(match[1])
  }

  // The host's own commands. The bundle's /swarm command is not one of them.
  const commands = new Set()
  for (const file of scoped) {
    if (!file.path.endsWith('.js')) continue
    const pattern = /commands\.register\(\s*\{[^}]*?name\s*:\s*['"`]([a-zA-Z0-9_-]+)['"`]/gs
    let match
    while ((match = pattern.exec(read(file.path))) !== null) commands.add(match[1])
  }

  closeSync(fd)
  return {
    tools: [...tools].sort(),
    commands: [...commands].sort(),
    read: (path) => {
      const { header: head, base: offset } = readAsarHeader(asarPath)
      const descriptor = openSync(asarPath, 'r')
      const stack = [{ node: head, prefix: '' }]
      while (stack.length > 0) {
        const { node, prefix } = stack.pop()
        for (const [name, entry] of Object.entries(node.files ?? {})) {
          const candidate = prefix ? `${prefix}/${name}` : name
          if (candidate === path) {
            if (entry.offset === undefined) {
              closeSync(descriptor)
              return ''
            }
            const buffer = Buffer.alloc(entry.size)
            readSync(descriptor, buffer, 0, entry.size, offset + Number(entry.offset))
            closeSync(descriptor)
            return buffer.toString('utf8')
          }
          if (entry.files) stack.push({ node: entry, prefix: candidate })
        }
      }
      closeSync(descriptor)
      return ''
    },
  }
}

// ---------------------------------------------------------------------------
// The checks that need only the note and the bundle.
// ---------------------------------------------------------------------------

const craftDirectory = join(bundleRoot, 'skills', 'swarm-engineering')
const craftFiles = []
if (existsSync(craftDirectory)) {
  for (const file of readdirSync(craftDirectory)) {
    if (file.endsWith('.md') && file !== 'swarm-engineering.md') craftFiles.push(file)
  }
  const languagesDirectory = join(craftDirectory, 'languages')
  if (existsSync(languagesDirectory)) {
    for (const file of readdirSync(languagesDirectory)) {
      if (file.endsWith('.md')) craftFiles.push(file)
    }
  }
}
const shippedSkills = craftFiles.length + 1
const skillNames = ['swarm-engineering', ...craftFiles.map((file) => `swarm-craft-${file.replace(/\.md$/, '')}`)]

const WORD_NUMBERS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12,
}
const declared = /(\w+)\s+skills\s+and\s+three\s+pass-through/.exec(note)
const declaredCount = declared ? WORD_NUMBERS[declared[1].toLowerCase()] ?? null : null

check(
  'the note states the true skill count',
  declaredCount !== null && declaredCount === shippedSkills,
  `the note says ${declaredCount ?? 'no number'}, the bundle ships ${shippedSkills}`,
)
const unnamedSkills = skillNames.filter((name) => !note.includes(name))
check(
  'the note names every skill the bundle registers',
  unnamedSkills.length === 0 && skillNames.length === 10,
  `unnamed: ${unnamedSkills.join(', ') || 'none'} (the bundle ships ${skillNames.length})`,
)

check(
  'the note says the host has no native review or judge command',
  /no native review or judge command/.test(note) && /no tool exposes them to a\s+model/.test(note),
)
check(
  'the note states the per-call authorization review under the Auto preset',
  /per-call\s+LLM\s+authorization\s+review/.test(note) && /\*\*Auto\*\*\s+permission\s+preset/.test(note),
)
check('the note names the /swarm command', /`\/swarm`/.test(note))
const bundleIndex = readFileSync(join(bundleRoot, 'index.js'), 'utf8')
check(
  'the bundle registers a command of its own named swarm',
  /commands\.register\(\s*\{[^}]*name:\s*['"]swarm['"]/.test(bundleIndex),
)
const coordinatorSection = note.slice(note.indexOf('## The Coordinator on this host'))
for (const tool of BUNDLE_OWN_TOOLS) {
  const bullet = coordinatorSection.split('\n').find((line) => line.startsWith(`- \`${tool}\``)) ?? ''
  check(
    `the note marks ${tool} as the bundle's own tool, not a host surface`,
    /this bundle's own tool, not a host surface/.test(bullet),
  )
}
check("the note names the host's own create_worktree", namedNames(note).has('create_worktree'))

// ---------------------------------------------------------------------------
// The checks that need the host's own source.
// ---------------------------------------------------------------------------

if (asarPath === null) {
  console.log(
    `SUITE ARM: host asar = SKIPPED (no packed asar on this machine; looked at ${ASAR_CANDIDATES.join(', ')})`,
  )
  console.log(
    'SKIPPED, NOT VERIFIED: the checks that need the host\'s own tool inventory did not run',
  )
} else {
  console.log(`SUITE ARM: host asar = ran (${asarPath})`)
  const host = readHostInventory()
  const hostTools = host.tools
  const noteNames = namedNames(note)

  const unnamed = hostTools.filter((name) => !noteNames.has(name) && !(name in EXCEPTIONS))
  check(
    'every model-facing tool the host ships is named in the note or listed with a reason',
    unnamed.length === 0,
    `not named and not excepted: ${unnamed.join(', ') || 'none'}`,
  )
  const dead = Object.keys(EXCEPTIONS).filter((name) => noteNames.has(name))
  check(
    'no exception lists a tool the note names',
    dead.length === 0,
    `the note names ${dead.join(', ')}`,
  )
  const unreasoned = Object.entries(EXCEPTIONS).filter(([, reason]) => reason.trim().length < 20)
  check(
    'every exception carries a reason',
    unreasoned.length === 0,
    unreasoned.map(([name]) => name).join(', '),
  )

  const sectionNames = namedNames(toolSection)
  const unknown = [...sectionNames].filter(
    (name) => !hostTools.includes(name) && !BUNDLE_OWN_TOOLS.has(name),
  )
  check(
    "every tool the note's own tool section names exists in the host's inventory",
    unknown.length === 0,
    `the note names ${unknown.join(', ') || 'none'} that the host does not ship`,
  )

  const reviewNames = ['autoreview', 'autojudge', 'review', 'judge']
  const reviewTools = hostTools.filter((name) => reviewNames.includes(name))
  const reviewCommands = host.commands.filter((name) => reviewNames.includes(name.toLowerCase()))
  check(
    'the host ships no review command and no review tool',
    reviewTools.length === 0 && reviewCommands.length === 0,
    `tools: ${reviewTools.join(', ') || 'none'}; commands: ${reviewCommands.join(', ') || 'none'}`,
  )

  const autoReview = host.read('dsh/node_modules/@deepseek-ai/dsh-experimental-auto-review/lib/index.js')
  const permissionPresets = host.read('dsh/node_modules/@deepseek-ai/dsh-permission-presets/lib/index.js')
  check(
    'the host ships the per-call review gate under the Auto preset',
    /AUTO_PRESET/.test(autoReview) &&
      /permissionPresets\.registerAuto/.test(autoReview) &&
      /AUTO_PRESET\s*=\s*["']auto["']/.test(permissionPresets),
    'the auto-review package or the Auto preset was not found in the host source',
  )
  check(
    'the auto-review gate registers no command and no tool of its own',
    !/tools\.register\(/.test(autoReview) && !/commands\.register\(/.test(autoReview),
  )
}

console.log(`SUITE CHECKS: ${checks}`)
if (failures === 0) console.log('ALL CHECKS PASSED')
else console.log(`${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
