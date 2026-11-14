
## 9. Third phase — requirement traceability: where the goals live, and how "matched" is decided

The user asked (verbatim): *"For the review role in the 'swarm-engineering.md', I think the reviewer must take care of the goals or cases or stories matched or not, right? so the first question, where are the goals or cases or stories. the second is how to matched?"* — then answered the framing question (verbatim): *"Nope, design first base on the whole workflow definition"*, choosing a **fresh reviewer round** as the proof. So this phase ran **design → approval → implementation → proof**, and nothing in the bundle was edited before the design was approved.

### 9.1 The two answers

**Where the goals / cases / stories live.** Nowhere as an artefact. They exist as free text in five carriers — the assignment brief (`skills/swarm-engineering.md:447`, `swarm-prompt.md:152`), the board entry (a second copy of the same brief, `swarm-prompt.md:253`), the session goal (one string, `swarm-prompt.md:256`), the round ledger (`skills/swarm-engineering.md:603`) and the repository's own binding rules (`AGENTS.md`) — and **no shared identifier links them**. The word "clause" occurs exactly once in the whole bundle (`skills/swarm-engineering.md:600`); "story", "stories" and "use case" occur zero times. The inventory that established this is `DESIGN-INVENTORY.md` (D1, 38,285 B): a role-by-role table showing that **every role must read a requirement somewhere, and no role must produce a per-requirement verdict or name its source** — the Reviewer being the weakest bound.

**How "matched" was decided.** By prose judgement anchored on the brief. Two mechanisms matter and they fail in different ways:

| check | what it asks | where it stood |
|---|---|---|
| **discrimination** | would the check fail if the behaviour were wrong? | proven in practice by a mutation/revert probe — the R9 probe killed 4 of 5 mutants — but written **nowhere** in the workflow (grep over the three markdowns for `mutat\|mutant\|probe\|revert` hits only two incidental lines) |
| **intent** | is the behaviour the one the criterion asked for? | in the user's own prose (`skills/swarm-engineering.md:297`, `:304`, `:315`) — but `:315` is inside "For each plausible issue, determine:" (`:312`), so it is per-**defect**, not per-requirement, and it produces no record |

The run evidence says this bites. The R9 reviewer matched the change against **commits and mutants** — six per-commit verdicts for the six ladder commits (the seventh commit, `c415a38`, is the *remediation* of the R9 findings, not a seventh verdict). At least **three** times did the code not meet its requirement: the `longest_word` tie (the brief said alphabetically first; `src/effdemo/core.py:19` uses a strict `>` so input order wins), the picker writing an empty day file, and the catalog shrinking silently. Only the first was caught — by a **deliberately commissioned** honest-failure probe lane, not by the review role.

### 9.2 The design, the review of it, and the user's approval

| round | surface | who | what |
|---|---|---|---|
| D1 | `subagent` (fresh) | `protocol-checker` | **DESIGN-INVENTORY.md** — the carriers with `file:line` evidence, 13 gaps, the numbering sweep, the live tooling facts (the board's task has **no requirement field**: `CreateTeamTaskRequest = { subject, description, blockedBy?, writeScopes? }`; a one-shot subagent gets one free-text prompt plus an optional `outputSchema`) |
| D2 | native teammate | `auditor` | **DESIGN-REVIEW.md** — verdict **SOUND WITH CORRECTIONS**; 7 unsupported claims in my own draft (re-run by the reviewer), 9 missed carriers, 6 contradictions |
| D3 | the user | — | approved: **A-1…A-6 + U-1**; `not demonstrated` **blocks acceptance**; the proof uses the **eff-repo `longest_word` criterion** |

**The Blocking finding D2 caught in my design (C1):** the Reviewer's duty sat in skill §14 — but `swarm-worker-prompt.md:12` says *"Its §11–§14 are Coordinator-side methods; you do not need them"*, and a Reviewer **is** a worker. The rule would never have reached the role it was written for. The fix: a **new worker-facing section §16** plus one bullet in the worker prompt.

**The corrections to my own draft** (each re-run by D2, not argued): "7 per-commit verdicts" → **six**; "the ONE time the code did not meet its requirement" → **at least three**; "caught by accident" → a **deliberately commissioned** probe lane; "only the first mechanism is written into the workflow" → **neither** is; "nothing in the workflow does this today" → the intent check **is** in the user's prose; "M5 survived because the verdict was missing" → M5 was a weak **assertion** found by the Reviewer's own probe — a reporting vocabulary cannot detect that; "nowhere else" → the board, the session goal and the ledger are carriers too.

**One correction to D2 itself**, verified against the recovered original: D2 called `skills/swarm-engineering.md:544-548` "the plugin's own Review Completion Gate". It is the **user's** policy §9.3, relocated verbatim (`policy_hit_1.txt` §9.1–§9.5 ≡ skill §12.1–§12.5, line for line, headings renumbered) — so a sentence added there is a user-prose edit, it was treated as optional (U-2), and it was **not** applied.

### 9.3 What was implemented — the plugin's own words, the user's prose intact except one approved sentence

| id | where | change |
|---|---|---|
| A-1 | `skills/swarm-engineering.md:603` | new §14 rule: **number the criteria in every brief** — `C1..Cn`, each with criterion / observable check / source; the Developer never authors criteria, the Coordinator names them |
| A-2 | `skills/swarm-engineering.md:602` | the Tester's requirement-clause file **cites the criterion id** each test covers; a criterion with no test is a **reported coverage gap**, never a silent pass |
| A-3 | `skills/swarm-engineering.md:615-634` | **NEW `## 16. Requirement Matching`** (worker-facing, behind its own marker): the verdict line; four verdicts (`met` / `not met` / `not demonstrated` / `not in scope`); *a verdict without evidence is `not demonstrated`, never `met`*; the Tester's `passed`/`failed`/`blocked`/`not-tested` mapping; **two checks, not one** (discrimination + intent); *"if your assignment carried no numbered criteria, say so and report it as a gap; do not invent criteria"*; and the completion-gate extension — a `not demonstrated` criterion **blocks acceptance** until it is checked or the Coordinator records an explicit waiver with a reason in the ledger row |
| A-4 | `skills/swarm-engineering.md:6`, `:481` | the two plugin markers name the plugin's own sections accurately (§11–§16; §16 is worker-facing) |
| A-5 | `swarm-worker-prompt.md:12` | "**Its §16 binds the Reviewer:** one verdict per criterion with its evidence, and two checks per criterion." (plugin prose; the quoted user extracts are untouched) |
| A-6 | `swarm-prompt.md:262` | the Coordinator-practice pointer enumerates §14's rules in prose, so it gains one clause: "numbering the criteria in every brief" |
| U-1 | `skills/swarm-engineering.md:306` | **the one approved change to the user's own prose**: *"Identify each acceptance criterion by id (C1, C2, …) and report a verdict with evidence for each."* — inside the Reviewer's own §5.4 Step 1 |

**Integrity re-proof after the edit** (`git diff --no-index`, the recovered original → the shipped file):

- the **policy**: 31 insertions / 96 deletions — **unchanged** from the baseline.
- the **skill**: 159 insertions / 6 deletions (baseline 135/6). The hunk headers place every insertion: `@@ -307,0 +306,2 @@` is the approved U-1 insertion; `@@ -481 +481,154 @@` is the plugin's appended band (now §11–§16). **The only change inside the user's own text is the two approved lines of U-1.**
- the render unit test `D:\project\.swarm-lab\test-render-prompt.mjs`: **ALL CHECKS PASSED**, exit 0.
- the bundle was re-applied (`set_plugin include:swarm-workflow` false → the skill catalog **loses** `swarm-engineering` → true → it returns) — the live proof that the row drives the skill.

### 9.4 The proof: a fresh Reviewer, a hidden control, a verdict table

**P1** was run with a **fresh `subagent`** (session `5cc81498-7501-48d2-93ce-f96fa6965bc8`, cwd `D:\project\.swarm-lab\eff-repo`). A fresh agent is required: the prompt is assembled at session start, so only an agent that did not exist before the edit can prove the new rule is *served*.

**The brief** carried seven criteria in one uniform shape (criterion / observable check / source) and did **not** reveal which one the code violates. The control is **C1**, taken verbatim from the original effdemo assignment (`D:\project\.swarm-lab\eff\eff-r5-discrepancy.md:3`: *"longest_word returns the alphabetically first word among those sharing the maximum length"*) — the same requirement the R13 honest-failure lane had already caught being unmet.

**The deliverable was a section of the Reviewer's own report**, headed exactly `## Criterion verdicts`, one line per criterion: `C<n> · <verdict> · <evidence pointer>`.

**What came back** — seven verdicts, both §16 checks run for every one:

| | verdict | evidence |
|---|---|---|
| C1 | **not met** | `src/effdemo/core.py:11-21` keeps the first tied word in input order; probe `[FAIL] C1 … actual='ddd' expected='aaa'`; the repo's own three collectible test files still pass 17/17 on C1-violating code ⇒ **no repo test discriminates C1** |
| C2 | met | `core.py:17-21`; mutation `empty → None` fails `test_longest_word_of_empty_sequence_returns_empty_string` |
| C3 | met | `core.py:6-8`; mutation "reverse the order" fails `test_word_lengths_counts_each_word` |
| C4 | met | `strings.py:6-16`; mutations "case-insensitive" and "pre-seed a–z with 0" each fail a repo test |
| C5 | met | `text.py:4-13`; mutations "no lowercasing" and "raw first/last char" each fail repo tests |
| C6 | met | AST listing: 4 public functions, `UNCOVERED=0`; adding an untested public function makes the coverage probe exit 1 |
| C7 | **not met** | the suite aborts at collection — `ImportError: cannot import name 'vowel_ratio'`, exit code 2, no test runs; supplying `vowel_ratio` flips it to exit 0 / 27 passed ⇒ the missing function is the sole cause |

**The negative control fired.** C1 came back `not met`, with a reproduction and with the *second* finding attached: the existing tie test uses `["bb","ccc","dd","eee"]`, where input-order-first and alphabetically-first coincide, so it cannot detect a wrong tie-break. That is the same defect the R13 honest-failure lane had found three months of rounds earlier — caught this time by the **review role itself**, from a numbered criterion, with no hint that C1 was the control.

**What I verified myself, rather than trusting the report:**

1. the substrate is byte-identical to the baseline I took before dispatching: all **8 files** under `src/` and `tests/` match `eff-repo-baseline.sha256` (SHA-256), so the Reviewer changed nothing;
2. the control reproduces on my own run: `longest_word(['ddd','aaa']) → 'ddd'` (the criterion expects `'aaa'`) and `longest_word(['bbb','ccc','aaa']) → 'bbb'`;
3. C7 reproduces on my own run: `pytest -q` → `ImportError: cannot import name 'vowel_ratio' from 'effdemo'`, `1 error in 0.18s`, collection interrupted;
4. **the rule was really served** — the agent's own session log (91 zstd frames decoded, 756,727 chars) contains the new worker-prompt bullet *verbatim* ("Its §16 binds the Reviewer: one verdict per criterion with its evidence, and two checks per criterion."), the skill's `## 16. Requirement Matching` heading, "A verdict without evidence is …" ×3, "Two checks, not one", "do not invent criteria" ×3, and `## Criterion verdicts` ×7 — so the section was loaded and used, not merely present on disk.

**One question the Reviewer left open, answered from the evidence:** it asked whether the criterion text or the code was the defect for C1, because the code's docstring and its test both state the input-order rule. The **criterion is the requirement** — `eff-r5-discrepancy.md:3` quotes the original assignment verbatim ("…the alphabetically first word among those sharing the maximum length"), and `EFFICIENCY.md:64-66` records the same deviation. The code is the defect; its docstring and its tie test are wrong with it. The Reviewer's proposed fix (`if len(word) > len(best) or (len(word) == len(best) and word < best):`) is the same one `eff-r5-discrepancy.md:11` had already named.

**What the phase proves.** Before it, "matched or not matched" was prose with nowhere to land. After it, a criterion has an **id**, a **verdict**, a **known vocabulary**, **evidence as a precondition**, and a **gate**: `not demonstrated` blocks acceptance. The proof round did not merely confirm the rule was written — it produced the artefact the rule was written to produce, on a defect that had already survived a review role once.