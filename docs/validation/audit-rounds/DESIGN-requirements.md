# Design (v2) — requirement traceability in the swarm workflow

Status: **APPROVED by the user (2026-11-07) and APPLIED.** The approved change set is A-1…A-6
(plugin-side) + U-1 (one sentence in the user's own §5.4 Step 1); U-2 was not applied. The gate
decision: `not demonstrated` **blocks acceptance**. The proof uses the **eff-repo `longest_word`
criterion**. What landed is listed in §11 at the end of this document.

No other file was changed, and the user's own prose is shipped verbatim apart from the two
approved lines of U-1 (`skills/swarm-engineering.md:306`).

Source of the question (the user, verbatim):

> For the review role in the "swarm-engineering.md", I think the reviewer must take care of the
> goals or cases or stories matched or not, right? so the first question, where are the goals or
> cases or stories. the second is how to matched?

The user's answer to the framing question (verbatim): *"Nope, design first base on the whole
workflow definition"*; the chosen proof: *"Fresh reviewer round"*.

Inputs to this revision:
- **D1** — the inventory: `DESIGN-INVENTORY.md` (38,285 B; 13 evidenced gaps, a role-by-role use
  table, a numbering sweep, and the live tooling facts).
- **D2** — the adversarial review: `DESIGN-REVIEW.md` (49,551 B; verdict **SOUND WITH
  CORRECTIONS**; 7 contradicted claims, 9 missed carriers, 6 contradictions, the smallest design
  that still works, and the proof feasibility).

---

## 0. What v2 changes, and why

| v1 said | v2 says | Why |
|---|---|---|
| The Reviewer's duty goes in skill §14 | It goes in a **new worker-facing plugin section `## 16. Requirement Matching`** + one bullet in the worker prompt | **C1 (Blocking)** — `swarm-worker-prompt.md:12` says "Its §11–§14 are Coordinator-side methods; you do not need them", so a rule in §14 never reaches the Reviewer, who *is* a worker. |
| Six user-prose edits (skill §5.4, §5.6 ×2, §5.9, §8; policy §7, §11) | **Zero required**; **one optional** | **C2/C3 (Material)** — the §8 edit would break the verbatim quotation shipped at `swarm-worker-prompt.md:22`; the rest are needless approval gates. |
| The "Accept" gate is described as today's flow | It is listed as a **proposal** | **C5 (Material)** — the user's rule is "Confirm original acceptance criteria" (`swarm-prompt.md:204`); a verdict-gated acceptance is an addition, not a description. |
| The verdict value `out of scope` | The verdict is **`not in scope`** | **C4** — `skills/swarm-engineering.md:540` already uses "Out of scope" as a *finding severity*. Two axes must not share one word. |
| Five objects (R0, C1..Cn, K1..Km, V, E) | **One** new object (the numbered criterion) + the verdict line | **D2 §4.4** — the objective and the constraints already exist as assignment fields (`swarm-prompt.md:144`, `:152`; `skills/swarm-engineering.md:447`); a second id space over the same content adds vocabulary, not traceability. |
| "7 per-commit verdicts", "the ONE time", "caught by accident", "only the first mechanism is written into the workflow", "nothing in the workflow does this today" | **six**, **at least three**, **a deliberately commissioned probe lane**, **neither**, **the intent check is in the user's prose** | **U10, U11, U14, U15, U16** — each contradicted by a file the review re-read and re-ran. |

**One correction to D2 itself** (verified here against the recovered original): D2 calls
`skills/swarm-engineering.md:544-548` "the plugin's own Review Completion Gate". It is **not**
plugin-authored — it is the user's own policy §9.3, relocated verbatim (verified: `policy_hit_1.txt`
§9.1–§9.5 ≡ skill §12.1–§12.5, line for line, headings renumbered). A sentence added there is
therefore a **user-prose** change and is treated as such below (option U-2). The same goes for
§12.1, §12.2 and §12.4.

---

## 1. The problem, stated precisely

The workflow already carries requirements. What it lacks is **requirement identity** — a shared,
citable handle for "the thing that must hold" — and a rule that makes some role *record* a verdict
against each one.

| What the shipped documents say | Where | What it does *not* say |
|---|---|---|
| "A complete assignment should specify label, role, objective, context, known facts and evidence, open questions, scope, out-of-scope boundaries, constraints, expected output, **acceptance criteria**, dependencies, ownership, investigation exit criteria, and validation expectations." | `skills/swarm-engineering.md:447` | that the criteria are enumerated, numbered, or that each names its check |
| "**Acceptance criteria:** Observable conditions for completion." | `swarm-prompt.md:152` | the same |
| "**Understand:** Coordinator establishes objective, scope, constraints, and acceptance criteria." | `swarm-prompt.md:122` | the same — but it does fix the *author* |
| "Provide implemented behavior, relevant changed files, **requirements addressed**, …" (Developer → Tester) | `skills/swarm-engineering.md:411` | that "requirements addressed" is reported *per criterion* |
| "Provide **objective and requirements**, actual change summary, …" (Developer → Reviewer) | `skills/swarm-engineering.md:417` | where the requirements came from, or how they are enumerated |
| "Translate requirements into observable test conditions." (Tester) | `skills/swarm-engineering.md:192` | that each test cites the requirement it covers |
| "Review for requirement violations, incorrect behavior, …" / "Establish intended behavior, relevant requirements, …, **acceptance criteria**, and explicit constraints." / "Does it violate a requirement or contract?" | `skills/swarm-engineering.md:297`, `:304`, `:315` | **where** those requirements live — and `:315` sits inside "For each plausible issue, determine:" (`:312`), so it is per-**defect**, not per-requirement |
| Reviewer Deliverable: scope, assessment, findings, evidence, impact, limitations, completion | `skills/swarm-engineering.md:392-403` | **no requirement trace at all** |
| "you accept the work only against the **original acceptance criteria**" / "**Confirm original acceptance criteria.**" | `swarm-prompt.md:188`, `:204` | how the Coordinator knows which criteria are original, or their state |

**Where do the goals/cases/stories live today?** In the **assignment** (the brief) — the objective,
the constraints and the acceptance criteria — plus the repository's binding rules and the behaviour
that must not change. The brief is not the only *copy*: the board entry is a second copy of the
same brief (`swarm-prompt.md:253`), the session goal carries the round's objective
(`swarm-prompt.md:256`), and the round ledger carries the round's state
(`skills/swarm-engineering.md:603`). **None of them gives a criterion an identity, and no role is
required to record a verdict per criterion.**

**How is "matched" today?** By prose judgement anchored on the brief. Two mechanisms matter, and
they fail in different ways:

- **Discrimination** — does the check distinguish the required behaviour from a broken one?
  Proven by a mutation or revert probe. The R9 probe proved exactly this and found two real gaps
  (F-1: the test asserted `returncode != 0` where the production value is `2`; F-2: the
  "stays open" line was never asserted). *Neither* mechanism is written into the workflow today:
  grepping the three shipped markdowns for `mutat|mutant|probe|revert` hits only
  `swarm-worker-prompt.md:56` ("before it was given") and `skills/swarm-engineering.md:92` ("Do not
  overwrite or revert changes outside the assignment") — both incidental.
- **Intent** — is the required behaviour the behaviour the brief asked for? This one **is** in the
  user's prose (`:297`, `:304`, `:315`), but only as prose, with no per-criterion record.

**What the runs actually show** (all re-verified by D2 against the run reports):

- The R9 reviewer matched the change against **commits and mutants** — **six** per-commit verdicts
  for the six ladder commits, plus five probes. The seventh commit (`c415a38`) is the *remediation*
  of the R9 findings, not a seventh verdict.
- The intent gap is **wider than one**: at least **three** times did the code not meet its
  requirement — the `longest_word` tie (brief: alphabetically first; code: input order at
  `src/effdemo/core.py:19`, strict `>`), the picker writing an empty day file, and the catalog
  shrinking silently (`FINAL-VERDICT.md:37` — "two real defects in the user's code").
- The `longest_word` tie was caught by a **deliberately commissioned** honest-failure probe lane
  (`EFFICIENCY.md:28`, `:63-67`), not by accident — and it was caught because that lane was told to
  read the requirement against the code. The review role did not catch it.

---

## 2. The model — one new object and one new line

| Object | What it is | Who writes it | Who must use it |
|---|---|---|---|
| **C1..Cn — Criterion** | one line: the criterion · the observable check that proves it · its source (the assignment, a repo rule by `file:line`, or the behaviour that must not change) | the **Coordinator** (the user's prose already gives the Coordinator that role at `swarm-prompt.md:122`) | Developer, Tester, Reviewer, Coordinator |
| **Verdict line** | `C<n> · <verdict> · <evidence pointer>` | the role that checked it | the next role in the chain |

The objective and the constraints are **not** new objects: they are already assignment fields
(`swarm-prompt.md:144`, `:152`; `skills/swarm-engineering.md:447`), and a criterion's *source* line
is where a repo rule is cited. Evidence is not a separate artefact — it is the third field of the
verdict line.

**Three rules make it a model rather than a form:**

1. **The Coordinator writes the criteria; the Developer never does.** A developer-authored criterion
   is a developer-authored acceptance. (The user's prose supports the Coordinator's authorship at
   `swarm-prompt.md:122`.)
2. **A verdict without evidence is `not demonstrated`, never `met`.** (The Reviewer's own probe
   caught a *weak assertion* in R9; a reporting vocabulary cannot detect that — but it does stop a
   lane's unevidenced "done" from reading as "met".)
3. **Two checks per criterion, or say which one you did not do** — see §5.

---

## 3. Where the criterion set lives, and who owns it

| Surface | What it carries | Rule |
|---|---|---|
| **The brief** (the assignment) | the criterion set `C1..Cn`, one line each | the Coordinator enumerates it. The brief is the source of truth (`swarm-worker-prompt.md:3`). |
| **The board entry** (`team_task_create` subject+description) | the same brief text | the board is a **copy**, not a second source. If the board entry and the brief disagree, the **brief wins** and the worker reports the disagreement (`swarm-worker-prompt.md:57` already says this). |
| **The Developer's report** | unchanged | the Developer never restates criteria; the trace is the Reviewer's job. |
| **The Tester's requirement-clause file** | each test **cites the criterion id** it covers; a criterion with no test is a **reported coverage gap**, never a silent pass | the file is already named as the Tester's (`skills/swarm-engineering.md:600`); the id is one clause of that same sentence. |
| **The Tester's report** | unchanged, except that its existing four values map onto the verdict vocabulary (see §4) | the Tester's "Coverage gaps." item (`skills/swarm-engineering.md:269`) names every criterion with no test. |
| **The Reviewer's report** | the same 7 items + **one added section**: the verdict line per criterion | §16 requires the section; the user's §5.9 list is neither extended nor contradicted. |
| **The Coordinator's acceptance** | `swarm-prompt.md:204` "Confirm original acceptance criteria." — unchanged — plus the outcome recorded in the ledger row (`skills/swarm-engineering.md:603`) | the ledger row is where `C1 met (evidence) / C2 not met (evidence)` is written. |
| **The re-review** | the criterion that the finding violated | §12.4 step 4 "Relevant parts are re-tested or re-reviewed" — a re-review re-matches the criterion, not the whole diff. |
| **The session goal** | the round's objective (`swarm-prompt.md:256`) | the goal stays a goal; it is not the criterion set. |

**The path where the criteria do not exist** (D1 G1, D2 M1): the shipped contract already has a
general rule for every role — `skills/swarm-engineering.md:449` "If essential information is
missing, identify it specifically…", quoted at `swarm-worker-prompt.md:23` and reinforced at `:27`.
§16 reuses it rather than inventing a Reviewer-only variant: **if the assignment carries no
numbered criteria, report that as a gap; do not invent criteria.** This is the case that matters
most in the "Tester and/or Reviewer Without Developer" composition (`skills/swarm-engineering.md:441`),
where no Developer handoff exists at all — so the **brief** must carry the criteria.

---

## 4. The verdict vocabulary — reconciled with the two that already exist

Three vocabularies exist or are proposed; they must not collide.

| Vocabulary | Where | Values |
|---|---|---|
| The Tester's condition states | `skills/swarm-engineering.md:273` | `passed` · `failed` · `blocked` · `not-tested` |
| The finding severities | `skills/swarm-engineering.md:535-540` (the user's policy §9.2) | `Blocking` · `Material` · `Non-blocking` · `Out of scope` |
| **The criterion verdict (new)** | the new §16 | `met` · `not met` · `not demonstrated` · `not in scope` |

**Mapping (stated once, in §16):** the Tester's `passed` → `met`; `failed` → `not met`;
`blocked` and `not-tested` → `not demonstrated` (with the blocker or the absence recorded in the
evidence field). `not in scope` (a **verdict**) and `Out of scope` (a **severity**) are different
axes and keep different words.

| Verdict | Meaning | Effect |
|---|---|---|
| `met` | the criterion's check passes and the evidence is recorded | contributes to acceptance |
| `not met` | the check fails, or the code contradicts the criterion | reopens the lane; a finding names the criterion |
| `not demonstrated` | no evidence either way — never checked, or the check is missing | blocks acceptance until checked or explicitly waived |
| `not in scope` | the criterion concerns something this assignment did not cover | no effect; still reported |

---

## 5. The two matching checks

A reviewer must make **two independent** matches, because they fail in different ways:

1. **Discrimination — "does the check distinguish the required behaviour from a broken one?"**
   Proven by a mutation or revert probe (or by the equivalent evidence the lane already produced).
2. **Intent — "is the required behaviour the behaviour the criterion asked for?"**
   Proven by reading the criterion text against the code semantics, criterion by criterion. This
   check is in the user's prose (`:297`, `:304`, `:315`) but has never produced a record.

Only (1) ⇒ the swarm can be perfectly self-consistent and still wrong: right tests, wrong
requirement. Only (2) ⇒ the swarm can assert compliance without proof. Both are required, and they
are different artefacts with different evidence.

---

## 6. The change set — exact, file by file (nothing applied)

### (a) Plugin-side changes — no approval needed, the user's prose is untouched

**A-1 · `skills/swarm-engineering.md` §14 — one new rule** (plugin band, `:589-603`; the Coordinator
is the audience):

> - **Number the criteria in every brief.** Every brief that carries acceptance criteria lists them
>   as `C1..Cn`, one line each: the criterion, the observable check that proves it, and its source
>   (the assignment, a repository rule by `file:line`, or the behaviour that must not change). The
>   Developer does not author criteria; the Coordinator names them.

**A-2 · `skills/swarm-engineering.md:600` — one clause appended** to the existing
"one test file per function" rule:

> … the Tester owns the requirement-clause file **and cites the criterion id each test covers; a
> criterion with no test is a reported coverage gap, never a silent pass.**

**A-3 · `skills/swarm-engineering.md` — a NEW worker-facing section `## 16. Requirement Matching`**,
after §15, behind its own marker comment:

> This section binds the Reviewer, and any worker asked to report against a criterion. For every
> criterion `C1..Cn` in your assignment, report one line: the criterion id, a verdict, and the
> evidence that supports it. Verdicts: `met` — the evidence shows the criterion is satisfied;
> `not met` — the evidence shows it is not; `not demonstrated` — no evidence either way; `not in
> scope` — the criterion was outside this assignment. A verdict without evidence is `not
> demonstrated`, never `met`. The Tester's `passed` / `failed` / `blocked` / `not-tested` map onto
> `met` / `not met` / `not demonstrated` / `not demonstrated`. Two checks, not one: does the check
> discriminate (would it fail if the behaviour were wrong), and is the behaviour the one the
> criterion asked for. If your assignment carried no numbered criteria, say so and report it as a
> gap; do not invent criteria. This section adds to the review completion gate: a review is
> complete only when every criterion in the assignment carries a verdict and its evidence, or is
> reported as `not demonstrated`.

**A-4 · `skills/swarm-engineering.md:6` — the marker must name the plugin's own sections
accurately.** It says "§11–§14, which the plugin adds at the end of the file" — §15 already exists
and is not named; §16 would be a third omission. The marker becomes "§11–§16".

**A-5 · `swarm-worker-prompt.md:12` — extend the skill bullet** (plugin prose, *not* a quoted
extract — the quoted user text is at `:5-8`, `:17-19`, `:21-25`, `:31-40`):

> … Its §11–§14 are Coordinator-side methods; you do not need them. Its §15 holds the host facts
> that apply to you too. **Its §16 binds the Reviewer: one verdict per criterion with its
> evidence, and two checks per criterion.**

*Without A-5, A-3 does not reach the Reviewer — this is the C1 defect, repaired.*

**A-6 · `swarm-prompt.md:262` — the Coordinator-practice pointer gains one clause**, because it
enumerates §14's rules in prose: add "numbering the criteria in every brief".

### (b) Optional, approval-gated changes to the user's own prose

**U-1 · `skills/swarm-engineering.md:304`** (the Reviewer's own §5.4 Step 1) — one sentence:

> "Identify each acceptance criterion by id (C1, C2, …) and report a verdict with evidence for
> each."

This lands in the one section the Reviewer always reads. *Recommended, but not required* — A-3 +
A-5 already deliver the duty.

**U-2 · `skills/swarm-engineering.md:544-548`** (the Review Completion Gate — the user's policy
§9.3, relocated verbatim) — one sentence:

> "Every criterion in the assignment carries a verdict and its evidence, or is reported as not
> demonstrated."

*Optional alternative to putting the gate sentence inside A-3. Note this is the USER's prose: D2
called it plugin-authored; it is not (verified above).*

### (c) Explicitly NOT changed

- `skills/swarm-engineering.md` §8 (the assignment contract) — editing it would break the verbatim
  quotation shipped at `swarm-worker-prompt.md:22` (C2). The criterion numbering rides the existing
  "acceptance criteria" field instead.
- `swarm-prompt.md` §7 / §11 — the assignment field list (`:152`) and the acceptance line (`:204`)
  already carry what is needed.
- `skills/swarm-engineering.md` `:297`, `:304`, `:315` — the user's intent check stays as it is.
- The Developer's deliverable, the Tester's deliverable, the report contract — unchanged.

---

## 7. How it would be proved

A **fresh Reviewer round** — a new `subagent` with a self-contained brief (not a warm teammate:
the prompt is assembled at session start, so only a new agent proves the new section is served).

**The brief carries the criteria uniformly** — `C1..Cn`, each with its check and its source —
and **does not reveal which one is the control**. Only the Coordinator knows that; the Reviewer
learns the answer from its own evidence, and the Coordinator checks afterwards.

**The deliverable is a section of the Reviewer's own report** (not a new file): the same 7 items it
always writes, plus `## Criterion verdicts` — one line per criterion.

**Controls (both already on disk — no construction):**

| Control | Where | What it proves |
|---|---|---|
| **Negative control** — `C1: longest_word returns the alphabetically first word among those sharing the maximum length` | requirement text verbatim in `D:\project\.swarm-lab\eff\eff-r5-discrepancy.md`; the code at `D:\project\.swarm-lab\eff-repo\src\effdemo\core.py:19` (`if len(word) > len(best):`, strict `>` ⇒ input order wins) | the reviewer must report **`not met`** with the failing call as evidence — the intent check, done live |
| **Discrimination control** — the `pick_daily` quiet-day guard | `D:\project\.swarm-lab\head_tree` (branch `swarm/lab10`, HEAD `c415a38`) and the runnable scratch `D:\project\.swarm-lab\r4-probe` (pre-fix blob `4666e107…` ≡ `4eb8643~1:scripts/pick_daily.py`) | the checks still discriminate: scratch "6 failed", tree "6 passed" |

**A second, self-contained control on the ladder** (if the round must be commit-based): at
`16a3d2b` — i.e. *before* the R11 fix `c415a38` — the criterion "the `check_site_links` JSON-report
test pins exit code `2`" is **not met** (the test asserted only `proc.returncode != 0`;
`FINDINGS.md:145`, `HT-R9.md:282`).

**Pass condition:** every criterion has a verdict and an evidence pointer; the control criterion is
reported `not met` with a reproduction; the discrimination probe still kills its mutants. The
Coordinator then writes the ledger row at acceptance (`skills/swarm-engineering.md:603`).

**Cost:** one fresh agent, one small brief, no code change. The negative control costs nothing to
set up — it is a file and a paragraph that already exist.

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| **Criterion inflation** — 30 criteria per lane is bureaucracy and the reviewer skims. | Cap at ~10 per lane; a condition that is not observable-and-checkable is a constraint (an existing assignment field), not a criterion. |
| **Criterion authorship drift** — the Developer ends up writing the criteria and accepting itself. | Criteria are written by the Coordinator; product decisions go to the human first (`skills/swarm-engineering.md:597`). |
| **The verdict table becomes a ritual** — filled in with `met` and no evidence. | `met` without evidence is invalid (`not demonstrated`); the Coordinator checks the evidence pointers at acceptance. One line per criterion. |
| **The Reviewer cost grows.** | The evidence already exists (the diff, the probe results); the table is a table, not a second analysis. |
| **The user's documents drift.** | Zero required user-prose edits; the two optional ones (U-1, U-2) need approval and are quoted verbatim here. The integrity diffs (`policy_hit_1.txt` → `swarm-prompt.md`, `user_skill_paste.md` → `skills/swarm-engineering.md`) are re-run after every edit; the baseline is live and green (skill 135/6, policy 31/96 — re-verified by D2). |
| **The model over-fits one runtime.** | The criterion set is plain text that rides the brief, the board entry and the report. It does not depend on the DSH tool registry. |
| **A criterion set that does not exist** (the no-Developer composition). | §16's rule: report the gap, do not invent criteria — the Coordinator then writes the criteria and dispatches again. |

---

## 9. Open decisions — the user's call

1. **Do the optional user-prose edits go in?** U-1 (one sentence in the Reviewer's own §5.4 Step 1)
   is recommended. U-2 (one sentence in the Review Completion Gate) is an alternative to putting
   that sentence in the plugin's §16 — not both.
2. **Does `not demonstrated` block acceptance, or only warn?** Proposed: blocks, unless the
   Coordinator explicitly accepts it with a reason recorded in the ledger row.
3. **Which control does the proof round use?** Proposed: the eff-repo `longest_word` criterion
   (cheapest, requirement text already on disk). Alternative: the ladder at `16a3d2b` against the
   exit-code-pinning criterion (commit-based, in the user's real repository). One round, not both.
4. **Is the verdict table mandatory whenever the brief carries numbered criteria, or always?**
   Proposed: mandatory when numbered criteria exist, optional otherwise, so trivial lanes stay
   cheap.

---

## 10. Provenance

- D1 (inventory): `DESIGN-INVENTORY.md` — 13 gaps (G1–G13), the role-by-role use table, the
  numbering sweep (the word "clause" occurs exactly once in the whole bundle,
  `skills/swarm-engineering.md:600`), and the live tooling facts (a native teammate's assignment is
  the board entry — `CreateTeamTaskRequest = { subject, description, blockedBy?, writeScopes? }`,
  no requirement field; a one-shot subagent gets one free-text prompt plus an optional
  `outputSchema`).
- D2 (adversarial review): `DESIGN-REVIEW.md` — verdict SOUND WITH CORRECTIONS; U1–U25, M1–M9,
  C1–C6, §4 the smallest design, §5 the proof feasibility.
- Run evidence: `HT-R9.md`, `HT-R10.md`, `HT-R10-live.md`, `HT-PLAN.md`, `FINAL-VERDICT.md`,
  `FINDINGS.md`, `EFFICIENCY.md`.

## 11. What was applied (2026-11-07)

Approved by the user: **A-1…A-6 + U-1**; U-2 **not** applied. The gate decision: `not demonstrated`
**blocks acceptance**. The proof control: the **eff-repo `longest_word`** criterion.

| id | where it landed | change |
|---|---|---|
| A-1 | `skills/swarm-engineering.md:603` | new §14 rule — number the criteria in every brief (`C1..Cn`: criterion, observable check, source); the Developer never authors criteria |
| A-2 | `skills/swarm-engineering.md:602` | the Tester's requirement-clause file cites the criterion id each test covers; a criterion with no test is a reported coverage gap, never a silent pass |
| A-3 | `skills/swarm-engineering.md:615-634` | **NEW `## 16. Requirement Matching`** (worker-facing): the verdict line, the four verdicts, "a verdict without evidence is `not demonstrated`, never `met`", the Tester's mapping, the two checks, "do not invent criteria", and the gate extension (a `not demonstrated` criterion blocks acceptance) |
| A-4 | `skills/swarm-engineering.md:6`, `:483` | the two plugin markers name the plugin's sections accurately (§11–§16; §16 is worker-facing) |
| A-5 | `swarm-worker-prompt.md:12` | "Its §16 binds the Reviewer: one verdict per criterion with its evidence, and two checks per criterion." |
| A-6 | `swarm-prompt.md:262` | the Coordinator-practice pointer gains the clause "numbering the criteria in every brief" |
| U-1 | `skills/swarm-engineering.md:306` | the one approved change to the user's prose — "Identify each acceptance criterion by id (C1, C2, …) and report a verdict with evidence for each." |

Integrity after the edit (`git diff --no-index`, recovered original → shipped): the **policy** is
31 insertions / 96 deletions — **unchanged**; the **skill** is 159 / 6 (baseline 135 / 6), and the
hunk headers place every insertion (`@@ -307,0 +306,2 @@` = U-1; `@@ -481 +481,154 @@` = the
plugin band). The render unit test passes (`ALL CHECKS PASSED`, exit 0) and the bundle was
re-applied (the skill catalog loses `swarm-engineering` when the row is disabled and returns when
it is enabled).