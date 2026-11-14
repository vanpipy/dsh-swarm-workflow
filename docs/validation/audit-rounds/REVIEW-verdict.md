# Independent Review — `@local/swarm-workflow` bundle

| | |
|---|---|
| **Task** | task-3 — "Independent review of the shipped plugin bundle (Reviewer)" |
| **Reviewer** | `auditor` (Reviewer role), teammate of `lead` |
| **Date** | 2026-11-06 |
| **Bundle under review** | `D:\project\dsh-plugins\swarm-workflow` (read-only) |
| **Recovered originals** | `D:\project\.swarm-lab\user_skill_paste.md`, `D:\project\.swarm-lab\policy_hit_1.txt` |
| **Method** | Independent re-run of both integrity diffs, line-level source reading, live runtime service contracts via `cordis_inspect_query`, runtime evidence from this reviewer session |
| **Tooling note** | `git` is not on PATH; all diffs used `"C:\Program Files\Git\cmd\git.exe" diff --no-index`. `Get-Content` used `-Encoding UTF8`. |

---

## 1. Verdict (one line)

**CONDITIONAL PASS — the bundle is functional and the user's prose is preserved by verbatim relocation, but one shipped marker comment is factually false (`swarm-prompt.md:235` claims the policy above it is "unchanged" while 29 insertions / 102 deletions sit above it) and the user's model-configuration paragraph was silently deleted; both must be fixed before the bundle can be called "the user's policy, unchanged".**

---

## 2. Registration check (Scope item 1) — **PASS**

Source: `D:\project\dsh-plugins\swarm-workflow\index.js`

| Check | Result | Evidence |
|---|---|---|
| Exactly ONE `ctx.systemPrompt.section(...)` | PASS | `index.js:98` — the only occurrence in the bundle (`grep` over all files: 1 hit). Fields: `name: 'swarm-workflow:swarm'` (`index.js:99`), `order: SECTION_ORDER` = `8000` (`index.js:100`, `index.js:22`), `interpolate: false` (`index.js:101`), `text: (context) => (isCoordinator(ctx, context) ? coordinatorPrompt : workerPrompt)` (`index.js:102`). |
| Exactly ONE `ctx.skills.register(...)` | PASS | `index.js:105` — the only occurrence in the bundle. |
| Registration carries the required `source` field | PASS | `index.js:109` — `source: SKILL_SOURCE`, with `const SKILL_SOURCE = '@local/swarm-workflow'` at `index.js:25`. Exactly one `source:` key exists in the bundle (grep: 1 hit). |
| `ctx.skills.register` contract satisfied | PASS | Live host contract (`cordis_inspect_query`, service `skills`): `register(skill: SkillRegistration)`; `SkillRegistration = Omit<SkillDefinition,'invocation'\|'provider'> & {invocation?,provider?}`; `SkillDefinition extends SkillSummary {content, metadata?}`; `SkillSummary` **requires** `name`, `description`, `invocation`, `source`, `provider`. `source: SkillSource` is therefore a **required** field of the registration and is supplied. `SkillSource` = `'project-dsh'\|'project-agents'\|'runtime'\|'user-dsh'\|'user-agents'\|'custom'\|'bundled'\|(string & {})` → the custom string `'@local/swarm-workflow'` is valid. `invocation`/`provider` are omitted and the host documents that omitted fields "receive defaults". Supplied fields `name`/`description`/`content`/`whenToUse` (`index.js:106-110`) all exist in the contract. |
| No duplicate/overlapping prompt layer | PASS | `systemPrompt.section` documents "duplicates within one layer and non-finite orders throw"; one section with a finite order `8000` is registered in the host (global) layer → no duplicate-name collision. |
| No second skill/prompt registration elsewhere | PASS | `client.js` registers a UI slot only (`conversation.composer.dock`) — no prompt section, no skill. The only other `ctx.*` use in the bundle is `ctx.agents.roots()` at `index.js:86`. |

**Runtime corroboration (empirical, this session):** this reviewer runs as a delegated teammate and its own system prompt contains the **worker** prompt text verbatim (`swarm-worker-prompt.md` §"Where your rules live" / "The assignment contract" / "What you report back", including the `<!-- Added by the @local/swarm-workflow plugin: host facts for this runtime. -->` marker at `swarm-worker-prompt.md:44`) and **not** the Coordinator policy → the plugin is loaded and `isCoordinator()` routed a delegated agent to the worker prompt. The `skill` tool resolved and loaded `swarm-engineering` from the session catalog → the runtime skill registration (name + `source`) is accepted by the host.

---

## 3. Integrity diffs — re-run by me, counts below are mine (Scope item 3)

`git diff --no-index` exit code `1` means "differences found" (not an error).

### Diff 1 — user's skill → shipped skill

```
> & "C:\Program Files\Git\cmd\git.exe" diff --no-index --numstat -- "D:\project\.swarm-lab\user_skill_paste.md" "D:\project\dsh-plugins\swarm-workflow\skills\swarm-engineering.md"
128	6	"D:\\project\\.swarm-lab\\user_skill_paste.md" => "D:\\project\\dsh-plugins\\swarm-workflow\\skills\\swarm-engineering.md"
exit=1
> ... --shortstat ...
 1 file changed, 128 insertions(+), 6 deletions(-)
```

**Diff 1 count: 128 insertions(+), 6 deletions(-).**

The 6 deletions are: (a) the 4 lines of user chat preamble above the frontmatter (`user_skill_paste.md:1-4` — "The swarm worker prompts I saw in plugin, did not update, why?", blank, "Here is the swarm enginnering", blank); (b) `user_skill_paste.md:24` `- Global execution policies in `prompt-overlay.md`.`; (c) the file's last line re-emitted with a trailing newline (`"Workers must follow the actual runtime capabilities and tool restrictions of the active Jcode version."`).

The 128 insertions are the plugin marker at `skills/swarm-engineering.md:479`, §11 (`:481-522`), §12 (`:523-564`), §13 (`:565-588`), the marker at `:589`, and §14 (`:591-603`).

### Diff 2 — user's policy → shipped policy

```
> & "C:\Program Files\Git\cmd\git.exe" diff --no-index --numstat -- "D:\project\.swarm-lab\policy_hit_1.txt" "D:\project\dsh-plugins\swarm-workflow\swarm-prompt.md"
29	102	"D:\\project\\.swarm-lab\\policy_hit_1.txt" => "D:\\project\\dsh-plugins\\swarm-workflow\\swarm-prompt.md"
exit=1
> ... --shortstat ...
 1 file changed, 29 insertions(+), 102 deletions(-)
```

**Diff 2 count: 29 insertions(+), 102 deletions(-).**

**The brief's framing ("an appended practice section") is not what the diff shows.** All 29 insertions and all 102 deletions are *not* confined to an appended tail: the bulk of them sit **above** the plugin marker at `swarm-prompt.md:235`. Breakdown of the 102 deletions:

| Original location | Lines | Fate in shipped file |
|---|---|---|
| `policy_hit_1.txt:13` | 1 | Rewritten (see F4) |
| `policy_hit_1.txt` §6.1–§6.5 block | 36 | **Relocated** to skill §11.1–§11.5, one pointer line left at `swarm-prompt.md:135` |
| `policy_hit_1.txt` §9.1–§9.5 block | 35–38 | **Relocated** to skill §12.1–§12.5, pointer at `swarm-prompt.md:186` (+ `:188`) |
| `policy_hit_1.txt` §10 block | 24 | **Relocated** to skill §13, pointer at `swarm-prompt.md:192` |
| `policy_hit_1.txt:300` (§12 heading) | 1 | Rewritten (see F3) |
| `policy_hit_1.txt:302` (§12 body) | 1 | Rewritten (see F3) |
| `policy_hit_1.txt:310-313` | 4 | **Deleted outright**, no counterpart (see F3) |
| `policy_hit_1.txt:327` (last line) | 1 | Re-emitted with a trailing newline |

The 29 insertions: the 5 rewritten lines above + the trailing newline + the plugin marker + `## Host facts — this runtime` (`swarm-prompt.md:237-250`) + `## Coordinator practice — this runtime` (`swarm-prompt.md:252-254`).

### Relocation fidelity — the user's prose was MOVED, not rewritten

Verified by extracting the corresponding line blocks from both files and comparing them (`Compare-Object`, PowerShell):

| Original block | Shipped counterpart | Result |
|---|---|---|
| policy §6.1–§6.5 (38 lines) | skill §11.1–§11.5 (38 lines) | **IDENTICAL** except the five heading numbers (`### 6.x` → `### 11.x`) |
| policy §9.1–§9.5 (38 lines) | skill §12.1–§12.5 (38 lines) | **IDENTICAL** except the heading numbers (`### 9.x` → `### 12.x`) |
| policy §10 (24 lines) | skill §13 (24 lines) | **IDENTICAL** except the heading number (`## 10.` → `## 13.`) |

So the bulk of the 102/29 churn is a *relocation into the skill file*, not a loss of the user's wording. The exceptions are F3, F4 and F5 below.

---

## 4. Findings

### F1 — **BLOCKING** — The shipped marker comment makes a false integrity claim

`D:\project\dsh-plugins\swarm-workflow\swarm-prompt.md:235`

```
<!-- Added by the @local/swarm-workflow plugin: host facts for this runtime. Everything above this marker is the shipped policy, unchanged. -->
```

This is false. Everything **above** that marker contains the 5 rewritten lines (F3, F4) and the 102 deleted lines (F3, plus the relocation). The marker asserts exactly the property this review was asked to check, and it fails it.

Severity rationale: the marker is the artifact's own provenance statement and is what a future auditor (or the user) would rely on to decide whether the shipped prompt still is the user's policy. It is the difference between "the plugin appended host facts" and "the plugin edited the user's policy and says it did not". It must be corrected (either the comment, or the text above it).

Exact command output supporting the finding: the Diff 2 numstat line above — `29	102` — together with the fact that the marker sits at line 235 while the rewritten §1 line is at `swarm-prompt.md:13` and the rewritten §12 at `swarm-prompt.md:210-212`, i.e. above the marker.

### F2 — **MATERIAL** — The user's model-configuration guidance was silently deleted

Original `D:\project\.swarm-lab\policy_hit_1.txt:310-313` (user's own prose) — **absent** from the shipped policy:

```
310: When supported, consider documented options for main agent model, Swarm worker model, inherited model selection, Swarm reasoning or effort configuration, and available model listing.
311:
312: Examples previously encountered include `model`, `agents.swarm_model`, `model: "inherit"`, `swarm list_models`, and `agents.swarm_effort`. These are references to verify, not a guarantee that every active version supports them.
313:
```

Shipped `swarm-prompt.md:210-220` keeps the surrounding checklist (`- Inspect the active configuration format.` … `- Avoid assuming options from another version are supported.`) but the two paragraphs above are gone.

Partial compensation: the *names* survive once, in the host-facts bullet at `swarm-prompt.md:241` — "there is no `swarm` command here: names such as `agents.swarm_model`, `model: "inherit"`, `swarm list_models`, and `agents.swarm_effort` come from other runtimes — references to verify, never options to assume." So the Coordinator is not left with dangling names. What is lost is the *instruction* to consider documented options for main-agent model, worker model, inherited model selection and reasoning/effort configuration at all, plus the "not a guarantee that every active version supports them" hedge as applied to configuration. The surviving bullet also carries the stronger claim "never options to assume", which is a stricter reading than the user's "references to verify, not a guarantee".

Severity rationale: Material, not Blocking — the section still instructs the Coordinator to verify every configuration key against the installed version (`swarm-prompt.md:214-218`), so the *safety* behaviour the user wanted survives; but a whole instruction line of the user's policy is gone without a marker or a note.

### F3 — **MATERIAL** — The user's §12 was rewritten, not merely re-scoped

| | Original (`policy_hit_1.txt`) | Shipped (`swarm-prompt.md`) |
|---|---|---|
| Heading | `## 12. Jcode Runtime and Model Configuration` (`:300`) | `## 12. Runtime and Model Configuration` (`:210`) |
| Body | `Runtime configuration must follow capabilities of the active Jcode version.` (`:302`) | `Runtime configuration must follow the capabilities of the active runtime version. The tools and services this runtime actually offers are listed under "Host facts — this runtime" below — use those names, not the ones other runtimes use.` (`:212`) |

The reword is defensible on its own terms (the runtime is not "Jcode"; the host-facts section genuinely replaces the Jcode-specific enumeration). It is reported as Material because (a) it is a rewrite of user prose above the marker that claims "unchanged" (F1), and (b) it is combined with the outright deletion in F2.

### F4 — **Non-blocking** — The user's §1 reference to `prompt-overlay.md` was rewritten

- Original `policy_hit_1.txt:13`: ``Follow the global `Goal-Directed Execution Principle` and phase progression defined in `prompt-overlay.md`.``
- Shipped `swarm-prompt.md:13`: ``Follow the global `Goal-Directed Execution Principle` and phase progression defined in the global execution policy.``

Justified rewrite: `prompt-overlay.md` is not shipped by this bundle, and the bundle now contains **zero** dangling references to it (grep over every file in the bundle → 0 hits). Recorded as Non-blocking because the rewrite removes a broken pointer rather than changing meaning — but it is one of the edits that makes the F1 marker false.

### F5 — **Non-blocking** — The skill's "This Skill does not replace" list was edited and extended without a plugin marker

| | Original (`user_skill_paste.md:23-24`) | Shipped (`skills/swarm-engineering.md:19-21`) |
|---|---|---|
| | `This Skill does not replace:` | `This Skill does not replace:` |
| | `- Global execution policies in `prompt-overlay.md`.` | `- The global execution policy — mission and ownership, goal-directed execution, evidence-driven investigation, verification and reporting.` |
| | — | `- Task decomposition, delegation, and orchestration rules in `swarm-prompt.md`.` (new bullet) |

Same justification as F4 (the pointer target is not shipped; the replacement names the real global policy). The second bullet is a correct, useful addition, but it sits inside the user's own list and is not covered by either plugin marker (`skills/swarm-engineering.md:479` and `:589` claim only §11–§13 and §14). Non-blocking, but it contributes to the F1 pattern.

### F6 — **Non-blocking** — One sentence added inside a relocated block

`skills/swarm-engineering.md` §12 carries one inserted framing sentence: *"The reviewer's own procedure is §5; the handoffs between roles are §6. This section states when the Coordinator may stop."* It is additive, correct (both pointers resolve — §5 is `## 5. Reviewer Role` at `:273`, §6 is `## 6. Role Handoffs` at `:403`), and it sits under the plugin marker at `:479`. Non-blocking.

### F7 — **Non-blocking** — Worker prompt's skill cross-reference is stale after §14 was added

`swarm-worker-prompt.md:12`: *"Its §11–§13 are Coordinator-side methods; you do not need them."* The skill now also carries §14 (Coordinator Practice, `skills/swarm-engineering.md:591`), which is equally Coordinator-side and equally not needed by a worker. The statement is still true as written (it names a subset), but it no longer covers every Coordinator-side section. Cosmetic drift only.

### F8 — **Non-blocking** — `isCoordinator()` falls back to the *Coordinator* prompt when no agent can be resolved

`index.js:69-87`:

```js
function resolveAgent(context) {
  const candidate = context?.agent ?? context?.scope
  return typeof candidate?.id === 'string' ? candidate : undefined
}
...
function isCoordinator(ctx, context) {
  const agent = resolveAgent(context)
  if (agent === undefined) return true
  return ctx.agents.roots().some((root) => root.id === agent.id)
}
```

Two observations:

1. The **default is the Coordinator prompt** (`index.js:85`). If the host ever assembles a prompt with no resolvable agent, a delegated worker would receive the Coordinator policy — the exact inversion the plugin exists to prevent.
2. `ctx.agents.roots()` is documented as *"All live top-level agents in registration order. A top-level agent was created without an owning agent context; durable session lineage does not affect this runtime relation, so a resumed fork may still be a root."* — a **resumed fork is still a root**, so a resumed delegated session would be routed to the Coordinator prompt as well.

Observed behaviour for a live delegated teammate in this session was correct (worker prompt received — see §2 runtime corroboration). The failure paths above were **not** exercised. Severity is Non-blocking because the common path is empirically correct, but the fallback ordering is the risky way round for a prompt router and is worth hardening (`index.js:85` → prefer the worker prompt when the agent cannot be resolved, or resolve the agent id from a field the host is documented to provide).

### F9 — **Non-blocking (cosmetic)** — Unnumbered sub-heading in policy §7

`swarm-prompt.md:137-159` is `## 7. Assignment Contract`, whose sub-heading is `### Assignment` — unnumbered, while every sibling section numbers its subsections (`### 8.1` …, `### 9.1` …). Numbering integrity is otherwise clean (see §5).

---

## 5. Internal consistency of the three markdown files (Scope item 2) — **PASS with the exceptions above**

| Check | Result | Evidence |
|---|---|---|
| Skill frontmatter present and well-formed | PASS | `skills/swarm-engineering.md:1-4`: `name: swarm-engineering`, `description: Engineering execution methods for Jcode Swarm workers. Defines bounded investigation, Developer implementation, Tester verification, Reviewer code review, role boundaries, handoffs, and evidence-based completion.` Matches the parser in `index.js` (frontmatter regex `/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/`, fields `name`/`description` at `index.js:106-107`). |
| Skill heading numbering | PASS | `##` sequence 1..14 contiguous, no gaps or duplicates: `:8` 1 Purpose, `:25` 2 Common Engineering Principles, `:92` 3 Developer Role, `:164` 4 Tester Role, `:273` 5 Reviewer Role, `:403` 6 Role Handoffs, `:431` 7 Role Composition, `:441` 8 Assignment and Reporting Contract, `:451` 9 Definition of Success, `:466` 10 Skill Availability and Execution, `:481` 11 Role Dependencies and Execution Patterns, `:523` 12 Review and Verification Termination, `:565` 13 Stalling Detection and Recovery, `:591` 14 Coordinator Practice. |
| Policy heading numbering | PASS | `##` sequence 1..13 contiguous, no gaps or duplicates: `swarm-prompt.md:3` 1 Mission and Ownership, `:15` 2 Delegation Strategy, `:35` 3 Role Routing, `:74` 4 Investigation Management, `:114` 5 Engineering Phase Orchestration, `:131` 6 Role Dependencies and Execution Patterns, `:137` 7 Assignment Contract, `:160` 8 Parallelism and Coordination, `:184` 9 Review and Verification Termination, `:190` 10 Stalling Detection and Recovery, `:194` 11 Integration and Final Acceptance, `:210` 12 Runtime and Model Configuration, `:222` 13 Completion Criteria. Two unnumbered plugin sections follow: `:237` Host facts, `:252` Coordinator practice. (F9 notes one unnumbered `###`.) |
| Marker comments delimit plugin additions | **FAIL (F1, F5)** | `swarm-prompt.md:235` claims "unchanged" above it — false. The skill markers (`:479`, `:589`) are accurate: they claim only §11–§13 and §14 respectively, and §1's edits (F5) fall outside their claimed range without being marked. |
| Pointer targets resolve | PASS | `swarm-prompt.md:135` → skill §11 ✓; `:186` → skill §12 (and skill §5/§6) ✓; `:188` → policy §11 ✓; `:192` → skill §13 ✓; `:254` → skill §14 ✓; `swarm-worker-prompt.md:8` → policy §1 ✓; `:19` → policy §7 ✓; `:25` → skill §8 ✓; `:40` → policy §4.4 ✓. |
| No dangling file references | PASS | grep for `prompt-overlay` over every file in the bundle → 0 hits. |
| Encoding / line endings | PASS | All 10 bundle files: UTF-8, **no BOM**, LF-only (0 CRLF). Byte/line inventory: `client.js` 1066 B, `cordis.patch.yml` 71 B, `icon.svg` 404 B, `index.js` 4274 B, `package.json` 943 B, `swarm-prompt.md` 18947 B / 253 LF, `swarm-worker-prompt.md` 4768 B / 55 LF, `locale/en.json` 263 B, `locale/zh.json` 255 B, `skills/swarm-engineering.md` 27304 B / 603 LF. |
| Locale files consistent | PASS | `locale/en.json` and `locale/zh.json` each carry only a `meta.title` + `meta.description` naming the same three capabilities (policy prompt, role-specific worker prompt, swarm-engineering skill). |

---

## 6. "Not run" / could not be verified

| Claim | Status | Reason |
|---|---|---|
| That the **Coordinator** (top-level Lead) session receives `swarm-prompt.md` and not the worker prompt | **Not run** | This review runs inside a delegated teammate session; the Lead's assembled prompt is not observable from here, and the harness implementation is not inspectable (the documented checkout `D:\software\dsh\resources\app.asar\dsh` does not exist on this host). The teammate direction was verified empirically; the Lead direction was not. |
| What the host actually puts in `AssembleContext` (does it carry `agent`? is `scope` the agent?) | **Not run** | `cordis_inspect_query` returns the declared type only: `AssembleContext = { scope?: ScopeKey; signal?: AbortSignal }` with `ScopeKey = object`, and the `assemble` parameter is described as "the optional scope and plugin-defined assembly fields" — the plugin-defined field that carries the agent id is not part of the published type and the runtime source is not available locally. `index.js:70` reads `context?.agent ?? context?.scope`, which works only if one of those carries `{id: string}`. |
| Behaviour of the `index.js:85` fallback and of a **resumed** delegated session (a resumed fork is still a `roots()` entry per the `agents.roots()` contract) | **Not run** | Not exercised in this session; no runtime hook available to force an agentless assembly or a resumed fork. Reported as F8. |
| Profile-level state: bundle row, enable state, plugin version pinning | **Not run — out of scope by instruction** | The assignment forbids `plugin_manager` calls and any touch of the DSH profile. The plugin is nonetheless observed to be **live** (§2 runtime corroboration). |
| Anything under `D:\project\reading-collector` | **Not run — out of scope by instruction** | Untouched. |

---

## 7. Boundaries observed

- **Wrote exactly one file:** `D:\project\.swarm-lab\rounds\REVIEW-verdict.md` (this report).
- **No modification** of anything under `D:\project\dsh-plugins` — read-only inspection (read, grep, `git diff --no-index`).
- **No** `plugin_manager` calls; no change to the DSH profile, bundle rows or enable state.
- **No** writes to any repo under `D:\project\reading-collector`.
- **No network access.**
- The recovered originals in `D:\project\.swarm-lab\` were read only and not modified (git's `LF will be replaced by CRLF` stderr notices during the diffs are Git's `core.autocrlf` checkout advisory, not a change to the files — verified separately: both originals and all shipped files are LF-only with no BOM).

---

## 8. Required before shipping

1. **F1 (Blocking).** Correct the marker at `swarm-prompt.md:235`. Either re-word it to what is true (e.g. "the Coordinator-side sections above were relocated into the `swarm-engineering` skill; the host facts below are the plugin's addition"), or restore the user's text above it.
2. **F2 (Material).** Restore the user's model-configuration paragraph (`policy_hit_1.txt:310-313`) into `swarm-prompt.md` §12, or state in the report and the shipped text that it was deliberately dropped and why.
3. **F3 (Material).** Accept the §12 reword explicitly, or restore the user's heading and sentence.
4. **F5 (Non-blocking, cheap).** Extend the skill's marker at `skills/swarm-engineering.md:479` backwards to cover the §1 list edits, so the plugin's additions are honestly delimited.
5. **F8 (Non-blocking, robustness).** Flip the `index.js:85` fallback to the worker prompt, or resolve the agent id from a host-documented field, so a delegated worker can never be handed the Coordinator policy.

---

*Reviewer note: the two diff counts in §3 (128/6 and 29/102) were produced by this reviewer, not taken from the brief. The brief's characterisation of Diff 2 as "an appended practice section" is contradicted by the numstat output and by the line numbers of the rewritten sections — see F1–F3.*
