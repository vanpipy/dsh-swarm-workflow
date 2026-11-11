// The user's text stays the user's text.
//
// The bundle ships three files that belong to the user: prompt-overlay.md
// (the global execution policy), swarm-prompt.md (the delegation briefing) and
// skills/swarm-engineering.md (the role methods). They are shipped byte for
// byte, and every host-specific fact lives in runtime-note.md, the one file
// the plugin wrote.
//
// This suite holds that boundary. It fails when
//   - a plugin marker (`<!-- swarm:... -->`) or a gating fragment
//     (`swarm:requires`) leaks into one of the shipped files,
//   - host prose (the host's own name, or the name of the plugin's note file)
//     leaks into one of the shipped files,
//   - runtime-note.md stops being the host note, or stops being the only
//     shipped file that carries plugin markers,
//   - a shipped file loses one of the anchors the plugin composes from.
//
// The scope is the four files the plugin composes from. README.md is the
// bundle's documentation and shows the marker syntax on purpose, so it is not
// a shipped prompt file and is not checked here.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))

/**
 * Read one file of the bundle.
 * @param {string} relative - path relative to the bundle root.
 * @returns {string} the file content.
 */
const read = (relative) => readFileSync(join(root, relative), 'utf8')

const NOTE = 'runtime-note.md'
const OVERLAY = 'prompt-overlay.md'
const BRIEF = 'swarm-prompt.md'
const SKILL = 'skills/swarm-engineering.md'
/** The files the plugin composes a prompt from. */
const SHIPPED = [NOTE, OVERLAY, BRIEF, SKILL]
/** The files the user owns; the plugin only reads them. */
const USER_FILES = [OVERLAY, BRIEF, SKILL]

const note = read(NOTE)
const overlay = read(OVERLAY)
const brief = read(BRIEF)
const skill = read(SKILL)
const texts = { [NOTE]: note, [OVERLAY]: overlay, [BRIEF]: brief, [SKILL]: skill }

let failures = 0
/**
 * Record one check.
 * @param {string} label - what the check proves.
 * @param {boolean} ok - whether the check holds.
 */
const check = (label, ok) => {
  if (!ok) { failures += 1; console.log(`FAIL  ${label}`) } else { console.log(`ok    ${label}`) }
}

// --- 1. The shipped files carry no plugin mechanics -------------------------
for (const name of USER_FILES) {
  check(`${name}: no plugin marker`, !/<!--\s*swarm:/i.test(texts[name]))
  check(`${name}: no gating fragment`, !/swarm:requires/i.test(texts[name]))
}

// --- 2. The shipped files carry no host prose -------------------------------
for (const name of USER_FILES) {
  check(`${name}: no host name`, !/deepseek harness/i.test(texts[name]))
  check(`${name}: no host-note file name`, !/runtime-note/i.test(texts[name]))
}

// --- 3. runtime-note.md is the host note, and the only marked file ----------
check(`${NOTE}: it names the host`, note.includes('DeepSeek Harness'))
check(`${NOTE}: it carries scope blocks`, /<!--\s*swarm:note\s/i.test(note))
{
  const marked = SHIPPED.filter((name) => /<!--\s*swarm:/i.test(texts[name]))
  check(`the host note is the only shipped file that carries markers (found: ${marked.join(', ')})`,
    marked.length === 1 && marked[0] === NOTE)
}

// --- 4. The shipped files still carry the user's own anchors ----------------
check(`${OVERLAY}: keeps the orchestration section`, overlay.includes('## 12. Swarm Orchestration'))
check(`${OVERLAY}: keeps the policy boundaries section`, overlay.includes('## 11. Policy and Tool Boundaries'))
check(`${BRIEF}: keeps the requirement rule`, brief.includes('Requirements belong to a todo lane'))
check(`${BRIEF}: keeps the brief contract`, brief.includes('What every brief must carry'))
check(`${SKILL}: keeps the requirement handover section`, skill.includes('## 13. Requirement Handover'))
check(`${SKILL}: keeps the requirement matching section`, skill.includes('## 12. Requirement Matching'))
check(`${SKILL}: keeps the assignment contract section`, skill.includes('## 8. Assignment and Reporting Contract'))
check(`${SKILL}: keeps the handover citation rule`, skill.includes('A worker cites the requirement as'))
check(`${SKILL}: keeps the handover carrier rule`, skill.includes('Jcode has no separate requirements file'))

// --- 5. The skill still starts with its frontmatter -------------------------
{
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(skill)
  check(`${SKILL}: it starts with a frontmatter block`, skill.startsWith('---') && frontmatter !== null)
  const fields = frontmatter === null ? '' : frontmatter[1]
  check(`${SKILL}: the frontmatter names the skill`, /^name:\s*swarm-engineering\s*$/m.test(fields))
  check(`${SKILL}: the frontmatter carries a description`, /^description:\s*\S/m.test(fields))
}

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
