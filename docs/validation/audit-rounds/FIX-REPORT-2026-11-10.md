# Swarm Workflow Bundle — Fix Round

Date: 2026-11-10
Repository: `D:\project\dsh-plugins\swarm-workflow` (branch `main`, upstream `origin/main`)
Contract: `D:\project\.swarm\requirements\swarm-workflow-fixes.md` — one block per finding F1–F15, each with the requirement, the observable check and the source.
Previous phase (read-only review): `D:\project\.swarm-lab\rounds\FINAL-REVIEW-2026-11-10.md` — 9 criteria C1–C9, 5 independent lanes, 15 findings.

The user asked for every finding to be fixed, one at a time. Each fix was verified before it was committed. The user then approved the publish and the profile re-install: the branch is **pushed to `origin/main`** (`232e218..a6382e5`) and the profile's installed copy is **re-resolved to `a6382e5`** (see §7).

## 1. Method

Per the bundle's own §17 the requirements were written down before the work started (`swarm-workflow-fixes.md`, one block per finding with a `check:` line). Each finding was fixed in isolation, checked against its own block, and committed on its own. Where one file carried several findings, they landed in one commit — the per-finding verification trail is the record, not the commit count.

The user's own documents were not edited. A strict line-by-line comparison after the round confirms it (§4 below).

## 2. The findings, one by one

| # | Finding | Verdict | What changed | Evidence |
|---|---|---|---|---|
| F1 | **material** — the primitives and the `/swarm` command were dropped on a cold boot: the plugin sampled service availability once, inside a one-shot effect, and a service that was not yet active was lost for the whole session | fixed | `registerWhenAvailable(ctx, service, name, register)` (`index.js:520`) binds each registration to a child fiber that the host starts when the service resolves; `apply` uses it for the three primitives (`index.js:1068-1071`) and for the command (`index.js:1107`). The plugin's own `inject` list stays minimal (`index.js:41`) so a host that lacks a service still loads the plugin and still ships the prompt | `test/gating.test.mjs` scenarios A–E run against the **host's real runtime** (`file:///D:/software/dsh/resources/app.asar/node_modules/@deepseek-ai/cordis/lib/index.js`): services before apply → all three registered; services after apply → nothing until they arrive, then all three; a late `agentTeams` → only `swarm_task`; no service → no primitive |
| F2 | **material** — shipped prompt lines claimed the primitives are callable and that `/swarm` prints the block, with no gate on either | fixed | the ungated umbrella bullet now reads "The three primitives below are thin pass-throughs to the host's own services. Each is registered when the service behind it arrives; the capability block above reports this agent's registry, so read it before you plan around any of them." (`swarm-prompt.md:261`, `swarm-worker-prompt.md:58`); the `/swarm` claims were removed from the static prose (`swarm-prompt.md:254`, `:269`); the README's `/swarm` row carries its condition (`README.md:18`) | `test/render-prompt.test.mjs` (57 checks) — "the plugin primitives are not advertised as host surfaces"; `test-markdown-fixes.py` (32 checks, 0 failures) |
| F3 | minor — the block the command printed was not the block the prompt served | fixed | the command handler prints `capabilityBlock(names, { referenced, command: true })` (`index.js:1128`), so the `/swarm` line is in the command's own output | `test/gating.test.mjs` F3 checks: the command output carries the `/swarm` line and the probed-live header |
| F4 | minor — a `swarm:requires` marker that spans two lines leaked a fragment into the rendered prompt | fixed | the strip pattern matches across lines (`index.js:80`) and `collapseMarkers` (`index.js:358`) folds a two-line marker onto one line before the line-based gate (`index.js:369`, `:431`); a name containing whitespace is no longer treated as a tool name | `test/gating.test.mjs` F4/F4b: a readable two-line marker keeps its bullet with no marker text and no fragment; an unreadable one drops its bullet without taking the document with it; an unclosed marker does not delete the document |
| F5 | minor — the worker prompt summarised §16 without its verdict vocabulary or the names of the two checks | fixed | `swarm-worker-prompt.md:12` now names the four verdicts (`met`, `not met`, `not demonstrated`, `not in scope`), the discrimination check, the intent check and "A verdict without evidence is `not demonstrated`, never `met`." | `test-markdown-fixes.py` F5 checks |
| F6 | minor — the §17 example block did not match the format the Coordinator actually writes | fixed | the example is now a column-0 fence: `### <ID> — <short title>`, the requirement, `check: …`, `source: …` (`skills/swarm-engineering.md:644-647`) | `test-markdown-fixes.py` F6 checks |
| F7 | **material** — the published bundle carried no verification: the suites lived outside the repository and imported this checkout by an absolute path | fixed | `test/` ships with the bundle: `run.mjs` (the runner), `render-prompt.test.mjs`, `swarm-tools.test.mjs`, `gating.test.mjs`, `lib/cordis-model.mjs` (a portable model of the host's service semantics) and `lib/host-cordis.mjs` (the resolver for the real runtime); `package.json:17-19` gains `scripts.test`, and `test/` is in `files` (`package.json:16`); the README documents the suite (`README.md:151-166`) | the suite runs from a **fresh copy of HEAD** (`git archive` → temp dir) and passes; the runner exits **1** on a deliberately broken assertion and **0** after restoring it; the suite passes on the host's real runtime and on the local model |
| F8 | minor — the README stated the gating condition more favourably than the code delivered | fixed | the README now says the plugin waits for the service instead of sampling availability once (`README.md:20-29`) | matches the behaviour the gating suite proves (F1) |
| F9 | minor — the develop route asserted a link mechanism that was never established | fixed | the develop section states what is verifiable ("The bundle is installed from that path, so an edit is picked up after a re-apply") and no longer claims a junction | L3's evidence: one historical `link:` log against copy-style records |
| F10 | **material** — the worker prompt's marker claimed everything above it was the user's own text; 31 of 43 lines were plugin glue | fixed | the marker now separates "the USER's own text, quoted verbatim" from "the plugin's own glue" (`swarm-worker-prompt.md:44`) | `test-markdown-fixes.py` F10 checks; L4's line-level evidence |
| F11 | **material** — three plugin pointer paragraphs in the Coordinator prompt sat outside any band | fixed | each carries its own marker (`swarm-prompt.md:135`, `:188`, `:196`) | `test-markdown-fixes.py` F11 checks |
| F12 | minor — the markers claimed "relocated verbatim" while the headings were renumbered | fixed | the markers name the renumbering in both files ("the policy's section 6 became the skill's section 11, the policy's section 9 became the skill's section 12 and the policy's section 10 became the skill's section 13. The prose was relocated verbatim; the headings were renumbered.") | `test-markdown-fixes.py` F12 checks |
| F13 | minor — the skill's marker did not name the two dropped chat lead-ins | fixed | the marker names them (`skills/swarm-engineering.md:6`) | `test-markdown-fixes.py` F13 checks |
| F14 | minor — the "not probed" block and the umbrella bullet named a cause the probe cannot establish | fixed | the not-probed text says "The tool registry listed no tools for this agent while this prompt was assembled, so the swarm surfaces could not be probed."; the absent line says "— not in this agent's registry; do not plan around these." | `test/render-prompt.test.mjs` "raw: not-probed block present", "empty registry: no bullet dropped" |
| F15 | minor — the count line promised more than the probe can know | fixed | the count line is now "**Tools this agent's registry lists:** N — the registry's view of this scope; a listed tool can still be refused by the host's policy", and the lead-in says "a surface that is listed is registered for this agent now" | `test/render-prompt.test.mjs` "full: tool count reported", "empty registry: no zero tool count claimed" |

## 3. Verification that ran

| Suite | Result |
|---|---|
| `test/run.mjs` (the bundle's own suite: 3 suites) | ALL SUITES PASSED (3) — exit 0 |
| `test/gating.test.mjs` against the host's real cordis | all A–E, F3, F4 scenarios pass |
| `test/gating.test.mjs` against `test/lib/cordis-model.mjs` | all A–E, F3, F4 scenarios pass |
| `test/render-prompt.test.mjs` | ALL CHECKS PASSED (57) |
| `test/swarm-tools.test.mjs` | ALL CHECKS PASSED (63) |
| the same suite from a fresh copy of HEAD (`git archive`) | ALL SUITES PASSED (3) |
| the runner with a deliberately broken assertion | exit 1, "SUITE FAILED", restored → exit 0 |
| the lab baseline suites (`D:\project\.swarm-lab\rounds\tools\`) | both pass — unchanged semantics |
| the strict verbatim comparison of the user's documents | policy: 11 lines not present verbatim (1 pointer line the user asked to change + 10 renumbered headings, now disclosed); skill: 3 (2 chat lead-ins, now disclosed + the same pointer line) |

## 4. The user's documents are untouched

A strict line-by-line comparison of the recovered originals against the shipped files (`D:\project\.swarm-lab\rounds\review-scratch\strict_verbatim_check2.py` plus a whole-file membership pass) after the round:

* every line of `policy_hit_1.txt` (327 lines) appears verbatim in the shipped files except 11: the pointer line the user asked to change, and the 10 subsection headings that were renumbered when they moved into the skill (their prose is present verbatim; the renumbering is now disclosed in the markers).
* every line of `user_skill_paste.md` (481 lines) appears verbatim in the shipped skill except 3: the two chat lead-ins (chat text, not skill text — now named in the marker) and the same pointer line. The frontmatter is shipped verbatim at `skills/swarm-engineering.md:1-4`.

## 5. Re-review against the original nine criteria

| Criterion | Verdict | Note |
|---|---|---|
| C1 — activates as a plugin, ships its three artefacts | **met** | the patch row, the exports and the artefacts are unchanged and correct; the profile's installed copy now carries the fixed commit `a6382e5` — see §7 |
| C2 — capability-gated prompt assembly, no marker leaks | **met** | 57 checks + the new F4 scenarios |
| C3 — the primitives exist only with their service and behave as documented | **met** | the registration now waits for the service (proved against the host's real runtime); the behaviour is covered by the 63 tool checks |
| C4 — §16 and §17 reach the lanes that must report | **met** | the worker prompt now carries the verdict vocabulary and the two checks |
| C5 — the user's documents shipped verbatim, host facts separated | **met** | §4 above; every deviation is disclosed by a marker |
| C6 — every host claim matches the live host | **met in the bundle; the live confirmation is now one new session away** | the claims are now gated or reworded; the profile carries the fixed code, but a bundle's code is fixed for the life of a session, so this session's served block still shows the old text — see §6 |
| C7 — the packaging and install surface is consistent | **met** | the four scope names agree; the README no longer asserts an unproven link mechanism |
| C8 — `/swarm` exists, prints the live block, is advertised only when registered | **met** | the command waits for the command registry; the printed block now equals the served block; the README row carries the condition |
| C9 — the verification travels with the bundle | **met** | a fresh copy of HEAD runs the suite and passes |

## 6. What is not demonstrated, and what is left

1. **This session still runs the old bundle.** The fixes are published and the profile's installed copy is re-resolved to `a6382e5`, but a bundle's code is fixed for the life of a session: this session's served prompt therefore still shows the old text and the old "Absent in this session: `swarm_worktree` · `swarm_task` · `swarm_child`" line. **A new session is required** to see the new capability block.
2. **The live host has not confirmed the fix yet.** The gating suite proves the behaviour against the host's own cordis runtime, and the profile now runs the fixed code — but the profile's own boot order is the only place where the old code was observed dropping the primitives. A fresh session must show `swarm_task` and `swarm_child` in the capability block — `swarm_worktree` stays absent on this profile, because the profile has no `worktrees` service.
3. **The `worktrees` service is not in this profile.** `swarm_worktree` is expected to remain absent here; that is correct behaviour, not a defect.
4. **A side effect of the re-install.** `pnpm update dsh-swarm-workflow` re-resolved the whole profile lockfile and therefore also moved the profile's unrelated `billion-context` from `0.1.212` to `0.1.213` — a version the profile's `package.json` already declared as `^0.1.213`. The published lockfile now pins `dsh-swarm-workflow` to `#a6382e5463f2289950318c13f183d16d28e63e3d`.

## 7. Commits

```
a6382e5 docs: let the table row carry the condition too        README.md      F2
a4de498 docs: say how to run the suite                          README.md      F7
acd6acd test: ship the verification with the bundle             test/, package.json  F7
305a6cd fix: make the skill's own rules say what they mean      skills/swarm-engineering.md  F6, F12, F13
fc82106 fix: say what is true in this session, and mark what the plugin wrote   swarm-prompt.md, swarm-worker-prompt.md  F2, F5, F10, F11, F12
406af14 docs: state the gating behaviour the code delivers      README.md      F8, F9
fbdf9a3 fix: register what the host provides, and never leak a marker           index.js      F1, F3, F4, F14, F15
```

Base commit: `232e218` ("docs: one install route - the GitHub address"). The working tree is clean.

## 8. Publish and profile re-install

The user approved both steps. They happened on 2026-11-10:

| Step | Command | Result |
|---|---|---|
| push | `git push origin main` | `232e218..a6382e5  main -> main`, exit 0 — the first attempt failed inside the workspace sandbox with `schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS (0x8009030E)`, because git's HTTPS credential store lives outside the sandbox; the retry outside it succeeded |
| re-install | `pnpm -C C:\Users\leroy\.dsh\profiles\desktop update dsh-swarm-workflow` (run with the profile's bundled `node.exe`, with `C:\Program Files\Git\cmd` on `PATH`) | exit 0 in 4m13s; the installed copy now carries the fixed `index.js` (`registerWhenAvailable` at `index.js:520`, `buildSwarmToolDefinitions` at `index.js:592`, the new count label at `index.js:337`), the reworded prompts (`swarm-prompt.md:261`, `swarm-worker-prompt.md:12`) and the whole `test/` directory; the lockfile pins `dsh-swarm-workflow` to `#a6382e5463f2289950318c13f183d16d28e63e3d` |

The installed copy's own suite was run in place with the profile's `node.exe`: `ALL SUITES PASSED (3)`, exit 0. It reports `host runtime: not found on this machine` and runs the local model only — plain Node cannot read inside `app.asar` (an asar is an Electron feature), so the real-runtime leg of the gating suite only runs under Electron-as-Node.
