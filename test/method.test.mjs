// The craft files themselves.
//
// The craft guidance is not composed into a prompt: the runtime note names the
// files through a token, the plugin resolves that token to a path, and a lane
// reads the file at that path. So the prompt suite can only see the path — it
// cannot tell a craft file that lost a piece from one that is still whole.
// This suite reads the files, so a rewrite that drops the craft guidance is a
// red suite rather than a silently shorter method.
//
// Five files ship under `skills/swarm-engineering/`: the shared craft every lane works by,
// the craft of the Developer, of the Tester, of the Reviewer, and the pieces
// of one language (Python today). The contract below is the design they ship:
// the sections, the three checks, the twelve pieces, the nineteen Python
// sections. A rewrite that changes the design has to change this suite too —
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
/**
 * Record one check. A missing file is a failure of this suite, not a crash.
 * @param {string} label - what the check proves.
 * @param {Function} fn - returns true when the check holds.
 */
const check = (label, fn) => {
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

// --- 5. every craft file is host-neutral and portable -------------------------
for (const craft of CRAFT_FILES) {
  check(`craft: ${craft.name} carries no plugin marker`, () => !/<!--\s*swarm:/i.test(craft.text))
  check(`craft: ${craft.name} carries no gating fragment`, () => !/swarm:requires/i.test(craft.text))
  check(`craft: ${craft.name} carries no host prose`, () => !/deepseek harness/i.test(craft.text))
  check(`craft: ${craft.name} does not name the host note`, () => !/runtime-note/i.test(craft.text))
  check(`craft: ${craft.name} carries no unresolved token`, () => !CRAFT_TOKEN.test(craft.text))
  check(`craft: ${craft.name} names no absolute path of any drive`, () =>
    !/(?<![A-Za-z0-9])[A-Za-z]:[\\/]/.test(craft.text))
  check(`craft: ${craft.name} names no D: path of this machine`, () => !craft.text.includes('D:\\'))
  check(`craft: ${craft.name} names no C: path of this machine`, () => !craft.text.includes('C:\\'))
}

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
