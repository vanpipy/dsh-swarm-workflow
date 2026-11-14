# Swarm-Workflow Bundle — Independent Review

**Work item:** `swarm-workflow-review`
**Subject:** the DSH bundle at `D:\project\dsh-plugins\swarm-workflow` — commit `232e218`, clean tree, in sync with `origin/main` (`https://github.com/vanpipy/dsh-swarm-workflow.git`)
**Date:** 2026-11-10
**Requirements file:** `D:\project\.swarm\requirements\swarm-workflow-review.md` (written before dispatch, per `skills/swarm-engineering.md:601` and `:636-654`)
**Mode:** READ-ONLY. Nothing in the bundle, the profile, the host configuration or the installed plugin rows was changed. Every proposal below is a recommendation awaiting approval.

---

## 1. Method and evidence base

The bundle ships its own reporting contract (`skills/swarm-engineering.md:615-654`: §16 *Requirement Matching*, §17 *Requirement handover*), so the bundle was reviewed by that contract: **one verdict per requirement, with evidence, plus two checks** — *does the check discriminate* (would it fail if the behaviour were wrong) and *is the behaviour the one the requirement asked for* (`:628`).

Lanes:

| Lane | Scope | Criteria | Status |
|---|---|---|---|
| L1 | shipped text vs the method it ships | C4 | reported |
| L2 | runtime code (`index.js`) | C2, C3, C8 | reported |
| L3 | packaging, docs, repo hygiene | C1, C7, C9 | reported — agrees with the Coordinator on all three |
| L4 | verbatim integrity of the user's documents | C5 | reported — agrees with the Coordinator: **met**, with two material disclosure findings |
| L5 | shipped host claims vs the live host | C6 | reported — agrees with the Coordinator: **not met**; 5 of 7 claim groups verify true |
| Coordinator | own verification, live-host probes, real-cordis harness, strict verbatim diff | C1–C9 | complete |

The first fan-out's output was truncated by the tool after L1 and L2; L3, L4 and L5 were re-dispatched as standalone lanes and all three have now reported. Where a lane's belief differs from the Coordinator's, the difference is recorded in the criterion section rather than silently dropped.

Evidence actually executed for this review:

* Baseline suites in `D:\project\.swarm-lab\rounds\tools\` — `test-render-prompt.mjs` (57 checks) and `test-swarm-tools.mjs` (63 checks): **all pass**, exit 0.
* Coordinator probes against the **real** cordis runtime (`D:\project\.swarm-lab\rounds\review-scratch\test-gating.mjs`, `test-sibling.mjs`, `test-lane.mjs`) and against the host's own packages read out of `app.asar` (scripts `asar-scan1.mjs` … `asar-scan11.mjs`).
* Live host inspection: the reviewing agent's own tool registry, the system prompt actually served in this session, the live desktop profile (`C:\Users\leroy\.dsh\profiles\desktop\package.json`), and the installed copy of the bundle.
* Strict verbatim diff (`review-scratch\strict_verbatim_check2.py`): exact-string membership plus `difflib` alignment, because the lab's `check_user_text.py` only detects **missing** lines and cannot see an **altered** line.

---

## 2. Verdict table

| ID | Requirement (short) | Verdict | Evidence (file:line) |
|---|---|---|---|
| C1 | Bundle activates and ships its three artefacts | **met** | `cordis.patch.yml` nested `- insert:` dialect; `package.json` exports/files; skill live in the agent catalogue; prompt section live in the served prompt; installed copy identical (CRLF only) |
| C2 | Prompt assembly is capability-gated, leaks no markers | **met** | `index.js:376-381`, `:410`, `:299`, `:325-328`; `test-render-prompt.mjs` 57/57; no `swarm:` string in rendered output |
| C3 | The three primitives register only when the service exists, and behave as documented | **not met** | `index.js:921-924` filter + `index.js:34` (no `inject`); real-cordis harness: service present before apply → 3 tools, service after apply → **0 tools**; live host has `agentTeams` + `subagents` active, yet all three primitives absent |
| C4 | §16 / §17 reach the lanes that must report | **met** | `swarm-worker-prompt.md:12`; `skills/swarm-engineering.md:615-654`; `swarm-prompt.md:252`, `:267`; reachable live (skill loadable from a clean-context worker) |
| C5 | The user's documents are shipped verbatim, host facts separated | **met** (prose intact) — with two material **disclosure** defects (F10, F11) | strict diff: 232/238 policy lines verbatim, 55/66 relocated lines verbatim in the skill; the only edited line is the pointer the user asked to change; L4's stricter per-line check: policy 316/327 verbatim, skill 478/481 verbatim — no rewording, no invention, no silent drop |
| C6 | Every host claim matches the live host | **not met** | `swarm-prompt.md:255` asserts the primitives "are callable as tools" — they are not registered; `:263` and `:248` advertise `/swarm` — the command is not registered in this session; L5 corroborates (5 of 7 claim groups true, the two `/swarm`/cause-attribution groups false) |
| C7 | Packaging / install surface is internally consistent | **met** | `package.json` name, `cordis.patch.yml` row, `client.js:2`, `index.js:40` all `dsh-swarm-workflow`; README route matches the code and the live profile |
| C8 | `/swarm` exists, prints the live block, advertised only when registered | **not met** | command **not registered** in this session (no `/swarm` line in the served capability block); printed block ≠ served block (`index.js:1045` vs `:1017`); prose advertisement ungated (`:248`, `:263`, `README.md:18`) |
| C9 | The bundle's verification travels with the bundle | **not met** | no `scripts` key in `package.json`; 12 tracked files, 0 test files; suites live outside the repo and import `file:///D:/project/dsh-plugins/swarm-workflow/index.js` |

Two criteria fail because of **one** defect (F1): the primitives and the `/swarm` command are resolved **once**, at the bundle's apply time, instead of being bound to the services' lifetime.

---

## 3. Criterion detail

### C1 — Bundle activates and ships its three artefacts → **met**

*Requirement:* activate on a DSH profile and expose exactly the orchestration policy prompt, the worker prompt and the `swarm-engineering` skill.

*Discrimination:* yes — a flat `- id:` row in `cordis.patch.yml` would contribute zero rows and the plugin would never activate; the check inspects the row shape, not merely the file's presence.
*Intent:* yes — the requirement is about activation and the three artefacts; all three are observable in this session.

Evidence:
* `cordis.patch.yml` uses the nested dialect — `- insert:` → `- id: swarm-workflow` → `name: 'dsh-swarm-workflow'` (the flat form would be parsed as an id-targeted override and the bundle would contribute zero rows).
* `package.json` exports `.`→`index.js`, `./client`→`client.js`, `./swarm-prompt.md`, `./swarm-worker-prompt.md`, `./skills/*.md`; the `files` list carries all of them.
* Live: the skill `swarm-engineering` is in this agent's catalogue and loads; the served system prompt carries the bundle's host-facts band and the Coordinator-practice band.
* The installed copy at `C:\Users\leroy\.dsh\profiles\desktop\node_modules\dsh-swarm-workflow` is a real directory (git install) whose 11 files are byte-identical to the checkout modulo CRLF.

*Corroborated independently by L3*, which additionally confirmed from the host's own sources that only **insert**-patches contribute bundle rows (`dsh-plugin-manager/lib/index.js:2184`; a flat `- id:` row becomes a zero-row "override" at `:2200`) — i.e. the dialect used here is the one the host actually honours.

### C2 — Prompt assembly is capability-gated and leaks no markers → **met**

*Discrimination:* yes — the check fails if a marker leaks, a missing surface is advertised, or an empty registry still reports a positive tool count.
*Intent:* yes.

Evidence: `index.js:376-381` implements marker semantics (`,` = all surfaces required, `|` = any one); `:373` drops an unparsable marker; `:410` strips the markers; `:299`/`:330` choose "probed live" vs "not probed"; `:328` writes the tool count; the same gating path renders the worker prompt. The baseline suite `test-render-prompt.mjs` passes 57/57, including the empty-registry case (no bullet dropped, no zero count) and idempotence.

*Deviation (minor):* a hand-edited **multi-line** `swarm:requires` marker leaks a dangling fragment — `REQUIRE_MARKER` (`index.js:62`) matches across lines because `[^>]*?` accepts newlines, while `REQUIRE_MARKER_STRIP` (`:71`) stops at the end of the line. Single-line markers (the shipped ones) are unaffected.

### C3 — The three host-backed primitives → **not met**

*Requirement:* a tool must exist **only when its service exists**; each must do what the README says.

*Discrimination:* yes — the check distinguishes "service missing" (tool absent, correct) from "service present" (tool must be registered).
*Intent:* **no** — on this host the services `agentTeams` and `subagents` **are present and active**, yet `swarm_task` and `swarm_child` are not registered.

Evidence (L2 + Coordinator, independently):

| Fact | Evidence |
|---|---|
| The bundle declares only `inject = ['systemPrompt','agents','skills']` | `index.js:34` |
| The three services are therefore never re-checked | `index.js:921-924` filter runs once inside a one-shot `ctx.effect` (`index.js:979-998`) |
| cordis only wakes a fiber for services **in its own inject list** | `@deepseek-ai/cordis` `reflect.ts:320` `if (!(name in fiber.inject)) continue` |
| A service whose provider fiber is not yet **active** reads as undefined | `reflect.ts:241`; `ReflectService.get(name, strict)` returns undefined unless `impl.fiber.state === 2` |
| Real-cordis harness | service present **before** apply → `["swarm_worktree","swarm_task","swarm_child"]`; service provided **after** apply → `[]`; sibling provider last → `[]`; sibling provider already active → `[]` |
| The live host has both services active | `dsh-experimental-tool-agent-team` (inject `["agents","agentTeams","tools","systemPrompt"]`) registers `team_task_create`, `spawn_teammate`, `send_message`, `interrupt_agent`, `list_agents`, `wait_agent` — all live in this session ⇒ its fiber is active ⇒ `agentTeams` is active. `TeamService` (`dsh-experimental-agent-team/lib/index.js:1452`) itself declares `static inject = [... ,"subagents"]`, and it is active ⇒ `subagents` is active too |
| The three service names are right | `dsh-experimental-worktree` → `super(ctx,"worktrees")`; `dsh-experimental-agent-team` → `super(ctx,"agentTeams")`; `dsh-subagent` → `super(ctx,"subagents")` |
| Not a stale build | the installed copy is content-identical to the checkout (CRLF only); every commit (`232e218`, `31a71dc`, `3cec879`, `403ef1f`, `2280c98`, `211029d`, `4c5f0cf`) carries the same filter |

Live state of this session: the served capability block says **"Absent in this session:** `swarm_worktree` · `swarm_task` · `swarm_child`". The 2026-11-08 audit recorded `swarm_task` and `swarm_child` as **present** — the difference is that the bundle was then installed into an *already-running* host, so the providers were active when `apply()` ran.

Note: **`swarm_worktree`'s absence is correct** — the desktop profile has no `worktrees` row. The defect is that `swarm_task` and `swarm_child` are absent although their services are live.

*L3 (packaging lane) could not observe the live registry and recorded the belief that this host exposes none of the three services; that belief is superseded by the evidence above — the host's own team and subagent tools are present in this session, and the plugins that provide them only become active once their injected services are active.*

### C4 — §16 / §17 reach the lanes that must report → **met**

*Discrimination:* yes — the check fails if the worker prompt does not name the sections, the path or the citation rule.
*Intent:* yes — the rule must be reachable from the lane's own served prompt, not from a file the lane is never told about.

Evidence: `swarm-worker-prompt.md:12` names the skill, both sections, the path `.swarm/requirements/<work-item>.md`, `file:line` citation and the conflict rule; `skills/swarm-engineering.md:615-632` (§16) and `:636-654` (§17) carry the rules as readable text; `swarm-prompt.md:252` and `:267` point at them. L1 verified reachability live: the sentence appears in the served prompt of a clean-context worker and the skill loads through the `skill` tool.

*Deviations (minor, reported by L1):* the worker prompt's paraphrase omits the four verdict labels (`met` / `not met` / `not demonstrated` / `not in scope`), the names of the two checks, and the general rule "A verdict without evidence is `not demonstrated`, never `met`" (`skills/swarm-engineering.md:626`) and the waiver rule (`:632`). The rule is reachable, so C4 is met — but a lane that reads only the worker prompt would under-report what a verdict must contain.

### C5 — The user's documents are shipped verbatim → **met**, with disclosed deviations

*Discrimination:* yes — an altered line counts as a violation (the lab's missing-lines-only check does not satisfy this requirement).
*Intent:* yes.

Strict diff (`review-scratch\strict_verbatim_check2.py`):

* Policy (`D:\project\.swarm-lab\policy_hit_1.txt`, 327 lines) → `swarm-prompt.md` user span (238 lines, plugin band marker at `:239`): **232 lines verbatim**. Four changed blocks, all accounted for:
  1. the pointer line the user asked to change (`…defined in \`prompt-overlay.md\`.` → `…defined in the global execution policy.`);
  2. §6.1–§6.5 → one pointer sentence to the `swarm-engineering` skill;
  3. §9.1–§9.5 → pointer sentence;
  4. §10 (stalling signs + recovery procedure) → pointer sentence.
  Of the 66 non-blank lines removed from the prompt, **55 are present verbatim in the shipped skill**; the 11 that are not are exactly the 1 changed pointer line and the 10 renumbered sub-headings (§6.x → §11.x, §9.x → §12.x). **No user prose was altered, dropped or invented**, and the relocation is disclosed by the plugin-band markers (`swarm-prompt.md:239`, `skills/swarm-engineering.md:6`, `:481`).
* Skill paste (`D:\project\.swarm-lab\user_skill_paste.md`, 481 lines) → `skills/swarm-engineering.md` user span (473 lines): only the two chat lead-in lines ("The swarm worker prompts I saw in plugin, did not update, why?" / "Here is the swarm enginnering") are absent — they are conversation, not skill text — plus the frontmatter, which **is** shipped at `:1-4`; and the L24 pointer line, changed as the user asked.

**L4** (independent verbatim lane, script `review-scratch\c5-strict\c5_strict.py`) ran a stricter, per-original-file comparison — exact-string lookup, then a `difflib` near-match (ratio ≥ 0.60) with a character-level diff, then an in-order (LCS + cursor) check for reordering, plus a byte-for-byte diff of each relocated section body, and it listed **every** shipped line absent from both originals, split by marker region. Its numbers: policy **316 verbatim / 11 altered / 0 absent**; skill paste **478 verbatim / 1 altered / 2 absent** (the two chat lead-ins). All 13 non-verbatim original lines are the two user-requested pointer edits plus 11 heading-number changes — **no user sentence was reworded, invented, dropped or reordered**.

**But the markers misstate provenance (F10, F11), and two deviations are undisclosed (F12, F13).** The user's prose is intact; the bundle's own claim about where that prose sits is not:

* `swarm-worker-prompt.md:44` asserts that "everything above this marker is the user's own text … except the pointer to the global execution policy, which the user asked to change". Neither half holds: the file contains **no** pointer to the global execution policy (`prompt-overlay` occurs only at `swarm-prompt.md:239` and `skills/swarm-engineering.md:6`; the worker's own mention of the policy is at `:53`, *below* the marker), and 31 of the 43 pre-marker lines are plugin-authored glue — the title, the attributions, and `:12`, which summarises the plugin's own *Requirement Matching* / *Requirement handover* sections. What the region contains is the user's text **quoted verbatim**, not the user's text.
* `swarm-prompt.md:135`, `:186`, `:188`, `:192` are plugin-written pointer paragraphs that sit **outside** any marker band; C5 admits a shipped non-original line only as one of the three documented deviations or inside a band. The band marker at `:239` describes them in prose, but the prose is itself inside the band.
* The section numbers were changed (`## 6.` → `## 11.`, `### 6.x` → `### 11.x`, `## 9.` → `## 12.`, `### 9.x` → `### 12.x`, `## 10.` → `## 13.`), and neither the marker at `skills/swarm-engineering.md:6` nor the one at `:481` says so.
* The two dropped chat lead-ins are not mentioned in any shipped marker.

*Scope note for this criterion:* C5 names the two user documents as the originals and lists `swarm-worker-prompt.md:44` among the band markers, so the worker prompt is in accounting scope; under a strict reading of C5's mechanical clause the 31 pre-marker glue lines and the four out-of-band pointer paragraphs are violations of the *disclosure* rule even though they never touch the user's prose. The verdict above therefore reads **met** on the substance (the prose is verbatim) with the disclosure defects recorded as F10–F13.

### C6 — Every host claim matches the live host → **not met**

*Discrimination:* yes — a claim that is stale, overbroad, or contradicts the live host is a violation.
*Intent:* **no** — three distinct claims are false for this host, in four places (one of them is repeated verbatim in the worker band).

| Shipped text | Claim | Live truth |
|---|---|---|
| `swarm-prompt.md:255` | "**The host's own primitives are callable as tools.**" | **False as rendered** — the sentence's second half holds ("its bullet appears below only then": `:256-258` are correctly dropped), but the first half does not: none of the three primitives is registered, and the block itself lists them as absent |
| `swarm-worker-prompt.md:58` | the same sentence, in the worker band (word for word) | **False as rendered** — same registry, same absence; the worker band repeats it verbatim, and the worker band carries **no** `/swarm` claim at all (`:52-62`), so the command defects live only in the Coordinator prompt and the README |
| `swarm-prompt.md:263` | "`/swarm` prints it on demand" | **False** — the command is not registered in this session |
| `swarm-prompt.md:248` | "The `/swarm` entry in the capability block above …" | **False** — that entry does not exist in this session's block (the bullet is gated on `subagent,subagent_fork,workflow`, all present) |

The worker band makes **no** `/swarm` claim, so the command-advertisement defects live only in the Coordinator prompt and the README.

The specific bullets at `:256`/`:257`/`:258` are correctly dropped when their services are missing — the gating works. The failure is that the **umbrella** claim at `:255` and the two `/swarm` mentions are **ungated**, so they survive into a rendered prompt that contradicts its own list.

All other host claims in the band checked out against this session's registry: `:250` (global execution policy injected by the harness), `:251` (the skill is registered for every agent — true in my catalogue and in a delegated worker's), `:252` (names §16/§17), `:253` (team surfaces), `:254` (`team_task_*`), `:259`, `:261`, `:262` — all true; the `swarm:requires` gates at `:248/:249/:253/:254/:259/:261/:262` match surfaces that are present.

**L5** (independent live-host lane) verified the same band against a **delegated worker's own registry** rather than against the source, and reached the same verdict — **not met** — with five of seven claim groups confirmed true and two false (the `/swarm` assertions, and the cause attribution). Its additional confirmations worth recording:

* the "Absent in this session" line is exactly the complement of the worker's enumerable registry (9 names, no false positives) — the probe sees the same registry the agent does;
* the tool count is a live computation, not a hardcoded number: `index.js:268-269`/`:328` use `tools.schemas(scope).length`, and the asar shows that is the host's visible set for the scope (61 in the root scope, 55 in a worker scope);
* the gating is correctly **scoped**: `:253` ("This profile enables the Agent Teams plugins") is gated on five names including `spawn_teammate` and `wait_agent`, so it is dropped for a worker scope and never reaches a worker — a positive confirmation of C2's scoping;
* the three primitive names appear nowhere in the host's own packages (only in this bundle), so their absence is not a naming collision;
* `worktrees` is absent from this profile legitimately (`dsh-app-boot/lib/index.js:579-592` offers the worktree bundle switched off).

L5 adds two minor findings the Coordinator had not separated out: **F14** (absence presented as host capability) and **F15** (the tool count can exceed the tools the agent can actually call).

### C7 — Packaging / install surface is internally consistent → **met**

*Discrimination:* yes — the check fails if any of the four scope names disagree or the documented route does not match the code.
*Intent:* yes.

Evidence: `package.json` `name: dsh-swarm-workflow`; `cordis.patch.yml` row `name: 'dsh-swarm-workflow'`; `client.js:2` module id `'dsh-swarm-workflow'`; `index.js:40` `const SKILL_SOURCE = 'dsh-swarm-workflow'` — all four agree, as `README.md:129-131` claims. The documented route (`dsh plugin --profile desktop add github:vanpipy/dsh-swarm-workflow`) matches the live profile, whose `package.json` carries `"dsh-swarm-workflow": "git+https://github.com/vanpipy/dsh-swarm-workflow.git"` and whose bundle list ends with `dsh-swarm-workflow`. The dev route (`plugin_manager install_bundle` + `set_plugin include:swarm-workflow`) and the uninstall route (`remove_bundle`, then `cmd /c rmdir` the junction, never `/s`) match the code and the recorded host facts.

*Deviation (minor, docs):* `README.md:20-22` says the three tools are registered "**only when the host exposes the backing service**". The letter holds; the promise does not — the real condition is "when the service is **already active** at the bundle's apply time" (F1). `README.md:18` lists `/swarm` unconditionally although the command is not registered here.

*Corroborated independently by L3*, which traced every README behaviour claim it sampled back to the code (`README:88-91` ↔ `index.js:147-166`; `README:92-93` ↔ `index.js:1030-1031`; `README:116-117` ↔ `index.js:945-972`) and found them consistent; the one README claim L3 could not corroborate is the dev route's link/copy wording (F9).

### C8 — `/swarm` exists, prints the live block, advertised only when registered → **not met**

*Discrimination:* yes — the check fails if the command is not registered, if the printed block differs from the served one, or if the shipped text advertises the command on a host that lacks it.
*Intent:* **no** — all three sub-checks fail on this host.

1. **Registered?** No. The served capability block contains **no** `- **`/swarm`** — print this block on demand` line, and that line is emitted **only** when `options.command === true` (`index.js:325-327`) — the served prompt passes `command: commandRegistered` (`index.js:1017`), and `commandRegistered` is set to `true` only after a successful `commands.register` (`index.js:1052`). So the command was not registered in this session. `apply()` reads the `commands` service **once, outside the effect** (`index.js:1021-1026`): if the service was not resolvable at that instant the whole command block (`:1027-1060`) is skipped, and if `register` was refused the catch at `:1054` sets `commandRegistered = false`. Either way nothing retries — the same one-shot pattern as F1. The API shape is *not* the cause: the service is `commands` (`dsh-commands/lib/index.js:259`, `lib/types/index.js:228`) and `normalizeDefinition` (`dsh-commands/lib/index.js:149-182`) accepts the bundle's definition (`name` pattern, non-empty `description`, function `handler`, `input.hint` string).
2. **Output matches the served block?** No — the command re-probes live at invocation and renders `capabilityBlock(names, { referenced })` (`index.js:1045`), while the served prompt renders with `command: commandRegistered` (`index.js:1017`); the printed block therefore differs from the served one by the self-reference line.
3. **Advertised only when registered?** No — `swarm-prompt.md:263` and the `:248` parenthetical mention `/swarm` in bullets that are not gated on the command, and `README.md:18` lists it unconditionally.

The gating *mechanism* is correct (baseline suite asserts both branches: `command:true` ⇒ line present, omitted ⇒ line absent); the failure is the one-shot registration plus ungated prose.

### C9 — The bundle's verification travels with the bundle → **not met**

*Discrimination:* yes — the check fails if a fresh clone cannot run the bundle's own verification without absolute paths into another directory.
*Intent:* **no** — there is nothing to run.

Evidence: `git ls-files` in the repository lists **12** tracked files (`.gitignore`, `README.md`, `client.js`, `cordis.patch.yml`, `icon.svg`, `index.js`, `locale/en.json`, `locale/zh.json`, `package.json`, `skills/swarm-engineering.md`, `swarm-prompt.md`, `swarm-worker-prompt.md`) and **no** test file; `package.json` has **no `scripts` key at all**, so there is no `npm test`; materialising the published content gives the same 12 files and 0 test files, while the installed copy holds 11 (the pack step drops `.gitignore`); the README mentions "test" only as role prose (`README.md:37,50,51`, `:133-142` "Files" section) and documents neither a suite location nor a run command; copying the two lab suites into the clone leaves them importing `file:///D:/project/dsh-plugins/swarm-workflow/index.js` (`test-render-prompt.mjs:11`, `:13-14`; `test-swarm-tools.mjs:15`), so they verify the **other** directory, not the clone.

*Corroborated independently by L3*, which reached the same verdict on the same artefacts, and added the point that copying the suites into a clone would not help either — their imports resolve to the developer's working copy. (L3 counted 13 tracked files; a direct `git ls-files` lists 12 — no difference that changes the verdict.)

(The verification itself is real and passes today — 120 checks green — but it lives in `D:\project\.swarm-lab\rounds\tools\`, outside the published repository.)

---

## 4. Findings

### F1 — Material: the primitives and the `/swarm` command are bound to a one-shot snapshot of service availability

*Location:* `index.js:34` (`inject`), `index.js:921-924` (filter), `index.js:979-998` (one-shot effect), `index.js:1021-1026` (one-shot `commands` lookup).
*Mechanism:* the bundle deliberately does **not** declare `agentTeams` / `subagents` / `worktrees` / `commands` in its `inject` (rationale at `index.js:28-32`: "A declared service that the host lacks would take the whole plugin down instead of one feature"). The consequence is that cordis never re-runs the fiber when a service arrives, and `ctx.get(name)` returns `undefined` while the provider fiber is not yet active — so on a cold boot the feature is dropped **for the whole session**, with no error, no retry and no log.
*Impact:* on this host `swarm_task` and `swarm_child` are silently missing even though both services are live; `/swarm` is silently missing; the served prompt advertises capabilities the plugin does not provide. On a host that provides the services earlier, the same code works — which is why the 2026-11-08 audit saw two of the three tools present.
*Recommendation (not implemented): bind each primitive to its own service lifetime with a child fiber that declares it — e.g. `ctx.inject(['agentTeams'], (child) => register(swarm_task, child))` — keeping the "absent rather than broken" behaviour for hosts that lack the service entirely, and re-probing the command registry the same way.

### F2 — Material: the served prompt asserts capabilities the plugin does not provide

*Location:* `swarm-prompt.md:255`, `:263`, `:248`; `swarm-worker-prompt.md:58`.
*Detail:* the umbrella sentence "The host's own primitives are callable as tools" is ungated **in both bands** (Coordinator `:255`, worker `:58`), and both `/swarm` mentions survive on a host where the command and the tools are absent. The prompt therefore contradicts its own "Absent in this session" list.
*Recommendation:* gate the umbrella bullet on the three primitives actually being registered, and gate the `/swarm` mentions on the command being registered (the rendering layer already knows: `commandRegistered`).

### F3 — Minor: the printed `/swarm` block differs from the served block

*Location:* `index.js:1045` vs `index.js:1017`.
*Detail:* the command renders `capabilityBlock(names, { referenced })` without `command: true`, so the block it prints lacks the self-reference line the served prompt carries.
*Recommendation:* pass the same options the prompt path uses.

### F4 — Minor: a multi-line `swarm:requires` marker leaks a dangling fragment

*Location:* `index.js:62` (`REQUIRE_MARKER`), `index.js:71` (`REQUIRE_MARKER_STRIP`).
*Detail:* the marker regex accepts newlines (`[^>]*?`) while the strip regex stops at the line end, so a marker a human edited across two lines leaves the tail of the first line in the rendered prompt.
*Recommendation:* make both patterns reject newlines, or fail the marker closed (as `:373` already does).

### F5 — Minor: the worker prompt under-specifies what a verdict must contain

*Location:* `swarm-worker-prompt.md:12` vs `skills/swarm-engineering.md:621-632`.
*Detail:* the worker prompt states the §16 binding but omits the four verdict labels, the names of the two checks, the "no evidence ⇒ `not demonstrated`" rule and the acceptance/waiver rule.
*Recommendation:* name the four verdicts in the worker prompt, or point at §16 by section anchor as the prompt already points at the skill.

### F6 — Minor: §17's documented example does not match the file format the Coordinator actually writes

*Location:* `skills/swarm-engineering.md:641-647` vs `D:\project\.swarm\requirements\swarm-workflow-review.md:13-56`.
*Detail:* §17 shows `check:` / `source:` indented four spaces and no heading; the requirements file writes them at column 1 under a `### <ID> — <title>` heading — a convention §17 never mentions, even though `:652` says a line number "is a convenience, not an identity" (implying a stable anchor exists).
*Recommendation:* show the `### <ID> — <title>` block shape in §17.

### F7 — Material: the published bundle carries no verification

*Location:* `package.json` (no `scripts`), repository root (no test files), `README.md` (no suite location or run command).
*Detail:* the two suites that justify the bundle's behaviour live outside the repository and import an absolute path into `D:\project\dsh-plugins\swarm-workflow`; a clone of the published repository can run nothing.
*Recommendation:* move the suites into the repository (e.g. `test/`), make the imports relative, and expose `npm test` — this is the "bring the test suite into the repo" option the user was offered and did not take yet.

### F8 — Minor: README states the gating condition more favourably than the code delivers

*Location:* `README.md:18`, `README.md:20-22`.
*Detail:* "registered **only when the host exposes the backing service**" and the unconditional `/swarm` row.
*Recommendation:* restate the condition as "when the service is already available when the bundle loads", once F1 is fixed — or make F1's fix make the current wording true.

### F9 — Minor: the dev route's "links the directory" wording is not established for the current profile

*Location:* `README.md:108`, `README.md:124-127`.
*Detail (reported by L3):* the host passes the typed absolute path straight to `pnpm add` (`dsh-plugin-manager/lib/index.js:2033-2038`); the profile logs contain both a `link:` record for this package name and two copy-style `<- path` records, so whether `install_bundle` produces a junction or a copied directory is not settled by the current state (the installed copy now in the profile comes from the git route). The junction-removal instruction (`cmd /c rmdir …`, never `/s`) should stay until this is observed directly.
*Recommendation:* run `install_bundle` against the local directory on a scratch profile and observe `node_modules\dsh-swarm-workflow` before publishing the wording.

### F10 — Material: the worker prompt's marker makes a false provenance claim

*Location:* `swarm-worker-prompt.md:44`.
*Detail (reported by L4):* the marker states that everything above it is the user's own text, except a pointer to the global execution policy that the user asked to change. The file has no such pointer (`prompt-overlay` appears only at `swarm-prompt.md:239` and `skills/swarm-engineering.md:6`; the worker's policy mention at `:53` is below the marker), and 31 of the 43 pre-marker lines are plugin-authored glue — the title (`:1`), the attributions (`:8`, `:19`, `:25`, `:40`) and `:12`, which summarises the plugin's *own* *Requirement Matching* / *Requirement handover* sections. The quoted fragments themselves are verbatim (`:5`→policy `:7`, `:6`→policy `:11`, `:17`→policy `:175`, `:21-23`→skill `:447/449/451`, `:31-38`→policy `:103-110`).
*Impact:* the one marker that is supposed to separate the user's text from the plugin's says the opposite of what is true — the opposite of the rule the bundle itself enforces for the other two files.
*Recommendation:* rewrite the marker to say the region is plugin-authored glue that **quotes the user's text verbatim**, and drop the inapplicable pointer exception.

### F11 — Material: plugin-written pointer paragraphs sit outside every marker band

*Location:* `swarm-prompt.md:135`, `:186`, `:188`, `:192`.
*Detail (reported by L4):* e.g. `:135` — "The patterns themselves — Developer Only, … — and the flow each one implies are defined in the `swarm-engineering` Skill…". These are shipped non-original lines that belong to no documented deviation and to no band; the band marker at `:239` mentions them in prose, but that prose lives inside the band.
*Recommendation:* give each pointer paragraph its own `<!-- Added by the dsh-swarm-workflow plugin … -->` marker, so the mechanical rule holds without reading marker prose.

### F12 — Minor: "relocated verbatim" over-claims — the headings were renumbered

*Location:* `swarm-prompt.md:239`; `skills/swarm-engineering.md:6`, `:481`.
*Detail (reported by L4):* the prose is verbatim, but the heading numbers changed (`## 6.`→`## 11.`, `### 6.x`→`### 11.x`, `## 9.`→`## 12.`, `### 9.x`→`### 12.x`, `## 10.`→`## 13.`); the user's original heading text survives verbatim at `swarm-prompt.md:131`, `:184`, `:190`. The bundle never states that the numbers moved.
*Recommendation:* add "the section and subsection numbers were renumbered to fit the Skill's numbering" to the marker at `skills/swarm-engineering.md:481`.

### F13 — Minor: the dropped chat lead-ins are undisclosed

*Location:* `D:\project\.swarm-lab\user_skill_paste.md:1`, `:3` (dropped from every shipped file).
*Detail (reported by L4):* "The swarm worker prompts I saw in plugin, did not update, why?" and "Here is the swarm enginnering" are absent from all three shipped files; they are conversation rather than skill text, and the criteria count them as a documented deviation — but no shipped marker says so.
*Recommendation:* one clause in the marker at `skills/swarm-engineering.md:6`.

### F14 — Minor: a bundle-caused gap is presented as a host limitation

*Location:* `swarm-prompt.md:255`, `index.js:310-324`.
*Detail (reported by L5):* the bullet says each primitive "is registered only when the host has the service behind it", and the "Absent in this session" line is built from the probed tool names alone (`index.js:317-319`), so the rendered prompt reports the bundle's own one-shot drop as if the host lacked the capability. On this host only `swarm_worktree`'s absence is genuinely host-side (no worktree bundle in the profile).
*Recommendation:* reword to what the probe can actually support — "a primitive missing from the registry means this session cannot call it" — and say nothing about why; once F1 is fixed the distinction disappears anyway.

### F15 — Minor: the tool count can exceed the tools the agent can call

*Location:* `index.js:328`, `index.js:268-269`.
*Detail (reported by L5):* the count is `tools.schemas(scope).length` — the host's visible schema set for the scope — while the model-facing tool list can be smaller (a worker scope was served "55" against 53 callable names; `dsh-tools/lib/index.js:3075` adds the `run_code` stub to the schema set, `:955`, `:3119-3120`).
*Recommendation:* relabel the line ("tools in the host registry for this scope") or count only the schemas actually offered to the model.

---

## 5. What is *not* demonstrated

* **Cold-boot ordering in full.** The mechanism (inject-less fibers are never refreshed; an inactive provider reads as `undefined`) is proven against the real cordis runtime, and the observed outcome matches it exactly. The precise scheduling tick at which `agentTeams` becomes active in this host was not instrumented; the alternative explanations (wrong service names, stale build, genuinely missing services) were each ruled out with direct evidence. One alternative remains formally open (L5): a swallowed `tools.register` failure (`index.js:985`) rather than the service filter — the two are indistinguishable from outside the host process, though the real-cordis harness reproduces the filter behaviour exactly.
* **Windows / other platforms.** Only this Windows host was inspected; the defect is host-independent (it is in the bundle's wiring, not the OS).
* **The other hosts.** No claim is made about a DSH host that provides `worktrees`, or about a host whose `commands` service is present at load time; the code path there was read, not executed.
* **`swarm_worktree`'s body.** It is unreachable on this host (`worktrees` is absent from the profile), so only its registration gate could be exercised; its behaviour rests on the mock-host suite, not on a live service.

---

## 6. Recommended next steps — for approval, not yet executed

1. **F1** — bind each primitive and the command to its service's lifetime via `ctx.inject(...)`; keep the "absent rather than broken" contract; re-verify with a cold-boot session on this host (the three primitives and `/swarm` must appear).
2. **F2 / F3 / F8** — gate the umbrella claim and the `/swarm` mentions on what is actually registered; make the printed block identical to the served block; correct the README wording.
3. **F4 / F5 / F6** — tighten the marker regexes, name the four verdicts in the worker prompt, and document the requirements-file block shape in §17.
4. **F7** — move the suites into the repository with relative imports and an `npm test` entry point.
5. **F9** — observe the dev route's install shape on a scratch profile before the README's wording is published.
6. **F10 / F11** — correct the provenance markers: the worker prompt's marker must say "plugin-authored glue quoting the user's text", and each out-of-band pointer paragraph gets its own marker.
7. **F12 / F13** — disclose the heading renumbering and the dropped chat lead-ins in the marker at `skills/swarm-engineering.md:6` / `:481`.
8. **F14 / F15** — reword the "absent" explanation to what the probe supports, and relabel the tool count.
9. **Re-review** after any change, against the same requirements file, with a lane per criterion.

Nothing above has been changed. The bundle, the profile and the host configuration are exactly as they were at commit `232e218`.
