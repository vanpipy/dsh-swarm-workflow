# Requirement handover — design (2026-11-07)

Status: APPROVED IN PRINCIPLE by the user (the three decisions below), IMPLEMENTED and TESTED.

## 0. Why this exists

Phase 3 gave every acceptance criterion an id (`C1..Cn`), a verdict vocabulary and a
per-criterion report line (skill §16). What was still missing is the place the criterion
**lives**. The criteria were carried in the chat — the brief — and copied into the board
entry. Two copies of a free-text list drift, cannot be diffed, cannot be cited, and leave
"the original acceptance criteria" (swarm-prompt.md:188) with nothing to point at.

The user asked the question directly (m04648): *"do we need a group of files or filesystem
supported to support the real docs handover? Or the real things to the swarm engineering?"*

## 1. The user's decisions (2026-11-07)

| # | question | the user's answer |
|---|---|---|
| 1 | where do the criteria files live? | **`.swarm/requirements/`** — a swarm-owned folder in the project the swarm works on (my recommendation had been `docs/requirements/`; the user's answer stands) |
| 2 | brief and file disagree — who wins? | **the lane reports the conflict and stops** that criterion; it does not guess a winner |
| 3 | what next? | **design, implement and then test them** — one round that exercises the whole path |

## 2. What lives where

- **The rules** go in the `swarm-engineering` skill — the only artefact every lane loads on
  demand (§16 already lives there). New section **§17 "Requirement handover"**, plugin-owned,
  worker-facing.
- **The data** (the real requirement documents) does **not** go into the skill: the skill is
  global — one bundle, one profile, every project — and it is loaded whole (~30 KB). A
  per-project spec inside it would freeze and bloat it. The data goes into the project the
  swarm works on: `.swarm/requirements/<work-item>.md`, one file per work item.

Why a file and not the brief, for the third time in this project:

1. the bundle's own documents are already files, and `index.js` re-reads them per assembly
   when their mtime/size change — file-based handover is the pattern the host supports;
2. the brief is one free-text string and the board entry is only a copy of it
   (`team_task_create` has no criteria field) — a real spec has dozens of criteria that must
   stay identical across Developer, Tester, Reviewer and Coordinator, and a chat copy can be
   neither diffed nor re-read reliably nor cited;
3. "the original acceptance criteria" needs an *original* that can be re-read;
4. the Reviewer must cite the requirement — a file line is checkable, a chat sentence is not;
5. one file per work item keeps the ids small and stable and gives each lane an ownership
   unit; a single shared file would recreate the board's one-blob problem.

## 3. The file format

```markdown
# <work item>

C1 · <the criterion>
    check: <the observable check that proves it>
    source: <the assignment | path:line | the behaviour that must not change>

C2 · <the criterion>
    check: ...
    source: ...
```

One block per criterion, numbered `C1..Cn`. Plain text on purpose: a human reads it, a lane
cites it as `<file>:<line>`, and no parser is needed.

## 4. The rules (skill §17)

1. The Coordinator writes the file before dispatching. No worker authors criteria.
2. The brief names the **file and the ids**; it never repeats the criterion text — a copy in
   a chat message is what drifts.
3. The board entry carries the same path, for the same reason.
4. The file is where the criterion text comes from. If the brief or the board entry describes
   a criterion differently, or names an id the file does not define, the lane **reports the
   conflict and stops that criterion** (`not demonstrated`, the other criteria unaffected).
   It does not pick a winner and it does not invent the missing criterion.
5. A lane cites the requirement as `<file>:<line>`; a verdict without that citation is
   `not demonstrated`.
6. A criterion whose file cannot be read is `not demonstrated`, never `met`.

## 5. The plugin change set (the user's own prose untouched)

| file | change |
|---|---|
| `skills/swarm-engineering.md:6` | marker: "§11–§16" → "§11–§17" |
| `skills/swarm-engineering.md:483` | marker now names §16 **and** §17 as worker-facing |
| `skills/swarm-engineering.md` (end) | **NEW** `## 17. Requirement handover` behind its own marker |
| `swarm-worker-prompt.md:12` | the skill bullet gains the §17 sentence (plugin prose, not a quoted extract) |
| `swarm-prompt.md:262` | the Coordinator-practice pointer gains the clause "writing the criteria file the brief points at" |

## 6. The test round (H1)

- **Substrate**: `D:\project\.swarm-lab\eff-repo` — the disposable `effdemo` package, now with
  the C1 (alphabetical tie-break) and C7 (`vowel_ratio` reachable) fixes in place, 28 tests green.
- **The Coordinator writes** `.swarm/requirements/effdemo-baseline.md` with **C1..C8**:
  C1 the alphabetical tie-break · C2 `longest_word([]) == ""` · C3 `word_lengths` in input
  order · C4 `char_counts` case-sensitive, absent characters omitted, empty → `{}` · C5
  `first_last_letter` lowercased alphanumerics · C6 every public function has a named test ·
  C7 the suite runs and passes · **C8 a deliberately violated control**: "`vowel_ratio` returns
  the ratio rounded to two decimal places" — the code returns the exact float, and it
  contradicts nothing else in the file.
- **A fresh `subagent` Reviewer** gets a brief that names the path and the ids **C1..C8**
  and *also* names **C9**, which the file does not define ⇒ the conflict case. The brief never
  repeats the criterion text and never says which criterion is the control.
- **Expected**: C1..C7 `met`, C8 `not met` (the control), C9 reported as a conflict with the
  verdict `not demonstrated`, every criterion cited as `file:line`, both §16 checks run
  (discrimination and intent).
- **Pass condition**: the control comes back `not met` with evidence, the conflict is
  reported and C9 is `not demonstrated`, the other eight carry verdicts and citations, and the
  report has a `## Criterion verdicts` section.
- **My own verification** (not the lane's word): the substrate hashes before and after, the
  control re-run by me, the conflict line read from the report.

## 7. Open items

- whether `.swarm/` is committed or gitignored in a real repository is the user's call (in the
  lab it stays untracked);
- one file per work item, no index yet — a project with many work items will want one.

## 8. What was applied (2026-11-07)

| file | change |
|---|---|
| `skills/swarm-engineering.md:6` | the plugin marker now reads "§11–§17, which the plugin adds at the end of the file" |
| `skills/swarm-engineering.md:483` | the marker names §16 **and** §17 as worker-facing |
| `skills/swarm-engineering.md` (end, 21 lines) | **NEW** `## 17. Requirement handover`, behind its own plugin marker |
| `swarm-worker-prompt.md:12` | the skill bullet gains: "Its §17 says where a numbered criterion lives when the work has a criteria file: `.swarm/requirements/<work-item>.md` — read it, cite `file:line`, and report a conflict instead of guessing." |
| `swarm-prompt.md:262` | the Coordinator-practice pointer gains the clause "writing the criteria file the brief points at" |

**Verification after the edit**

- `D:\project\.swarm-lab\test-render-prompt.mjs` → "ALL CHECKS PASSED", `EXITCODE=0`.
- `index.js` syntax check (`ELECTRON_RUN_AS_NODE=1` + "D:\software\dsh\DeepSeek Harness.exe" --check) → `EXITCODE=0`.
- Integrity diffs (`git diff --no-index --numstat`): `policy_hit_1.txt` → `swarm-prompt.md` = **31 insertions / 96 deletions** — unchanged from the phase-3 baseline, so the user's policy prose is still byte-identical. `user_skill_paste.md` → `skills/swarm-engineering.md` = **180 / 6** (was 159/6; the +21 lines are exactly the §17 band), so the user's skill prose is unchanged apart from the one sentence the user approved in phase 3.
- The bundle re-applied live: `set_plugin include:swarm-workflow false` → the `<available_skills>` catalog **lost** `swarm-engineering`; `true` → it returned.


## 9. The H1 round — what it found (2026-11-07)

**Verdicts:** C1 met · C2 met · C3 met · C4 met · C5 met · C6 met · C7 met · **C8 not met** (the hidden control) · **C9 not demonstrated** (the conflict: the file defines no C9).

**The mechanism worked as designed.** The brief named the criteria file and the ids and never repeated the criterion text; the file was the authority; C8 came back `not met` although the brief never said which criterion was the control; C9 was reported as a conflict and stopped rather than answered; every verdict carries a `file:line` citation and both legs of the two-check rule ran.

**What H1 exposed that the design did not cover:** a criteria file can contradict the *repository's own tests* — my fixture's C8 (`vowel_ratio("a b") == 0.33`) versus `tests/test_spec_vowel_ratio.py:60-63` (`pytest.approx(1.0/3.0)`). The lane reported it as a product decision (§14) instead of guessing, which is right, but §17 currently covers only brief-versus-file conflicts. One sentence is proposed in §17 (see FINDINGS.md F30) and waits for the user's approval.
### The gap is closed (2026-11-07, the user's decision)

The user approved the one-sentence addition, now `skills/swarm-engineering.md:656`: a criteria file is only authoritative over the behaviour it names; the Coordinator reconciles it with the repository's existing tests before writing it; a criterion that contradicts an existing test is a conflict in its own right and is reported like any other. The user's prose is untouched (policy 31/96 unchanged, skill 181/6 = the plugin band only), and the bundle was re-applied live.