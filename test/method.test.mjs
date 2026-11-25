// The craft files themselves.
//
// The craft guidance is not composed into a prompt: the runtime note names the
// files through a token, the plugin resolves that token to a path, and a lane
// reads the file at that path. So the prompt suite can only see the path — it
// cannot tell a craft file that lost a piece from one that is still whole.
// This suite reads the files, so a rewrite that drops the craft guidance is a
// red suite rather than a silently shorter method.
//
// Nine craft files ship under `skills/swarm-engineering/`: the shared craft
// every lane works by, the craft of the Developer, of the Tester and of the
// Reviewer, and one file per language — Python, Java, Go, TypeScript and Rust.
// The bundle registers ten skills: the role-methods skill plus one for each
// craft file. The contract below is the design they ship: the sections, the
// three checks, the twelve pieces, and the nineteen sections of each language
// file. A rewrite that changes the design has to change this suite too —
// that is deliberate, because the shape of the guidance is part of what a brief
// points at.
//
// Every file is host-neutral on purpose: it names no host, no machine path and
// no plugin marker, so the craft travels with the bundle wherever it is
// installed.
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** The craft files the bundle ships, and the design each one carries. */
const CRAFT_FILES = [
  {
    key: 'shared',
    path: 'skills/swarm-engineering/shared.md',
    name: 'shared.md',
    title: 'The shared craft',
    sections: [
      '1. How to use this file',
      '2. The three checks that hold in every language',
      '3. The pieces that hold in every language',
      '4. The same piece in another stack',
      '5. What this directory does not cover',
    ],
  },
  {
    key: 'developer',
    path: 'skills/swarm-engineering/developer.md',
    name: 'developer.md',
    title: "The developer's craft",
    sections: [
      '1. How to use this file',
      '2. Name the target before the edit',
      '3. Shape the change',
      '4. Make the code say what it means',
      '5. Prove it as you go',
      '6. The language pieces',
    ],
  },
  {
    key: 'tester',
    path: 'skills/swarm-engineering/tester.md',
    name: 'tester.md',
    title: "The tester's craft",
    sections: [
      '1. How to use this file',
      '2. Choose the oracle',
      '3. Make the check discriminate',
      '4. Cover the boundary, not the middle',
      '5. Prove the check can fail',
      '6. Report honestly',
    ],
  },
  {
    key: 'reviewer',
    path: 'skills/swarm-engineering/reviewer.md',
    name: 'reviewer.md',
    title: "The reviewer's craft",
    sections: [
      '1. How to use this file',
      '2. Read the change as a claim',
      '3. Re-derive the evidence yourself',
      '4. The review smells',
      '5. Hunt the check that cannot fail',
      '6. Name what you did not check',
      '7. The severity vocabulary',
    ],
  },
  {
    key: 'python',
    path: 'skills/swarm-engineering/languages/python.md',
    name: 'python.md',
    title: 'The Python pieces',
    sections: [
      '0. How to use this file',
      '1. The surface: layout, packaging, the version floor',
      '2. Typing',
      '3. Data modelling',
      '4. Collections and the standard library',
      '5. Iteration and laziness',
      '6. Errors',
      '7. Resources',
      '8. Files and paths',
      '9. The shell and the outside world',
      '10. Time and clocks',
      '11. Concurrency',
      '12. Testing',
      '13. The command line',
      '14. Performance',
      '15. Style, naming and docstrings',
      '16. Dependencies and environments',
      '17. Logging and diagnostics',
      '18. Security',
      '19. The common traps',
    ],
  },
  {
    key: 'java',
    path: 'skills/swarm-engineering/languages/java.md',
    name: 'java.md',
    title: 'The Java pieces',
    sections: [
      '0. How to use this file',
      '1. The surface: layout, packaging, the version floor',
      '2. Typing',
      '3. Data modelling',
      '4. Collections and the standard library',
      '5. Iteration and laziness',
      '6. Errors',
      '7. Resources',
      '8. Files and paths',
      '9. The shell and the outside world',
      '10. Time and clocks',
      '11. Concurrency',
      '12. Testing',
      '13. The command line',
      '14. Performance',
      '15. Style, naming and documentation comments',
      '16. Dependencies and environments',
      '17. Logging and diagnostics',
      '18. Security',
      '19. The common traps',
    ],
  },
  {
    key: 'go',
    path: 'skills/swarm-engineering/languages/go.md',
    name: 'go.md',
    title: 'The Go pieces',
    sections: [
      '0. How to use this file',
      '1. The surface: layout, packaging, the version floor',
      '2. Typing',
      '3. Data modelling',
      '4. Collections and the standard library',
      '5. Iteration and the loop variable',
      '6. Errors',
      '7. Resources',
      '8. Files and paths',
      '9. The shell and the outside world',
      '10. Time and clocks',
      '11. Concurrency',
      '12. Testing',
      '13. The command line',
      '14. Performance',
      '15. Style, naming and docstrings',
      '16. Dependencies and environments',
      '17. Logging and diagnostics',
      '18. Security',
      '19. The common traps',
    ],
  },
  {
    key: 'typescript',
    path: 'skills/swarm-engineering/languages/typescript.md',
    name: 'typescript.md',
    title: 'The TypeScript pieces',
    sections: [
      '0. How to use this file',
      '1. The surface: layout, packaging, the version floor',
      '2. Typing and the compiler options',
      '3. Data modelling',
      '4. Collections and the standard library',
      '5. Iteration and laziness',
      '6. Errors',
      '7. Resources',
      '8. Files and paths',
      '9. The shell and the outside world',
      '10. Time and clocks',
      '11. Concurrency',
      '12. Testing',
      '13. The command line',
      '14. Performance',
      '15. Style, naming and docstrings',
      '16. Dependencies and environments',
      '17. Logging and diagnostics',
      '18. Security',
      '19. The common traps',
    ],
  },
  {
    key: 'rust',
    path: 'skills/swarm-engineering/languages/rust.md',
    name: 'rust.md',
    title: 'The Rust pieces',
    sections: [
      '0. How to use this file',
      '1. The surface: layout, packaging, the version floor',
      '2. Typing',
      '3. Data modelling',
      '4. Collections and the standard library',
      '5. Iteration and laziness',
      '6. Errors and the Result type',
      '7. Resources',
      '8. Files and paths',
      '9. The shell and the outside world',
      '10. Time and clocks',
      '11. Concurrency',
      '12. Testing',
      '13. The command line',
      '14. Performance',
      '15. Style, naming and docstrings',
      '16. Dependencies and environments',
      '17. Logging and diagnostics',
      '18. Security',
      '19. The common traps',
    ],
  },
]
/** The three checks that hold in every language. */
const SHARED_CHECKS = [
  '2.1 Make the check falsifiable',
  '2.2 Re-derive every number a second way',
  '2.3 Validate where the artifact runs',
]
/** The labels every check carries. */
const CHECK_LABELS = ['**The principle.**', '**In practice.**', '**How you show it.**']
/** The twelve pieces that hold in every language. */
const SHARED_PIECES = [
  '3.1 Boundaries and modules',
  '3.2 Types and contracts',
  '3.3 Errors, exit codes and streams',
  '3.4 Dependencies and the standard library',
  '3.5 State, data and its shape',
  '3.6 Time, concurrency and ordering',
  '3.7 Input, output and the outside world',
  '3.8 Performance, and how you know',
  '3.9 Tests and test design',
  '3.10 Security and secrets',
  '3.11 Diagnostics and logging',
  '3.12 Naming, comments and documentation',
]
/** A token the runtime note uses to name a craft file. */
const CRAFT_TOKEN = /\{\{swarm:[a-z-]+\}\}/

let failures = 0
let checks = 0
/**
 * Record one check. A missing file is a failure of this suite, not a crash.
 * @param {string} label - what the check proves.
 * @param {Function} fn - returns true when the check holds.
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
 * Split a markdown file into its headings, each with the body that follows it
 * up to the next heading of the same or a higher level.
 * @param {string} text - the markdown.
 * @returns {{level: number, title: string, body: string}[]} the headings.
 */
const blocks = (text) => {
  const lines = text.split(/\r?\n/)
  const heads = []
  lines.forEach((line, index) => {
    const match = /^(#{1,6})\s+(.*?)\s*$/.exec(line)
    if (match) heads.push({ level: match[1].length, title: match[2], index })
  })
  return heads.map((head, at) => {
    let end = lines.length
    for (let next = at + 1; next < heads.length; next += 1) {
      if (heads[next].level <= head.level) { end = heads[next].index; break }
    }
    return { level: head.level, title: head.title, body: lines.slice(head.index + 1, end).join('\n') }
  })
}

/**
 * The rule bullets a body carries.
 * @param {string} body - the markdown body.
 * @returns {string[]} the bullet lines.
 */
const bullets = (body) => body.split(/\r?\n/).filter((line) => /^\s*[*+-]\s+\S/.test(line))

/**
 * A body with its line breaks collapsed, so a label that wraps across two
 * lines is still found.
 * @param {string} body - the markdown body.
 * @returns {string} the body on one line.
 */
const flat = (body) => body.replace(/\s+/g, ' ')

/**
 * Find one heading by its level and its exact title.
 * @param {{level: number, title: string, body: string}[]} headings - the headings.
 * @param {number} level - the heading level.
 * @param {string} title - the heading text.
 * @returns {object|undefined} the heading block.
 */
const find = (headings, level, title) => headings.find((head) => head.level === level && head.title === title)

/**
 * The level-3 headings a level-2 section carries, in order.
 * @param {string} body - the body of the section.
 * @param {string} prefix - the number the pieces start with, e.g. '2.'.
 * @returns {string[]} the titles of the pieces.
 */
const pieces = (body, prefix) => body.split(/\r?\n/)
  .map((line) => /^(#{1,6})\s+(.*?)\s*$/.exec(line))
  .filter((match) => match !== null && match[2].startsWith(prefix))
  .map((match) => match[2])

// --- 1. every craft file ships and carries its design ------------------------
for (const craft of CRAFT_FILES) {
  const file = fileURLToPath(new URL(`../${craft.path}`, import.meta.url))
  const exists = existsSync(file)
  const text = exists ? readFileSync(file, 'utf8') : ''
  const headings = blocks(text)
  craft.file = file
  craft.text = text
  craft.headings = headings

  check(`craft: ${craft.name} ships with the bundle`, () => exists)
  check(`craft: ${craft.name} is not empty`, () => text.trim().length > 0)
  check(`craft: ${craft.name} carries the top-level heading`, () =>
    find(headings, 1, craft.title) !== undefined)
  check(`craft: ${craft.name} carries its sections in order`, () => {
    const found = headings.filter((head) => head.level === 2).map((head) => head.title)
    return found.length === craft.sections.length &&
      found.every((title, index) => title === craft.sections[index])
  })
}

// --- 2. the shared craft ------------------------------------------------------
const shared = CRAFT_FILES[0]
const sharedHowTo = find(shared.headings, 2, '1. How to use this file')
check('craft: shared section 1 says which file owns the process and which the craft', () =>
  sharedHowTo !== undefined && sharedHowTo.body.includes('swarm-engineering') &&
  sharedHowTo.body.includes('**process**') && sharedHowTo.body.includes('**craft**'))
check('craft: shared section 1 names the files a lane can read', () =>
  sharedHowTo !== undefined &&
  ['developer.md', 'tester.md', 'reviewer.md', 'languages/'].every((name) =>
    sharedHowTo.body.includes(name)))
check('craft: shared section 1 tells a brief how to point at a piece', () =>
  sharedHowTo !== undefined && /§\d+/.test(sharedHowTo.body))

const sharedChecks = find(shared.headings, 2, '2. The three checks that hold in every language')
check('craft: shared section 2 carries exactly the three checks 2.1 to 2.3', () => {
  const found = sharedChecks === undefined ? [] : pieces(sharedChecks.body, '2.')
  return found.length === SHARED_CHECKS.length &&
    found.every((title, index) => title === SHARED_CHECKS[index])
})
for (const title of SHARED_CHECKS) {
  check(`craft: shared check ${title.split(' ')[0]} carries the three labels`, () => {
    const found = find(shared.headings, 3, title)
    return found !== undefined && CHECK_LABELS.every((label) => found.body.includes(label))
  })
}

const sharedPieces = find(shared.headings, 2, '3. The pieces that hold in every language')
check('craft: shared section 3 carries exactly the twelve pieces 3.1 to 3.12', () => {
  const found = sharedPieces === undefined ? [] : pieces(sharedPieces.body, '3.')
  return found.length === SHARED_PIECES.length &&
    found.every((title, index) => title === SHARED_PIECES[index])
})
check('craft: shared every piece carries at least one rule', () =>
  SHARED_PIECES.every((title) => {
    const found = find(shared.headings, 3, title)
    return found !== undefined && bullets(found.body).length > 0
  }))

const stacks = find(shared.headings, 2, '4. The same piece in another stack')
check('craft: shared section 4 carries the other stacks', () =>
  stacks !== undefined && ['TypeScript', 'Go', 'Rust', 'Java'].every((name) =>
    stacks.body.includes(`**${name}`)))
const sharedBoundary = find(shared.headings, 2, '5. What this directory does not cover')
check('craft: shared section 5 says what this directory does not cover', () =>
  sharedBoundary !== undefined &&
  ['**process**', '**host**', '**repository**', '**language**', '**role**'].every((label) =>
    sharedBoundary.body.includes(label)))

// --- 3. the role crafts -------------------------------------------------------
const roleCrafts = [
  {
    craft: CRAFT_FILES[1],
    owns: '**craft of the edit**',
    namesSkill: true,
    pieceExample: true,
  },
  {
    craft: CRAFT_FILES[2],
    owns: '**craft of the check**',
    namesSkill: false,
    pieceExample: true,
  },
  {
    craft: CRAFT_FILES[3],
    owns: '**craft**',
    namesSkill: true,
    pieceExample: false,
  },
]
for (const role of roleCrafts) {
  const howTo = find(role.craft.headings, 2, '1. How to use this file')
  const body = howTo === undefined ? '' : flat(howTo.body)
  check(`craft: ${role.craft.name} section 1 says what the file owns`, () =>
    howTo !== undefined && body.includes('**process**') &&
    body.includes(role.owns) && body.includes('shared.md') &&
    (role.namesSkill ? body.includes('swarm-engineering') : true))
  if (role.pieceExample) {
    check(`craft: ${role.craft.name} section 1 tells a brief how to point at a piece`, () =>
      howTo !== undefined && /§\d+/.test(howTo.body))
  } else {
    // The reviewer's file does not repeat the piece-pointing example; it
    // points into the shared craft instead, and that is what it must do.
    check(`craft: ${role.craft.name} points into the shared craft`, () =>
      /shared\.md`?\s*§\d+/.test(role.craft.text))
  }
  check(`craft: every ${role.craft.name} section after section 1 carries at least one rule`, () =>
    role.craft.sections.slice(1).every((title) => {
      const found = find(role.craft.headings, 2, title)
      return found !== undefined && bullets(found.body).length > 0
    }))
}

// --- 4. the Python pieces -----------------------------------------------------
const python = CRAFT_FILES[4]
check('craft: the python file carries the section 0 and the nineteen numbered sections', () => {
  const found = python.headings.filter((head) => head.level === 2).map((head) => head.title)
  return found.length === python.sections.length &&
    found.every((title, index) => title === python.sections[index])
})
check('craft: every Python section carries at least one rule', () =>
  python.sections.filter((title) => !title.startsWith('0.')).every((title) => {
    const found = find(python.headings, 2, title)
    return found !== undefined && bullets(found.body).length > 0
  }))
const pythonHowTo = find(python.headings, 2, '0. How to use this file')
check('craft: section 0 of the python file says which file owns the idioms', () =>
  pythonHowTo !== undefined && pythonHowTo.body.includes('swarm-engineering') &&
  pythonHowTo.body.includes('**process**') && pythonHowTo.body.includes('**shared pieces**') &&
  pythonHowTo.body.includes('**idioms**') && pythonHowTo.body.includes('../shared.md') &&
  /§\d+/.test(pythonHowTo.body))

// F-22: the five language files' section 0 must have the same shape.  The suite
// used to check Python alone, so one of the other four could drift away from
// the rest of them and the suite stayed green.  Every language file has to
// carry the same clause, the same example naming its own language, and the same
// closing sentence.
const LANGUAGE_CRAFT = [
  { key: 'python', language: 'Python' },
  { key: 'java', language: 'Java' },
  { key: 'go', language: 'Go' },
  { key: 'typescript', language: 'TypeScript' },
  { key: 'rust', language: 'Rust' },
]
check('craft: every language file\'s section 0 names the piece, the example and the closing sentence', () => {
  for (const entry of LANGUAGE_CRAFT) {
    const craft = CRAFT_FILES.find((file) => file.key === entry.key)
    if (craft === undefined) throw new Error(`the suite has no ${entry.key} craft file`)
    const howTo = find(craft.headings, 2, '0. How to use this file')
    if (howTo === undefined) throw new Error(`${craft.name} has no "0. How to use this file" section`)
    const body = flat(howTo.body)
    if (!body.includes('A brief names the piece')) {
      throw new Error(`${craft.name} section 0 does not carry the "A brief names the piece" clause`)
    }
    const example = `"read §6 of the ${entry.language} craft before you touch the error handling"`
    if (!body.includes(example)) {
      throw new Error(`${craft.name} section 0 does not carry the example ${example}`)
    }
    if (!body.includes('Everything here is checkable')) {
      throw new Error(`${craft.name} section 0 does not carry the closing sentence`)
    }
    if (!body.includes('swarm-engineering') || !body.includes('**process**') ||
        !body.includes('**shared pieces**') || !body.includes('**idioms**') ||
        !body.includes('../shared.md') || !/§\d+/.test(body)) {
      throw new Error(`${craft.name} section 0 does not say which file owns the idioms`)
    }
  }
  return true
})

// --- 5. every craft file is host-neutral and portable -------------------------
// The craft files travel with the bundle, so they must not name a surface of
// another host: a reader on a different host cannot act on them. The token
// list is the one the policy suites use (test/verbatim.test.mjs and
// test/render-prompt.test.mjs), so the three suites look for the same
// surfaces and a token added to one is not a hole in the others.
const JCODE_TOKENS = [
  /\bJcode\b/,
  /\bjcode\b/,
  /`swarm (?:await_members|list_models|list|message|stop|summary|spawn|launch)`/,
  /\/(?:auto)?(?:review|judge)\b/,
  /`\[agents\]/,
  /~?\/\.jcode\//,
  /scratch\//,
  /\btodo lane\b/,
  /`details`/,
  /\broot session\b/,
  /\bforce\b/,
]

// The craft check must look for every surface the policy suites look for: a
// token they catch and it does not is a hole in it.
const tokenSourcesIn = (text) => {
  const start = text.indexOf('const JCODE_TOKENS = [')
  if (start === -1) return null
  const body = text.slice(start + 'const JCODE_TOKENS = ['.length)
  const end = body.indexOf('\n]')
  if (end === -1) return null
  const literals = body.slice(0, end).match(/\/(?:\\.|\[[^\]]*\]|[^/\\\n])+\/[gimsuy]*/g)
  if (literals === null) return null
  return literals.map((literal) => literal.slice(1, literal.lastIndexOf('/'))).sort()
}
check('craft: the neutrality check looks for every surface the policy suites look for', () => {
  const mine = JCODE_TOKENS.map((token) => token.source).sort()
  for (const suite of ['test/verbatim.test.mjs', 'test/render-prompt.test.mjs']) {
    const path = fileURLToPath(new URL(`../${suite}`, import.meta.url))
    const text = existsSync(path) ? readFileSync(path, 'utf8') : ''
    const theirs = tokenSourcesIn(text)
    if (theirs === null) throw new Error(`${suite} has no JCODE_TOKENS list to share`)
    const missing = theirs.filter((source) => !mine.includes(source))
    if (missing.length > 0) {
      throw new Error(`${suite} looks for ${missing.join(', ')}, the craft check does not`)
    }
  }
  return true
})

for (const craft of CRAFT_FILES) {
  check(`craft: ${craft.name} carries no plugin marker`, () => !/<!--\s*swarm:/i.test(craft.text))
  check(`craft: ${craft.name} carries no gating fragment`, () => !/swarm:requires/i.test(craft.text))
  check(`craft: ${craft.name} carries no host prose`, () => !/deepseek harness/i.test(craft.text))
  check(`craft: ${craft.name} does not name the host note`, () => !/runtime-note/i.test(craft.text))
  check(`craft: ${craft.name} carries no unresolved token`, () => !CRAFT_TOKEN.test(craft.text))
  check(`craft: ${craft.name} names no surface of another host`, () => {
    const found = JCODE_TOKENS.filter((token) => token.test(craft.text)).map((token) => token.source)
    if (found.length > 0) throw new Error(`it names ${found.join(', ')}`)
    return true
  })
  check(`craft: ${craft.name} names no absolute path of any drive`, () =>
    !/(?<![A-Za-z0-9])[A-Za-z]:[\\/]/.test(craft.text))
  check(`craft: ${craft.name} names no D: path of this machine`, () => !craft.text.includes('D:\\'))
  check(`craft: ${craft.name} names no C: path of this machine`, () => !craft.text.includes('C:\\'))
}

// --- 6. the craft inventory is stated once, and correctly ---------------------
// A stale inventory is a defect with a cost: it sends a lane to a file that
// does not ship, and it hides a file that does. So the files that state the
// inventory state the current one, and no live file carries a count from an
// older layout.
//
// The dated tester report keeps the layout of its own round as a record, so
// its body is exempt from the scan and held to the banner instead: without the
// banner, a reader would take the old layout for the current one.
// The phrases are assembled word by word: this suite scans itself, and a
// phrase written out in full would make the scan find its own pattern.
const STALE_INVENTORY = [
  ['five', 'craft', 'files'].join(' '),
  ['six', 'skills'].join(' '),
  ['five', 'files', 'ship'].join(' '),
  ['five', 'tokens'].join(' '),
  ['the', 'five', 'files'].join(' '),
  ['all', 'five', 'craft'].join(' '),
  ['five', 'file'].join('-'),
]
const INVENTORY_FILES = [
  { path: 'README.md', label: 'README.md' },
  { path: 'runtime-note.md', label: 'runtime-note.md' },
  { path: 'test/method.test.mjs', label: 'this suite' },
  ...CRAFT_FILES.map((craft) => ({ path: craft.path, label: craft.name })),
]
for (const file of INVENTORY_FILES) {
  const path = fileURLToPath(new URL(`../${file.path}`, import.meta.url))
  const text = existsSync(path) ? readFileSync(path, 'utf8') : ''
  check(`inventory: ${file.label} states no stale craft count`, () =>
    text.length > 0 && STALE_INVENTORY.every((phrase) => !new RegExp(phrase, 'i').test(text)))
}

const readme = readFileSync(fileURLToPath(new URL('../README.md', import.meta.url)), 'utf8')
check('inventory: the README states the craft count the method suite asserts', () =>
  /each of the nine\b/.test(readme))
check('inventory: the README names every craft skill', () =>
  CRAFT_FILES.every((craft) => readme.includes(`swarm-craft-${craft.key}`)))
// The table row that summarises the craft skills is read on its own, so it has
// to carry the whole list: a row that names one language reads as if that were
// the only language that ships.
const readmeCraftRow = readme.split(/\r?\n/).find((line) => line.startsWith('| `swarm-craft-*` skills |'))
check('inventory: the README craft row names every language skill', () => {
  if (readmeCraftRow === undefined) return false
  const column = readmeCraftRow.split('|')[2] ?? ''
  return ['python', 'java', 'go', 'typescript', 'rust'].every((language) =>
    column.includes('`' + language + '`'))
})
const report = readFileSync(fileURLToPath(new URL('../test/method-report.md', import.meta.url)), 'utf8')
const reportLines = report.split(/\r?\n/)
const reportHead = reportLines.slice(0, reportLines.findIndex((line) => line.startsWith('## '))).join('\n')
check('inventory: the dated tester report declares what superseded it', () =>
  reportHead.includes('nine craft files') && reportHead.includes('ten skills'))

// --- 7. the README tells the truth --------------------------------------------
// The bundle keeps a record of what it changed for this host
// (docs/host-adaptation.md). A README sentence that claims more than that
// record supports sends a reader to a promise the bundle does not keep, so
// the claims are checked against the record and against the craft files.
// The checks read the claims, not a copy of the wording: a check that
// hard-codes the corrected sentence breaks the next time the sentence is
// legitimately reworded.
const ADAPTATION_RECORD = 'docs/host-adaptation.md'
const readmeParagraphs = readme.split(/\r?\n\s*\r?\n/)

// The shipped text is adapted to this host, and the record says where. A claim
// of unmodified shipping is true only when the paragraph names the record.
const UNADAPTED_SHIPPING_CLAIM = [
  /\bbyte[\s-]for[\s-]byte\b/i,
  /\bshipped\s+verbatim\b/i,
  /the\s+user's\s+(own\s+)?text,\s*verbatim/i,
  /nothing\s+in\s+the\s+shipped\s+text\s+is\s+rewritten/i,
  /the\s+shipped\s+text\s+is\s+not\s+rewritten/i,
]
check('inventory: the README claims no unmodified shipping of the shipped text', () => {
  const claimed = readmeParagraphs.filter((paragraph) =>
    UNADAPTED_SHIPPING_CLAIM.some((claim) => claim.test(paragraph)))
  const unguarded = claimed.filter((paragraph) => !paragraph.includes(ADAPTATION_RECORD))
  if (unguarded.length > 0) {
    throw new Error(`${unguarded.length} paragraph(s) claim unmodified shipping without naming ${ADAPTATION_RECORD}`)
  }
  return true
})
check('inventory: the README names the adaptation record', () =>
  readme.includes(ADAPTATION_RECORD))

// The guard compares the shipped policy files section by section against the
// hashes the record holds. The README must describe that comparison and must
// not describe a whole-file byte comparison.
const GUARD_PARAGRAPH = /check-policy-sync|policy files?/i
check('inventory: the README describes the drift guard as a section-by-section comparison', () => {
  const paragraphs = readmeParagraphs.filter((paragraph) => GUARD_PARAGRAPH.test(paragraph))
  if (paragraphs.length === 0) throw new Error('the README no longer describes the drift guard')
  const guard = paragraphs.join('\n')
  if (!/\bsections?\b/i.test(guard)) throw new Error('the guard description names no section')
  if (!/\bhash(es|ed)?\b/i.test(guard)) throw new Error('the guard description names no recorded hash')
  if (/\bbyte[\s-]for[\s-]byte\b/i.test(guard)) {
    throw new Error('the guard description claims a whole-file byte comparison')
  }
  return true
})

// The number of test beds the README states is the number the validation
// record names, and the README names each of them.
const VALIDATION_BEDS = ['swarm-lab', 'craft-lab', 'mixed-lab']
const validation = readFileSync(fileURLToPath(new URL('../docs/validation/README.md', import.meta.url)), 'utf8')
const recordBeds = VALIDATION_BEDS.filter((bed) => validation.includes(bed))
check('inventory: the README names every test bed the validation record names', () => {
  if (recordBeds.length !== VALIDATION_BEDS.length) {
    throw new Error(`the validation record names ${recordBeds.length} of ${VALIDATION_BEDS.length} beds`)
  }
  const missing = recordBeds.filter((bed) => !readme.includes(bed))
  if (missing.length > 0) throw new Error(`the README does not name ${missing.join(', ')}`)
  return true
})
const BED_COUNT_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
}
check('inventory: the README states the number of test beds the validation record names', () => {
  const stated = [...readme.matchAll(/(\w+)\s+test beds/g)]
    .map((match) => BED_COUNT_WORDS[match[1].toLowerCase()])
    .filter((count) => count !== undefined)
  if (stated.length === 0) throw new Error('the README states no number of test beds')
  const wrong = stated.filter((count) => count !== recordBeds.length)
  if (wrong.length > 0) {
    throw new Error(`the README states ${wrong.join(' and ')} test beds; the record names ${recordBeds.length}`)
  }
  return true
})

// The language files word their section titles in their own language, so the
// README may not claim that they carry the same titles, and it must name the
// ones that differ: a reader who looks for the section the README names finds
// it.
const level2Titles = (craft) => craft.headings.filter((head) => head.level === 2).map((head) => head.title)
const bareTitle = (title) => title.replace(/^\d+\.\s*/, '')
const sectionOf = (title) => {
  const match = /^(\d+)\.\s*(.*)$/.exec(title)
  return match === null ? null : { number: match[1], name: match[2] }
}
const languageCraft = CRAFT_FILES.filter((craft) => craft.path.includes('languages/'))
const referenceCraft = languageCraft.find((craft) => craft.path.endsWith('/python.md'))
check('inventory: the README names the language files whose section titles differ', () => {
  if (referenceCraft === undefined) throw new Error('the python craft file is missing')
  const reference = new Map()
  for (const title of level2Titles(referenceCraft)) {
    const section = sectionOf(title)
    if (section !== null) reference.set(section.number, section.name)
  }
  const missing = []
  for (const craft of languageCraft) {
    const differing = []
    for (const title of level2Titles(craft)) {
      const section = sectionOf(title)
      if (section === null) continue
      if (reference.get(section.number) === section.name) continue
      differing.push(section.name)
    }
    if (differing.length === 0) continue
    if (!readme.includes(craft.path.split('/').pop())) missing.push(`${craft.name} is not named`)
    for (const name of differing) {
      if (!readme.includes(name)) missing.push(`${craft.name} does not name "${name}"`)
    }
  }
  if (missing.length > 0) throw new Error(missing.join('; '))
  return true
})
const IDENTICAL_TITLE_CLAIM = [
  /the same nineteen sections/i,
  /identical section titles/i,
  /the same section titles/i,
]
check('inventory: the README does not claim the language files carry identical section titles', () => {
  const claim = readmeParagraphs.find((paragraph) =>
    IDENTICAL_TITLE_CLAIM.some((pattern) => pattern.test(paragraph)))
  if (claim !== undefined) {
    throw new Error(`the README claims identical section titles: ${claim.slice(0, 80).replace(/\s+/g, ' ')}`)
  }
  return true
})

// The craft index names every section of the craft files it lists, so a brief
// can point at one by number. Each file is checked against its own row: an
// index that names every section of one file and drops one from another still
// reads as complete, so the row is where the sections have to appear.
const readmeIndexOf = (craft) => {
  const lines = readme.split(/\r?\n/)
  const name = craft.path.split('/').pop()
  if (craft.path.endsWith('/shared.md')) {
    const start = lines.findIndex((line) => line.startsWith('### `shared.md`'))
    if (start === -1) return ''
    const rest = lines.slice(start + 1)
    const end = rest.findIndex((line) => line.startsWith('#'))
    return (end === -1 ? rest : rest.slice(0, end)).join('\n')
  }
  const row = lines.find((line) => line.startsWith(`| \`${name}\``))
  return row === undefined ? '' : row
}
check('inventory: the README craft index names every section of the craft files it lists', () => {
  const missing = []
  for (const craft of CRAFT_FILES.filter((entry) => !entry.path.includes('languages/'))) {
    const row = readmeIndexOf(craft)
    if (row.length === 0) {
      missing.push(`${craft.name} has no index of its own`)
      continue
    }
    for (const title of level2Titles(craft)) {
      const name = bareTitle(title)
      if (!row.toLowerCase().includes(name.toLowerCase())) missing.push(`${craft.name}: ${name}`)
    }
  }
  if (missing.length > 0) throw new Error(`the index does not name ${missing.join('; ')}`)
  return true
})

// --- 8. the coordination-call exemption list is complete ---------------------
// F-24: the list of coordination calls that do not consume the read budget has
// to name every delegation and coordination surface this host offers.  The
// runtime note is this host's own statement of the surfaces it offers, so the
// two lists are held to one set: a surface the note lists and the exemption
// list omits is a call the policy charges to the read budget, and a name the
// exemption list adds that the note does not list is a call this host does not
// offer.  One direction alone can be satisfied by a list that has drifted, so
// both are checked.
//
// A name counts as a surface when it is lower case with digits and
// underscores.  That also keeps the note's files out of the two lists: the
// `.swarm/` directory carries a dot, the craft skills carry hyphens, and the
// note's file templates carry braces.
const SURFACE_NAME = /^[a-z][a-z0-9_]*$/
const surfaceNames = (text) =>
  [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]).filter((name) => SURFACE_NAME.test(name))

const overlayText = readFileSync(fileURLToPath(new URL('../prompt-overlay.md', import.meta.url)), 'utf8')
const noteText = readFileSync(fileURLToPath(new URL('../runtime-note.md', import.meta.url)), 'utf8')

// The exemption list is the paragraph that states which calls do not draw on
// the read budget.  Every backticked name in that paragraph is a claim that
// this host offers the call, so the paragraph is read as a list of claims.
const exemptionParagraph = overlayText
  .split(/\r?\n\s*\r?\n/)
  .find((paragraph) => paragraph.includes('Coordination calls are not reads'))
const exemptionNames = exemptionParagraph === undefined ? [] : [...new Set(surfaceNames(exemptionParagraph))]

// The note's surface list is the run of bullets that follows the line that
// announces them.  A blank line between the announcement and the first bullet
// does not end the list; the first line that is neither blank nor a bullet
// does.
const noteLines = noteText.split(/\r?\n/)
const surfaceListStart = noteLines.findIndex((line) => line.includes('The surfaces this host offers'))
const surfaceBullets = []
for (let at = surfaceListStart + 1; at < noteLines.length; at += 1) {
  const line = noteLines[at]
  if (line.trim() === '') continue
  if (!line.startsWith('- ')) break
  surfaceBullets.push(line)
}
const noteNames = [...new Set(surfaceBullets.flatMap((bullet) => surfaceNames(bullet)))]

check('inventory: the policy states which coordination calls do not draw on the read budget', () => {
  if (exemptionParagraph === undefined) {
    throw new Error('prompt-overlay.md no longer states that coordination calls are not reads')
  }
  if (exemptionNames.length === 0) throw new Error('the exemption list names no call')
  return true
})
check('inventory: the runtime note lists the surfaces this host offers', () => {
  if (surfaceListStart === -1) throw new Error('runtime-note.md no longer announces the surfaces this host offers')
  if (surfaceBullets.length === 0) throw new Error('the runtime note lists no surface')
  return true
})
check('inventory: the exemption list names every coordination surface the runtime note lists', () => {
  if (noteNames.length === 0) throw new Error('the runtime note lists no surface')
  const missing = noteNames.filter((name) => !exemptionNames.includes(name))
  if (missing.length > 0) throw new Error(`the exemption list does not name ${missing.join(', ')}`)
  return true
})
check('inventory: the exemption list names no surface the runtime note does not list', () => {
  const extra = exemptionNames.filter((name) => !noteNames.includes(name))
  if (extra.length > 0) {
    throw new Error(`the exemption list names ${extra.join(', ')}, which the runtime note does not list`)
  }
  return true
})
// The marker on a bullet names the surface that bullet is about, so a marker
// that points at a surface its own bullet does not list is a broken
// annotation.
check('inventory: every surface marker in the runtime note names a surface of its own bullet', () => {
  const broken = []
  for (const bullet of surfaceBullets) {
    const marker = /<!--\s*swarm:requires\s+([^\s-]+)\s*-->/.exec(bullet)
    if (marker === null) continue
    if (!surfaceNames(bullet).includes(marker[1])) broken.push(marker[1])
  }
  if (broken.length > 0) {
    throw new Error(`a surface marker names ${broken.join(', ')}, which its own bullet does not list`)
  }
  return true
})

// --- 9. the delegation surfaces are in the exemption list -----------------------
// F-24 names three sources of surfaces: the delegation list of `swarm-prompt.md`,
// the coordinator surface list of `runtime-note.md`, and the exemption list of
// `prompt-overlay.md`.  The two lists above check the second against the third
// in both directions; this one adds the first.  The delegation list names the
// surfaces a lane is started with, so a surface that is offered but not
// exempted is a call the policy charges to the read budget.
const briefText = readFileSync(fileURLToPath(new URL('../swarm-prompt.md', import.meta.url)), 'utf8')
const delegationParagraph = briefText
  .split(/\r?\n\s*\r?\n/)
  .find((paragraph) => paragraph.includes('The delegation surfaces are'))
const delegationNames =
  delegationParagraph === undefined ? [] : [...new Set(surfaceNames(delegationParagraph))]

check('inventory: the briefing names the delegation surfaces', () => {
  if (delegationParagraph === undefined) {
    throw new Error('swarm-prompt.md no longer states which surfaces delegate')
  }
  if (delegationNames.length === 0) throw new Error('the delegation list names no surface')
  return true
})
check('inventory: the exemption list names every delegation surface the briefing lists', () => {
  const missing = delegationNames.filter((name) => !exemptionNames.includes(name))
  if (missing.length > 0) throw new Error(`the exemption list does not name ${missing.join(', ')}`)
  return true
})

// --- 10. the package ships what an install needs -------------------------------
// F-28: an install has to carry the adaptation record and the drift guard, so
// the record that says what was adapted and the checker that keeps it honest
// travel with the bundle.  `npm pack` is not on every host, so the check reads
// the manifest itself: the `files` array has to name the directories that
// carry them, and the files they carry have to exist on disk.  A directory
// entry ships what is under it, which is how npm packs it.
const packageJson = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
)
const packagedFiles = Array.isArray(packageJson.files) ? packageJson.files : []
const PACKAGED_PATHS = [
  'docs/host-adaptation.md',
  'docs/host-adaptation.json',
  'tools/check-policy-sync.ps1',
]
/**
 * Whether the manifest's files array ships a path.
 * @param {string[]} files - the manifest's files array.
 * @param {string} path - the path the package has to carry.
 * @returns {boolean} true when an entry covers the path.
 */
const ships = (files, path) =>
  files.some((entry) => entry === path || (entry.endsWith('/') && path.startsWith(entry)))

check('inventory: the package ships the record and the guard', () => {
  if (packagedFiles.length === 0) throw new Error('package.json names no files')
  const missing = PACKAGED_PATHS.filter((path) => !ships(packagedFiles, path))
  if (missing.length > 0) throw new Error(`the package does not ship ${missing.join(', ')}`)
  return true
})
check('inventory: the paths the package names exist on disk', () => {
  const missing = PACKAGED_PATHS.filter(
    (path) => !existsSync(fileURLToPath(new URL(`../${path}`, import.meta.url))),
  )
  if (missing.length > 0) throw new Error(`${missing.join(', ')} is named but not there`)
  return true
})

console.log(`SUITE CHECKS: ${checks}`)
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
