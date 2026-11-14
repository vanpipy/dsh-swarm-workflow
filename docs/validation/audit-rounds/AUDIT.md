# The audit phase — the swarm plugin against the live host

**Request (the user's own words, 2026-11-08):** "Audit the swarm workflow plugin, ensure it can help dsh itself"

**How it was read.** The plugin did not only *describe* the host in prose; it had to integrate with
the host's real primitives, so that a swarm workflow runs on the host's own worktrees, board and
delegation surfaces instead of working around them. The phase therefore had two halves: **verify
every host claim in the shipped text against the running host**, and **wire the host services the
workflow was working around**.

**Goal.** `goal-4907c3be-1189-41b4-90b8-04d6ca30ef0d` — "Audit the @sages/swarm-workflow plugin
against the live DSH host and make it help DSH itself: verify every host claim in the shipped text and
code against the real services, wire the host primitives the swarm workflow currently works around
(the native worktrees service, the team task board for workers, the goal/question services) into the
plugin, prove the result with unit tests and a live probe, and record the audit in the ledger."

---

## 1. The lanes

| lane | surface | role | deliverable |
|---|---|---|---|
| A1 | the shipped text | Reviewer | `AUDIT-TEXT.md` — every host claim, verified against the live host |
| A2 | the plugin's code | Developer | `AUDIT-CODE.md` — the three wirings in design form |
| A3 | the uncommitted change | Reviewer (independent) | `AUDIT-REVIEW.md` — accept with corrections |

A1 and A2 ran as two fresh `subagent` lanes with disjoint deliverables; A3 reviewed the actual
working-tree diff (`index.js +399`, `swarm-prompt.md 9`, `swarm-worker-prompt.md +1`) against both
reports and against the live host, and wrote nothing but its report.

## 2. The host ground truth (verified in this session, not from documentation)

- `cordis_inspect_query` on the **host** platform: 94 services, **no `jcode` service anywhere**; the
  runtime is **DeepSeek Harness 0.2.1-rc.5**.
- `worktrees.create(agent, request = {}, signal?)` → `{ path, branch, baseCommit, repositoryRoot }`;
  "Create a fresh branch and checkout at a pinned local revision, then enter it"; `CreateWorktreeRequest
  = { name?, from? }`. **This service is absent in this profile** — the bundle
  `@deepseek-ai/dsh-experimental-tool-worktree` is `enabled: false`, and the host's own
  `create_worktree` tool is absent too.
- `agentTeams` — `listTasks`, `getTask`, `updateTask` (compare-and-set on `expectedRevision`),
  `tryMembership` ("Team membership, or undefined for non-Team subagents and stale identities"),
  `TeamTaskView` = `{ id, revision, subject, description, status, blockedBy, writeScopes, ownerName?,
  ready, writeScopeWarnings }`.
- `subagents` — `listChildren(parentSessionId)`, `sendMessage(sender, targetId, content, options)` ("Steer
  one model-authored message to the sender's direct parent or direct continuable child"), `interrupt(
  targetSessionId, authority)` with `authority = { kind:'user', parentSessionId } | { kind:'ancestor',
  agent }` ("An absent target is an accepted no-op").
- `agents` exposes **no parent accessor** — only `roots()`, `get`, `list`, `isOwnedBy(id, owner)`.
  `roots()` is *global* across every live agent in the process.
- `tools.register(definition)` → the exact disposer; `ToolExecutionInput.agent` is the calling agent;
  `ToolOutputDefinition = { schema, render, presentationMeta? }`.

### The decisive discovery: two `send_message` tools

| | the Lead's registry | a delegated worker's registry |
|---|---|---|
| `send_message` | `target` = "Member target returned by `spawn_teammate` or `list_agents`, including lead" | `agent_id` = "The agent id of **your direct continuable child**, or your direct parent when you are a resident continuable child" |
| `interrupt_agent` | "Interrupt one teammate's current turn while preserving its pending inbox. Team Lead only." | `agent_id` = "The id of an agent created under you: your direct child or a deeper descendant" |
| team family | `spawn_teammate`, `wait_agent`, `team_task_*` | **none** |

The same tool names mean different things in the two families. The shipped text had collapsed them
into one story and was wrong in both directions — see finding F2 below.

## 3. What the audit found

### The three findings that mattered (A1)

1. **Wrong, behaviour-changing.** `swarm-prompt.md` told the Coordinator that a delegated worker
   cannot be steered or resumed. The live schemas say the opposite: `subagent` — "The child reports
   results with `send_message`; use `send_message` to steer it while running or continue its
   conversation after it finishes." Only an *external* execution is non-resumable, and the text never
   said so.
2. **Opportunity.** The `worktrees` service was never mentioned (`grep worktree` in the bundle = 0
   hits), while the bundle's most-repeated rule insists on per-lane file sets and admits that
   `write_scopes` are "advisory, not a lock".
3. **Wrong, host-visible.** The skill's frontmatter says "Jcode Swarm workers", and that string *is*
   the description the live skill catalog displays.

### A3's material findings — all fixed

| id | finding | the fix |
|---|---|---|
| F1 | the "gap `interrupt_agent` leaves open" clause is false — `interrupt_agent` reaches exactly the delegated children `swarm_child` claims to add | the clause was deleted; the real difference stated (a mode-aware roster and one call that lists, steers and stops) |
| F2 | "a fork … `send_message` … does not reach it" is false — a fork is a continuable child and the steering family of `send_message` reaches it | the text now names both families and says which tool reaches which |
| F3 | `stop` reported `{ stopped: target }` for an absent target, but the host treats an absent target as an accepted no-op | the child catalog is read first; an absent target throws "No running child at <id>; nothing was interrupted." |
| F4 | `swarm_child`'s output schema forbade `target` while the steer branch returned it | `target` declared |
| F5 | `worktrees.create` dropped `exec.signal` | the signal is forwarded |
| F6 | the worktree's side effect (the host publishes the new checkout as the caller's working directory) was hidden | the description and the render state it plainly |
| F7 | `writeScopeWarnings` never reached the lane | rendered, and the task shape is declared |
| F8 | the acting **credential** was not disclosed (the worker learned who acted, never under whose authority) | `authority` + `authorityRole` in the value and in the render: "acted as <authority> (role: …) on behalf of <actor>" |
| F9 | `delete` was refused only by the parameter enum, and the host's argument validation is unverifiable (it lives inside `app.asar`) | an explicit guard in the tool |

The minor findings were fixed too: every host call is wrapped and rethrown with the action and the
host's reason (F10); the board relay no longer picks an arbitrary root (F11, below); the third
capability group — which mislabelled the bundle's own tools as host surfaces — was removed (F12);
the "one-shot child cannot be steered" clause was corrected (F13); each tool is registered in its own
`try/catch` so one refusal cannot skip the others (F14); each primitive carries its own marker so
one missing tool no longer removes the other two (F15).

### The first live probe found the defect the review could only predict

A read-only probe (`52740e86`) called the three tools from a delegated worker and found:

- **`swarm_task` read the WRONG board.** The relay picked `ctx.agents.roots()[0]`, and `roots()` is
  global across every live agent — so the worker read *another* team's board ("0 task(s) on the
  board") while the Lead's own board held 33+ tasks. A worker would have believed it had no
  assignment.
- **`swarm_worktree` could only fail.** The capability block advertised it because the *tool* was
  registered, not because the *service* existed.
- **`wait_agent` and `team_task_list` were missing from the worker's registry and were not named as
  absent**, so a worker could assume they existed.

## 4. What the plugin now does

Three thin pass-throughs to the host's own services, each registered **only when the host has the
service behind it**, so the prompt never advertises a primitive this host can only fail at:

| tool | host service | what it is for |
|---|---|---|
| `swarm_worktree` | `worktrees` | the host's own retained Git worktree: a fresh branch and a clean checkout, the source checkout untouched |
| `swarm_task` | `agentTeams` | the shared board — a member reads and moves it as itself; a session outside the team reads it read-only through the nearest ancestor the team service recognises as a member, and a move from outside the team is refused |
| `swarm_child` | `subagents` | this session's own child lanes: list them with their mode, steer a continuable one, stop a live one |

The board relay was rewritten to walk the caller's **own lineage** (`exec.parent`, then
`ctx.agents.list()` + `ctx.agents.isOwnedBy`) and to relay only through an ancestor the *team
service* recognises as a member; with no such ancestor it refuses instead of guessing.

The plugin's `inject` did not grow: the three services are resolved defensively at call time, so a
host without one loses one tool, never the plugin.

The skill's **registered** description now carries a host note in front of the user's own sentence —
the file's frontmatter stays byte-identical, because the user's rule is that host-specific facts go
in a separate note prepended at injection time:

> On this host the runtime is DeepSeek Harness, not Jcode: the methods are the same, and the live
> surfaces are the ones the swarm prompt names. Engineering execution methods for Jcode Swarm
> workers. Defines bounded investigation, Developer implementation, Tester verification, Reviewer
> code review, role boundaries, handoffs, and evidence-based completion.

## 5. Verification

- `tools/test-swarm-tools.mjs` — **ALL CHECKS PASSED (62)**: the tool set per service presence, the
  lineage relay, the authority disclosure, the delete refusal, the absent child, the signal
  forwarding, the working-directory line.
- `tools/test-render-prompt.mjs` — **ALL CHECKS PASSED**: the primitives are no longer advertised as
  host surfaces, the primitive bullets drop when the tools are missing, and a surface named in the
  *other* prompt file is named as absent.
- `index.js --check` — exit 0.
- The bundle was re-applied live: the skill leaves the catalog and returns with the host note.
- The live registry now holds `swarm_task` and `swarm_child` — and **not** `swarm_worktree`, because
  this profile has no worktrees service. The plugin advertises exactly what this host can call.

## 6. Limits

- The host's implementation lives inside `app.asar` and is unreadable as files. Four behaviours
  therefore stay unverified and the fixes assume the worst case: whether tool arguments are
  validated against `parameters` before `execute`, whether a returned value is validated against
  `output.schema`, how a thrown error is materialised, and whether `render` receives undeclared keys.
- The worktrees wiring could not be exercised live here: the service is absent in this profile. It
  is unit-tested against a stub only.
- A `subagent` outside the team can read the whole team board through the Lead's credential. The
  design sanctioned that relay and the output discloses it (with the authority), but it is a surface
  the host does not otherwise expose to non-members.
- The plugin's board is a strict subset of the host's: `edit`, `set_dependencies`, `reassign`,
  `reopen` and the `owner`/`subject`/`description`/`blockedBy`/`writeScopes` request fields are not
  expressible through `swarm_task`.
- The "Jcode" wording inside the skill's frontmatter is the user's own text and was left alone; the
  host note in front of it is the plugin's remedy.

## 7. The second live probe (delegated worker  4e7ae47) - the relay was refused

The second probe ran as a plain delegated worker and found one real defect in the wiring.

**What it observed (verbatim)**

- The registry holds **60** tools: the 58 host tools plus swarm_task and swarm_child.
  swarm_worktree is absent - the harness answers Error: unknown tool "swarm_worktree", which is
  the designed behaviour: the tool is registered only when the host has the service behind it, and
  this profile has none.
- The served prompt's absent line reads
  `- **Absent in this session:** spawn_teammate · 	eam_task_create · 	eam_task_get · 	eam_task_update · swarm_worktree · wait_agent · 	eam_task_list - do not plan around these.`
  so the prompt never advertises a primitive this host cannot call.
- swarm_task list and get were BOTH refused:
  *"This session is not a team member, and no ancestor of it is recognised as one, so the board cannot
  be read from here. Ask the Coordinator for the task text."*
- swarm_task claim without expected_revision produced the argument error
  *"The \"claim\" action needs expected_revision: the revision the task had when you read it."*; with
  expected_revision: 1 it produced the membership guard *"This session is not a team member, so it
  cannot change the shared board."* - **the board was not changed** (the write path is refused, by
  design).
- swarm_child list returned   child lane(s); swarm_child stop with a made-up id returned
  the plugin's own pre-check: *"No running child at not-a-real-session-id; nothing was interrupted."*

**The defect it exposed.** oardAuthority() started its lineage walk at exec.parent. The host does
not always fill that field in for a delegated worker, so the chain came back empty and the read was
refused - a lane entitled to the board was told it had none.

**The fix.** The walk now starts at the CALLER and continues through the caller's own owner; the
parent named in the tool context is appended afterwards. 	ools/test-swarm-tools.mjs grew the case
that pins it (a caller whose context carries no parent still reads through its own owner), the tool
test now runs **63** checks, the render test passes, index.js --check exits 0, and the bundle was
re-applied live. Bundle commit 190cd38.
## 8. The third live probe (8b91d019) - the relay works

The third probe ran the same three calls after the fix and the fix held.

- swarm_task list returned **33 task(s) on the board** - the Lead's own board, with every task's id,
  revision, owner and subject - and the relay disclosed itself:
  *"acting session: 8b91d019-... / acted as session-f8b73c8f-... (role: lead) on behalf of 8b91d019-...
  - a read-only relay, because the board belongs to the team"*.
- swarm_task get on 	ask-1 returned the whole task body - subject, owner, ready, blocked by, write
  scopes and the full assignment text (LABEL, ROLE, OBJECTIVE, CONTEXT, HOW TO RUN, REQUIREMENT, SCOPE,
  CONSTRAINTS, REPORT, ACCEPTANCE) - with the same disclosure. A delegated worker can now READ the
  board it belongs to, and still cannot MOVE it.
- swarm_child list returned   child lane(s) (correct: a delegated subagent that spawned nothing has
  no child lanes).
- The served prompt still advertises only callable primitives: the absent line names swarm_worktree,
  the tool count reads **60**, and neither swarm:requires nor swarm:capabilities nor the character
  "§" reaches the served text.

**One discrepancy the probe raised, and the answer.** It counted 61 names in its own schema and
suspected the absent line was stale. The second probe enumerated the registry name by name - 60 names,
swarm_worktree NOT among them - and calling the tool returned the harness's own
Error: unknown tool "swarm_worktree". The absent line is therefore correct: the tool is not
registered in this profile, and the prompt says so instead of advertising it.