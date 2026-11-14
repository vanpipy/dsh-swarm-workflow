# DESIGN-REVIEW — independent review of `DESIGN-requirements.md`

**Round:** D2 · **Role:** Reviewer (`auditor`) · **Board:** task-21 (claimed, rev 2)
**Design under review:** `D:\project\.swarm-lab\rounds\DESIGN-requirements.md` (213 lines)
**Deliverable:** this file only. Read-only everywhere else; nothing in `D:\project\dsh-plugins`, no git write command, no network, no goal, no plugin/bundle/profile change.

**Marking convention used throughout:** every statement carries `Verified` (I ran the check and it produced this), `Inferred` (read from a cited line without an executable check), or `Not run` (with the reason). Severity is `Blocking` / `Material` / `Non-blocking`, per the board brief.

---

## 0. Verdict summary

**SOUND WITH CORRECTIONS.**

The *model* is right: a numbered criterion id (`C1..Cn`) plus one verdict per criterion with an evidence pointer, plus the two checks (does the check discriminate / is the behaviour the one the criterion asked for), is the correct answer to the user's two questions and it fits the shipped documents' architecture — the criterion carrier already exists in the user's own prose.

The *draft* as written would not close the gap, for three structural reasons:

1. It puts the Reviewer's new duty in `skills/swarm-engineering.md` §14 — a section every worker is explicitly told it does **not** need (`swarm-worker-prompt.md:12`), so the rule never reaches the Reviewer. (C1, Blocking.)
2. It proposes six edits to the user's prose where **zero** are needed if the plugin uses its own sections and the brief as the carrier. (C2, C3, §4 below.)
3. Four of its load-bearing evidence claims are wrong or contradicted by the shipped files. None of them changes the model's direction; they change what the design may claim and how it must be justified. (U1–U4.)

**The three changes that matter most**

1. **Move the Reviewer's duty into a new worker-facing plugin section** — a new `## 16. Requirement Matching` in `skills/swarm-engineering.md` (behind a marker, after §15) **plus one bullet** in `swarm-worker-prompt.md`'s plugin-owned "Host facts" area (`:46-58`), instead of §14. Without the worker-prompt bullet the Reviewer never learns §16 exists — the same defect that breaks §5(c) today.
2. **Drop all six user-prose edits** (design `:136-156`). Carry the rule through the two carriers that already exist in the user's prose — the brief (`swarm-prompt.md:122`, `:152`; `skills/swarm-engineering.md:447`) and the plugin's own sections (§14 one new rule, §12.3 one sentence, §16 the Reviewer-facing rule). One user-prose edit remains worth asking for, and it is optional: one sentence in the Reviewer's own §5.4 Step 1 (`skills/swarm-engineering.md:304`).
3. **Re-verify the contradicted claims and re-point the proof** — `7 per-commit verdicts` → six (the seventh commit is the remediation of the R9 findings); "the one time the code did not meet its requirement" → at least three; "caught by accident" → a deliberately commissioned probe lane; "only the first [mechanism] is written into the workflow" → **neither** mechanism is written into the workflow; "nothing in the workflow does this today" → the intent check *is* in the user's prose (`skills/swarm-engineering.md:297`, `:304`, `:315`); "M5 was allowed by the missing verdict" → M5 was a weak *assertion*, found by the Reviewer's own probe; "nowhere else" → the board, the session goal and the ledger are carriers too. Then close the three gaps in the proof design (§5 below: hide the control's identity, put the verdict table inside the Reviewer's report, choose the eff-repo or ladder round).

---

## 1. UNSUPPORTED CLAIMS

Each row quotes the design sentence, then the `file:line` that supports or contradicts it. "Contradicted" means the cited file says something different.

### 1.1 Claims about the shipped documents

| # | Design sentence (quoted) | Evidence | Verdict | Severity |
|---|---|---|---|---|
| U1 | `:29` "Establish intended behavior, **relevant requirements**, …, **acceptance criteria**, and explicit constraints." → "**where** those requirements live — the reviewer must hunt for them" | `skills/swarm-engineering.md:304` reads exactly that. The claim that it says nothing about *where* requirements live is correct. | Verified | — |
| U2 | `:31` Reviewer Deliverable … "**no requirement trace at all**" | `skills/swarm-engineering.md:392-403` — seven numbered items (scope, assessment, findings, evidence, impact, limitations, completion); no criterion, no id. Grep of `HT-R9.md` for `criterion\|clause` returns **0 hits**. | Verified | — |
| U3 | `:32-33` `swarm-prompt.md:188` "you accept the work only against the **original acceptance criteria**"; `:204` "**Confirm original acceptance criteria.**" | `swarm-prompt.md:188` and `:204` read exactly that. | Verified | — |
| U4 | `:26-28` quotes of `skills/swarm-engineering.md:411`, `:417`, `:192` | `:411` "Provide implemented behavior, relevant changed files, **requirements addressed**, …"; `:417` "Provide **objective and requirements**, actual change summary, …"; `:192` "Translate requirements into observable test conditions." — all exact. | Verified | — |
| U5 | `:25` the assignment-contract quote | `skills/swarm-engineering.md:447` — verbatim, including "acceptance criteria". | Verified | — |
| U6 | `:81` "Grounded in the policy's own phase list (`swarm-prompt.md:122-127`)" | `swarm-prompt.md:114` "## 5. Engineering Phase Orchestration"; `:118` "Understand → Investigate → Design → Implement → Verify → Integrate and Accept"; `:122-127` the six phase bullets (`:122` Understand — "Coordinator establishes objective, scope, constraints, and acceptance criteria."; `:126` Verify — "…Ensure verification examines the actual implementation, not only the proposed design or worker's description."; `:127` Integrate and Accept). | Verified | — |
| U7 | `:85` "the board entry and the brief must agree (`swarm-worker-prompt.md:57`)" | `swarm-worker-prompt.md:57` "The board entry and your brief must agree; if they disagree, report it instead of guessing which one is right." | Verified | — |
| U8 | `:86` Verify carrier = the Tester's requirement-clause file, `skills/swarm-engineering.md:600` | `:600` "**Name one test file per function in every brief.** The Developer owns the implementation smoke test; the Tester owns the requirement-clause file. Two workers never author tests for the same clause…". The file is named; **clause ids are not** — `:600` neither numbers clauses nor requires a citation, which is exactly what the design proposes to add at `:165-166`. | Verified with a caveat | Non-blocking |
| U9 | `:88` Accept carrier = `swarm-prompt.md:188`, `:204`; `:91` Remediate carrier = `skills/swarm-engineering.md:421-425` | `:188`, `:204` as above; `:421-425` is §6.3 "Tester or Reviewer → Developer". | Verified | — |
| U10 | **`:50-52`** "Two mechanisms work: a **mutation/revert probe** … and a **clause-level read** … **Only the first is written into the workflow.**" | Grep of the three shipped markdown files for `mutat\|mutant\|probe\|revert\|strictly stronger` returns **two** hits, both incidental: `swarm-worker-prompt.md:56` ("before it was given") and `skills/swarm-engineering.md:92` ("Do not overwrite or revert changes outside the assignment"). **Neither** mechanism is written into the workflow. The design's second claim ("only the first") is false; the first is also false. | **Contradicted** | **Material** |
| U11 | **`:103-104`** "Nothing in the workflow does this today" (the intent check) | `skills/swarm-engineering.md:297` "Review for requirement violations, incorrect behavior, logic errors, interface or contract violations…"; `:304` "Establish intended behavior, relevant requirements, … acceptance criteria…"; `:315` "Does it violate a requirement or contract?" — the intent check **is** in the workflow, in prose, without a per-criterion record. The design's own table at `:29` quotes `:304`. | **Contradicted** (and internally inconsistent with `:29`) | **Material** |
| U12 | `:197` "the user's prose changes only with their approval and **only with the exact wording shown in §5**" | Design §5(b) `:154-156` gives **no wording at all** — three prose bullets, no quoted sentence. The design's own mitigation is therefore unmet by the design. | **Contradicted** (self-verifying) | **Material** |
| U13 | `:197` "The integrity diffs (`policy_hit_1.txt` → `swarm-prompt.md`, `user_skill_paste.md` → `skills/swarm-engineering.md`) are re-proven after every edit" | **Re-run by me, this round:** `git diff --no-index --numstat` gives `135	6	user_skill_paste.md => skills/swarm-engineering.md` and `31	96	policy_hit_1.txt => swarm-prompt.md` — byte-identical to the baseline `FINAL-VERDICT.md:214` records ("31 insertions / 96 deletions … 135 insertions / 6 deletions"), and `FINAL-VERDICT.md:214` also lists the known deviations. Both recovered originals still exist on disk. ⇒ the gate the design relies on is **live and currently green**; it needs no re-baselining. (Note the shipped marker at `swarm-prompt.md:239` now enumerates its own two exceptions, so the deviation list is stated twice and must be kept in step.) | **Verified** (I re-ran both diffs) | Non-blocking |

### 1.2 Claims about the run

| # | Design sentence (quoted) | Evidence | Verdict | Severity |
|---|---|---|---|---|
| U14 | **`:37-38`** "The R9 reviewer matched the change against **commits and mutants** (**7 per-commit verdicts**, 5 probes)" | `HT-R9.md` §1 "Per-commit verdicts" contains **exactly six** sub-sections: `:49` 1.1 `8120554`, `:55` 1.2 `fb2ebae`, `:82` 1.3 `4eb8643`, `:106` 1.4 `24bedad`, `:123` 1.5 `8723290`, `:140` 1.6 `16a3d2b` — and the round's own verdict says "ACCEPT on all **six** commits" (`HT-PLAN.md:81`, `FINDINGS.md:160`). The ladder has **seven** commits; the seventh, `c415a38` "test(scripts): pin the JSON-report exit code and the quiet-day 'stays open' line", is the **remediation of the R9 findings** (`FINDINGS.md:161`, `HT-PLAN.md:84`, `FINAL-VERDICT.md:37` "the R9 review ACCEPTed the ladder but its mutation probe proved two of the new tests were too weak; R11 pinned them"). The design conflated *seven commits* with *seven verdicts*. "5 probes" is correct (`HT-R9.md:163-288`: M1–M4 plus "Extra probe M5"). | "5 probes" **Verified**; "7 per-commit verdicts" **Contradicted** | **Material** (it is a "measured" sentence) |
| U15 | **`:41-44`** "The **one** time the code did not meet its requirement in the whole project — the `longest_word` tie …" | At least **three**: (i) the `longest_word` tie; (ii) `FINAL-VERDICT.md:37` "the ladder found **two real defects in the user's code** (the picker closing an announcement day forever with an empty file; the catalog able to shrink silently — the 2026-10-22 regression)" — commits `4eb8643` and `24bedad`; (iii) `FINDINGS.md:70` R13/E5 (the tie itself). | **Contradicted** | **Material** (the intent gap is *broader* than the design claims — the argument survives, the evidence does not) |
| U16 | **`:43-44`** "was caught by a lane that was *explicitly told* to read the requirement against the code … **It was caught by accident.**" | First half **Verified**: `EFFICIENCY.md:28` "| E5 | native teammate (**resumed**, warm context) | `eff-tester` | honest-failure probe of E1 |"; `D:\project\.swarm-lab\eff\eff-r5-discrepancy.md` "**Requirement as given (verbatim):** 'longest_word returns the alphabetically first word among those sharing the maximum length'". Second half **Contradicted**: `EFFICIENCY.md:63-67` "The honest-failure lane was cheap and found more than the requirement did. E5 used 9 calls to report that E1's implementation returns the first maximum-length word **in input order** … and then found that E1's tie test was **non-discriminating**" — a deliberately commissioned probe lane, not an accident. | **Partly contradicted** | **Material** (it misstates the mechanism the design uses to justify the intent check) |
| U17 | `:39` "`AGENTS.md:269-270` for the 02:00 comment" | At the ladder commit: `git show 8120554:AGENTS.md` → "### The daily job" + "The ritual runs unattended: a scheduled task in DSH fires at **02:00 local time** and runs the whole pipeline." — matches `HT-R9.md:52` and `HT-R10.md:487`. In the **live** working copy `D:\project\reading-collector\AGENTS.md` the same sentence now sits at `:271-272` and says **00:00** local time; `:269-270` is now the heading plus a blank line. | Verified at the ladder commit; **stale in the live repo** | Non-blocking |
| U18 | `:99-101` "The R9 probe proved exactly this and found the two real gaps (F-1: `!= 0` instead of `== 2`; F-2: the 'stays open' line was never asserted)" | `FINDINGS.md:145` (F-1 → F28: the test asserted only `proc.returncode != 0` + stderr; `HT-R9.md:272` "M5 survives — no test kills it"; `HT-R9.md:282` "| M5 (extra) | `scripts/check_site_links.py:541` `exit_code = 3` | — | **No** | 0 |") and `FINDINGS.md:146` (F-2 → F29: the "stays open" line at `scripts\pick_daily.py:588` was never asserted). | Verified | — |
| U19 | **`:72-75`** "it is exactly what let mutant M5 survive R9: the test asserted `returncode != 0`, so an exit code of `3` passed as 'loud'" — offered as the motivation for the "not demonstrated" verdict rule | The **factual** half is verified (U18). The **causal** half is **contradicted by the design's own model**: §3 `:99-101` classifies a weak assertion as the **discrimination** failure, which §3 says is already covered by the mutation probe. A *reporting* vocabulary cannot detect a weak assertion — the Reviewer's own probe found it. | **Contradicted** (mis-motivation; mixes the two failure modes) | **Material** |
| U20 | `:174-178` "A **fresh Reviewer round** on a commit set that already exists" | `D:\project\.swarm-lab\head_tree` exists (worktree of `D:\project\reading-collector`, branch `swarm/lab10`, HEAD `c415a38`) and holds the seven ladder commits. | Verified | — |
| U21 | `:180-181` negative control "the `longest_word` tie … (brief: alphabetically first; code: input order)" | `D:\project\.swarm-lab\eff-repo\src\effdemo\core.py:11-21` — `def longest_word(words: Sequence[str]) -> str:`, docstring "On a tie the first such word in input order wins."; `:19` `if len(word) > len(best):` (strict `>`). Requirement text recorded verbatim in `D:\project\.swarm-lab\eff\eff-r5-discrepancy.md`. Repo is disposable by design (`EFFICIENCY.md:11`). | Verified | — |
| U22 | `:48-49` "**Where?** In the assignment — the brief — plus the repository's binding rules and the existing behaviour that must not change. **Nowhere else.**" | "Nowhere else" is **contradicted** by live carriers the design omits: the shared board (`swarm-prompt.md:253` "The shared board carries the assignments."), the session goal (`swarm-prompt.md:256` "Complete it only when the acceptance criteria are met"), and the round ledger (`skills/swarm-engineering.md:603`). "Plus the repository's binding rules" is verified (`FINAL-VERDICT.md:185` lists `AGENTS.md` as the repo's binding rules). | **Contradicted** | **Material** (this is the answer to the user's *first* question) |
| U23 | `:63`, `:118` the four-value verdict vocabulary, incl. `not demonstrated` | Grep of every `.md` in `D:\project\.swarm-lab\rounds` for `not demonstrated` returns **hits only in `DESIGN-requirements.md`** (`:63, :71, :89, :90, :118, :124, :125, :145, :156, :212`). The value is new everywhere — no shipped document and no prior report uses it. New is fine; what the design fails to say is that a four-value vocabulary **already exists** for the Tester (`skills/swarm-engineering.md:273` "Clearly distinguish passed, failed, blocked, and not-tested conditions."). | Verified (new); omission → M3 | see M3 |
| U24 | `:194` risk mitigation "product decisions go to the human first (the plugin's own rule at `:597`)" | `skills/swarm-engineering.md:597` "**Put an open product decision in front of the human before you delegate.**" | Verified | — |
| U25 | `:198` "the clause set is a plain text artefact that rides the brief, the board entry and the report" | `swarm-prompt.md:253` (board carries assignments), `:141-156` (§7 "### Assignment" — the field list the brief is built from, incl. `:152` "**Acceptance criteria:** Observable conditions for completion."), `skills/swarm-engineering.md:392-403` (the Reviewer's report). | Verified | — |

**Summary of §1:** **seven** contradicted-by-file claims (U10, U11, U14, U15, U16, U19, U22 — U14 and U16 are partly contradicted), one stale citation (U17, `AGENTS.md:269-270` — correct at the ladder commit, wrong in the live repo), one internally unmet mitigation (U12), and U13 **Verified by my own re-run** of both integrity diffs. **No claim in the design is left without evidence**; the failures are contradictions, not absence of evidence.

---

## 2. MISSED CARRIERS

Places a requirement can live — or be lost — that the design does not mention.

**M1 — The "the criteria do not exist" path (Material).**
`skills/swarm-engineering.md:449` "If essential information is missing, identify it specifically. Do not compensate for an unclear assignment by performing unbounded investigation." (quoted into `swarm-worker-prompt.md:23`, reinforced at `:27` "Your assignment carries those fields. If one of them is materially missing, name the gap and report it to the Coordinator; do not guess and do not widen the assignment to compensate."), and `swarm-prompt.md:158` "Do not omit critical information merely because the worker may infer it."
The design's object set (`R0`, `C1..Cn`, `K1..Km`) has **no state for "no criterion set exists"**, and its only fallback is a Reviewer-only sentence at design `:138-140`. The shipped contract already has a general rule for this for **every** role. The design neither cites nor reuses it, so it re-invents one role's version of a rule the user already wrote — and leaves the Developer and Tester without it. **Severity: Material.**

**M2 — The Tester already reports requirements and coverage gaps (Material).**
`skills/swarm-engineering.md:264` "Requirements or behaviors tested."; `:269` "Coverage gaps."; `:273` "Clearly distinguish passed, failed, blocked, and not-tested conditions."; §4.5 exit criteria "Material coverage gaps are reported."
The design's flow row `:87` invents "Each test cites the clause it covers. A clause with no test is a **reported coverage gap**, not a silent pass." The *coverage-gap* notion exists; the *clause id* linkage and the mapping onto the Tester's existing `not-tested` value do not. Missing this changes what "the smallest design" is (§4): the right change is one clause on an existing deliverable item, not a new report structure. **Severity: Material.**

**M3 — A second, existing four-value vocabulary and an existing severity taxonomy (Material).**
`skills/swarm-engineering.md:273` (Tester: passed / failed / blocked / **not-tested**) and `:535-540` (§12.2 Finding Classification: Blocking `:537` / Material `:538` / Non-blocking `:539` / **Out of scope** `:540` — "**Out of scope:** Unrelated observation.").
The design's §4 `:112-126` introduces a *third* set (met / not met / not demonstrated / out of scope) without reconciling it with either. Two consequences: (a) the same clause can be reported two ways by two roles ("not met" by the Reviewer, "failed" by the Tester) with no mapping; (b) the word "out of scope" becomes a **verdict** and a **severity** in the same report. **Severity: Material (a); Non-blocking (b) if the two tables are kept separate and named differently.**

**M4 — The plugin's own Review Completion Gate (Material).**
`skills/swarm-engineering.md:544-548` §12.3 "Review Completion Gate": "A review is complete when the relevant scope has been examined, material risks assessed, findings sufficiently supported, blocking and material findings reported, and remaining observations are non-blocking or out of scope." — **plugin-authored** (the marker at `:481` places §§11–§14 in the plugin's band).
This is exactly where "every criterion carries a verdict and its evidence" belongs, and it needs **no user approval**. The design never mentions §12.3 and instead proposes two new bullets in the user's §5.6. **Severity: Material** (it directly changes the smallest design).

**M5 — The session goal and the round ledger as criterion carriers (Non-blocking).**
`swarm-prompt.md:256` "Complete it only when the acceptance criteria are met — a worker's completion is not the swarm's completion"; `:257` the `todo_write` round ledger; `skills/swarm-engineering.md:603` "Keep one ledger row per round — the agents spawned, the files each touched, the verdict, and where the evidence came from". The design's open question `:206-208` asks "Where does the clause set live?" without checking the goal/board/ledger surfaces. **Severity: Non-blocking.**

**M6 — The remediation loop as a re-matching carrier (Non-blocking).**
`skills/swarm-engineering.md:550-559` §12.4 step 4 "Relevant parts are re-tested or re-reviewed."; `:421-425` §6.3 "Tester or Reviewer → Developer". The design cites §6.3 as a *phase owner* but never asks what a re-review must re-match (its open question `:209-211` only asks whether the table is mandatory). **Severity: Non-blocking.**

**M7 — The board/brief disagreement path as the drift detector (Non-blocking).**
`swarm-worker-prompt.md:57` already tells a worker to report a disagreement between the board entry and the brief. The design's §2 `:85` cites that line but uses it only as a fact about the surface, not as the mechanism that keeps two copies of the clause set in sync. **Severity: Non-blocking.**

**M8 — The user's existing "constraints" concept (Non-blocking).**
`swarm-prompt.md:122` "Coordinator establishes objective, scope, constraints, and acceptance criteria."; `skills/swarm-engineering.md:447` lists "constraints" and "acceptance criteria" as two distinct assignment fields. The design's `K1..Km` class (`:62`) is a third vocabulary over content the user's prose already fields. **Severity: Non-blocking.**

**M9 — The plugin's own authorship rule, and where a Reviewer-facing rule may live (Material).**
`skills/swarm-engineering.md:6` marker: "this file is the user's own skill text. Two deliberate exceptions: the §1 bullet below … and **§11–§14, which the plugin adds at the end of the file**, each behind a marker comment."; `:593` "Practice learned in the field, added by the plugin. It does not change the policy above; it is how the policy is best executed on this host."; `skills/swarm-engineering.md:481` marker: "§11–§13 are Coordinator-side; a worker needs its own role section (§3, §4, §5) and the shared contract in §8."
The design's §5(c) `:158-168` puts the Reviewer's rule in §14 without checking any of these; the practical consequence is C1 below. **Severity: Material.**

---

## 3. CONTRADICTIONS WITH THE USER'S DOCUMENTS

**C1 — The design puts the Reviewer's new duty where the Reviewer is told not to look. (Blocking.)**
Design `:167-168`: "a new rule: **'Two checks, not one.'** A review that only proves discrimination (mutation probe) has not proved intent (clause read); the Reviewer does both, or says which it did not do." — placed in `skills/swarm-engineering.md` §14.
Against it, `swarm-worker-prompt.md:12`: "the `swarm-engineering` skill — the role methods, the common engineering principles, the handoff rules and the reporting contract. Load it before non-trivial work; your assignment names your role — Developer, Tester, or Reviewer — and that role's section is what you follow. **Its §11–§14 are Coordinator-side methods; you do not need them.**" (repeated by the marker at `skills/swarm-engineering.md:481`).
A Reviewer is a worker. §14 is a section the worker prompt explicitly removes from the worker's reading. As placed, the rule that closes the user's gap never reaches the person who must execute it. **This is the single defect that makes the draft fail on its own terms.**

**C2 — The §8 edit breaks a shipped verbatim quotation. (Material.)**
Design `:149-150` proposes: "**§8** — the assignment contract's 'acceptance criteria' becomes 'numbered acceptance criteria (C1, C2, …), each with the check that proves it'."
But `swarm-worker-prompt.md:21-25` quotes `skills/swarm-engineering.md` §8 **verbatim** — `:22` carries the whole field list including the words "acceptance criteria", `:23` the "If essential information is missing…" sentence — and `:44` marks the region "Everything above this marker is the user's own text…". Editing the source without updating the quotation ships two documents that disagree about the assignment contract, inside the one file whose purpose is to be a faithful worker-facing extract. The design never mentions the coupling. (Note: design `:152-156`'s policy §7/§11 edits do **not** break a quotation — `swarm-worker-prompt.md:17` quotes only §7's opening sentence — so this coupling is specific to the skill §8 edit.)

**C3 — The design's edit surface contradicts the plugin's shipping rule. (Material.)**
The rule, as the plugin itself states it: `skills/swarm-engineering.md:6` (the user's text; the plugin adds §§11–§14) and `swarm-prompt.md:239` ("Everything above this marker is the user's own policy text, with two deliberate exceptions… Everything below this marker is plugin-added host context, not policy.").
The design proposes **six** user-prose edits — skill §5.4 (`:136-142`), §5.6 ×2 (`:143-145`), §5.9 (`:146-148`), §8 (`:149-150`), policy §7 and §11 (`:154-156`) — while its own risk row (`:197`) states that plugin rules go in §14 and user prose needs approval. Under the plugin's own architecture, most of what the design wants can live in the plugin's own sections and in the brief, with **no** user-prose edit (see §4). Six approval-gated edits for a change that needs none is not a wording preference — it is six chances for the change to stall on approval, and it enlarges the surface the integrity diffs (design `:197`) have to police. **Severity: Material.**

**C4 — The verdict table collides with the shipped severity taxonomy. (Non-blocking.)**
Design `:119` defines the verdict `out of scope` ("the clause concerns something the assignment did not cover"). `skills/swarm-engineering.md:540` already defines "**Out of scope:** Unrelated observation." as a *finding severity* in the same report the verdict table would live in. Same words, two axes. **Severity: Non-blocking** provided the two tables are named apart (e.g. verdict `not in scope` / severity `Out of scope`).

**C5 — The design's "Accept" gate is presented as existing flow, but it is an addition. (Material.)**
Design `:90` states, as a description of the shipped flow: "The Coordinator accepts a lane only when every criterion is `met` — or explicitly accepted with the reason recorded. A `not demonstrated` criterion blocks acceptance; a `not met` one reopens the lane."
The user's actual prose: `swarm-prompt.md:196` "Coordinator owns integration and final acceptance."; `:198-206` the "Before accepting:" list, `:204` "Confirm original acceptance criteria."; `:208` "Worker reports are evidence inputs, not substitutes for integration." The user's rule is *the Coordinator confirms the criteria*; the design's rule is *the Coordinator's acceptance is gated by a worker's verdict table*. That is a real behavioural change, delivered inside a table the design presents as "how the workflow works today". It belongs in §5 as a proposal. **Severity: Material.**

**C6 — The new completion obligation is stricter than the shipped gate (Non-blocking, but decide it deliberately).**
Design `:184-185` "Pass condition: every clause has a verdict and an evidence pointer" vs `skills/swarm-engineering.md:546` "A review is complete when the relevant scope has been examined, material risks assessed, findings sufficiently supported, blocking and material findings reported, and remaining observations are non-blocking or out of scope" and `:368` "A review does not need to prove the absence of every hypothetical defect."
The design's rule is compatible with `:368` (it asks for a verdict per *criterion*, not for the absence of every defect) and is plugin-side, so it may be tightened freely. Flagging it so the Lead tightens it **deliberately**, not accidentally. **Severity: Non-blocking.**

---

## 4. THE SMALLEST DESIGN THAT STILL WORKS

### 4.1 The premise the design misses: the carrier already exists

The user's own prose already defines where criteria live and who writes them:

- `swarm-prompt.md:122` "**Understand:** Coordinator establishes objective, scope, constraints, and acceptance criteria." (phase owner)
- `swarm-prompt.md:152` "**Acceptance criteria:** Observable conditions for completion." (policy §7, the assignment contract)
- `skills/swarm-engineering.md:447` "… scope, out-of-scope boundaries, constraints, expected output, **acceptance criteria**, dependencies …"
- `swarm-prompt.md:204` "**Confirm original acceptance criteria.**" (acceptance)

So the gap the user named is **not** "there is no place where criteria live". It is exactly two things:

1. the criteria have **no identity** (no id, no source), so "matched or not" cannot be recorded against anything; and
2. **no role is required to record a verdict per criterion**, and the one place the design chose for that record (§14) is a section the Reviewer is told to skip (C1).

### 4.2 The minimum change set — four sentences of plugin text, zero user-prose edits

**(1) `skills/swarm-engineering.md` §14 — one new rule** (plugin band, Coordinator-side, so it may be written without approval):

> **Number the criteria in every brief.** Every brief that carries acceptance criteria lists them as `C1..Cn`, one line each: the criterion, the observable check that proves it, and its source (assignment, repo rule by `file:line`, or the behaviour that must not change). The Developer does not author criteria; the Coordinator names them.

*Why §14:* it is the plugin's Coordinator-practice section (`skills/swarm-engineering.md:591-603`), and the policy points the Coordinator at it (`swarm-prompt.md:262`). **Coupling to note:** `:262` enumerates §14's rules in prose, so it gains one clause there.

**(2) `skills/swarm-engineering.md` §14 — extend the existing rule at `:600`** (same bullet, one clause):

> … the Tester's requirement-clause file **cites the criterion id each test covers, and a criterion with no test is a reported coverage gap, never a silent pass.**

*Why extend `:600` rather than add:* `:600` already fixes "one test file per function" and "the Tester owns the requirement-clause file"; the clause id is one clause of that same sentence.

**(3) `skills/swarm-engineering.md` — a new plugin section `## 16. Requirement Matching`**, after §15, behind a marker, and the marker at `:6` updated to name §16 alongside §§11–§14:

> This section binds the Reviewer, and any worker asked to report against a criterion. For every criterion `C1..Cn` in your assignment, report one line: the criterion id, a verdict, and the evidence that supports it. Verdicts: `met` — the evidence shows the criterion is satisfied; `not met` — the evidence shows it is not; `not demonstrated` — no evidence either way; `not in scope` — the criterion was outside this assignment. A verdict without evidence is `not demonstrated`, never `met`. Two checks, not one: does the check discriminate (would it fail if the behaviour were wrong), and is the behaviour the one the criterion asked for. If your assignment carried no numbered criteria, say so and report it as a gap; do not invent criteria.

*Why a new section:* §5 is the user's prose (`skills/swarm-engineering.md:6`); §§11–§14 are declared Coordinator-side to workers (`swarm-worker-prompt.md:12`, `skills/swarm-engineering.md:481`); §12.3 is plugin-authored but also in that band. The **only** worker-facing places are the user's §§1–§10 and a new plugin section — so a new section is required unless the user approves a §5 edit.

**(4) `swarm-worker-prompt.md` — one bullet in the plugin-owned "Host facts" area (`:46-58`)** (the marker at `:44` ends the user's text, so this is plugin territory):

> The skill's §16 applies to you when you are the Reviewer: report one verdict per criterion with its evidence, and run two checks per criterion — does the check discriminate, and is the behaviour the one the criterion asked for.

*Without (4), (3) does not reach the Reviewer* — this is the C1 defect, repaired.

**(5) `skills/swarm-engineering.md` §12.3 — one sentence** (plugin band, the Review Completion Gate):

> A review is complete only when every criterion in the assignment carries a verdict and its evidence, or is reported as `not demonstrated`.

*(Optional, and the only user-prose change worth asking for: one sentence appended to `skills/swarm-engineering.md:304` in the Reviewer's own §5.4 Step 1 — "Identify each acceptance criterion by id (C1, C2, …) and report a verdict with evidence for each." It lands in the one section the Reviewer always reads, and it is the user's to approve.)*

### 4.3 What a lane's artefacts look like, before and after

| Artefact | Before (shipped) | After (minimum design) |
|---|---|---|
| **Coordinator brief** | prose acceptance criteria (`swarm-prompt.md:152`); constraints, objective (`skills/swarm-engineering.md:447`) | the same prose **plus** an enumerated list `C1..Cn`, each line: criterion / observable check / source. **New file: none** — it is a section of the existing brief, and the same text goes into the board entry (`swarm-prompt.md:253`) |
| **Developer report** | `skills/swarm-engineering.md:153-164` (§3.5 deliverable) | **unchanged.** The Developer never restates criteria; the trace is the Reviewer's job. (The design's flow row `:86`, which makes the Developer report carry per-clause status, is dropped) |
| **Tester file** | the requirement-clause file named at `skills/swarm-engineering.md:600`; tests with no criterion id; coverage gaps reported as free text (`:269`) | same file; each test **cites the criterion id** it covers; the existing "Coverage gaps." item (`:269`) names every criterion with no test |
| **Tester report** | `skills/swarm-engineering.md:261-273` (8 items + the passed/failed/blocked/not-tested rule) | **unchanged**, except the mapping onto the Reviewer's vocabulary is stated once (M3). The Tester's `not-tested` maps to the Reviewer's `not demonstrated` — one line, not a new report |
| **Reviewer report** | `skills/swarm-engineering.md:392-403` — 7 items, no criterion trace | the same 7 items **plus** a "## Criterion verdicts" section: one line per criterion (id, verdict, evidence pointer). **No user-prose edit needed** — §16 requires the section; the user's §5.9 list is neither extended nor contradicted (adding an 8th item, design `:146-148`, is the optional approval-gated variant) |
| **Coordinator acceptance** | `swarm-prompt.md:204` "Confirm original acceptance criteria."; `:208` "Worker reports are evidence inputs, not substitutes for integration." | the same line, with the outcome recorded in the ledger row (`skills/swarm-engineering.md:603`) as `C1 met (evidence) / C2 not met (evidence) / C3 not demonstrated`. **No policy edit needed.** The design's stronger gate (C5) stays a *proposal*, not a description |
| **Policy / skill prose** | as shipped | **unchanged**, unless the user approves the single optional §5.4 Step 1 sentence |

### 4.4 What to DROP from the draft design, and why

| Drop | Why |
|---|---|
| §5(a) in full — skill §5.4 / §5.6 ×2 / §5.9 / §8 edits (design `:136-150`) | Redundant or unnecessary. `skills/swarm-engineering.md:304` already says "Establish intended behavior, relevant requirements, … acceptance criteria"; `:451` already requires a report to distinguish evidence obtained; `:447` already carries acceptance criteria in the assignment. The same output can be required plugin-side (§16 + §12.3) without an approval-gated edit — **and the §8 edit actively breaks the shipped quotation at `swarm-worker-prompt.md:22` (C2)**. Approval cost: 5 edits → 0 (1 optional) |
| §5(b) — policy §7 / §11 edits (design `:154-156`) | `swarm-prompt.md:152` already defines acceptance criteria and `:204` already requires confirming them; the plugin's §14 rule reaches the same place through the brief. §5(b) also shows **no wording**, which the design's own `:197` rule demands (U12) |
| `R0 — Objective` (design `:60`) | The objective already exists as an assignment field (`skills/swarm-engineering.md:447` "objective"; `swarm-prompt.md:144`). Naming it R0 adds a label, not a carrier |
| `K1..Km — Constraints` (design `:62`, `:193`) | Constraints already exist as a first-class assignment field (`skills/swarm-engineering.md:447`; `swarm-prompt.md:122`). A second numbered id space over the same content adds vocabulary, not traceability — the brief's "source" field carries it |
| `E — Evidence` as a separate object (design `:64`) | Evidence is the *form* of the verdict line ("verdict + evidence pointer"), not an independent artefact. It collapses into one line per criterion |
| The §2 "Accept" gate as a *description* of today's flow (design `:90`) | It is an addition to the user's §11, delivered as a description (C5). Keep it in §5 as an optional proposal only |
| §5(c)'s placement of "Two checks, not one" in §14 (design `:167-168`) | The Reviewer is told §11–§14 are "Coordinator-side methods; you do not need them" (`swarm-worker-prompt.md:12`). Move it to §16 (+ the worker-prompt bullet). Keep §14's version of it as the *Coordinator's* instruction to require the two checks in the brief |
| The design's §6 "Accept" row claiming "every criterion `met`" as current behaviour | See C5 |

**KEEP** (all verified against the shipped files, all cheap): the numbered criterion id; the four-value verdict with `not demonstrated`; the rule that a verdict without evidence is `not demonstrated`; the two checks; "the Coordinator writes the criteria, the Developer never does" (the user's prose supports the Coordinator's authorship at `swarm-prompt.md:122`); the §14 rule that the Tester's file cites the criterion id; the fresh Reviewer round as the proof; the risk row's re-verification discipline (once the baseline is re-established, U13); the `not demonstrated`→acceptance question as a **user** decision (`:212-213`) — it is a genuine policy choice, not a technical one.

---

## 5. THE PROOF FEASIBILITY

**Short answer: yes for both controls — the artefacts already exist — but the proof as designed has three gaps and one wrong assumption about where the negative control lives.**

### 5.1 Negative control — exists, zero construction needed

- The requirement is recorded **verbatim**: `D:\project\.swarm-lab\eff\eff-r5-discrepancy.md` — "**Requirement as given (verbatim):** 'longest_word returns the alphabetically first word among those sharing the maximum length'" … "**VERDICT: deviates.** `longest_word(["ddd","aaa"])` returns `"ddd"`".
- The code is on disk and unchanged: `D:\project\.swarm-lab\eff-repo\src\effdemo\core.py:19` `if len(word) > len(best):` (strict `>` ⇒ input order wins), docstring `:11-14` "On a tie the first such word in input order wins.".
- The repo is disposable by design: `EFFICIENCY.md:11` "**Lab repo**: `D:\project\.swarm-lab\eff-repo` (package `effdemo`), commit `12ea0cc`, disposable."
- **Cheapest constructible clause:** `C1: longest_word returns the alphabetically first word among those sharing the maximum length`. The current code does **not** meet it; a Reviewer must return `not met` with the failing call as evidence.
- A second clause from the same repo gives the round a discrimination probe without touching the code: `D:\project\.swarm-lab\eff-repo\tests\test_core.py:17-18` `test_longest_word_tie_returns_first_in_input_order` asserts `longest_word(["bb","ccc","dd","eee"]) == "ccc"` — **non-discriminating**, because "ccc" is also alphabetically first. (Recorded in `eff-r5-discrepancy.md`: "…E1's tie test was non-discriminating".)
- **Caveat (Verified):** `eff-repo` has **no `.git`** (directory listing shows no `.git`), so the round there is a *file-based* review of a small disposable repo, not a commit-based review.

### 5.2 Discrimination control — exists and is already proven twice

- **Ladder:** `D:\project\.swarm-lab\head_tree` (branch `swarm/lab10`, HEAD `c415a38`) holds the seven commits; R9's probe is recorded at `HT-R9.md:163-288` (M1–M4 killed, M5 survived, "Mandated mutants killed: 4 / 4" at `:284`), and `FINAL-VERDICT.md:216` "the Reviewer refused to accept the R3 fix until a revert probe proved the six new tests fail against the pre-fix code".
- **The cheapest *runnable* probe in the lab** is my own R4 scratch: `D:\project\.swarm-lab\r4-probe` holds the pre-fix `scripts/pick_daily.py` (byte-verified blob `4666e107cdb50f70b241e711cd1fbc91b33e655e` = `4eb8643~1:scripts/pick_daily.py`, guard absent), and the six `TestQuietDay` tests discriminate — scratch "6 failed in 1.04s", tree "6 passed in 0.36s". Expected outputs are already recorded, so the round's expected transcript is known before it runs.
- **Second, already-documented expected survivor:** `FINDINGS.md:146` (F-2 → F29) — the "stays open" line at `scripts\pick_daily.py:588` was never asserted.
- **Not runnable as-is:** the textstats mutant harness `D:\project\.swarm-lab\probe\reviewer_r1\mutants.py` (7945 B) has an **empty** head snapshot `probe\reviewer_r1\head_src_textstats_core.py` (**0 B**). The lab repo survives (`D:\project\.swarm-lab\lab-repo`, commits `fdb2716`/`3e9bc26`, `src\textstats\core.py` 1890 B, `tests\test_core.py` 1508 B), so the harness could be regenerated from it — but that is construction. **Prefer the ladder.**

### 5.3 The three gaps in the proof as designed

- **Gap 1 — the proof is gameable (Material).** Design `:174-185` never says the control clause must be *indistinguishable* in the brief. If the brief says "C1 (negative control: known failure)", the round proves nothing. The brief must enumerate `C1..Cn` uniformly; **only the Coordinator** may know which is the control; the Reviewer learns the answer from its own evidence and the Coordinator checks it afterwards.
- **Gap 2 — the artefact is undefined (Material).** The design fixes "the deliverable" as "the criterion-verdict table" (`:178`) but never says **where it is written**. Under the minimum design it is a *section of the Reviewer's own report* (no new file, no extra board round-trip); the Coordinator checks it at acceptance (`swarm-prompt.md:204`) and records the outcome in the ledger row (`skills/swarm-engineering.md:603`).
- **Gap 3 — the negative control's location on the ladder (Material).** If the round must be *commit-based* on `head_tree`, the `longest_word` clause is in a different repo and cannot serve. The cheapest **self-contained** control on the ladder is already recorded: at tree `16a3d2b` (i.e. *before* `c415a38`), the criterion "the `check_site_links` JSON-report test pins exit code `2`" is **not met** — the test asserted only `proc.returncode != 0` (`FINDINGS.md:145`, `HT-R9.md:282` "| M5 (extra) | `scripts/check_site_links.py:541` `exit_code = 3` | — | **No** | 0 |"), and commit `c415a38` is exactly the fix for it. ⇒ two viable controls: **(a)** the eff-repo `longest_word` clause (file-based, five minutes, verbatim requirement text on disk), or **(b)** the ladder at `16a3d2b` against the exit-code-pinning criterion (commit-based, already recorded). The design names only (a) while proposing a commit-based round — that mismatch is the gap.

### 5.4 The proof, restated in the minimum design

A fresh Reviewer round on **one** of the two candidate sets, with: a brief enumerating `C1..Cn` uniformly (source and check per line, written by the Coordinator); the Reviewer reporting one verdict + evidence pointer per criterion inside its own report; the two checks per criterion; the Coordinator verifying afterwards which clause was the control and whether the Reviewer's verdict matches the evidence. **Pass condition:** every criterion has a verdict and an evidence pointer; the control clause is reported `not met` with a reproduction; the discrimination probe still kills its mutants (`r4-probe` scratch vs tree, or the recorded R9 M1–M4/M5 outcome). No new code, no new repo, no new file — every input is already on disk.

---

## 6. VERDICT

**SOUND WITH CORRECTIONS.**

The design's *model* is the right answer to the user's question and it is compatible with the shipped documents' architecture: a criterion id, one verdict per criterion with an evidence pointer, and the two checks are exactly the missing piece, and the criterion carrier already exists in the user's own prose. The design's *draft* would not deliver it: it hides the Reviewer's duty in a section the Reviewer is told to skip (C1), it spends six approval-gated edits on the user's prose where none is needed (C3, C2), and four of its measured claims are contradicted by the files it cites (U10, U11, U14, U15/U16, U19, U22).

**The three changes that matter most**

1. **Move the Reviewer's duty out of §14 into a new worker-facing plugin section (§16) + one bullet in the worker prompt's host-facts area.** Without this the rule never reaches the Reviewer. (C1, §4.2 items 3–4.)
2. **Drop the six user-prose edits; carry the rule through the brief and the plugin's own sections** — one new §14 rule (numbered criteria), one clause added to the existing §14 rule at `:600` (clause id per test), one sentence in §12.3 (the completion gate), §16 (the Reviewer's duty), and the worker-prompt bullet. Optional and approval-gated: one sentence in the Reviewer's own §5.4 Step 1 at `skills/swarm-engineering.md:304`. (C2, C3, M4, §4.)
3. **Re-verify the false claims and re-point the proof:** 7 → 6 per-commit verdicts (the seventh commit is R10's); "the one time" → at least three; "caught by accident" → a commissioned probe lane; "only the first mechanism is written into the workflow" → **neither** is; and the proof must hide the control's identity, write the verdict table inside the Reviewer's report, and pick either the eff-repo file-based round or the ladder-at-`16a3d2b` commit-based round. (U10, U14, U15, U16, U19, §5.)

---

## 7. NOT RUN / limits of this review

- **Not run — the fresh Reviewer round** (design §6). It is the design's own proof step and needs the Lead's approval of any text change first; this review covers the design, not its execution.
- **Not run — a mutation probe re-execution in this round.** The discrimination evidence cited is recorded (`HT-R9.md:163-288`, `FINDINGS.md:145-146`) plus my own R4 measurements in `D:\project\.swarm-lab\r4-probe` (scratch "6 failed" vs tree "6 passed"). I did not re-run a probe in this round.
- **Not run — the textstats mutant harness** (`probe\reviewer_r1\mutants.py`): its head snapshot is 0 B, so it is not runnable as-is. I did not regenerate it.
- **Not run — design §5(b)'s wording**, because none exists in the design to verify (U12).
- **Not run — the plugin's runtime behaviour** (prompt assembly, skill loading) and the **profile / bundle rows / plugin enable state**: out of scope for this round, and no `plugin_manager` call was made.
- **Not run — any write outside this file.** Nothing under `D:\project\dsh-plugins` was modified; no git write command; no network; no goal.

---

## Appendix A — files read (read-only)

**Design:** `D:\project\.swarm-lab\rounds\DESIGN-requirements.md` (213 lines — read in full, in four ranges).
**Bundle:** `D:\project\dsh-plugins\swarm-workflow\` — `swarm-prompt.md` (262), `skills/swarm-engineering.md` (610), `swarm-worker-prompt.md` (58), `index.js` (505).
**Run evidence:** `D:\project\.swarm-lab\rounds\` — `FINDINGS.md`, `HT-R9.md`, `HT-R10.md`, `HT-R10-live.md`, `HT-PLAN.md`, `FINAL-VERDICT.md`, `EFFICIENCY.md`, plus my own `HT-R4.md`.
**Lab artefacts:** `D:\project\.swarm-lab\eff-repo\`, `D:\project\.swarm-lab\eff\eff-r5-discrepancy.md`, `D:\project\.swarm-lab\lab-repo\`, `D:\project\.swarm-lab\probe\reviewer_r1\`, `D:\project\.swarm-lab\r4-probe\`, `D:\project\.swarm-lab\head_tree\`, `D:\project\.swarm-lab\policy_hit_1.txt`, `D:\project\.swarm-lab\user_skill_paste.md`.

## Appendix B — commands run (read-only)

`Get-Content -Encoding UTF8` on the four plugin/design files (line-numbered); `Select-String` over `D:\project\.swarm-lab\rounds\*.md` for `not demonstrated` and for `binding rules`, and over `HT-R9.md` for `^#{2,3} ` / `criterion|clause`; `Test-Path` / `Get-Item` on the lab artefacts; `git -C … log --oneline` (read-only) on `lab-repo`; `git show 8120554:AGENTS.md` (read-only) and `git -C … log` on `head_tree` (read-only) to check the `AGENTS.md:269-270` citation; `git diff --no-index --numstat` on the two integrity-diff pairs (skill: `135	6`; policy: `31	96` — matching `FINAL-VERDICT.md:214`); `Get-ChildItem` listings to establish that `eff-repo` has no `.git` and that `probe\reviewer_r1\head_src_textstats_core.py` is 0 B. No write command of any kind was issued.
