// The user's text stays the user's text.
//
// The bundle ships three files that belong to the user: prompt-overlay.md
// (the global execution policy), swarm-prompt.md (the delegation briefing) and
// skills/swarm-engineering/swarm-engineering.md (the role methods). They are
// the user's own text, adapted to this host's surfaces and carriers: every
// adapted passage is recorded in docs/host-adaptation.md and guarded by the
// cross-repo checker. The host facts live in runtime-note.md, the one file the
// plugin wrote.
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
const SKILL = 'skills/swarm-engineering/swarm-engineering.md'
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
let checks = 0
/**
 * Record one check.
 * @param {string} label - what the check proves.
 * @param {boolean} ok - whether the check holds.
 */
const check = (label, ok) => {
  checks += 1
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
check(`${BRIEF}: keeps the requirement rule`, brief.includes('Requirements belong to a task on the shared board'))
check(`${BRIEF}: keeps the brief contract`, brief.includes('What every brief must carry'))
check(`${SKILL}: keeps the requirement handover section`, skill.includes('## 13. Requirement Handover'))
check(`${SKILL}: keeps the requirement matching section`, skill.includes('## 12. Requirement Matching'))
check(`${SKILL}: keeps the assignment contract section`, skill.includes('## 8. Assignment and Reporting Contract'))
check(`${SKILL}: keeps the handover citation rule`, skill.includes('A worker cites the requirement as'))
check(`${SKILL}: keeps the handover carrier rule`, skill.includes('.swarm/requirements/<work-item>.md'))

// The anchors the canonical text gained in its last re-sync: the decidable
// sufficiency mechanism, the bounded read and verification phases, and the
// ladder that stops a lane that overran its brief. The bundle ships that text
// byte for byte, so these headings are anchors like the ones above: a re-sync
// that dropped them would still be a bundle shipping the older text.
const NEW_ANCHORS = [
  [OVERLAY, /#### 2\.2\.1 Evidence Thresholds/, 'keeps the evidence thresholds'],
  [OVERLAY, /#### 2\.2\.2 Tool-Call Budgets/, 'keeps the tool-call budgets'],
  [OVERLAY, /#### 2\.2\.3 The End Event Binds the Next Action/, 'keeps the end event'],
  [OVERLAY, /#### 2\.2\.4 Bounding the Read Phase of a Direct Task/, 'keeps the bounded read phase'],
  [OVERLAY, /#### 2\.2\.5 Bounding the Verification Phase/, 'keeps the bounded verification phase'],
  [OVERLAY, /### 12\.8 Enforcing a Lane.s Bound/, 'keeps the lane-bound ladder'],
  [SKILL, /#### 2\.3\.1 Evidence Thresholds/, 'keeps the evidence thresholds'],
  [SKILL, /#### 2\.3\.2 Tool-Call Budgets/, 'keeps the tool-call budgets'],
  [SKILL, /#### 2\.3\.3 The End Event Binds the Next Action/, 'keeps the end event'],
  [SKILL, /#### 2\.3\.4 No Third Read of the Same Path/, 'keeps the no-third-read rule'],
  [SKILL, /#### 2\.3\.5 Bounding the Verification Phase/, 'keeps the bounded verification phase'],
  [SKILL, /### 11\.1 Stopping a Lane That Overran Its Brief/, 'keeps the overrun ladder'],
  [BRIEF, /A brief without a target list, an evidence budget, or a stop condition is not/, 'keeps the three new brief fields'],
]
for (const [name, anchor, what] of NEW_ANCHORS) {
  check(`${name}: ${what}`, anchor.test(texts[name]))
}

// The two headings under §14 are adapted titles. The canonical text named a
// native review surface and a mode-dependent end-of-turn trigger, neither of
// which this host has; the bodies of both sections say so. The adaptation is
// recorded in docs/host-adaptation.md, and pinning the adapted titles here
// makes a revert to the canonical titles fail this suite instead of passing
// silently.
const ADAPTED_SKILL_HEADINGS = [
  [/^## 14\. The Verification Paths This Host Offers$/m, 'keeps the adapted §14 heading'],
  [/^### 14\.1 No End-of-Turn Trigger Exists on This Host$/m, 'keeps the adapted §14.1 heading'],
]
for (const [anchor, what] of ADAPTED_SKILL_HEADINGS) {
  check(`${SKILL}: ${what}`, anchor.test(skill))
}

// --- 5. The skill still starts with its frontmatter -------------------------
{
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(skill)
  check(`${SKILL}: it starts with a frontmatter block`, skill.startsWith('---') && frontmatter !== null)
  const fields = frontmatter === null ? '' : frontmatter[1]
  check(`${SKILL}: the frontmatter names the skill`, /^name:\s*swarm-engineering\s*$/m.test(fields))
  check(`${SKILL}: the frontmatter carries a description`, /^description:\s*\S/m.test(fields))
}

// --- 6. The shipped policy names no Jcode surface ----------------------------
// The canonical text names the `swarm` tool, the settings around it and the
// Jcode CLI. The adapted text names this host's surfaces instead, so a Jcode
// token left in the shipped policy is a passage that was never adapted. The
// host note may name them: the note is where the map of every replacement
// lives.
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
for (const name of USER_FILES) {
  const hit = JCODE_TOKENS.find((pattern) => pattern.test(texts[name]))
  check(`${name}: names no Jcode surface`, hit === undefined)
}

console.log(`SUITE CHECKS: ${checks}`)
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
