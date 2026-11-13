// The registered skills must follow every file they are built from.
//
// The skill the bundle registers is not the skill file: it is the runtime
// note's `skill` blocks plus the skill body, so the re-registration stamp has
// to cover BOTH `skills/swarm-engineering.md` AND `runtime-note.md`. A change
// to runtime-note.md alone must re-register the skill, and a change to the
// skill file alone must re-register it too.
//
// The bundle registers the craft files the same way it registers the skill:
// each one is a skill of its own, so the stamp has to cover them as well. A
// change to a craft file alone must re-register the skills, and the change
// shows up where the file changed: the body in the content, the frontmatter in
// the description.
//
// The shipped files are never touched by this suite. The bundle is copied into
// a sandbox directory and the COPY is exercised there: the copy of index.js
// resolves its markdown relative to itself, so it reads the sandbox's files.
// The last checks prove the edit landed in the sandbox and not in the bundle.
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { ModelContext } from './lib/cordis-model.mjs'

/** The bundle root, one level above this file. */
const root = fileURLToPath(new URL('..', import.meta.url))

/**
 * The craft files the bundle ships, relative to `skills/`, with the skill name
 * each one registers under and the heading of its body.
 */
const CRAFT = [
  { path: 'swarm-engineering/shared.md', name: 'swarm-craft-shared', heading: '# The shared craft' },
  { path: 'swarm-engineering/developer.md', name: 'swarm-craft-developer', heading: "# The developer's craft" },
  { path: 'swarm-engineering/tester.md', name: 'swarm-craft-tester', heading: "# The tester's craft" },
  { path: 'swarm-engineering/reviewer.md', name: 'swarm-craft-reviewer', heading: "# The reviewer's craft" },
  { path: 'swarm-engineering/languages/python.md', name: 'swarm-craft-python', heading: '# The Python pieces' },
]

let failures = 0

/**
 * Compare one value with what the suite expects.
 * @param {string} label - what the check proves.
 * @param {any} actual - the value under test.
 * @param {any} expected - the expected value.
 * @returns {void}
 */
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label} -> ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

/**
 * Run one check whose value is computed by a function, so a thrown error fails
 * the check instead of the whole suite.
 * @param {string} label - what the check proves.
 * @param {Function} compute - returns the value to compare.
 * @param {any} expected - the expected value.
 * @returns {void}
 */
function checkResult(label, compute, expected) {
  let actual
  try {
    actual = compute()
  } catch (error) {
    failures += 1
    console.log(`FAIL ${label} -> threw: ${error.message}`)
    return
  }
  check(label, actual, expected)
}

/**
 * The frontmatter fields of a file, as the plugin reads them.
 * @param {string} path - the file.
 * @returns {object} the fields; empty when the file carries no frontmatter.
 */
function frontmatter(path) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(path, 'utf8'))
  if (match === null) return {}
  const fields = {}
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([A-Za-z]+):\s*(.*)$/.exec(line)
    if (field !== null) fields[field[1]] = field[2].trim()
  }
  return fields
}

const sandbox = mkdtempSync(join(tmpdir(), 'swarm-skill-stamp-'))

try {
  // --- the sandbox copy of the bundle ---------------------------------------
  copyFileSync(join(root, 'index.js'), join(sandbox, 'swarm-bundle.mjs'))
  copyFileSync(join(root, 'runtime-note.md'), join(sandbox, 'runtime-note.md'))
  copyFileSync(join(root, 'prompt-overlay.md'), join(sandbox, 'prompt-overlay.md'))
  copyFileSync(join(root, 'swarm-prompt.md'), join(sandbox, 'swarm-prompt.md'))
  mkdirSync(join(sandbox, 'skills'))
  copyFileSync(join(root, 'skills', 'swarm-engineering.md'), join(sandbox, 'skills', 'swarm-engineering.md'))
  for (const craft of CRAFT) {
    const target = join(sandbox, 'skills', craft.path)
    mkdirSync(join(target, '..'), { recursive: true })
    copyFileSync(join(root, 'skills', craft.path), target)
  }

  const bundle = await import(pathToFileURL(join(sandbox, 'swarm-bundle.mjs')).href)

  /** Every skill registration, in order. */
  const registrations = []
  /** Every registration that was disposed again. */
  const disposed = []
  /** Every prompt section the bundle added. */
  const sections = []

  const ctx = new ModelContext()
  ctx.provide('systemPrompt', { section: (definition) => { sections.push(definition); return () => {} } })
  ctx.provide('agents', { list: () => [], get: () => undefined, roots: () => [], isOwnedBy: () => false })
  ctx.provide('skills', {
    register: (definition) => {
      registrations.push(definition)
      return () => { disposed.push(definition) }
    },
  })
  ctx.provide('tools', {
    register: () => () => {},
    schemas: () => [{ name: 'subagent' }, { name: 'todo_write' }],
  })

  ctx.plugin({ inject: bundle.inject, apply: bundle.apply })

  /** Assemble a prompt, which is what drives the re-registration. */
  const render = () => sections[0].text({ agent: { id: 'a1' } })

  // --- 1. the first registration ---------------------------------------------
  // The skill of the bundle plus the craft files, one registration each.
  check('the bundle registers the skill when it is applied', registrations.length, 6)
  check('the registered skills carry their names in the order they are registered',
    registrations.map((registration) => registration.name),
    ['swarm-engineering', ...CRAFT.map((craft) => craft.name)])
  check('the registered skill keeps the name from the file', registrations[0]?.name, 'swarm-engineering')
  check('the registered skill names this host in its catalog line', registrations[0]?.description.startsWith('On this host the runtime is DeepSeek Harness'), true)
  check('the catalog line keeps the user\'s own description byte for byte', registrations[0]?.description.endsWith(
    /^description:\s*(.*)$/m.exec(readFileSync(join(root, 'skills', 'swarm-engineering.md'), 'utf8'))[1].trim(),
  ), true)
  check('the registered content carries the note\'s skill block', registrations[0]?.content.includes('## The skill on this host'), true)
  check('the registered content carries the user\'s skill body', registrations[0]?.content.includes('A worker cites the requirement as'), true)
  check('the registered content leaves the coordinator\'s note out', registrations[0]?.content.includes('## The Coordinator on this host'), false)
  check('the registered content leaves the worker\'s note out', registrations[0]?.content.includes('## The worker lane on this host'), false)
  check('the registered content is the body, not the frontmatter', /^---\r?\nname: swarm-engineering/.test(registrations[0]?.content ?? ''), false)

  for (const [at, craft] of CRAFT.entries()) {
    const fields = frontmatter(join(root, 'skills', craft.path))
    const registration = registrations[at + 1]
    check(`the ${craft.path} registration carries its own body`, registration?.content.includes(craft.heading), true)
    check(`the ${craft.path} registration carries the note's skill block`, registration?.content.includes('## The skill on this host'), true)
    check(`the ${craft.path} registration starts with the note's first block`, registration?.content.startsWith('# '), true)
    check(`the ${craft.path} registration names this host in its catalog line`, registration?.description.startsWith('On this host the runtime is DeepSeek Harness'), true)
    check(`the ${craft.path} catalog line keeps the file's own description byte for byte`, registration?.description.endsWith(fields.description), true)
    check(`the ${craft.path} registration carries the whenToUse from the file`, registration?.whenToUse, fields.whenToUse)
    check(`the ${craft.path} registration carries the bundle as its source`, registration?.source, 'dsh-swarm-workflow')
    checkResult(`the ${craft.path} registration does not leak its frontmatter into the content`, () => {
      const content = registration?.content ?? ''
      return !content.startsWith('---') && !content.includes('name: swarm-craft-') &&
        !content.includes('whenToUse:') && !content.includes(fields.description)
    }, true)
  }

  // --- 2. a change to runtime-note.md alone re-registers the skills -----------
  const NOTE_EDIT = ' (edited by the stamp test)'
  const notePath = join(sandbox, 'runtime-note.md')
  writeFileSync(notePath, readFileSync(notePath, 'utf8').replace('## The skill on this host', `## The skill on this host${NOTE_EDIT}`), 'utf8')
  render()
  check('a change to runtime-note.md alone re-registers the skills', registrations.length, 12)
  check('the re-registered skill carries the changed note', registrations[6]?.content.includes(`## The skill on this host${NOTE_EDIT}`), true)
  check('the re-registered skill keeps the user\'s body', registrations[6]?.content.includes('A worker cites the requirement as'), true)
  check('the previous registrations are disposed when the skills are re-registered', disposed.length, 6)
  check('the disposed registrations are the first ones', disposed[0] === registrations[0], true)

  // --- 3. a change to the skill file alone re-registers the skills ------------
  const SKILL_EDIT = ' (edited by the stamp test)'
  const skillPath = join(sandbox, 'skills', 'swarm-engineering.md')
  writeFileSync(skillPath, readFileSync(skillPath, 'utf8').replace('A worker cites the requirement as', `A worker cites the requirement as${SKILL_EDIT}`), 'utf8')
  render()
  check('a change to the skill file alone re-registers the skills', registrations.length, 18)
  check('the re-registered skill carries the changed body', registrations[12]?.content.includes(`A worker cites the requirement as${SKILL_EDIT}`), true)
  check('the re-registered skill keeps the changed note', registrations[12]?.content.includes(`## The skill on this host${NOTE_EDIT}`), true)
  check('the second round of registrations is disposed as well', disposed.length, 12)

  // --- 4. a change to a craft file's body re-registers the skills -------------
  // The edit goes to the heading, not to the frontmatter: the frontmatter
  // description repeats the file's name, and the registered body has its
  // frontmatter stripped.
  const CRAFT_EDIT = ' (edited by the stamp test)'
  const craftPath = join(sandbox, 'skills', 'swarm-engineering', 'shared.md')
  writeFileSync(craftPath, readFileSync(craftPath, 'utf8').replace('# The shared craft', `# The shared craft${CRAFT_EDIT}`), 'utf8')
  render()
  check('a change to a craft file alone re-registers the skills', registrations.length, 24)
  check('the re-registered craft file carries the changed body', registrations[19]?.content.includes(`# The shared craft${CRAFT_EDIT}`), true)
  check('the re-registered craft file keeps its name', registrations[19]?.name, 'swarm-craft-shared')
  check('the third round of registrations is disposed as well', disposed.length, 18)

  // --- 5. a change to a craft file's frontmatter changes its description ------
  // The frontmatter is the file's catalog line: changing it changes the
  // description of the registration, and leaves the body alone.
  const DESCRIPTION_EDIT = ' (edited by the stamp test)'
  const testerPath = join(sandbox, 'skills', 'swarm-engineering', 'tester.md')
  writeFileSync(testerPath, readFileSync(testerPath, 'utf8').replace("description: The tester's craft", `description: The tester's craft${DESCRIPTION_EDIT}`), 'utf8')
  render()
  check('a change to a craft file\'s frontmatter re-registers the skills', registrations.length, 30)
  check('the re-registered description carries the edited description', registrations[27]?.description.includes(`The tester's craft${DESCRIPTION_EDIT}`), true)
  check('the re-registered description still names this host', registrations[27]?.description.startsWith('On this host the runtime is DeepSeek Harness'), true)
  check('the re-registered content still carries the unedited body', registrations[27]?.content.includes("# The tester's craft"), true)
  check('the re-registered content starts with the note\'s first block', registrations[27]?.content.startsWith('# '), true)
  check('the edited frontmatter does not leak into the content', registrations[27]?.content.includes(`The tester's craft${DESCRIPTION_EDIT}`), false)
  check('the fourth round of registrations is disposed as well', disposed.length, 24)

  // --- 6. a change to a file the skills do not depend on changes nothing ------
  const overlayPath = join(sandbox, 'prompt-overlay.md')
  writeFileSync(overlayPath, `${readFileSync(overlayPath, 'utf8')}\n<!-- stamp test: the overlay changed -->\n`, 'utf8')
  render()
  check('a change to the policy alone does not re-register the skills', registrations.length, 30)

  // --- 7. the shipped files were never touched --------------------------------
  check('the shipped runtime note does not carry the sandbox edit', readFileSync(join(root, 'runtime-note.md'), 'utf8').includes(NOTE_EDIT), false)
  check('the shipped skill file does not carry the sandbox edit', readFileSync(join(root, 'skills', 'swarm-engineering.md'), 'utf8').includes(SKILL_EDIT), false)
  check('the shipped policy does not carry the sandbox edit', readFileSync(join(root, 'prompt-overlay.md'), 'utf8').includes('stamp test: the overlay changed'), false)
  check('the shipped craft file does not carry the sandbox edit', readFileSync(join(root, 'skills', 'swarm-engineering', 'shared.md'), 'utf8').includes(CRAFT_EDIT), false)
  check('the shipped tester craft file does not carry the sandbox edit', readFileSync(join(root, 'skills', 'swarm-engineering', 'tester.md'), 'utf8').includes(DESCRIPTION_EDIT), false)
} catch (error) {
  failures += 1
  console.log(`FAIL the stamp suite could not run -> ${error.message}`)
} finally {
  rmSync(sandbox, { recursive: true, force: true })
}

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exitCode = failures === 0 ? 0 : 1
