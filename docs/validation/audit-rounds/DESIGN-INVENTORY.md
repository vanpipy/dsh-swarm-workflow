# DESIGN-INVENTORY — where requirements live in the swarm workflow, and how (if at all) they are matched

**Round:** D1 (design-phase investigation — evidence base only, no design, no proposed fixes)
**Author:** protocol-checker (native teammate) · **Board task:** `task-20`
**Written:** 2026-11-07 · **Status:** delivered to the Lead with this file

## 0. Scope, method, evidence key

**User question this round answers (verbatim):**
> "For the review role in swarm-engineering.md, the reviewer must take care of the goals or cases or stories matched or not — where are the goals or cases or stories, and how are they matched?"

**What this file is.** An inventory of every place a requirement can enter the swarm workflow, the exact wording at each place, what each role is actually required to do with a requirement, and the evidenced gaps between them. It is deliberately **not** a design: no fix, no new field, no new section is proposed anywhere below.

**Files read (read-only, quoted with `file:line` throughout):**

| key | path | size / lines |
|---|---|---|
| **P** | `D:\project\dsh-plugins\swarm-workflow\swarm-prompt.md` | 21 685 B / 262 lines |
| **S** | `D:\project\dsh-plugins\swarm-workflow\skills\swarm-engineering.md` | 28 230 B / 610 lines |
| **W** | `D:\project\dsh-plugins\swarm-workflow\swarm-worker-prompt.md` | 6 736 B / 58 lines |

**Method (all Verified):** full read of P, S, W; two regex sweeps over the three `.md` files (§5); live-host inspection through `cordis_inspect_list` / `cordis_inspect_query` with `platform: "host"` (§6); one live board entry read with `team_task_get` (§6.1); a repository probe for `AGENTS.md` (§6.5).

**Not authority:** `D:\project\.swarm-lab\policy_hit_1.txt` and `user_skill_paste.md` are the user's originals; the shipped files' differences from them are already recorded in `D:\project\.swarm-lab\rounds\FINDINGS.md` (reference only, not re-litigated here).

**Evidence tags used on every statement:**
- **Verified** — observed directly in the cited `file:line`, or returned by a live tool call quoted in §6.
- **Inferred** — a conclusion drawn from cited Verified evidence; the reasoning is stated.
- **Not run** — not executed in this round; the reason is given (§7).

---

## 1. CARRIER TABLE — one row per place a requirement can live

| # | carrier | where it enters (file:line) | who writes it | who must use it | where it can be lost or diluted (file:line) |
|---|---|---|---|---|---|
| **C1** | **The brief / assignment text** (the canonical place) | S:447; W:21–25 (same list quoted to the worker); P:137–156 (the §7 field list, incl. P:152); P:31 | Coordinator (P:9, S:472) | every worker, before execution (S:35, S:445, W:27) | S:449 "If essential information is missing, identify it specifically."; P:158 "Do not omit critical information merely because the worker may infer it."; W:55 "anything you need has to be in your brief"; the field is free text — no format, no enumeration, no identity is required of it (P:152) |
| **C2** | **The board task entry** (native teammate's durable assignment) | P:253; W:57 | the Lead via `team_task_create` | the native teammate, via `team_task_get` (W:57) | live `TeamTaskView` has **no** requirement/criteria field (§6.1) — everything is one free-text `description`; the revision CAS can refuse a write (W:57); `write_scopes` is advisory (W:57, S:595); the brief may be superseded by a chat note (W:57 "A note from the Coordinator reaches you at its next step boundary") |
| **C3** | **The session goal** (`create_goal`) | P:256 | the Coordinator — a delegated worker "neither advances nor closes your goal, and it should not create one" (P:256) | Coordinator only | live `CreateGoalRequest = { objective: string; maxGoalRounds?: number }` (§6.4) — one free-text string; P:256 "Complete it only when the acceptance criteria are met" references criteria the goal does not contain |
| **C4** | **Developer → Tester handoff** | S:411 | the Developer | the Tester (S:413, S:497) | "requirements addressed" is one list item inside one paragraph (S:411); nothing downstream has a slot for it (S:263–271); S:413 makes the Tester re-derive verification independently, so the handoff is optional input, not a contract |
| **C5** | **Developer → Reviewer handoff** | S:417 | the Developer | the Reviewer (S:419) | "objective and requirements" is one list item (S:417); S:309 "Do not rely exclusively on a change summary or implementation report" makes the summary the fallback; the Reviewer deliverable (S:392–401) has no field to receive it; in the composition without a Developer (S:441) this carrier does not exist at all |
| **C6** | **The repository's own binding rules** (e.g. a repo `AGENTS.md`) | **never named in P, S or W** (grep for `AGENTS.md` → 0 hits). Nearest wording: S:90, S:110, S:598 | the repository's owner (human) | all roles (S:90) | no rule makes a repository document a *requirement source*; conventions are framed as things to respect/preserve (S:90, S:110), never as criteria to be judged against. In this environment there is also no `AGENTS.md` at all (§6.5) |
| **C7** | **Existing regression tests / current coverage** | S:198, S:200; S:125; P:67 | whoever implemented the behavior | the Tester (S:198–200), the Developer (S:125) | S:200 "Determine which tests already establish required behavior and which gaps remain." presumes a known set of "required behavior" that the test file does not carry; S:600 assigns "the requirement-clause file" but defines no clause (§4, G6) |
| **C8** | **The requirement-clause test file** | S:600 | the Tester ("the Tester owns the requirement-clause file") | the Tester, and the Coordinator at acceptance (S:596) | the clause has no identity: the word "clause" occurs **exactly once** in the whole workflow definition (S:600) and is never defined, numbered, named, or assigned to anyone; nothing says the brief contains clauses to write files for |
| **C9** | **The final acceptance step** (Coordinator) | P:194–208 (§11), P:196, P:198–206, P:204; P:188; S:561–563 | the Coordinator | the Coordinator | the checklist carries **one** acceptance line for **all** criteria (P:204 "- Confirm original acceptance criteria."); "the original acceptance criteria" (P:188, P:204) is free text held in the brief (P:152); P:208 "Worker reports are evidence inputs, not substitutes for integration."; §13 completion criteria are aggregate (P:229) |
| **C10** | **The worker's own final report** | P:103–110 (the 7-item contract); S:451 (the 6-part distinction); W:29–42 | the worker | the Coordinator | **no item in either list mentions a requirement or acceptance criterion** (Verified by sweep, §5) — P:104 asks for "Relevant evidence and locations", i.e. where evidence lives, not which criterion it satisfies |
| **C11** | **The round ledger** (`todo_write`) | P:257; S:603 | the Coordinator | the Coordinator (and the human reading it) | S:603 records "the agents spawned, the files each touched, the verdict, and where the evidence came from" — **no criteria column**; it is the natural trace artifact and does not carry one |

---

## 2. EXACT WORDING per carrier (quoted, `file:line`)

**C1 — the brief.** P:31: "A good assignment has one clear primary objective, a bounded scope, a concrete expected output, explicit constraints, and observable acceptance criteria." · P:152: "- **Acceptance criteria:** Observable conditions for completion." · S:447: "A complete assignment should specify label, role, objective, context, known facts and evidence, open questions, scope, out-of-scope boundaries, constraints, expected output, acceptance criteria, dependencies, ownership, investigation exit criteria, and validation expectations." · W:22 (same list, quoted to the worker) · S:35: "Before starting, identify assigned role, objective, scope and out-of-scope boundaries, relevant context and established evidence, constraints, expected deliverables, acceptance criteria, dependencies, and validation expectations." · S:472: "The Coordinator must ensure each worker receives the instructions necessary for its assignment." · S:476: "- Provide the relevant scope and acceptance criteria."

**C2 — the board entry.** P:253: "- **The shared board carries the assignments.** `team_task_create` takes the subject and description (the brief), `blocked_by` (dependency order) and `write_scopes` (advisory paths a task may touch — overlapping scopes have to be avoided by design); `team_task_update` compares and sets on `expected_revision`; `team_task_get` and `team_task_list` read it back. Give a teammate the same self-contained brief a `subagent` gets; it inherits the Lead's history only with `context: \"fork\"`." · W:57: "**If you run as a native teammate, the board holds your assignment.** `team_task_get` reads your task and its current revision; `team_task_update` claims it (action `claim`) and completes it, and every write compares and sets on `expected_revision`, so a refused write means your revision was stale — read the task again. The board entry and your brief must agree; if they disagree, report it instead of guessing which one is right. The `write_scopes` on your task are advisory, not a lock, so write only in the files your assignment names. A note from the Coordinator reaches you at your next step boundary: it steers the assignment you already have, it is not a second assignment."

**C3 — the session goal.** P:256: "- **The session goal is your own persistence.** `create_goal` opens one (objective plus an optional `max_goal_rounds`) when the objective needs more than the current turn; … Complete it only when the acceptance criteria are met — a worker's completion is not the swarm's completion — and block it only after the same blocker has persisted for three consecutive rounds, stating the condition in `blocked_reason`. A delegated worker runs in its own scoped session; it neither advances nor closes your goal, and it should not create one."

**C4 — Developer → Tester.** S:411: "Provide implemented behavior, relevant changed files, requirements addressed, important interfaces and assumptions, tests already executed, known limitations, and expected behavior to verify." · S:413: "The Tester should independently derive and execute required verification." · S:497: "The Tester should receive requirements, relevant constraints, and expected behavior, not merely a list of implementation details."

**C5 — Developer → Reviewer.** S:417: "Provide objective and requirements, actual change summary, changed files and relevant interfaces, important design decisions, known risks or limitations, and validation already performed." · S:419: "The Reviewer must inspect the actual diff independently." · S:309: "Do not rely exclusively on a change summary or implementation report."

**C6 — repository binding rules.** S:90: "Respect existing project structure, interfaces, conventions, and user changes." · S:110: "Determine where the behavior is implemented, which components or interfaces are affected, which existing conventions must be preserved, and what assumptions need verification." · S:598: "- **An assignment names every surface the worker may touch.** Give it the files it may write, the commands it may run and the surfaces it must not touch (the plugin directory, the profile and its plugin rows, the network, other people's workspaces). A worker that meets a surface it was not given stops and reports; it does not explore, and it does not install anything into the host."

**C7 — existing tests / coverage.** P:67: "- Tester derives test conditions from requirements and observable behavior." · S:125: "Run relevant checks, such as targeted tests, relevant regression tests, type checks, linting and formatting, build checks, and reproducible runtime scenarios." · S:198: "Inspect relevant existing tests, test framework and fixtures, public interfaces, runtime behavior, test environment, and existing coverage." · S:200: "Determine which tests already establish required behavior and which gaps remain." · S:206: "Consider normal cases, boundary cases, invalid inputs, failure paths, state transitions, relevant regressions, and interface/integration behavior."

**C8 — the requirement-clause file.** S:600: "- **Name one test file per function in every brief.** The Developer owns the implementation smoke test; the Tester owns the requirement-clause file. Two workers never author tests for the same clause — that duplication is the defect the Tester is supposed to find in the implementation, not in another test file." · S:596: "- **Run the independent verification once, at acceptance.** One full suite run by you, after the workers are done, is evidence; three overlapping runs are cost without evidence. Let each worker's own report carry its own narrow checks."

**C9 — final acceptance.** P:196: "Coordinator owns integration and final acceptance." · P:198–206 (checklist): "- Confirm required assignments delivered their outputs. / - Inspect actual integrated changes. / - Resolve relevant conflicts and inconsistencies. / - Verify shared contracts. / - Assess test and review results. / - Confirm original acceptance criteria. / - Identify remaining risks or limitations. / - Ensure unrelated work was not overwritten or discarded." · P:204: "- Confirm original acceptance criteria." · P:188: "Your obligation stays here: you decide whether findings require action, and you accept the work only against the original acceptance criteria (§11 of this policy)." · P:208: "Worker reports are evidence inputs, not substitutes for integration. Do not accept a task solely because every worker reports completion." · S:563: "Verification is complete when required tests and checks have been executed, results assessed against acceptance criteria, failures resolved or explicitly reported, remaining coverage gaps and limitations understood, and Coordinator has enough evidence to make an acceptance decision." · P:229: "- Overall objective has been addressed."

**C10 — the worker's report contract.** P:103–110: "Require the worker to report: 1. Investigation question. 2. Relevant evidence and locations. 3. Findings. 4. Assumptions and confidence. 5. Material unresolved questions. 6. Recommended decision or next action. 7. Whether exit criteria are satisfied." · S:451: "Every final report must distinguish work completed, evidence obtained, validation performed, findings or failures, remaining uncertainty, and uncompleted work." · W:42: "Report against that contract… Keep it short — the contract is the shape of the report, not its length."

**C11 — the round ledger.** P:257: "- **The round ledger is yours.** `todo_write` shows the human which lanes are running, what is still open, and what is blocked; write one row per round and keep it in order." · S:603: "- **Keep one ledger row per round** — the agents spawned, the files each touched, the verdict, and where the evidence came from — written once, in order."

---

## 3. ROLE-BY-ROLE USE TABLE

Three questions per role: **(a)** must the role *read* the requirement? **(b)** must it produce a *per-requirement verdict*? **(c)** must it *name the requirement source*?

| Role | (a) read the requirement | (b) per-requirement verdict | (c) name the requirement source | Evidence (`file:line`) |
|---|---|---|---|---|
| **Developer** (S §3) | **Yes.** "Establish required behavior, relevant existing behavior, interfaces and dependencies, constraints, and acceptance criteria." | **No.** The deliverable is aggregate: "1. Objective addressed." — one item for the whole objective, none per criterion. | **No.** The only citation instruction is "Provide concrete file or symbol references where useful." — code locations, not criterion identities. | S:105; S:153–162 (list), S:156; S:164 |
| **Tester** (S §4) | **Yes.** "Identify expected behavior, relevant acceptance criteria, inputs and outputs, preconditions and postconditions, error behavior, relevant edge cases, and regression-sensitive behavior." Plus the exit condition "Relevant requirements are sufficiently understood." and the guard "Do not derive all tests solely from the implementation." | **Partial.** Per-*condition* verdicts are required — "Clearly distinguish passed, failed, blocked, and not-tested conditions." — and item 1 is "Requirements or behaviors tested." (plural, unnamed). The key is the test's own name, not a requirement identity: a verdict per criterion is not required because a criterion has no identity. | **No.** The 8-item deliverable (S:263–271) has no field for the origin of a requirement; S:190/S:231 require *reading* criteria, never *citing* them. | S:190; S:192; S:194; S:231; S:263–271 (list), S:264; S:273 |
| **Reviewer** (S §5) | **Yes.** "Establish intended behavior, relevant requirements, changed files and components, important interfaces, acceptance criteria, and explicit constraints." | **No.** The Reviewer deliverable (7 items: scope, assessment, findings, evidence, impact, limits, completion) contains **no** requirement item. The per-requirement-sounding line "- Does it violate a requirement or contract?" sits inside Step 3, whose scope is "For each plausible issue, determine:" — i.e. a question per *candidate defect*, not a verdict per *requirement*. | **No.** "- Its relationship to requirements or contracts is clear." is a quality property of the change, not a citation; "If no material findings are identified, state that clearly and describe the scope actually reviewed." asks for scope, not for criteria. Nothing tells the Reviewer where the requirement text is (see G1). | S:297; S:304; S:311–317 (S:312, S:315); S:350; S:392–401; S:403 |
| **Coordinator** (P phases + acceptance) | **Yes.** "- **Understand:** Coordinator establishes objective, scope, constraints, and acceptance criteria." · "you accept the work only against the original acceptance criteria" · "- Confirm original acceptance criteria." · "results assessed against acceptance criteria" | **No.** The acceptance checklist has exactly one criteria line for *all* criteria (P:204); the phase list's acceptance step is aggregate ("determines whether the original objective is satisfied", P:127); §13 completion criteria are aggregate (P:229). | **Indirect only.** "the original acceptance criteria" (P:188, P:204) points back at the brief, but the brief's criteria carry no identifier, and the ledger row (S:603) records agents, files, verdict and evidence — not criteria. | P:122; P:127; P:188; P:196; P:198–206; P:204; P:208; P:228–237 (P:229); S:563; S:603 |

**Summary (Inferred from the table above):** every role is told to *read* a requirement somewhere; **no role** is told to produce a verdict *per requirement*; **no role** is told to cite the requirement's source. The Reviewer — whose role text contains the phrase the user is asking about — is exactly the role with the weakest requirement binding: it must read "relevant requirements" (S:304) but has no requirement line in its deliverable (S:392–401) and no stated source for those requirements (S:315, S:350).

---

## 4. THE GAPS (each evidenced with `file:line`)

**Class A — real absence: the connection does not exist in the workflow definition.**

- **G1 — a role told to check "requirement violations" with no way to know the requirement.** S:297 "Review for requirement violations, incorrect behavior, logic errors, …" and S:315 "- Does it violate a requirement or contract?" are the Reviewer's two requirement hooks. The only places a requirement text is ever handed to a Reviewer are the Developer's handoff (S:417 "objective and requirements") and — implicitly — the brief. In the composition "**Tester and/or Reviewer Without Developer:** Appropriate when the assignment concerns an existing implementation, test coverage, or independent assessment" (S:441) **there is no Developer handoff at all**, so no rule anywhere tells such a Reviewer to open the brief's acceptance criteria. *Consequence (Inferred): the Reviewer's requirement check is unfalsifiable as written.*
- **G2 — a source with no consumer.** S:411 "requirements addressed" and S:417 "objective and requirements" exist as handoff content, but no downstream artifact has a slot for them: the Tester deliverable (S:263–271) and the Reviewer deliverable (S:392–401) list no requirement field, and the Coordinator's acceptance checklist (P:199–206) has one aggregate line (P:204). *Consequence (Inferred): the requirement content reaches the roles and dies there — it is never carried into an artifact the Coordinator can check.*
- **G3 — a mention with no source: "the original acceptance criteria".** P:188 and P:204 refer to "the original acceptance criteria"; the only definition of that text is the assignment field "**Acceptance criteria:** Observable conditions for completion." (P:152), duplicated at S:447 and W:22. Nothing requires the Coordinator to re-read it, to retain it, or to compare it criterion-by-criterion against anything. For a native teammate the brief's durable copy is the board `description` (P:253, W:57, §6.1); no rule in P or S tells the Coordinator to re-read the board entry at acceptance.
- **G4 — a deliverable list with no requirement trace.** The 7-item report contract (P:103–110) has no requirement item; S:451 (the 6-part report distinction) has none; the Developer deliverable has only "1. Objective addressed." (S:156); the Tester deliverable has only "1. Requirements or behaviors tested." (S:264); the Reviewer deliverable (S:392–401) has none at all. *Consequence (Inferred): a Reviewer's verdict cannot be traced back to the criteria it claims to have judged, and a Coordinator accepting at P:204 has no per-criterion artifact to check against.*
- **G5 — the "clause" concept exists with no identity.** S:600: "the Tester owns the requirement-clause file … Two workers never author tests for the same clause — that duplication is the defect the Tester is supposed to find in the implementation, not in another test file." The word "clause" occurs exactly once in the entire workflow definition (Verified, §5); no clause is defined, numbered, named, written by anyone, or required to exist in the brief. *This is the sharpest instance of the user's "cases or stories": the workflow assumes clauses, and never says where they come from.*
- **G6 — repository binding rules are not connected as a requirement source.** S:90, S:110 and S:598 treat conventions and surfaces as things to respect, not as criteria to be judged against; grep for `AGENTS.md` / `README` / `CONTRIBUTING` across P, S, W returns 0 hits (Verified, §5). *Consequence (Inferred): in a repository that does define its rules in `AGENTS.md`, the swarm workflow has no instruction to read it, and no instruction to treat it as a requirement source.*
- **G7 — the session goal is not a requirement carrier.** P:256 "Complete it only when the acceptance criteria are met", while the live goal object is one free-text string: `CreateGoalRequest = { objective: string; maxGoalRounds?: number }` (§6.4). *Consequence (Inferred): the goal references criteria it does not contain, so it cannot serve as the requirement source even for the Coordinator.*
- **G8 — the round ledger does not carry criteria.** S:603 (agents, files, verdict, evidence) and P:257 — the artifact that would normally be the round's trace row has no criteria column.

**Class B — thin wording: the carrier exists and is load-bearing, but its content model is unspecified.** These are *not* absences; they are the places where the plumbing is present and only the form is missing.

- **G9 — the two requirement handoff items are one list item each.** S:411 "requirements addressed"; S:417 "objective and requirements". No required format, no enumeration, no reference convention, no count.
- **G10 — the "read the requirement" instructions are single sentences.** S:105, S:190, S:304, P:122 — each says to establish/identify the criteria, none says to keep, quote, enumerate, or key them.
- **G11 — the requirement-clause file has no producer.** S:600 assigns ownership of "the requirement-clause file" to the Tester but says nothing about who writes the clause list the file is named after.
- **G12 — regression coverage is used as a proxy for requirements.** S:200 "Determine which tests already establish required behavior and which gaps remain" uses "required behavior" as if defined; the only definition in the workflow is the brief's acceptance criteria (P:152) and S:105.
- **G13 — two requirement carriers that may disagree have no precedence rule.** W:57: "The board entry and your brief must agree; if they disagree, report it instead of guessing which one is right." — the only place two requirement carriers are compared, and it compares them as free text, leaving the resolution to the worker.

---

## 5. THE NUMBERING QUESTION — does anything give acceptance criteria a shared identifier?

**Answer: No. Verified by search, not by assumption.** Two regex sweeps were run over the three `.md` files.

**Sweep 1 — `clause|traceab|trace|REQ-|AC-|TC-|R#|numbered|identifier|stable name|per-requirement|each requirement` → exactly 2 matching lines in the whole definition:**

| file:line | line |
|---|---|
| P:142 | "- **Label:** A short, meaningful task identifier." |
| S:600 | "- **Name one test file per function in every brief.** The Developer owns the implementation smoke test; the Tester owns the requirement-clause file. Two workers never author tests for the same clause — that duplication is the defect the Tester is supposed to find in the implementation, not in another test file." |

P:142 identifies a **task** (the assignment's `Label` field), not a criterion. S:600 is the only occurrence of the word "clause" anywhere. There is **no** `REQ-`/`AC-`/`TC-`/`R#` pattern, **no** numbering of criteria, **no** "trace"/"traceability" wording, and **no** instruction to name a requirement in any report.

**Sweep 2 — `goal|story|stories|use case|cases|acceptance criteri` → 24 matching lines.** From those:
- **"story" / "stories" / "use case" → 0 matches.** The workflow definition has no user-story or use-case concept at all.
- **"cases" → 2 matches only:** P:42 ("| Tester | Establish and execute behavioral verification | Test cases, results, coverage gaps, failure evidence |") and S:206 ("Consider normal cases, boundary cases, invalid inputs, failure paths, state transitions, relevant regressions, and interface/integration behavior."). In both, "cases" is an **output** of testing (the Tester's typical output, per the role table), never an input that a requirement lives in.
- **"goal" → only the global principle's name** (P:13, P:250, S:22, S:29, W:53) and S:464/S:466 ("The goal is not maximum investigation, maximum code changes, maximum test count, or maximum review comments."). There is no artefact called a goal, case or story that requirements are matched against.
- **"acceptance criteri…" → 13 matching lines**, and every one of them is either (i) the assignment field list (S:447, W:22, P:152), (ii) a "read/establish it" instruction (S:35, S:105, S:190, S:304, S:476, P:31, P:122), or (iii) a completion gate (P:188, P:204, P:256, S:563). **None of them is a citation instruction and none assigns an identifier.**

**Verdict (5):** there is **no shared identifier** that the brief, the Developer's report (S:153–162), the Tester's test file (S:600) and a Reviewer's verdict table (S:392–401) could all cite. The only thing that plays that role today is the **verbatim text** of the brief's acceptance-criteria field (P:152) — free text, different in every brief, and never quoted back by any role. **Inferred consequence:** "matched or not matched" is currently a judgement each role makes in prose, with no common key, and therefore no artifact in which a match (or a miss) can be recorded or checked.

---

## 6. THE TOOLING FACTS (read from the live host, `cordis_inspect`, `platform: "host"`)

### 6.1 What a native teammate's assignment actually is — the board entry

**Live, this round:** `team_task_get task-20` returned
`{ id: "task-20", revision: 1, status: "pending", ownerName: <absent>, blockedBy: [], writeScopes: [".swarm-lab/rounds/DESIGN-INVENTORY.md"], ready: true }`;
after `team_task_update action=claim expected_revision=1` → `revision 2`, `status "in_progress"`, `ownerName "protocol-checker"`.
**Verified.** The whole brief lives in the entry's free-text `description`; the title is `subject`.

**Live service contract — Service `agentTeams`:**
- `createTask(caller, request: CreateTeamTaskRequest)` — "Create one unowned pending task in the Team Lead log."
- `CreateTeamTaskRequest = { subject: string; description: string; blockedBy?: readonly TeamTaskId[]; writeScopes?: readonly string[] }`
- `TeamTaskView = { id: SessionId; revision: number; subject: string; description: string; status: 'pending'|'in_progress'|'completed'|'deleted'; blockedBy: TeamTaskId[]; writeScopes: string[]; ownerName?: string; ready: boolean; writeScopeWarnings: string[] }`
- `TeamTaskAction = 'claim'|'release'|'edit'|'set_dependencies'|'complete'|'reopen'|'reassign'|'delete'`; `updateTask` = "Compare-and-set one authorized task transition" on `expectedRevision`.
- `spawnTeammate(caller, request: SpawnTeammateRequest)` with `SpawnTeammateRequest = { name; description; prompt: ContentBlock[]; context: 'fresh'|'fork'; provider; signal }`.

**Consequence (Verified + Inferred):** the board object has **no field for requirements, criteria, goals or identifiers** — its only structured members are the dependency list and the advisory path list. The board therefore carries **state** (who owns what, in which order, with which scope), not requirements-as-structured-data; requirements ride inside the free-text `description`.

**Live tool schemas:**
- `team_task_create` — `subject`: "Concise task title."; `description`: "Complete task details and acceptance criteria." → **the acceptance criteria of a task live in one free-text string, and nothing says they must be enumerated, labelled, or numbered.**
- `team_task_update` — `{ task_id, expected_revision, action, subject?, description?, blocked_by?, write_scopes?, owner? }` → an `edit` can rewrite the description, but still only as free text.
- `spawn_teammate` — `prompt`: "Complete initial task for the teammate."; `context`: `'fresh'|'fork'`.
- A teammate therefore receives **both** a spawn prompt and the durable board entry; W:57 makes the board the authoritative carrier ("the board holds your assignment"), and W:57 also requires the two to agree.

### 6.2 What a one-shot subagent receives instead

**Live service contract — Service `subagents`:**
- `SubagentStartRequest = { cwd?: string; agentPreset?: string; label?: string; prompt: ContentBlock[]; parent: Agent; signal: AbortSignal; agentOptions?: AgentOptions; outputSchema?: ObjectJsonSchema; maxDepth?: number }`
- `SubagentResult = { output: readonly ContentBlock[]; structured?: unknown; diagnostic?: string; stopReason: SubagentStopReason }`
- `SubagentProvider.inheritsParentContext: boolean`; `prepareContinuable?(request: ContinuableCreateRequest)` exists only for the *continuable* (teammate) provider.

**Live tool schema — `subagent`:** `prompt`: "The complete, self-contained task for the subagent. It does not share this conversation's context, so include everything it needs."

**Consequence (Verified):** a one-shot subagent gets **one free-text prompt** (plus a display `label` and an optional `outputSchema`). It has **no board entry, no task id, no requirement field and no durable assignment record**; P:252 "a `subagent` cannot be resumed", P:254 "A `subagent` is one-shot and independent".
**Contrast (Verified):** `subagent_fork` inherits the parent's transcript — S:599 "A forked worker inherits the whole parent transcript — including the original user request"; P:249 "A fork inherits everything … the live task, the todo list, the history". So for a fork, the **original user request** is a requirement carrier of last resort; for a fresh teammate, the **board entry** is; for a one-shot subagent, **the prompt text** is.

### 6.3 What the report contract asks for

**P:103–110** (the contract every worker is held to): "1. Investigation question. 2. Relevant evidence and locations. 3. Findings. 4. Assumptions and confidence. 5. Material unresolved questions. 6. Recommended decision or next action. 7. Whether exit criteria are satisfied." — reproduced to workers at W:31–40, with W:42 "Report against that contract…".
**S:451:** "Every final report must distinguish work completed, evidence obtained, validation performed, findings or failures, remaining uncertainty, and uncompleted work."
**Consequence (Verified):** neither list contains an item for **requirement provenance**, a **per-criterion verdict**, or the **identity of the criteria** being judged. "Relevant evidence and locations" (P:104) asks where evidence *lives*, not which criterion it satisfies.

### 6.4 The session goal

**Live service contract — Service `goals`:** `create(agent, request: CreateGoalRequest)` with `CreateGoalRequest = { objective: string; maxGoalRounds?: number }`; `GoalSnapshot = { id; revision; objective: string; phase: 'active'|'paused'|'blocked'|'complete'; blockedReason?: { code: string; message: string }; maxGoalRounds }`.
**Consequence (Verified):** the goal carries **one free-text objective** — no criteria list, no identifiers.

### 6.5 Prompt assembly and the repository probe

**Live service contract — Service `systemPrompt`:** `assemble(context: AssembleContext { scope?, signal? })` → `PromptAssembly { sections: AssembledSection[]; contexts; tools: ToolSchema[]; variables }`; `section(section: PromptSection { name; order; text: string | ((context: AssembleContext) => string); interpolate?; complete? })`. P:258: "- **You can read the prompt an agent actually receives.** `ctx.systemPrompt.assemble({ agent, scope: agent })` returns the assembled text for that agent, and `ctx.agents.roots()` lists the top-level agents (a delegated worker is owned, so it is not a root). Use that instead of asking a worker what it was given — it is exact, and it costs no agent."

**Bundle mechanics (Verified by reading `D:\project\dsh-plugins\swarm-workflow\index.js`, 505 lines):** the two prompt files are read through a cache keyed by path and invalidated on `${info.mtimeMs}:${info.size}` (index.js:120, :138), and the registered section's `text` callback re-reads them per assembly (index.js:449–463) — the doc comment at index.js:128–131 states "The file is re-read whenever its mtime or size changed, so an edit to the bundle is live in the next prompt without a bundle re-apply." **Consequence:** the P/S/W text quoted in this report is the operative prompt text, not a stale copy.

**Repository probe (Verified):** no `AGENTS.md` exists anywhere in the working tree — searched `D:\project`, `D:\project\dsh-plugins` (recursive), `D:\project\dsh-plugins\swarm-workflow`, and `D:\project\.swarm-lab` (top level): **0 hits**. The "repository's own binding rules" carrier therefore cannot be exercised in this environment at all; it is an explicit absence here *and* an unconnected carrier in the definition (G6).

---

## 7. NOT RUN (with reasons)

| item | why not run |
|---|---|
| Byte-level diff between the prompt actually delivered to a worker and the on-disk file | the delivered text exists only in model context; capturing it would require writing a scratch file outside my owned file (scope rule) |
| Line-by-line re-derivation of the shipped-vs-original differences | `FINDINGS.md` already records them and the brief makes it a reference, not authority; the shipped files are the subject of this round |
| Splitting a real brief's acceptance criteria into clauses and matching them | that is the design this round must not produce |
| Reading `policy_hit_1.txt` / `user_skill_paste.md` | by instruction — the user's originals, not authority |
| Calling `ctx.systemPrompt.assemble({ agent, scope: agent })` to dump a live assembled prompt | requires host-level execution outside a read-only Inspect query; P:258 documents it as a Coordinator-side capability |
| Any write outside `D:\project\.swarm-lab\rounds\DESIGN-INVENTORY.md`, any git write, any network, any plugin/bundle/profile change | out of scope / hard boundaries of this assignment |

---

## 8. Verdict for the Lead (one paragraph)

The "goals, cases or stories" the Reviewer is supposed to match **do not exist as artefacts anywhere in the workflow definition** (§5: 0 hits for story/use-case, "cases" only as test-case outputs, "goal" only as the global principle's name). Requirements exist only as **free text in a small number of carriers**: the brief's `acceptance criteria` field (P:152 / S:447 / W:22), the board task `description` (P:253 / W:57 / §6.1), the session goal's single `objective` string (P:256 / §6.4), and two handoff phrases — "requirements addressed" (S:411) and "objective and requirements" (S:417). Every role is told to *read* a requirement (S:105, S:190, S:304, P:122); **no role** is told to produce a verdict per requirement, and **no role** is told to name the requirement's source — most sharply the Reviewer, whose §5 deliverable (S:392–401) has no requirement item and whose only requirement hooks (S:297, S:315) tell it to judge "requirements" without saying where they are, while the "requirement-clause file" of S:600 presumes a clause identity that is never defined, numbered, or produced. There is therefore **no shared identifier** (§5) and **no artifact** in which a match or a miss could be recorded: the acceptance step (P:199–206, P:204) reduces the whole criterion set to one line, and the worker's report contract (P:103–110) and the round ledger (S:603) carry no criteria either. The gaps are catalogued in §4 (G1–G13, split into real absences and thin wording); the design is deliberately not attempted here.

---

## 9. Provenance (board protocol)

**Board task:** `task-20` — "D1 — inventory the requirement-carrying places in the swarm workflow definition"
**Owner:** protocol-checker · **Write scope:** `.swarm-lab/rounds/DESIGN-INVENTORY.md` (the only file written)

| step | call | result |
|---|---|---|
| read | `team_task_get task-20` | revision **1**, status `pending`, owner absent, writeScopes `[".swarm-lab/rounds/DESIGN-INVENTORY.md"]` |
| claim | `team_task_update task-20 action=claim expected_revision=1` | revision **2**, status `in_progress`, ownerName `protocol-checker` |
| complete | `team_task_update task-20 action=complete expected_revision=2` | revision **3**, status `completed`, ownerName `protocol-checker` |

No write was refused. **Verified.** Deliverable written and read back: `D:\project\.swarm-lab\rounds\DESIGN-INVENTORY.md`, 38 285 B, 210 lines (LastWriteTime 2026-11-07 09:59:09), spot-checked for all six sections. Nothing outside this file was written; `D:\project\dsh-plugins` was read only.
