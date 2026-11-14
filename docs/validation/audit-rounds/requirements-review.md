# Swarm Workflow Bundle — Review Requirements

Work item: `swarm-workflow-review`
Subject under review: the DSH bundle at `D:\project\dsh-plugins\swarm-workflow` (commit `232e218`, clean tree, in sync with `origin/main`).
Written by: the Coordinator, before dispatching the review lanes (per `skills/swarm-engineering.md:601` and `:636-654`).

Scope of the review: the bundle as published — its runtime code, its shipped text, its packaging and its documentation, judged against the method the bundle itself ships (`skills/swarm-engineering.md` §16 *Requirement Matching* and §17 *Requirement handover*).

Out of scope: any change to the bundle, the profile, the host configuration, or the installed plugin rows. This work item is READ-ONLY. A lane that finds a defect reports it; it does not fix it.

How to report: one verdict per requirement below, with the evidence that supports it (`met` / `not met` / `not demonstrated` / `not in scope`), plus two checks — does the check discriminate (would it fail if the behaviour were wrong), and is the behaviour the one the requirement asked for (`skills/swarm-engineering.md:628`). A verdict without evidence is `not demonstrated` (`:626`).

### C1 — The bundle activates as a plugin and ships its three artefacts
The bundle must activate on a DSH profile and expose exactly the three artefacts it claims: the orchestration policy prompt, the worker prompt, and the `swarm-engineering` skill.
check: `cordis.patch.yml` inserts a row with `id: swarm-workflow` and `name: 'dsh-swarm-workflow'` in the nested `- insert:` dialect (a flat `- id:` entry is parsed as an id-targeted override and contributes zero rows); `package.json` exports/files include `index.js`, `client.js`, `swarm-prompt.md`, `swarm-worker-prompt.md` and `skills/swarm-engineering.md`; the installed copy under the desktop profile's `node_modules` contains the same artefacts as the checkout.
source: `D:\project\dsh-plugins\swarm-workflow\cordis.patch.yml`; `package.json`; `README.md`; `C:\Users\leroy\.dsh\profiles\desktop\node_modules\dsh-swarm-workflow`

### C2 — Prompt assembly is capability-gated and leaks no internal markers
The plugin must render the shipped prompts from the live tool registry: a host fact whose `swarm:requires` surfaces are absent on this host must be dropped, the `<!-- swarm:requires … -->` markers must never reach the user, and the rendered block must say what it probed.
check: `renderPrompt` in `index.js` drops a bullet whose required surfaces are missing, strips the markers, and renders the "Host capabilities — probed live" / "— not probed" heading and a non-zero tool count; the same gating applies to the worker prompt; the rendered output contains no `swarm:` marker string; the check fails if the behaviour is wrong (a marker leaks, a missing surface is advertised, or an empty registry still reports a positive tool count).
source: `index.js` (`renderPrompt`, marker parsing); `swarm-prompt.md:241-264`; `swarm-worker-prompt.md:46-62`; the baseline suite `D:\project\.swarm-lab\rounds\tools\test-render-prompt.mjs`

### C3 — The three host-backed primitives are registered only when the backing service exists, and behave as documented
The bundle adds three thin pass-throughs over host services — `swarm_worktree` (worktrees), `swarm_task` (agent teams), `swarm_child` (subagents). A tool must exist only when its service exists, and each tool must do what the README says it does.
check: with a host that has no `worktrees` / `agentTeams` / `subagents` service, only the remaining tools are registered and each missing tool is absent rather than broken; `swarm_task` resolves the calling member's own team ancestry (not a global root) and discloses the acting member and its authority; `swarm_child` lists child lanes with their mode, steers a continuable child and stops a live one.
source: `index.js:445-447` (service map), `index.js:531/543/555` (`optionalService`), `index.js:680-930` (tool bodies); `README.md` ("What it adds"); the baseline suite `D:\project\.swarm-lab\rounds\tools\test-swarm-tools.mjs`

### C4 — Requirement Matching and Requirement handover reach the lanes that must report against a requirement
The skill's §16 and §17 are the bundle's own reporting contract. Every lane that must report against a requirement has to be told where the rule lives, what a verdict is, what evidence is required, and where the requirement text lives.
check: the worker prompt names both sections and states that §16 binds the Reviewer (one verdict per requirement with evidence, two checks per requirement) and that §17 puts the requirement text in `.swarm/requirements/<work-item>.md` with `file:line` citation and conflict reporting; the skill carries §16 and §17 as sections a worker can read; the Coordinator prompt points at them; the rule is reachable from the lane's own served prompt (no separate file to open that the lane is not told about).
source: `skills/swarm-engineering.md:615-654`; `swarm-worker-prompt.md:12`; `swarm-prompt.md:265` (Coordinator practice band)

### C5 — The user's own documents are shipped verbatim, with host facts separated
The bundle must not rewrite the user's text. The policy prompt and the skill are the user's documents; the plugin adds host facts in clearly delimited bands.
check: a strict line-by-line comparison of the recovered originals against the shipped files accounts for EVERY line of the originals: each original line appears unmodified in the shipped file, and every shipped line that is not in the original is either one of the documented deviations (the pointer line the user asked to change, the relocated subsection headings, the chat lead-in lines) or inside a plugin-added band that begins at a `<!-- Added by the dsh-swarm-workflow plugin … -->` marker. A missing-lines-only check does not satisfy this requirement; an altered line counts as a violation.
source: `D:\project\.swarm-lab\policy_hit_1.txt` (the user's policy, 327 lines); `D:\project\.swarm-lab\user_skill_paste.md` (the user's skill paste, 481 lines); band markers at `skills/swarm-engineering.md:606`, `:613`, `:634` and `swarm-worker-prompt.md:44`

### C6 — Every host claim in the shipped text matches the live host
The shipped text asserts facts about the host (which tool surfaces exist, what the registry looks like, what the plugin adds). Those claims must be true for the host the bundle runs on.
check: each host claim in the shipped bands is checked against a live registry of this host — the plugin primitives `swarm_worktree` / `swarm_task` / `swarm_child`, the delegation surfaces `subagent` / `subagent_fork` / `workflow`, and the team surfaces `spawn_teammate` / `team_task_*` — and against the text actually served to an agent in this session. A claim that is stale, overbroad, or contradicts the live host is a violation.
source: `swarm-prompt.md:241-264`; `swarm-worker-prompt.md:46-62`; the served system prompt of this session; the live registry of the reviewing agent

### C7 — The packaging and install surface is internally consistent
The scope of the bundle appears in several places; they must agree, and the documented install route must match what the code does.
check: the bundle/scope name in `package.json` (`name`), the patch row (`name`), the client plugin module id (`client.js`) and the skill's source path in `index.js` all refer to the same bundle; the README's install route (`github:vanpipy/dsh-swarm-workflow`), its uninstall instructions and its local-development route match the code and the actual install state of the desktop profile.
source: `package.json`; `cordis.patch.yml`; `client.js`; `index.js` (skill registration); `README.md`

### C8 — The `/swarm` command exists, prints the live capability block, and is advertised only when registered
The bundle advertises a slash command that prints the live host capability block.
check: the command is registered by the plugin, its output matches the block served to an agent, and the "/swarm" line appears in the shipped text only when the command is actually registered in the host.
source: `index.js` (command registration); `README.md`; the served prompt of this session; `D:\project\.swarm-lab\rounds\tools\test-render-prompt.mjs`

### C9 — The bundle's verification travels with the bundle
The evidence a reviewer of the published bundle needs must be reachable from the published bundle, not only from the machine it was developed on.
check: a fresh clone of the published repository can run the bundle's own verification without absolute paths into another directory; `package.json` exposes a test entry point, or the README documents where the suites live and how to run them; the suites' imports are not hardcoded to an absolute path under `D:\project\.swarm-lab`.
source: `package.json` (no `scripts.test`); `D:\project\.swarm-lab\rounds\tools\test-render-prompt.mjs:11`; `D:\project\.swarm-lab\rounds\tools\test-swarm-tools.mjs:15`
