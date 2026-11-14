# Round R9 — the swarm primitives, exercised against the live host

Date: 2026-11-11
Executor: the Team Lead ("lead")
Work item: swarm-lab (the test bed for the refactored `dsh-swarm-workflow` bundle)
Host: DSH 0.2.2-rc.1, desktop profile, `dsh-swarm-workflow` 2.0.0 installed as a
junction to `D:\project\dsh-plugins\dsh-swarm-workflow`

## What this round is

The bundle ships three pass-through primitives so that a lane can act on the
host's own collaboration surfaces without knowing their names: `swarm_task`
(the shared board), `swarm_child` (the child lanes) and `swarm_worktree` (an
isolated tree). Round R9 exercises each one against the live host and records
what actually happened.

## The primitives

### `swarm_task` — the shared board

    swarm_task {action: "list"}
      → 6 task(s) on the board
        task-1 [completed] rev 3 owner developer — Rewrite index.js …
        task-2 [completed] rev 3 owner tester — Rewrite the test suite …
        task-3 [completed] rev 3 owner reviewer — Independent review …
        task-4 [completed] rev 4 owner pydev — Implement the swarmlab package (R1–R8)
        task-5 [in_progress] rev 2 owner pytester — Tester lane: clause tests …
        task-6 [in_progress] rev 2 owner pydev — Implement R10 …
        acting session: session-5135fefc-3a26-4aaa-ae85-6dc981c4c758

    swarm_task {action: "claim", task_id: "task-8", expected_revision: 1}
      → Task task-8 [in_progress] rev 2 … owner: lead

    swarm_task {action: "get", task_id: "task-8"}
      → Task task-8 [in_progress] rev 2 … owner: lead

    swarm_task {action: "complete", task_id: "task-8", expected_revision: 2}
      → Task task-8 [completed] rev 3 … owner: lead

Verdict: **met** — the read path, the claim and the complete all work against
the live board, and the tool names the acting session so a relayed read is
visible.

### `swarm_child` — the child lanes

    swarm_child {action: "list"}
      → 5 child lane(s)
        9fe59153-2332-4865-b871-e6ae7781fb94 [continuable] Developer lane: rewrite index.js …
        974a8d80-30ee-4581-a4a0-d4903ce8470d [continuable] Tester lane: rewrite the test suite …
        d2248c54-f968-4ace-98d0-b819a222b1cd [continuable] Reviewer lane: independent, read-only verification …
        bf9b476c-1319-45c6-a0d4-41fb3b9fef79 [continuable] Developer lane for the swarmlab package (R1-R8) …
        98c29617-4e51-4999-a00c-862de36617b6 [continuable] Tester lane for the swarm-lab round …

Verdict: **met** — the lanes of this session are listed with their ids and their
continuable state.

### `swarm_worktree` — an isolated tree

Verdict: **not in scope for this host** — the primitive is absent, and that is a
recorded boundary, not a gap. The live capability block names it:

    **Absent in this session:** `swarm_worktree`

The bundle that would provide it (`@deepseek-ai/dsh-experimental-tool-worktree`)
is rejected by the registry with `incompatible-version` (it ships
`0.2.1-alpha.2`; the host runs `0.2.2-rc.1`). The human chose to keep it
disabled — see `.swarm/decisions/2026-11-11-worktree-boundary.md`.

## Defect found in this round — `swarm_task` breaks on an unowned task

**Symptom.** With a freshly created, unowned task on the board, every read of
the board fails:

    swarm_task {action: "list"}
      → Error: tool "swarm_task" returned invalid output: value is not lossless JSON

    swarm_task {action: "get", task_id: "task-8"}   (task-8 created, unowned)
      → Error: tool "swarm_task" returned invalid output: value is not lossless JSON

**Reproduction, twice, on the live host.**

1. `team_task_create` produced task-5 and task-6; both were unowned, and
   `swarm_task {action:"list"}` failed with the error above.
2. After `pytester` and `pydev` claimed them, every task had an owner and the
   same call listed all six tasks.
3. A scratch task (task-8) was created unowned: `swarm_task get` failed on it.
   `swarm_task claim` succeeded (the claim itself returns the updated task,
   which is owned by then), and `swarm_task get` on the now-owned task-8
   succeeded.

**Root cause.** `projectTask()` in the plugin's `index.js` copies the host's
task view into the shape a lane reads:

    owner: task.ownerName,
    …
    description: task.description,

The host leaves `ownerName` undefined for an unowned task, so the tool result
carries a property whose value is `undefined`. That value is not representable
in JSON, the host validates the result and rejects the whole call. The same
hazard sits in the `authorityRole` field of the execute result, because
`boardAuthority()` may report no role for a relayed read.

**Why it matters.** The normal order of operations is: the Coordinator creates a
task, the lane claims it. In that window the board is unreadable — and the
error message names neither the cause nor the task, so a lane cannot recover
from it. This is exactly the workflow the bundle exists to support.

**Disposition.** Dispatched as board task-7 ("Fix swarm_task: an unowned task on
the board must not break the tool") to the `pluginfix` lane, with a regression
test in `test/swarm-tools.test.mjs` and a fresh-process probe against the real
host runtime. The fix lands in the plugin source tree; the desktop profile
installs that tree as a junction, so the next session loads it.

## The native team surfaces, for comparison

The host's own board tools (`team_task_create`, `team_task_get`,
`team_task_list`, `team_task_update`) work on every task, owned or not, and
they are what a lane uses when it does not go through the plugin's primitive.
That is why the defect above was visible: the native path showed the board, the
plugin's path could not.
