# A2 — Audit the plugin CODE and design the wiring that makes the plugin use the host's own primitives

**Role:** Developer (investigation + design; you implement nothing).
**Your files:** `D:\project\.swarm-lab\rounds\AUDIT-CODE.md` (the only file you write).
**Read-only:** `D:\project\dsh-plugins\swarm-workflow\*`, the host, the profile.

## The question

`D:\project\dsh-plugins\swarm-workflow\index.js` is the plugin's HOST half. Today it does three things:
it registers one prompt section, one runtime skill, and one `/swarm` command. It **describes** the host
in prose (the "host facts" block) and it *probes* the host for a small set of tool names to decide what
to show.

The host is far bigger than that description. This round's instruction from the user: *"Audit the swarm
workflow plugin, ensure it can help dsh itself."*

Your question:

> **What can the plugin legitimately add, using the host's OWN services, so that the swarm workflow runs on
> the host's native features instead of working around them — and what would that take, exactly?**

Three candidates the previous rounds already hit as workarounds:

1. **Worktrees.** The host has a `worktrees` service (`create(agent, request)`) that creates *retained*
   git worktrees under the mounted filesystem and the sandbox providers. In the last ladder the Coordinator
   had to hand-roll `git worktree add` in a shell, and hit a stale-registration problem in the process.
2. **The team task board for delegated workers.** The host's `agentTeams` service carries the board
   (`createTask`, `getTask`, `listTasks`, `updateTask`). In the last ladder a **delegated worker could not
   reach the board at all** — the Coordinator had to claim and complete every task on the worker's behalf,
   and the ledger recorded that as a process defect.
3. **Steering and stopping a delegated worker.** The host's `subagents` service has `sendMessage` and
   `interrupt`. The agent-facing tool surface did not reach a *running* `subagent` (it answered
   "active teammate not found"), so a long-running delegated worker could neither be redirected nor
   stopped.

Your job is to produce the **exact design** for the wiring that closes these three gaps, plus a
considered answer to whether the plugin should also expose the host's own *questions* and *goals* paths
(the plugin's text already tells the Coordinator to put a product decision in front of the human and to
keep a session goal — check whether the host's own tools already do that, so the plugin does not
duplicate them).

## How to verify (do not guess)

1. `cordis_inspect_list` → `cordis_inspect_query` (`platform: "host"`, `provider: "Service"`,
   `method: "listService"`) for the directory, then again with `input: {"service": "<key>"}` for the exact
   contract of: `worktrees`, `agentTeams`, `subagents`, `tools`, `commands`, `goals`, `userQuestions`,
   `systemPrompt`, `agentPresets`. The directory output spills to a temp file — grep/read it, do not
   re-call it blindly.
2. Load the host's own skill `cordis-plugin-development` (call the `skill` tool with that exact name)
   for the correct shape of a tool definition and of a command definition in this harness, including
   how a plugin gets the CALLING agent and how scoping works.
3. Read `D:\project\dsh-plugins\swarm-workflow\index.js` in full (416+ lines) and the three markdown
   files it serves.
4. You may run read-only commands. You may NOT edit the bundle, the profile, or any repository, and you
   may NOT register anything in the live host.

## The deliverable

`D:\project\.swarm-lab\rounds\AUDIT-CODE.md`:

### Part 1 — what the plugin does today
A precise map of `index.js`: every registration, every hard-coded name list, every assumption, and the
line numbers. Include the `inject` declaration and whether the services it uses are declared in it.

### Part 2 — the three wirings, in design form
For each of worktrees / board / steering, give:
- the **exact host service contract** you verified (service key, method signature, request and result
  fields) with the inspect output that proves it;
- the **tool definition** you would register (name, description, parameter schema, what it returns) —
  written in the harness's own shape, taken from the plugin-development skill, not invented;
- **how it gets the calling agent** and what happens when there is none (an agentless assembly, a
  non-team agent);
- **the scope question**: should the tool be visible to a delegated worker, a native teammate and the
  Coordinator alike? What does the host's `tools.schemas(scope)` do with an unscoped registration, and
  what does the plugin's capability gating do to it (read the gating code in `index.js` before you answer);
- **failure modes** and what the tool must return when the service refuses;
- the **smallest test** that would prove it works, and where that test should live
  (`D:\project\.swarm-lab\rounds\tools\` holds the plugin's current unit test).

### Part 3 — what the plugin must NOT duplicate
Which host primitives the plugin should only *mention* because the host already provides the tool
(goals, questions, reminders, the ledger, the commands registry), and which it should *provide*.

### Part 4 — the risks
Registering host-backed tools from a plugin: lifetime, disposal, multi-session bleed, the capability
gating dropping a bullet whose tool is absent, the `inject` declaration, and what happens when the
service is missing in another profile.

### Part 5 — your limits
What you did not verify and what would need a live run to settle.

## Rules

- Design only. Do not edit `index.js`. Do not register a tool, command or skill in the live host.
- Every service claim must be traceable to an inspect query or a file:line you read.
- No file other than your report.
