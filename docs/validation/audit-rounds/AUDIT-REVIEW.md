# AUDIT-REVIEW — independent review of the uncommitted `@sages/swarm-workflow` change

Reviewer: delegated `subagent` (independent). Subject: the uncommitted working-tree change in
`D:\project\dsh-plugins\swarm-workflow` (branch `main`; ` M index.js`, ` M swarm-prompt.md`,
` M swarm-worker-prompt.md`; diffstat `index.js +399`, `swarm-prompt.md 9`, `swarm-worker-prompt.md +1`).
Authority read: `D:\project\.swarm-lab\rounds\AUDIT-CODE.md` (design, lane A2) and
`D:\project\.swarm-lab\rounds\AUDIT-TEXT.md` (shipped-text audit, lane A1).
Host truth: live `cordis_inspect_query` against the running Harness (`Service.listService`,
`Tool.listTools`). No bundle file was edited, no git write command was run, the plugin's own tools
were not called.

## Verdict

**ACCEPT WITH CORRECTIONS** — the wiring is sound, safe and mostly faithful (the board correctly
refuses a non-member's *write*, the host still owns every authority check, and the global
registration works), but nine Material defects must be fixed first: two of the shipped markdown
clauses state host facts that the live registry contradicts, and three tool contracts (the worktree
cwd side effect, the `stop` result, the `swarm_child` output schema) misdescribe what the code does.

## Findings

| id | severity | evidence (file:line / quoted contract) | what is wrong | smallest fix |
|---|---|---|---|---|
| F1 | Material | `swarm-prompt.md:255` — "…any live child of yours can be stopped — **the gap `interrupt_agent` leaves open, because that tool reaches native teammates only**"; live registry (`Tool.listTools`, spill line 1184-1191): `interrupt_agent` = "Ask a subagent to stop its current work…", `agent_id` = "**The id of an agent created under you: your direct child or a deeper descendant.**" | The premise is false. `interrupt_agent` reaches exactly the delegated children `swarm_child` claims to add, and a deeper descendant besides. There is no gap to fill. (`swarm-prompt.md:253` already says "`interrupt_agent` stops a running teammate without losing its inbox" — the two bullets now tell the model two different stories about one tool.) | Delete the clause "— the gap `interrupt_agent` leaves open, because that tool reaches native teammates only" and state the real difference: `swarm_child` adds a mode-aware roster (`continuable`/`one-shot`/`external`) and one call that does list+steer+stop. |
| F2 | Material | `swarm-prompt.md:249` — "…it is not a team member, so **`send_message` — which addresses native teammates by name — does not reach it**"; live registry (spill 1163-1170): `send_message` = "Send a message to an agent…", `agent_id` = "The agent id of **your direct continuable child**, or your direct parent when you are a resident continuable child."; `subagent_fork` (spill 1486+): "The child reports results with `send_message`; **use `send_message` to steer it while running or continue its conversation after it finishes**." | False on both counts: the tool named `send_message` takes an **agent id** (not a teammate name) and its target is a delegated *continuable child* — exactly a fork. This is AUDIT-TEXT finding **F1** re-introduced in new words: the "correction" restores the error the audit flagged. | Replace with the true statement: "a fork is a continuable child, so `send_message` reaches it — steer it with `send_message` (or `swarm_child`), or stop it with `swarm_child`." |
| F3 | Material | `index.js:768-771` (`subagents.interrupt(target, { kind: 'ancestor', agent })` → `return { stopped: target }`) and `index.js:731` render "**Stopped child ${value.stopped}. The cancel signal was issued**; the child may still be finishing its current step." Host contract: `interrupt` — "**An absent target is an accepted no-op**". AUDIT-CODE §2.3: the tool must report "no running child at that id; nothing was interrupted", "**not** a success that implies the worker was stopped". | A wrong or already-dead target is reported as a successful stop with a cancel signal. A Coordinator that typos the id will believe a runaway lane was stopped while it is still running. | Read the catalog (`subagents.listChildren`) first; if the target is not a live child of this session, throw/return "no running child at that id; nothing was interrupted" and do not claim a signal. Only claim a stop for a live child. |
| F4 | Material | `index.js:716-725` output schema `properties: { children, messageId, stopped }`, `additionalProperties: false`; `index.js:766` returns `{ target, messageId: String(messageId) }`; `index.js:732` renders `Steered ${value.target}: …` | Schema/runtime mismatch — `target` is returned but not declared, and `additionalProperties: false` forbids it. `render` reads a property the schema says cannot exist; if the host validates the result against `output.schema` the steer branch fails or degrades to "Steered undefined". | Add `target: { type: 'string' }` to the output schema (and keep `additionalProperties: false`). |
| F5 | Material | `index.js:610` — `await worktrees.create(agent, request)`; host signature `async create(agent: Agent, request: CreateWorktreeRequest = {}, signal?: AbortSignal)` with `signal` = "cancellation of lookup, creation, and working-directory publication"; AUDIT-CODE §2.1: "**`exec.signal` is forwarded as the service's `signal`**" | The signal is dropped. An aborted turn leaves a half-created branch/checkout (the host warns: "Failures may retain newly allocated Git/filesystem artifacts"). The two sibling calls do forward it (`index.js:741`, `index.js:765`) — inconsistent. | `await worktrees.create(agent, request, exec.signal)`. |
| F6 | Material | `index.js:577-601` — description and render say "Worktree ready / path / branch / base / repository" only; host: `create` = "Create a fresh branch and checkout at a pinned local revision, **then enter it**", `signal` = "…**working-directory publication**"; AUDIT-CODE §2.1/R10: "**Side effect the plugin must state, not hide.** … the tool's result must say so plainly — 'your working directory is now `<path>`'" | The caller's working directory silently becomes the new checkout and nothing says so. Because the tool is registered **globally**, any agent in the host can trigger it and then resolve its next relative path against a different directory. | Add a line to the render and to the description: "your working directory is now `<path>`" (and keep the failure path free of any cwd claim — the host only publishes the cwd after Git setup succeeds, so the current behaviour on failure is already correct). |
| F7 | Material | `index.js:473-486` `projectTask` keeps `writeScopeWarnings`; `index.js:640-650` output schema `task: { type: 'object' }` (no properties); `index.js:661` render prints subject/owner/ready/blocked by/write scopes/description but **not** the warnings; AUDIT-CODE §2.2: "`writeScopeWarnings` \| **returned verbatim**" | The scope-overlap warnings exist in the value but never reach the lane as text, and the schema does not declare the task shape either. The one signal that a lane is about to collide with another lane's write scope is invisible. | Render a `write scope warnings: …` line when non-empty, and declare the task properties (or `additionalProperties: true`) in the output schema. |
| F8 | Material | `index.js:654-661` — list branch prints "Read-only relay: this session is not a team member, so the board was read through a team root…" plus "acting session: ${value.actor}"; get branch prints only " (read-only relay: this session is not a team member)"; AUDIT-CODE §2.2(2): "**disclose the acting identity in the tool's output** ('acted as the Lead on behalf of `<worker id>`')" | The identity of the **acting credential** is never disclosed: the worker learns that a relay happened but not *which* root/Lead acted under it. R8's mitigation is half-implemented — the acting worker is named, the Lead is not. | Include the authority in the output, e.g. `acted as the team root <root id> (role: lead) on behalf of <worker id>`, and add the root id to the value (`authority` field). |
| F9 | Material | `index.js:628` enum `['list','get','claim','complete','release']`; `index.js:690-694` forwards `action` verbatim to `teams.updateTask`; host `TeamTaskAction = 'claim'\|'release'\|'edit'\|'set_dependencies'\|'complete'\|'reopen'\|'reassign'\|'delete'`; AUDIT-CODE §2.2: "`action: 'delete'` \| **refused by the plugin.**" | The refusal is delegated to the parameter schema, not implemented. Whether the host validates `arguments` against `parameters` before `execute` is **unverified** (the host implementation is inside `app.asar` and unreadable — see *Verified*). If it does not, a team member can delete a board task through this tool. | Explicit guard before the call: `if (action === 'delete') throw new Error('This tool refuses to delete a task.')`. |
| F10 | Minor | `index.js:671` (`teams.listTasks`), `index.js:680` (`teams.getTask`), `index.js:690` (`teams.updateTask`), `index.js:610` (`worktrees.create`), `index.js:765` (`subagents.sendMessage`) — none wrapped | Host errors reach the model raw: a stale revision (the design wants "error result naming current revision"), an unknown `task_id`, an existing branch name (Git output), a non-child steer target ("adjacency is rejected"). Non-leaking for most, but the Git path can carry raw command output. | Wrap each host call and rethrow with the action and the host reason: `throw new Error('swarm_task complete failed: ' + error.message)`. |
| F11 | Minor | `index.js:567` — `ctx.agents.roots().filter((root) => membershipOf(root) !== undefined)` then `roots[0]` (index.js:571); AUDIT-CODE §2.2(2): "walk **UP** to the nearest ancestor the SERVICE recognises"; R8: "**never escalate to an arbitrary root**"; host `agents.roots()` = "All live top-level agents in registration order… a resumed fork may still be a root" | The relay picks a *root*, not the nearest ancestor, and picks the first qualifying one. The host exposes no parent accessor (`agents` has only `roots/get/list/isOwnedBy`), so a multi-root session cannot distinguish "my ancestor" from "some other team's Lead". In a session holding two team roots, a delegated worker could read a **different team's** board. | Prefer the caller's own ancestry (`exec.parent` + `ctx.agents.isOwnedBy`); if more than one team root qualifies and none is an ancestor, refuse rather than pick `roots[0]`. |
| F12 | Minor | `index.js:117-124` adds a third `CAPABILITY_GROUPS` group 'Host-backed swarm primitives'; AUDIT-CODE §2.0: "Do **not** add plugin tools to `CAPABILITY_GROUPS` — that list is a host-surface list (`index.js:97-117`)" | The capability block says "Probed from this host's tool registry… **This list is the ground truth for this session**" and now lists this bundle's own three tools as host surfaces. Also redundant: `index.js:311-313` already adds marker-referenced missing tools to the "Absent in this session" line, so the marker alone reports the absence the design asked for. | Drop the third group (the `<!-- swarm:requires swarm_worktree,swarm_task,swarm_child -->` marker already gates the bullet and reports absence), or rename the group so it is clear these are this bundle's tools. |
| F13 | Minor | `swarm-prompt.md:256` — "A `subagent` is independent and starts with a clean context… if you must steer or stop it mid-run, use `swarm_child` — **a one-shot child cannot be steered**"; live `subagent` description (spill 1778+): "The child reports results with `send_message`; use `send_message` to steer it while running or continue its conversation after it finishes." | A `subagent` child is continuable, so attaching "a one-shot child cannot be steered" to the `subagent` case mislabels the common case and hides the fact that the host's own `send_message` already steers it. (The old wording — "A `subagent` is one-shot and independent… you will not steer or resume" — was the worse of the two; the new wording is an improvement but still wrong.) | Say that a `subagent` child is continuable and can be steered with `send_message` or `swarm_child`, and that only a one-shot/external child can be stopped but not steered. |
| F14 | Note | `index.js:828-835` — one `try { … } catch {}` around the whole registration loop | If the host refuses the second definition, the first stays registered and the third is never attempted (partial registration), and nothing is logged. Mitigation exists: the marker requires all three, so the bullet is dropped and the capability block lists what is missing. | Register each definition in its own `try/catch` so one refusal cannot skip the others. |
| F15 | Note | `swarm-prompt.md:255` and `swarm-worker-prompt.md:58` carry `<!-- swarm:requires swarm_worktree,swarm_task,swarm_child -->`; `index.js:364-378` — inside one marker ',' means ALL required | One missing tool removes the whole bullet, including the two tools that do work. Latent only, because all three are registered together or not at all. | Optional: one marker per bullet, or split into three bullets. |
| F16 | Note | `index.js:821-846` (global registration) + `index.js:560-572` (relay); this worker's own registry contains **no** `team_task_*`, `spawn_teammate` or `wait_agent` (verified by grep over the `Tool.listTools` spill) | Because the plugin registers globally, *any* non-member agent in the host session (including a reviewer's own subagent) can read the whole team board through the Lead's credential — a surface the host does not otherwise expose to non-members. The design sanctioned the relay (AUDIT-CODE §2.2(2)) and the output discloses that a relay happened (though see F8), so this is a note, not a defect. | If the Coordinator wants it tightened: restrict the relay to agents the plugin can attribute to a swarm lane, or make the relay opt-in per session. |

### Things that are correct — and why

- **`inject` did not grow** (`index.js:34` `['systemPrompt','agents','skills']`). The three new services
  are resolved defensively at call time (`optionalService`, `index.js:435-447`), and each missing
  service produces an actionable message naming the fallback (`index.js:507`, `index.js:519`,
  `index.js:531`). A host without `worktrees` loses one tool, never the plugin. This is exactly what
  AUDIT-CODE §2.0 demanded.
- **Global registration works and reaches delegated workers.** The live registry contains
  `swarm_worktree` (spill 641), `swarm_task` (659) and `swarm_child` (691) with descriptions and
  parameter schemas identical to `index.js`. No name collision; `run_code` is not used. The teardown
  disposes in reverse with a per-disposer `try/catch` (`index.js:836-844`) — correct.
- **The board refuses a non-member's write** (`index.js:686-689`) and never substitutes
  `ctx.agents.roots()[0]` for the *worktree* or *child* tools. The host keeps every authority check:
  `interrupt` throws `UNAUTHORIZED` "when the authority does not own the live target", `sendMessage`
  rejects adjacency, `listChildren(agent.id, …)` is scoped to the caller's own session id. A worker
  therefore cannot stop or steer another lane's child, and cannot move another lane's task.
- **The `swarm_task` description matches the code exactly** ("A team member reads and updates it as
  itself; a session outside the team reads it read-only through the team root") — member → read+write
  as itself, non-member → read-only relay. The worker-prompt clause "as a delegated worker outside
  the team it reads read-only through the team root, because the board belongs to the team and a
  session outside it may not move it" is faithful to `index.js:560-572` and `index.js:686-689`.
- **The compare-and-set is implemented** (`index.js:682-694`): a write without `expected_revision` is
  refused with a clear message, and there is no auto-retry.
- **The `ctx.systemPrompt.assemble({ agent, scope: agent })` clause was correctly removed.** The
  replacement ("What a worker actually receives is the text in this bundle… The one part that differs
  per session is the capability block, and `/swarm` prints it on demand") is faithful: the prompt is
  rendered from these files (`index.js:859`, `index.js:848-862`), the skill from
  `skills/swarm-engineering.md` (`index.js:792`), and `/swarm` prints the probed block
  (`index.js:864-903`).
- **`swarm_worktree`'s `name`/`from` semantics match `CreateWorktreeRequest`** ("Branch and checkout
  name. It must not exist yet." / "Defaults to the current HEAD."), and there is no silent retry with
  a mangled name (AUDIT-CODE R11 ✓).

## Verified

Checks actually executed (read-only):

1. **The diff.** `& 'C:\Program Files\Git\cmd\git.exe' -C 'D:\project\dsh-plugins\swarm-workflow' diff
   -- swarm-prompt.md swarm-worker-prompt.md` (full index.js diff read earlier). Confirms the three
   modified files and the exact before/after wording quoted in F1, F2, F13.
2. **The post-change source.** Read `index.js` in full (904 lines): `inject` (34), `CAPABILITY_GROUPS`
   (97-125), `toolService` (227-239), `probeToolNames` (250-280), `capabilityBlock` (290-330),
   `isLineSatisfied` (364-378), `SWARM_TOOL_NAMES` (422), `optionalService` (435-447), `textBlock`
   (454-456), `callingAgent` (463-466), `projectTask` (473-486), `buildSwarmTools` (499-776), `apply`
   (782-904). Every `file:line` above is from that read.
3. **Live host services** — `cordis_inspect_query` host/`Service`/`listService` with
   `{"service":"worktrees"|"agentTeams"|"subagents"|"tools"|"agents"}`. Confirms
   `worktrees.create(agent, request, signal?)`, `agentTeams.listTasks/getTask/updateTask/tryMembership`,
   `TeamTaskAction`/`TeamTaskView`/`UpdateTeamTaskRequest`, `subagents.listChildren/sendMessage/interrupt`,
   `SubagentCatalogEntry` modes, `SubagentInterruptAuthority`, `tools.register` ("duplicates within one
   layer and the reserved `run_code` name fail"), `ToolDefinition`/`ToolSchema`/`ToolOutputDefinition`/
   `ToolExecutionInput` (`agent?: Agent`, `signal: AbortSignal`), and that `agents` exposes **no**
   parent/ancestor accessor (only `roots/get/list/isOwnedBy`).
4. **Live tool registry** — `cordis_inspect_query` host/`Tool`/`listTools` (output spilled to
   `C:\Users\leroy\AppData\Local\Temp\dsh-spill-gsa0oP\session-c48f1c2fabd6\e709bf69c980-cordis_inspect_query.txt`).
   Verified: the three `swarm_*` tools are registered and visible to a **delegated worker** (lines
   641/659/691, schemas identical to `index.js`); `send_message` (1163) and its `agent_id` description
   (1170); `interrupt_agent` (1184) and its `agent_id` description (1191); `list_agents` (1200) and its
   `scope` description (1207); `subagent` (1778) and `subagent_fork` (1486) both stating
   "The child reports results with `send_message`…". Verified by grep over the spill file: this
   worker's registry contains **no** `team_task_*`, `spawn_teammate` or `wait_agent`.
5. **Host source availability** — `Test-Path 'D:\software\dsh\resources\app.asar\dsh'` → `False`;
   the implementation is inside the `.asar` archive and is not readable as files.
6. **Live evidence for F2** — this session *is* a delegated `subagent`, and the Coordinator reached it
   with `send_message`; the runtime's own `subagent`/`subagent_fork` descriptions say the same.

**Not run (out of scope or not possible):**

- The plugin's own tools (`swarm_worktree` / `swarm_task` / `swarm_child`) — prohibited by the
  assignment, and another probe is exercising them live.
- Any git write, any edit to a bundle file, any plugin install/enable, any network call, any agent
  spawn.
- **Not verifiable from here, and therefore assumed worst-case in the findings:** whether the host
  validates tool arguments against `parameters` before `execute` (this is what F9's risk depends on);
  whether the host validates the returned value against `output.schema` (F4's impact); exactly how a
  thrown error is materialized into a tool result (F10); and whether `render` receives undeclared keys
  such as `target` (F4). All four live inside `app.asar`.

## Design deviations

Every departure from `AUDIT-CODE.md`, with a judgement.

| # | deviation | judgement |
|---|---|---|
| D1 | **Three tools, not seven.** The design prescribed four board tools (`swarm_task_create/_get/_list/_update`) and two steering tools (`swarm_steer`/`swarm_stop`); the change ships one multi-action tool per host service (`swarm_worktree`, `swarm_task`, `swarm_child`). | **Right.** One action enum per service is more discoverable and matches the plugin's "thin pass-through" character. The cost is real but not claimed away: the plugin's board is a strict subset of the host's (`edit`, `set_dependencies`, `reassign`, `reopen` and the `owner`/`subject`/`description`/`blockedBy`/`writeScopes` request fields are not expressible), and the prompt does not claim parity ("reads and moves the shared board in one call", `swarm-prompt.md:255`). |
| D2 | **A non-member's *write* is refused, not relayed.** AUDIT-CODE §2.2(2) would have escalated writes to the Lead; `index.js:686-689` refuses them. | **Right — and safer.** AUDIT-CODE itself records that "whether `agentTeams.createTask` *accepts* a Lead caller for a write authored by a non-member is **not verified**", and the host withholds `team_task_*` from non-members (verified: this worker's registry has none). Refusing keeps the plugin out of the privilege-escalation path R8 warns about, and the tool description plus the worker-prompt bullet both state the read-only relay. The only thing lost is §2.2(2)'s "record the acting worker in the task" — moot when nothing is written. |
| D3 | **The acting worker is not recorded in the task** (`owner` on claim / in the description). | **Moot** given D2 (no write is ever relayed). For a team member, `updateTask` without an explicit `owner` lets the host assign the owner to the caller — the same thing the host's own `team_task_update` does. |
| D4 | **The acting identity is only half disclosed** — "acting session: `<worker id>`", never the Lead/root that acted (F8). | **Wrong.** R8's mitigation requires "disclose the acting identity in the tool's output ('acted as the Lead on behalf of `<worker id>`')". Fix F8. |
| D5 | **The relay walks to `roots[0]` rather than to the nearest ancestor the service recognises** (F11). | **Acceptable in the common case, wrong in principle.** The "the service itself recognises it" filter is the load-bearing part of R8 and it *is* implemented; picking a root rather than an ancestor is only safe because a host session normally has one root. `agents` exposes no parent accessor, so "nearest ancestor" is not directly reachable — `exec.parent` plus `agents.isOwnedBy` is the available approximation. Tighten per F11. |
| D6 | **`exec.signal` is not forwarded to `worktrees.create`** (F5). | **Wrong.** Explicit rule, one-argument fix. |
| D7 | **The worktree side effect (the caller's cwd changes) is not stated** (F6). | **Wrong.** Explicit rule ("Side effect the plugin must state, not hide"), and the most consequential omission in the change: a globally registered tool that silently moves every later relative path. |
| D8 | **The `stop` result does not distinguish an absent target** (F3). | **Wrong.** AUDIT-CODE named this exact case ("An absent target is an accepted no-op" → report "no running child at that id; nothing was interrupted", "**not** a success that implies the worker was stopped"). The host's fire-and-return semantics are already honoured in the render ("the child may still be finishing its current step") — only the absent case is missing. |
| D9 | **`action: 'delete'` is not refused in code** (F9). | **Wrong.** The design says "**refused by the plugin**"; the change relies on its own parameter enum, whose enforcement by the host is unverified. One guard line. |
| D10 | **`writeScopeWarnings` are not surfaced in the rendered output** (F7). | **Wrong.** Explicit rule ("returned verbatim"). One render line. |
| D11 | **Plugin tools added to `CAPABILITY_GROUPS`** (F12). | **Unnecessary deviation, minor.** The design reserved that list for host surfaces; the marker gating plus `index.js:311-313` already report a missing tool as absent, so the group adds a mislabel and no capability. |
| D12 | **Three tools registered globally in one `ctx.effect()`** (`index.js:821-846`). | **As prescribed** ("register all three wirings globally, in one `ctx.effect()`") and verified working from a delegated worker. |
| D13 | **`inject` left at `['systemPrompt','agents','skills']`**. | **As prescribed** ("`inject` stays… A missing service must disable **one tool**, never the plugin") and verified in the code. |
| D14 | **Missing `exec.agent` → a thrown `Error`, not a returned error result.** | **Equivalent.** The host materializes tool failures ("Tool and listener failures resolve as materialized error results"), and the message names the reason exactly as the design requires ("the tool returns an error result naming the reason"). No substitution of another agent occurs in the worktree or child tools. |

### Exit criteria

Satisfied: the change was read in full, the design and the text audit were read, the live host was
queried for every signature the change depends on, and every finding carries a file:line or a quoted
contract. Nothing was edited in the bundle; the only file created is this report.
