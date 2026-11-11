// The registered skill must follow both files it is built from.
//
// The skill the bundle registers is not the skill file: it is the runtime
// note's `skill` blocks plus the skill body, so the re-registration stamp has
// to cover BOTH `skills/swarm-engineering.md` AND `runtime-note.md`. A change
// to runtime-note.md alone must re-register the skill, and a change to the
// skill file alone must re-register it too.
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

const sandbox = mkdtempSync(join(tmpdir(), 'swarm-skill-stamp-'))

try {
  // --- the sandbox copy of the bundle ---------------------------------------
  copyFileSync(join(root, 'index.js'), join(sandbox, 'swarm-bundle.mjs'))
  copyFileSync(join(root, 'runtime-note.md'), join(sandbox, 'runtime-note.md'))
  copyFileSync(join(root, 'prompt-overlay.md'), join(sandbox, 'prompt-overlay.md'))
  copyFileSync(join(root, 'swarm-prompt.md'), join(sandbox, 'swarm-prompt.md'))
  mkdirSync(join(sandbox, 'skills'))
  copyFileSync(join(root, 'skills', 'swarm-engineering.md'), join(sandbox, 'skills', 'swarm-engineering.md'))

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
  check('the bundle registers the skill when it is applied', registrations.length, 1)
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

  // --- 2. a change to runtime-note.md alone re-registers the skill ------------
  const NOTE_EDIT = ' (edited by the stamp test)'
  const notePath = join(sandbox, 'runtime-note.md')
  writeFileSync(notePath, readFileSync(notePath, 'utf8').replace('## The skill on this host', `## The skill on this host${NOTE_EDIT}`), 'utf8')
  render()
  check('a change to runtime-note.md alone re-registers the skill', registrations.length, 2)
  check('the re-registered skill carries the changed note', registrations[1]?.content.includes(`## The skill on this host${NOTE_EDIT}`), true)
  check('the re-registered skill keeps the user\'s body', registrations[1]?.content.includes('A worker cites the requirement as'), true)
  check('the previous registration is disposed when the skill is re-registered', disposed.length, 1)
  check('the disposed registration is the first one', disposed[0] === registrations[0], true)

  // --- 3. a change to the skill file alone re-registers the skill ------------
  const SKILL_EDIT = ' (edited by the stamp test)'
  const skillPath = join(sandbox, 'skills', 'swarm-engineering.md')
  writeFileSync(skillPath, readFileSync(skillPath, 'utf8').replace('A worker cites the requirement as', `A worker cites the requirement as${SKILL_EDIT}`), 'utf8')
  render()
  check('a change to the skill file alone re-registers the skill', registrations.length, 3)
  check('the re-registered skill carries the changed body', registrations[2]?.content.includes(`A worker cites the requirement as${SKILL_EDIT}`), true)
  check('the re-registered skill keeps the changed note', registrations[2]?.content.includes(`## The skill on this host${NOTE_EDIT}`), true)
  check('the second registration is disposed as well', disposed.length, 2)

  // --- 4. a change to a file the skill does not depend on changes nothing -----
  const overlayPath = join(sandbox, 'prompt-overlay.md')
  writeFileSync(overlayPath, `${readFileSync(overlayPath, 'utf8')}\n<!-- stamp test: the overlay changed -->\n`, 'utf8')
  render()
  check('a change to the policy alone does not re-register the skill', registrations.length, 3)

  // --- 5. the shipped files were never touched --------------------------------
  check('the shipped runtime note does not carry the sandbox edit', readFileSync(join(root, 'runtime-note.md'), 'utf8').includes(NOTE_EDIT), false)
  check('the shipped skill file does not carry the sandbox edit', readFileSync(join(root, 'skills', 'swarm-engineering.md'), 'utf8').includes(SKILL_EDIT), false)
  check('the shipped policy does not carry the sandbox edit', readFileSync(join(root, 'prompt-overlay.md'), 'utf8').includes('stamp test: the overlay changed'), false)
} catch (error) {
  failures += 1
  console.log(`FAIL the stamp suite could not run -> ${error.message}`)
} finally {
  rmSync(sandbox, { recursive: true, force: true })
}

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exitCode = failures === 0 ? 0 : 1
