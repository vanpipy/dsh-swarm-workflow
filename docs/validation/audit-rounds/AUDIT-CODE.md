# AUDIT-CODE — What `@sages/swarm-workflow` can legitimately add on the host's **own** services

**Round:** A2 audit · **Role:** Developer (investigation + design only) · **Date:** 2026-11-08
**Plugin under audit:** `@sages/swarm-workflow` at `D:\project\dsh-plugins\swarm-workflow`
**Question answered:** *What can the plugin legitimately add, using the host's OWN services, so that the swarm workflow runs on the host's native features instead of working around them — and what would that take, exactly?*

**Rules honoured:** nothing was edited in the plugin, nothing was registered in the live host, nothing was installed, committed or pushed. The only file written is this report. Every service claim below is traceable to an inspect query or to a `file:line` I read.

---

## Part 0 — Evidence index and method

| # | Source | How obtained | Used for |
|---|---|---|---|
| E1 | `cordis_inspect_query` host / `Service` / `listService` `{"service":"worktrees"}` | inspect | worktree contract (Part 2.1) |
| E2 | `cordis_inspect_query` host / `Service` / `listService` `{"service":"tools"}` | inspect | tool definition shape, scoping, calling agent (Parts 2.0–2.3) |
| E3 | `cordis_inspect_query` host / `Service` / `listService` `{"service":"agentTeams"}` | inspect | board contract (Part 2.2) |
| E4 | `cordis_inspect_query` host / `Service` / `listService` `{"service":"subagents"}` | inspect | steering contract (Part 2.3) |
| E5 | `cordis_inspect_query` host / `Tool` / `listTools` | inspect | the 58-tool surface; the **absence** of `spawn_teammate`, `team_task_create/get/list/update`, `wait_agent` and any worktree tool (Parts 2.2, 2.3, 3) |
| E6 | `cordis_inspect_query` host / `Config` / `listConfigs` `{"name":"agent-team"}` and `{"name":"tool-agent-team"}` | inspect | both returned `{"entries": [], "total": 0}` — the team packages are not exposed under those names in this profile |
| E7 | `index.js` (505 lines, read in full) | read | Part 1 map, all line numbers |
| E8 | `swarm-prompt.md` (263 lines), `swarm-worker-prompt.md` (58 lines), `skills/swarm-engineering.md` | read | the gated prompt bullets the wirings must attach to |
| E9 | `package.json`, `cordis.patch.yml` | read | bundle/loader facts (Part 4) |
| E10 | host skill `cordis-plugin-development` → `SKILL.md` (50 lines) + `references/practices.md` (38 lines), base `D:\software\dsh\resources\app.asar\dsh\node_modules\@deepseek-ai\dsh-agent-preset\skills\cordis-plugin-development\` | skill + read | registration/disposal/scoping rules (Parts 2.0, 4) |
| E11 | `D:\project\.swarm-lab\rounds\tools\test-render-prompt.mjs` (110 lines, 45 checks) | read | where the smallest test lives and how it is written |
| E12 | `D:\project\.swarm-lab\rounds\HT-PLAN.md:8-16`, `FINDINGS.md:15,17`, `FINAL-VERDICT.md:163,191` | read | the three recorded workarounds, in the lab's own words |

**The three workarounds being designed away (E12):**

1. **Worktrees** — `HT-PLAN.md:10-15`: *"Created with `git worktree add -b swarm/lab10 <path> HEAD` after `git worktree prune` removed a stale, prunable entry… The host also exposes a `worktrees` service (`ctx.worktrees.create(agent, {name, from})` → `{path, branch, baseCommit, repositoryRoot}`), **but it is only reachable from plugin code, not from a tool**, so the swarm used the git mechanism the service wraps."*
2. **Board** — a delegated worker could not reach the board at all; the Coordinator had to claim and complete every task on the worker's behalf.
3. **Steering** — `FINDINGS.md:17` (F5): *"`send_message` to a running subagent returns 'active teammate not found'; `interrupt_agent` addresses team members only; there is no subagent kill."* `FINAL-VERDICT.md:163`: *"You cannot stop a running subagent."*

**Method note.** Every host contract used here was captured from an inspect query **before** the inspect provider began failing (see risk R12). No host source was modified and no service was called at runtime.

---

## Part 1 — Today's map of `index.js`

`D:\project\dsh-plugins\swarm-workflow\index.js` — 505 lines, ESM, one Host half. `client.js` is the client half; the three markdown files are what the agents read.

### 1.1 The three registrations the plugin owns

| # | Line(s) | Registration | Owner / disposer |
|---|---|---|---|
| R1 | `index.js:429-435`, wrapped by `439-447` | `ctx.skills.register({ name, description, content, source, whenToUse })` for the bundled `swarm-engineering` skill; re-registered when the file's mtime:size stamp changes (`419-437`) | `ctx.effect()` at `439-447` returns the disposer; `skillDisposer` is re-invoked on re-sync (`424-427`) |
| R2 | `index.js:449-463` | `ctx.systemPrompt.section({ name: 'swarm-workflow:swarm', order: 8000, interpolate: false, text(context) {…} })` — the section that ships the Coordinator or the worker prompt | `ctx.effect()` at `449` returns the section's disposer |
| R3 | `index.js:472-503` | `commands.register({ name: 'swarm', description, input: { hint: 'swarm' }, handler(invocation) {…} })` — the `/swarm` command | `ctx.effect()` at `472` returns the disposer; `commandRegistered` (`413`, `496`, `500`) tells the prompt whether to advertise the command |

**No tool is registered anywhere in the plugin today.** That is the single structural fact behind all three workarounds: the host's `worktrees`, `agentTeams` and `subagents` services have no model-facing surface at all, so an agent in a swarm can only reach them by shell (`git worktree add`) or not at all.

### 1.2 The `inject` declaration — and what it deliberately omits

```
index.js:34   export const inject = ['systemPrompt', 'agents', 'skills']
```

* **Declared (hard dependency):** `systemPrompt`, `agents`, `skills`. The plugin cannot load without them.
* **Used but NOT declared:** `tools` (fetched defensively by `toolService(ctx)` at `index.js:219-231`: `ctx.tools` first, then `ctx.get('tools')`, both in `try/catch`), and `commands` (fetched defensively at `index.js:465-470`).
* **Never mentioned at all:** `worktrees`, `agentTeams`, `subagents` — the plugin does not even ask whether they exist.

The plugin states the rule itself at `index.js:28-32`: *"The tool registry and the command registry are NOT declared here… because this bundle must still load — and still ship a prompt — on a host that has no command service at all. **A declared service that the host lacks would take the whole plugin down instead of one feature.**"*

That is exactly the pattern the three wirings must follow: **fetch the service defensively, register one feature, and let only that feature disappear.**

### 1.3 The hard-coded name lists

* **`CAPABILITY_GROUPS` (`index.js:97-117`)** — the hand-maintained list of host tool names the prompt reports on:

| Group | Tool | Line |
|---|---|---|
| Delegation | `subagent` | `101` |
| Delegation | `subagent_fork` | `102` |
| Delegation | `workflow` | `103` |
| Delegation | `spawn_teammate` | `104` |
| Coordination | `team_task_create` | `110` |
| Coordination | `create_goal` | `111` |
| Coordination | `todo_write` | `112` |
| Coordination | `ask_user_question` | `113` |
| Coordination | `schedule_create` | `114` |

  Two of these — `spawn_teammate` and `team_task_create` — are **absent from this session's tool surface** (E5), so they are printed under "Absent in this session" (`index.js:296-310`). The list is a *host* list: it names surfaces the plugin does not provide. It must not grow plugin-owned tools (see §2.0, "the gating interaction").

* **The marker language** — `REQUIRE_MARKER` (`index.js:62`), `REQUIRE_MARKER_STRIP` (`71`), `REQUIRE_MARKER_LOOSE` (`74`). Inside one marker `,` = all required, `|` = one of (documented at `index.js:53-55`). A marker that cannot be parsed is treated as **unsatisfied** (`index.js:356-370`), i.e. a bullet whose requirement is unreadable is dropped.

### 1.4 The capability probe

* `probeToolNames(ctx, context)` — `index.js:242-272`. Scope = `ctx.agents.get(agent.id) ?? agent` (`246-247`); cache key = `String(scope.id ?? 'scope')` (`248`); **TTL 5 s** (`CAPABILITY_TTL_MS`, `index.js:91`, used at `251`); reads `tools.schemas(scope)` then falls back to the global view (`254`, `259-265`); an empty registry is treated as **not probed**, not as "nothing exists" (`259-269`, and again in `renderPrompt` at `386`).
* `capabilityBlock(names, options)` — `index.js:282-322`: the "## Host capabilities — probed live" block; per-group present tools (`292-295`); an "Absent in this session" line built from `CAPABILITY_GROUPS` **plus every tool named by a prompt marker that is missing** (`296-310`); a `/swarm` line when the command registered (`311-313`); a tool count (`314`).
* `renderPrompt(raw, names, options)` — `index.js:383-404`, the one exported unit (`:383`) — drops gated lines, strips markers, replaces `<!-- swarm:capabilities -->` with the live block.

### 1.5 The assumptions the plugin embeds

| # | Assumption | Where | Why it becomes load-bearing now |
|---|---|---|---|
| A1 | the host has `systemPrompt`, `agents`, `skills` | `index.js:34` | unchanged |
| A2 | `tools.schemas(scope)` takes the **Agent object** as the viewing scope | `index.js:254` | the plugin's probe is exactly the mechanism a plugin-registered tool changes — see §2.0 |
| A3 | the tool registry exposes **model-facing** schemas | `index.js:255` | the plugin's tool names become visible to the plugin's own probe |
| A4 | a delegated worker is never a root | `index.js:205-212` (`ctx.agents.roots()`) | the Coordinator/worker prompt split; also the starting point for the board's authority walk (§2.2) |
| A5 | `ctx.get(name)` may throw for a missing service | `index.js:222-229`, `467-469` | the pattern the three wirings must copy for `worktrees`/`agentTeams`/`subagents` |
| A6 | a service may refuse a registration without breaking the plugin | `index.js:498-501` (command), `454-458` (skill) | the model for "one feature disappears, the prompt still ships" |

### 1.6 What the plugin does *not* do today

It never asks the host whether `worktrees`, `agentTeams` or `subagents` exist; it never registers a tool; it never reaches the session log, the board, or a git worktree through a service. Its only contact with the live host beyond prompts/skills/commands is the **tool-name probe**.

---

## Part 2 — The three wirings

### 2.0 The shared frame (read this before the three)

**Where a plugin tool gets its caller.** From the `tools` contract (E2): `ToolDefinition extends ToolSchema { … execute(args: unknown, exec: ToolRunContext): Promise<unknown> }`, `ToolRunContext extends ToolExecution extends ToolExecutionInput`, and `ToolExecutionInput { … readonly agent?: Agent; readonly parent?; readonly signal: AbortSignal }`.

* **The calling agent is `exec.agent`, and it is OPTIONAL.**
* All three services need a live `Agent` as the *actor*:
  * `worktrees.create(agent, …)` — "caller whose current directory selects the source repository and file policy" (E1);
  * `agentTeams.createTask(caller, …)` / `updateTask(caller, …)` — "exact live Team member" (E3);
  * `subagents.sendMessage(sender, …)` — "The service derives durable sender attribution from the exact live sender" (E4).
* **Design rule:** when `exec.agent` is `undefined` the tool returns an error result naming the reason. It must **never** substitute `ctx.agents.roots()[0]` or any other agent: that would attribute the caller's action to a different session, and for the board, to a different Lead.

**Scope — `tools.schemas(scope)` with an unscoped registration.** From E2: `register(definition)` — *"Register globally or in the calling agent scope. Scoped tools shadow globals; duplicates within one layer and the reserved `run_code` name fail."*; `schemas(scope?)` — *"scope: the viewing scope (the agent); omitted = the global view."*

* A registration made on the **plugin's own `ctx`** is **global**: it is in the global view *and* in every agent's scoped view (the scoped view is the global set plus that scope's own).
* A registration made on **`agent.ctx`** is **scoped** to that agent: it is in that agent's view only, and **not** in the global view.

Consequence for the plugin's own gating (`index.js:246-254`, which prefers the scoped view and falls back to the global view):

| Registration | `tools.schemas(scope)` for the Coordinator | for a delegated worker | prompt bullet gated on it |
|---|---|---|---|
| global (on the plugin `ctx`) | contains it | contains it | kept for everyone |
| scoped (on `agent.ctx` of one agent) | missing (unless that agent *is* the Coordinator) | present only for that agent | **kept for the worker, silently dropped for the Coordinator** |

**Recommendation: register all three wirings globally**, in one `ctx.effect()`, exactly in the style of `index.js:472-503`. The action is still session-local in every case — the service acts on `exec.agent`, and for steering the service itself enforces the ancestor relation (`SubagentError` `UNAUTHORIZED`, E4). Scoped registration would only buy a smaller blast radius at the price of an asymmetric prompt, which is the failure mode the plugin exists to prevent.

**The gating interaction — what the plugin's capability gating does to a plugin-registered tool.**

1. A **global** plugin tool appears in `tools.schemas(scope)` for every agent, so `probeToolNames` sees it and a prompt bullet gated on it survives. This is the mechanism that makes the plugin's own surfaces self-reporting.
2. The "Absent in this session" line is built from `CAPABILITY_GROUPS` **plus every marker-named tool that is missing** (`index.js:303-305`). So a plugin bullet gated on `swarm_worktree` automatically makes `swarm_worktree` appear in the absent line when the plugin's tool did not register. **That is the mechanism to reuse; `CAPABILITY_GROUPS` stays a list of host surfaces.**
3. The probe has a **5-second TTL** (`index.js:91`, `251`). Registering the plugin's tools at `apply()` time (not lazily per agent) removes the race: the very first prompt assembly already sees them. If a tool were registered later, a bullet could stay dropped for up to 5 s.
4. If the plugin's tool registration **fails**, the plugin's bullets vanish *and* the block says why — the fail-safe is already correct. The plugin only has to not swallow the error silently.

**Lifetime and disposal.** `references/practices.md:8`: *"Registrations are effects owned by a context… A registration on another context, such as `agent.ctx`, has two owners: keep its disposer in your plugin's own effect too, so either teardown removes it."* A global registration on the plugin's own context has one owner: the plugin's effect. Return the disposer from `ctx.effect(() => …)` — the same shape as `index.js:472-503`.

**Optional services.** `worktrees` is documented as an *optional* access (`ctx.get("worktrees")`) in E1. `references/practices.md:20` says optional services belong in `inject` or `ctx.inject([...], …)`. **This plugin's own rule (E7, `index.js:28-32`) is stricter and wins here**: the plugin must stay *loaded and shipping its prompt* on a host that lacks these services, so `inject` stays `['systemPrompt','agents','skills']` and each service is fetched with the existing defensive pattern (`index.js:219-231` / `465-470`). A missing service must disable **one tool**, never the plugin.

**Naming.** `tools.register` fails on duplicates within one layer and on `run_code` (E2). The plugin's names must be unique and namespaced (`swarm_*`), because a *name collision between two host surfaces* is the mechanism behind the recorded steering failure (§2.3).

---

### 2.1 Wiring 1 — Worktrees: give the swarm the host's `worktrees` service

**Verified contract (E1, host key `worktrees`, description "Creates retained Git worktrees under the mounted filesystem and sandbox providers."):**

```
async create(agent: Agent, request: CreateWorktreeRequest = {}, signal?: AbortSignal): Promise<CreatedWorktree>
```

| Parameter | Meaning (verbatim) |
|---|---|
| `agent` | "caller whose current directory selects the source repository and file policy" |
| `request` | "optional new name and local revision; defaults are generated name and HEAD" |
| `signal` | "cancellation of lookup, creation, and working-directory publication" |
| returns | "canonical checkout path, branch name, pinned commit, and source repository root" |

Types: `CreateWorktreeRequest { name?: string; from?: string }`; `CreatedWorktree { path: string; branch: string; baseCommit: string; repositoryRoot: string }`.

Service description, verbatim: *"Create a fresh branch and checkout at a pinned local revision, then enter it. Existing branches or checkout paths fail. Uncommitted files stay in the source checkout. Checkout disables configured clean, smudge, and process filters without changing Git config. Repository-local replacement refs still apply; baseCommit reports the resolved object name. The new checkout becomes current only after Git setup succeeds. Failures may retain newly allocated Git/filesystem artifacts; no branch or checkout is removed automatically."*

**What this replaces:** `HT-PLAN.md:10-15` — the hand-rolled `git worktree add` plus `git worktree prune` for a stale registration. The service *is* the mechanism the ladder hand-rolled, and it refuses an existing branch or path for the same reason.

**Tool definition (the harness's own shape — E2).**

```js
// registered inside ctx.effect(() => { … return disposer })
{
  name: 'swarm_worktree',
  description:
    'Create an isolated git worktree for the calling agent: a fresh branch and checkout at a pinned local ' +
    'revision, entered as the caller\'s working directory. Returns the checkout path, branch, base commit ' +
    'and source repository root. Use it to give each parallel lane its own checkout instead of sharing one ' +
    'working tree.',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Optional branch/worktree name. Defaults to a generated name.' },
      from: { type: 'string', description: 'Optional local revision to branch from. Defaults to HEAD.' },
    },
    additionalProperties: false,
  },
  output: {
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string' }, branch: { type: 'string' },
        baseCommit: { type: 'string' }, repositoryRoot: { type: 'string' },
      },
      required: ['path', 'branch', 'baseCommit', 'repositoryRoot'],
    },
    render(args, value) { return [{ type: 'text', text: `Worktree ready: ${value.path} (branch ${value.branch} @ ${value.baseCommit})` }] },
  },
  async execute(args, exec) { /* §2.1 "the calling agent" */ },
}
```

**The calling agent.** `exec.agent` is passed straight through as the service's `agent` — the service's own words make the caller the actor: *"caller whose current directory selects the source repository and file policy"*. Consequences:

* The tool acts on the **caller**, never on a named target. There is no `for_agent` parameter.
* `exec.agent === undefined` → return an error result: *"No calling agent: `worktrees.create` needs the caller's Agent (its current directory selects the source repository and file policy). Run this from an agent session."* The service is never called.
* `exec.signal` is forwarded as the service's `signal`, so an aborted turn cancels the lookup, the creation and the working-directory publication.

**The scope question.** Global registration (see §2.0): every agent can isolate itself; the service scopes the action to the caller's own cwd, so a global tool does not leak a checkout across sessions. A scoped registration would make the Coordinator's prompt drop the bullet while the worker's keeps it.

**Side effect the plugin must state, not hide.** "then enter it" plus "working-directory publication" (E1) means the caller's effective working directory becomes the new checkout. Two consequences:

* **Worker-side call (recommended).** The Coordinator delegates with `cwd: <repo root>`; the worker calls `swarm_worktree` itself; the worker ends up in its own branch and checkout, and the Coordinator's cwd never moves. The plugin's worker prompt gains one sentence and one gated bullet.
* **Coordinator-side call.** The Coordinator's own cwd moves to the new checkout. The tool's result must say so plainly — *"your working directory is now `<path>`"* — and the Coordinator returns with the host's own `working_directory` tool (already present, E5; the plugin must not re-implement it, see Part 3). The returned `path` is also what the Coordinator passes as `cwd` to `subagent`/`subagent_fork`.

**Failure modes — what the tool returns when the service refuses.**

| Host condition (E1) | Tool result |
|---|---|
| "Existing branches or checkout paths fail" | error result carrying the service's message verbatim; **no silent retry with a mangled name** — the contract also says *"Failures may retain newly allocated Git/filesystem artifacts; no branch or checkout is removed automatically"*, so a retry can litter |
| "Uncommitted files stay in the source checkout" | not an error, but the result text must say the dirty files did **not** travel |
| "The new checkout becomes current only after Git setup succeeds" | a failure leaves the caller's cwd unchanged — the tool must not claim a new cwd |
| git missing / not a repository | the service's error is returned verbatim |
| `exec.signal` aborted | aborted result; the tool must not report a checkout that was never published |

**The smallest test** — `D:\project\.swarm-lab\rounds\tools\test-swarm-tools.mjs`, a new sibling of the existing `test-render-prompt.mjs` (110 lines, 45 checks, E11), importing from `file:///D:/project/dsh-plugins/swarm-workflow/index.js` the same way that file does. The worktree tool's `execute` must be reachable from a unit test, which means `index.js` exports a tool factory (today it exports only `renderPrompt` at `:383` and `apply` at `:410`) — that export is the only structural change the design implies, and it changes no runtime behaviour.

Checks (a fake `ctx.worktrees` that records calls, never a live service):

1. `create` is called with **the `exec.agent` object** and with `name`/`from` mapped 1:1 into the request.
2. `exec.agent === undefined` → an error result, and `create` was **never** called.
3. The service rejects (`"Existing branches or checkout paths fail"`) → the tool returns an error result containing that text and does not throw.
4. The service resolves → the tool's result carries `path`, `branch`, `baseCommit`, `repositoryRoot`, and its text states the caller's new working directory.

---

### 2.2 Wiring 2 — The board: give a delegated worker the host's `agentTeams` board

**Verified contract (E3, host key `agentTeams`, description "Agent Teams service backed by the exact live Lead Session log."):**

```
async createTask(caller: Agent, request: CreateTeamTaskRequest): Promise<TeamTaskView>
getTask(caller, id): TeamTaskView
listTasks(caller): TeamTaskView[]
async updateTask(caller, request): Promise<TeamTaskView>
membership(agent): TeamMembership
tryMembership(agent): TeamMembership | undefined
listMembers(agent): TeamMemberView[]
```

| Method | Contract text (verbatim) |
|---|---|
| `createTask` | "Create one unowned pending task in the Team Lead log"; `caller` = "exact live Team member creating the task" |
| `updateTask` | "Compare-and-set one authorized task transition" |
| `tryMembership` | "Resolve a caller without throwing, used by scoped-tool installation and observers… returns Team membership, or undefined for non-Team subagents and stale identities" |
| `listTasks` / `getTask` | read the Lead's task board |

Types: `CreateTeamTaskRequest { subject, description, blockedBy?, writeScopes? }`; `UpdateTeamTaskRequest { taskId, expectedRevision, action, subject?, description?, blockedBy?, writeScopes?, owner? }`; `TeamTaskAction = 'claim'|'release'|'edit'|'set_dependencies'|'complete'|'reopen'|'reassign'|'delete'`; `TeamTaskStatus = 'pending'|'in_progress'|'completed'|'deleted'`; `TeamTaskView { id, revision, subject, description, status, blockedBy, writeScopes, ownerName?, ready, writeScopeWarnings }`; `TeamMembership { root, id, role: 'lead'|'teammate', name }`.

**The measured gap.** The `agentTeams` **service** exists (E3) but the board has **no tool surface in this session**: `host/Tool/listTools` (E5) returns 58 tools and among them there is no `team_task_create`, `team_task_get`, `team_task_list`, `team_task_update`, no `spawn_teammate` and no `wait_agent`. The board exists; a worker cannot reach it. That is the exact shape of the recorded defect.

**The hard part — the caller must be a Team member.** `createTask`/`updateTask` demand "exact live Team member", and `tryMembership` "returns … undefined for non-Team subagents". A delegated `subagent` worker is **not** a Team member, which is why the Coordinator had to claim and complete every task on the worker's behalf.

**Design (primary path + honest refusal).**

The plugin registers **four namespaced tools** — `swarm_task_create`, `swarm_task_get`, `swarm_task_list`, `swarm_task_update` — mirroring the host's own four-tool shape (so a future native `team_task_*` set can replace them without a name clash) and each mapping 1:1 onto one service method. One tool per method keeps each parameter schema small and each prompt marker exact.

*Authority resolution for a caller that is not a Team member:*

1. `tryMembership(exec.agent)` → if defined, the caller **is** a Team member: use `exec.agent` as the service's `caller`. Nothing is escalated.
2. If undefined, walk **up** the agent tree (`ctx.agents`) to the nearest ancestor the service itself recognises (`tryMembership(ancestor) !== undefined` — typically the session Lead). Use that ancestor as the service's `caller`, because the board *is* the Lead's log (E3) — and record the acting worker in the task (`owner` on `claim`, and in the description), and **disclose the acting identity in the tool's output** ("acted as the Lead on behalf of `<worker id>`").
3. If no ancestor is a Team member → the tool **refuses** and returns the host's own reason ("this session has no Team"), rather than writing to some other board.

**Limits of this design, stated up front:** whether `agentTeams.createTask` *accepts* a Lead caller for a write authored by a non-member is **not verified** (see Part 5). The service's wording ("exact live Team member creating the task") may be an authorization check that rejects it. The tool therefore must surface the service's refusal verbatim rather than paper over it, and the plugin's worker prompt must keep the existing fallback (report to the Coordinator) as the guaranteed path.

**Tool definition (shape per E2).**

```js
{
  name: 'swarm_task_update',
  description:
    'Move one shared board task: claim, release, edit, set_dependencies, complete, reopen or reassign. ' +
    'The transition is compare-and-set — read the task first and pass the revision you read. ' +
    'The board is the session Lead\'s log; a worker\'s call is recorded against the worker that made it.',
  parameters: {
    type: 'object',
    properties: {
      taskId: { type: 'string', description: 'The task id, as returned by swarm_task_get or swarm_task_list.' },
      expectedRevision: { type: 'number', description: 'The revision the caller last read.' },
      action: { type: 'string', enum: ['claim','release','edit','set_dependencies','complete','reopen','reassign'],
                description: 'The transition to apply. Deletion is not offered here.' },
      owner: { type: 'string', description: 'Optional owner name for claim/reassign.' },
      subject: { type: 'string' }, description: { type: 'string' },
      blockedBy: { type: 'array', items: { type: 'string' } },
      writeScopes: { type: 'array', items: { type: 'string' } },
    },
    required: ['taskId', 'expectedRevision', 'action'],
    additionalProperties: false,
  },
  output: {
    schema: { type: 'object', properties: { id: {type:'string'}, revision: {type:'number'}, status: {type:'string'},
                   ownerName: {type:'string'}, ready: {type:'boolean'} },
              required: ['id','revision','status','ready'] },
    render(args, value) { return [{ type: 'text', text: `Task ${value.id} is now ${value.status} (revision ${value.revision})` }] },
  },
  async execute(args, exec) { /* §2.2 */ },
}
```

**The calling agent.** `exec.agent` is the *acting* agent. It is required: with `exec.agent === undefined` the tool refuses and calls nothing. When the acting agent is not a Team member, the **authority** agent (nearest recognised ancestor) is what goes into the service call, and the **acting** agent is what is recorded in the task and disclosed in the output. The two are never conflated.

**The scope question.** Global registration. The board is deliberately visible to the worker: the whole point of the wiring is that the worker can claim and complete its own task. The service, not the visibility, is the guard — `createTask`/`updateTask` require a live member and `updateTask` is an authorized compare-and-set transition.

**Failure modes — what the tool returns when the service refuses.**

| Condition | Tool result |
|---|---|
| stale `expectedRevision` | error result: "the task changed since you read it (current revision N) — read it again". The plugin must **not** auto-retry the transition; a compare-and-set exists to make that impossible. |
| `tryMembership` undefined and no recognised ancestor | error result naming the host reason ("this session has no Team board") — the worker keeps reporting to the Coordinator |
| the service refuses a Lead-as-caller write | the service's message verbatim; no silent fallback to a different board |
| `TeamTaskView.writeScopeWarnings` non-empty | **returned verbatim** — the host is telling us the task's write scopes do not cover what the worker intends to touch; the warning must reach the model, not be swallowed |
| `action: 'delete'` | **refused by the plugin.** `TeamTaskAction` includes `delete`; a plugin-provided board tool should not expose destructive deletion of a shared artifact. The native surface (or the Lead) owns deletion. |
| `getTask` on a deleted task | the service's tombstone view is returned as-is (`TeamTaskStatus` includes `'deleted'`) |

**The smallest test** — same new file, `D:\project\.swarm-lab\rounds\tools\test-swarm-tools.mjs`, with a fake `ctx.agentTeams` that records the `caller` it received:

1. A Team-member caller is passed through **unchanged** to `createTask`.
2. A non-member worker escalates to its nearest recognised ancestor and the task records the **acting worker** — the two identities stay distinguishable.
3. A session with no recognised member **refuses**: the service is never called and the result explains why.
4. A stale `expectedRevision` is surfaced as an error result containing the current revision, with no automatic retry.
5. `writeScopeWarnings` from the service appear in the result.
6. `action: 'delete'` is refused by the plugin without calling the service.

---

### 2.3 Wiring 3 — Steering: reach a *running* delegated worker through the host's `subagents` service

**Verified contract (E4, host key `subagents`, description "Named provider registry with managed activations, durable discovery, and local child messaging."):**

```
async sendMessage(sender: Agent, targetId: SessionId, content: ContentBlock[], options: SubagentSendMessageOptions): Promise<MessageId>
interrupt(targetSessionId: SessionId, authority: SubagentInterruptAuthority): void
listChildren(parentSessionId, signal?): Promise<SubagentCatalogEntry[]>
listDescendants(rootSessionId, signal?): Promise<SubagentCatalogEntry[]>
```

| Method | Contract text (verbatim) |
|---|---|
| `sendMessage` | "Steer one model-authored message to the sender's direct parent or direct continuable child. A running target admits it at the nearest step boundary; an idle target starts a turn, and an absent direct child cold-resumes from persistence. The service derives durable sender attribution from the exact live sender." |
| `interrupt` | "Interrupt one live child's current execution under a human parent address or an exact live ancestor Agent… An absent target is an accepted no-op… throws {SubagentError} `UNAUTHORIZED` when the authority does not own the live target." |

Types: `SubagentInterruptAuthority = { kind:'user'; parentSessionId: SessionId } | { kind:'ancestor'; agent: Agent }`; `SubagentSendMessageOptions { readonly signal: AbortSignal }`.

**Why the recorded failure happened.** The evidence, and the reasoning:

* The host's own `send_message` tool (E5) has the parameter `agent_id` = *"The agent id of your direct continuable child, or your direct parent when you are a resident continuable child"*, and the description *"Send a message to an agent. A working agent receives it at its next step; an idle agent starts a new turn with it."* Its host `interrupt_agent` takes *"The id of an agent created under you: your direct child or a deeper descendant."* — these are the **subagents** surface.
* The host **also** has a **team** surface with the same service method name: `agentTeams.sendMessage(caller, request)` steers a **peer by NAME** (E3). Two different services, one method name.
* The plugin's own coordinator prompt describes the **team** surface while pointing at the tool name `send_message`: `swarm-prompt.md:253` — *"Native teams and a shared task board"*, gated on `spawn_teammate,send_message,interrupt_agent,list_agents,wait_agent`, telling the Coordinator that *"`send_message` delivers a note at the teammate's next step boundary"*. The worker in the ladder was a delegated `subagent`, **not** a teammate. The Coordinator therefore called a surface that resolves by teammate name with a session id → *"active teammate not found"* (`FINDINGS.md:17`, `FINAL-VERDICT.md:163`).
* The host's tool registry makes such a shadowing possible: *"Scoped tools shadow globals; duplicates within one layer … fail"* (E2). In a profile that mounts both surfaces, which `send_message` wins is the host's decision, not the plugin's.

**The fix the plugin can legitimately make:** stop depending on an ambiguous host tool name and give the swarm a **namespaced tool of its own** that calls the service whose semantics actually match the situation.

```js
{
  name: 'swarm_steer',
  description:
    'Send a message to a delegated worker of this session and have it act on it. A running worker ' +
    'receives the message at its next step boundary; an idle worker starts a new turn with it. ' +
    'Use this to redirect a worker that is running the wrong task — it is not a delivery receipt, ' +
    'the worker may finish its current step first.',
  parameters: {
    type: 'object',
    properties: {
      target: { type: 'string', description: 'The session id of the worker, as listed by list_agents.' },
      message: { type: 'string', description: 'What the worker should do next.' },
    },
    required: ['target', 'message'],
    additionalProperties: false,
  },
  output: {
    schema: { type: 'object', properties: { messageId: { type: 'string' } }, required: ['messageId'] },
    render(args, value) { return [{ type: 'text', text: `Message accepted (${value.messageId}); a running worker sees it at its next step boundary.` }] },
  },
  async execute(args, exec) {
    const agent = exec.agent
    if (agent === undefined) return { /* error result */ }
    const messageId = await subagents.sendMessage(agent, args.target, [{ type: 'text', text: args.message }], { signal: exec.signal })
    return { messageId }
  },
}
```

and the companion stop tool:

```js
{
  name: 'swarm_stop',
  description:
    'Stop one delegated worker of this session from running further steps. The worker is interrupted ' +
    'where it is; it does not receive a message first. Returns whether a running child was interrupted.',
  parameters: {
    type: 'object',
    properties: { target: { type: 'string', description: 'The session id of the worker.' } },
    required: ['target'],
    additionalProperties: false,
  },
  output: {
    schema: { type: 'object', properties: { interrupted: { type: 'boolean' } }, required: ['interrupted'] },
    render(args, value) { return [{ type: 'text', text: value.interrupted ? 'Worker interrupted.' : 'No running child at that id; nothing was interrupted.' }] },
  },
  async execute(args, exec) {
    const agent = exec.agent
    if (agent === undefined) return { /* error result */ }
    subagents.interrupt(args.target, { kind: 'ancestor', agent })
    return { interrupted: true }
  },
}
```

**The calling agent.** `exec.agent` is both the **sender** (`sendMessage`'s `sender`) and the **authority** (`interrupt`'s `SubagentInterruptAuthority`). Only `kind: 'ancestor'` is usable by a plugin: `kind: 'user'` is "a human parent address", which a plugin cannot forge. With `exec.agent === undefined` both tools refuse without touching the service.

**The scope question.** Global registration. The service is the guard, not the visibility: `sendMessage` is limited to "the sender's direct parent or direct continuable child", and `interrupt` throws `UNAUTHORIZED` "when the authority does not own the live target". A globally visible tool therefore cannot be used to steer a stranger's worker.

**Failure modes — what the tool returns when the service refuses.**

| Condition | Tool result |
|---|---|
| target is not a child / not an ancestor-owned target | the service's `SubagentError` `UNAUTHORIZED`, mapped to an error result that names the target's real parent (so the Coordinator can retry through the right agent) |
| `interrupt` on an absent target | "An absent target is an accepted no-op" — the tool reports *no running child at that id; nothing was interrupted*, **not** a success that implies the worker was stopped |
| target idle | `sendMessage` "starts a turn" — the tool must not claim the worker is already running |
| target running | "admits it at the nearest step boundary" — the tool must not promise immediate effect; a worker mid-tool-call will not see it until its next step |
| grandchild target | `sendMessage` reaches only "the sender's direct parent or direct continuable child", while `interrupt` accepts "an exact live ancestor Agent" — so **stopping** a grandchild can work where **redirecting** it cannot. The plugin's prompt must state that asymmetry rather than let the Coordinator discover it. |
| the Coordinator targets its own parent | `sendMessage` explicitly allows "the sender's direct parent" — a worker can report upward with the same tool. |

**The smallest test** — same new file, with a fake `ctx.subagents`:

1. `sendMessage` is called with **the `exec.agent`** as sender, the forwarded `target`, the message as a text content block, and `exec.signal` in the options.
2. `interrupt` is called with `{ kind: 'ancestor', agent: exec.agent }` — never `kind: 'user'`.
3. `exec.agent === undefined` → error result, service never called.
4. A service `UNAUTHORIZED` rejection becomes an **error result**, not a thrown tool error.
5. A successful call returns the `messageId` and its text says "at the next step boundary" (no promise of immediacy).

**What the plugin must additionally fix in the prompt** (not in code): `swarm-prompt.md:253` currently describes `send_message` as a **teammate** surface. It must be rewritten to name the **two** surfaces separately — the host's `send_message`/`interrupt_agent` (a delegated worker's direct continuable child / deeper descendant) and the plugin's `swarm_steer`/`swarm_stop` (the service-backed, unambiguously named path) — and to stop calling `wait_agent` and `spawn_teammate` capabilities that are absent in this profile (E5). A prompt that names an absent surface is exactly what `renderPrompt`'s gating exists to prevent (`index.js:356-370`), but the *text* of the bullet must also stop asserting teammate semantics for a subagent surface.

---

## Part 3 — What the plugin must NOT duplicate vs. what it should provide

Measured with `host/Tool/listTools` (E5): this session's agent can already call `create_goal`, `get_goal`, `update_goal`, `ask_user_question`, `todo_write`, `schedule_create`, `schedule_list`, `schedule_update`, `schedule_delete`, `subagent`, `subagent_fork`, `workflow`, `send_message`, `interrupt_agent`, `list_agents`, `working_directory`, `skill`, `read`, `write`, `edit`, `grep`, `glob`, `pwsh`, `job_*`, `present`, `web_*`, `compress`, `decompress`, `search_context`, `acp_*`, `mnemon_*`, `cordis_inspect_*`, `plugin_manager`, `exit_plan_mode`, `load_workspace_dependencies`, `read_image`, `get_goal`.

| Surface | The host already provides | Evidence | Plugin action |
|---|---|---|---|
| Session goal | `create_goal` / `get_goal` / `update_goal` | E5; already referenced at `swarm-prompt.md:257` | **Mention only.** Never re-register a goal tool. |
| Asking the human | `ask_user_question` | E5 | **Mention only.** |
| Round ledger | `todo_write` | E5; referenced at `swarm-prompt.md:258` | **Mention only.** |
| Reminders | `schedule_create` / `schedule_list` / `schedule_update` / `schedule_delete` | E5 | **Mention only.** |
| Delegation | `subagent`, `subagent_fork`, `workflow` | E5; referenced at `swarm-prompt.md:248-249,255` | **Mention only.** |
| Worker roster | `list_agents` ("children … accept send_message in any status. descendants lists the whole tree below you") | E5 | **Mention only.** The plugin must not add a roster tool; `subagents.listChildren/listDescendants` would duplicate it. |
| Reading the assembled prompt | `ctx.systemPrompt.assemble({agent, scope: agent})`, `ctx.agents.roots()` | `swarm-prompt.md:259` | **Mention only.** |
| Working directory | `working_directory` | E5 | **Mention only.** `swarm_worktree` creates a checkout; it must not become a general "set cwd" tool. |
| Command registry | the `commands` service the plugin already uses | `index.js:465-503` | The plugin's own `/swarm` stays; the plugin must not register host commands or shadow them. |
| Skill registry | `ctx.skills.register` | `index.js:429-435` | Keep `swarm-engineering`; do not re-ship host skills. |
| **Shared task board** | **no tool**; the `agentTeams` **service** exists | E5 vs E3 | **PROVIDE** `swarm_task_create` / `_get` / `_list` / `_update` on top of `ctx.agentTeams`. Do **not** build a second board inside the plugin: the board must stay the Lead Session log (`references/practices.md:1` — "The session log is the only source of truth"). |
| **Isolated worktrees** | **no tool**; the `worktrees` **service** exists | E5 vs E1 | **PROVIDE** `swarm_worktree` on top of `ctx.worktrees`. Do not shell out to `git worktree add` again. |
| **Steering / stopping a delegated worker** | `send_message` / `interrupt_agent` exist, but their names collide with the team surface and their reach is one level | E3, E4, E5, `FINDINGS.md:17` | **PROVIDE** `swarm_steer` / `swarm_stop` with unambiguous names, **and fix the prompt text** that mislabels `send_message` as a teammate surface (`swarm-prompt.md:253`). Do not re-implement delivery. |

**The rule behind the table:** the host's **tools** are the plugin's vocabulary; the host's **services** are the plugin's implementation. A plugin tool that re-implements a host *tool* is duplication; a plugin tool that exposes a host *service* the host does not expose is exactly the gap the swarm has been working around.

---

## Part 4 — Risks

| # | Risk | Evidence | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Registration lifetime / double ownership.** A tool registered on `agent.ctx` needs its disposer kept in the plugin's own effect. | `references/practices.md:8,19` | A disposed agent keeps a live registration; unloading the plugin leaves the tool behind. | Register **globally on the plugin's own context**, in one `ctx.effect()` that returns the disposer — the same shape as `index.js:472-503`. One owner, one disposer. |
| R2 | **Multi-session bleed.** A global tool is visible in every session's scope. | E2 ("Register globally or in the calling agent scope"); `index.js:254` | The *tool* is global; the *action* is not — every wiring acts on `exec.agent`, and steering is authorized by the service. | Accept global visibility; keep all actions caller-bound. Do not register scoped copies as well — "Scoped tools shadow globals" (E2) would make the behaviour scope-dependent in a way the prompt cannot describe. |
| R3 | **Capability gating drops a bullet whose tool is absent.** If the plugin's tool fails to register, every bullet gated on it vanishes. | `index.js:356-370`, `296-310` | The swarm loses the feature silently except for the "Absent in this session" line. | That line is the intended fail-safe and it already names marker-referenced tools that are missing (`index.js:303-305`). Gate the new bullets on `swarm_*` names so the absence is reported. Do **not** add plugin tools to `CAPABILITY_GROUPS` — that list is a host-surface list (`index.js:97-117`). |
| R4 | **The probe's 5-second TTL.** | `index.js:91,249-251` | A tool registered *after* the first probe can stay invisible to the prompt for up to 5 s — a bullet that should be there is dropped. | Register at `apply()` time, before any prompt assembly, so the first probe already sees them. |
| R5 | **The `inject` declaration.** | `index.js:28-34` | Adding `worktrees`/`agentTeams`/`subagents` to `inject` on a host that lacks one would take the **whole plugin** down — prompt, skill and command included. | Keep `inject = ['systemPrompt','agents','skills']`; fetch each service defensively with the `index.js:219-231` / `465-470` pattern and register only the tools whose service resolved. |
| R6 | **Service missing in another profile.** | E1 (`worktrees` access: optional `ctx.get("worktrees")`); E6 (the team packages are not exposed under the probed names here) | The swarm loses one surface on that profile. | Register per service; gate the corresponding bullet on the plugin's own tool name; the absent line names it; the plugin still loads and still ships its prompt. |
| R7 | **Name collision / shadowing.** | E2 ("duplicates within one layer and the reserved `run_code` name fail"; "Scoped tools shadow globals") | A plugin tool named like a host tool could shadow it, or fail to register. | Namespace every new tool `swarm_*`; never reuse `send_message`, `interrupt_agent`, `list_agents`, `todo_write`, `create_goal`, `ask_user_question`. |
| R8 | **The board's authority escalation is a privilege escalation performed by the plugin.** | E3 ("exact live Team member"); `tryMembership` → undefined for non-Team subagents | A worker's write is executed under the Lead's credential; a buggy plugin could write to the Lead's log on a worker's behalf. | Escalate only to an ancestor **the service itself recognises**; record the acting worker in the task; disclose the acting identity in the tool output; refuse `delete`; never escalate to an arbitrary root. Whether the service even accepts this is unverified (Part 5). |
| R9 | **Steering reach asymmetry.** | E4 (`sendMessage` = direct parent or direct continuable child; `interrupt` = exact live ancestor) | A grandchild can be stopped but not redirected. | State the asymmetry in the tool descriptions and in the prompt; do not paper over it. |
| R10 | **The worktree changes the caller's working directory.** | E1 ("then enter it"; "working-directory publication") | A Coordinator that calls it silently leaves its own checkout. | Prefer the worker-side call; make the tool's text state the new cwd; return with the host's `working_directory` tool. |
| R11 | **Worktree litter.** | E1 ("Failures may retain newly allocated Git/filesystem artifacts; no branch or checkout is removed automatically") | Retrying with a mangled name leaves branches and checkouts behind — the same class of mess the ladder hit with `git worktree prune`. | Never auto-retry with a different name; return the service's refusal and let the Coordinator decide. `git worktree prune` stays an explicit, human-visible shell action. |
| R12 | **The live profile's plugin row may differ from the workspace files.** The capability block rendered in *this* session names `team_task_get` but not `team_task_list` or `wait_agent`, while the workspace `swarm-prompt.md:253-254` references all of them. | this session's rendered prompt vs `swarm-prompt.md:253-254` (E8) | The line-to-marker mapping used in the live host is not the workspace one; conclusions about *which* bullet survives must be re-checked against the installed bundle. | Verified only as an observation — no profile was inspected or written. Treat the workspace files as the design target and re-verify against the installed row before shipping. |
| R13 | **The audit instrument itself failed.** `cordis_inspect_query` began rejecting every call with `missing required property "platform"` — including argument sets that had just succeeded — part-way through this audit. | tool output of this session | Contracts captured after the fault would be unreliable; a reader may suspect the host changed. | Every contract in this report was captured **before** the fault; each is quoted with its query. Re-query `worktrees`, `agentTeams`, `subagents`, `tools` and `Tool.listTools` before implementing. |

---

## Part 5 — Limits of this report

1. **Design only.** No file in `D:\project\dsh-plugins\swarm-workflow` was modified; nothing was registered in the live host; nothing was installed, committed or pushed. The only file written is this report. The three wirings above are **specifications**, not implementations.
2. **The host's tool-result envelope was not verified.** `ToolDefinition.execute` returns `Promise<unknown>` (E2) and `ToolOutputDefinition.render` returns `ContentBlock[]` (E2), but the exact error-result shape the host expects (`{ content: [...] }` with an error flag, or a different convention) was not read from a shipped tool's source: the package directory is inside `app.asar`, `Config.listConfigs` returned no entry for the probed names (E6), and the guessed paths did not exist. **Before implementing, copy the envelope from one shipped tool's `lib/index.js`** — the skill's own instruction (`SKILL.md:32`: *"installed packages ship built `lib/index.js` and `lib/types/**/*.d.ts` with JSDoc under that same `packageDir`"*).
3. **Whether `agentTeams.createTask` accepts a non-Team caller was not verified.** The contract says "exact live Team member creating the task" (E3), which may be an authorization check. The board design therefore ends in an honest refusal rather than an assumed success, and the worker prompt must keep reporting to the Coordinator as the guaranteed path.
4. **"Then enter it" was read, not executed.** That `worktrees.create` publishes the caller's working directory (E1's "working-directory publication") is an inference from the contract wording, not an observed behaviour.
5. **The origin of the literal `"active teammate not found"` was not located.** The host source sits inside `app.asar` and is not greppable from this session. The name-collision explanation in §2.3 is a **hypothesis** consistent with the recorded evidence (`FINDINGS.md:17`, `FINAL-VERDICT.md:163`) and with the two service contracts — not a confirmed root cause.
6. **Not investigated:** the client half (`client.js`), the locale files, the body of `skills/swarm-engineering.md`, the plugin's routing/queue semantics, and whether a delegated worker's `todo_write` writes to the Coordinator's ledger (that would change how much the board gap matters relative to the ledger the host already provides).
7. **The three wirings are independent.** Each can ship alone; the board and the worktree wiring are the two the recorded ladder actually lacked, and they are the two with a service that is provably present but provably unreachable from a tool (E1/E3 vs E5).
8. **If the host later mounts its native team tools**, the plugin's `swarm_task_*` set must be withdrawn (names and prompt markers together) so that two boards do not compete.

---

**One-line summary of the three wirings**

1. **Worktrees** — one global plugin tool `swarm_worktree` that calls `ctx.worktrees.create(exec.agent, {name, from})` and returns `{path, branch, baseCommit, repositoryRoot}`, replacing the hand-rolled `git worktree add` + `prune`.
2. **Board** — four global plugin tools `swarm_task_create/_get/_list/_update` on `ctx.agentTeams`, escalating a non-member worker's call to the nearest service-recognised ancestor (the Lead) and recording/disclosing the acting worker, so a delegated worker can claim and complete its own task.
3. **Steering** — two global plugin tools `swarm_steer` / `swarm_stop` on `ctx.subagents.sendMessage(exec.agent, target, …)` and `ctx.subagents.interrupt(target, {kind:'ancestor', agent: exec.agent})`, with unambiguous names, so a running delegated worker can be redirected and stopped instead of hitting "active teammate not found".
