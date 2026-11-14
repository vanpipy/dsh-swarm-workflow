# TEAM-protocol — native-team board path verification

**Role:** Tester (native teammate `protocol-checker`)
**Date:** 2026-11-06 (session `80eefdaf-6bf7-4404-a79c-1cc138311b5f`, DSH profile `desktop`)
**Board task:** `task-4` — "Verify the native-team board protocol reaches teammates"
**Verdict:** Claims (a)–(e) are **all Verified**. One **Material** finding (F1): the prompt text actually
delivered to a native teammate is *not* the current on-disk text of the plugin's worker prompt — the plugin
reads its markdown once at `apply()` time and never re-reads it.

Every statement below carries a tag: **Verified** (observed directly), **Inferred** (reasoned from observed
evidence), **Not run** (not attempted, reason given).

---

## 1. Claim (a) — the swarm WORKER prompt was received, not the Coordinator policy — **Verified**

The prompt injected into my context is the worker variant. Its headings, in the order they appeared:

1. `# Swarm Workflow — Worker`
2. `## Where your rules live`
3. `## The assignment contract`
4. `## What you report back`
5. `## Host facts — this runtime`

Preceded by the HTML marker comment:

```
<!-- Added by the @local/swarm-workflow plugin: host facts for this runtime. -->
```

Evidence:

* **Verified** — the five headings above are the complete set of markdown headings in the swarm block I received;
  they were read directly from my own context.
* **Verified** — the Coordinator policy heading `# Swarm Orchestration Policy` does **not** appear in my prompt.
* **Verified** — the harness global policy heading (`# Global Execution Policy` / "Mission and Ownership")
  does **not** appear in my prompt either; the prompt states this explicitly:
  *"The global execution policy is not in your prompt. It is injected straight into the Coordinator's prompt by
  the harness."*
* **Verified** — the received prompt's structure matches
  `D:\project\dsh-plugins\swarm-workflow\swarm-worker-prompt.md` line-for-line for headings 1–4
  (file lines 1, 10, 15, 29) and for the host-facts heading (file line 46).

---

## 2. Claim (b) — the board host-fact bullet is present in the prompt — **Verified**

**The bullet as delivered to me, quoted verbatim:**

> - **If you run as a native teammate, the board holds your assignment.** The board entry and your brief must agree; if they disagree, report it instead of guessing which one is right. The `write_scopes` on your task are advisory, not a lock, so write only in the files your assignment names. A note from the Coordinator reaches you at your next step boundary: it steers the assignment you already have, it is not a second assignment.

The bullet **is present** in the received prompt, and it **does** begin with the exact required text
`If you run as a native teammate, the board holds your assignment`. — **Verified**.

### Finding F1 (Material) — delivered prompt text ≠ current on-disk prompt text

The same bullet in the shipped bundle,
`D:\project\dsh-plugins\swarm-workflow\swarm-worker-prompt.md:55`, reads:

> - **If you run as a native teammate, the board holds your assignment.** `team_task_get` reads your task and its current revision; `team_task_update` claims it (action `claim`) and completes it, and every write compares and sets on `expected_revision`, so a refused write means your revision was stale — read the task again. The board entry and your brief must agree; if they disagree, report it instead of guessing which one is right. The `write_scopes` on your task are advisory, not a lock, so write only in the files your assignment names. A note from the Coordinator reaches you at your next step boundary: it steers the assignment you already have, it is not a second assignment.

**Difference — exactly one sentence is missing from what I received:**

```
`team_task_get` reads your task and its current revision; `team_task_update` claims it (action `claim`) and
completes it, and every write compares and sets on `expected_revision`, so a refused write means your revision
was stale — read the task again.
```

Everything else in the bullet is identical.

Evidence for the mechanism:

* **Verified** — `D:\project\dsh-plugins\swarm-workflow\index.js:97-106` reads both markdown files **once**
  inside `apply(ctx)` and registers them as a static prompt section:

  ```js
  const coordinatorPrompt = readText('./swarm-prompt.md')
  const workerPrompt = readText('./swarm-worker-prompt.md')
  ...
  ctx.effect(() => ctx.systemPrompt.section({
    name: 'swarm-workflow:swarm',
    order: SECTION_ORDER,
    interpolate: false,
    text: (context) => (isCoordinator(ctx, context) ? coordinatorPrompt : workerPrompt),
  }))
  ```

  The `text` callback returns the **already-read** string. There is no file watcher and no re-read on change.
* **Verified (timestamps)** — bundle file modification times on 2026-11-06:

  | file | LastWriteTime | size |
  |---|---|---|
  | `skills\swarm-engineering.md` | 11/6/2026 11:47:02 PM | 27 533 |
  | `index.js` | 11/6/2026 11:47:14 PM | 4 496 |
  | `swarm-prompt.md` | 11/6/2026 11:52:12 PM | 20 760 |
  | `swarm-worker-prompt.md` | 11/6/2026 11:52:16 PM | 5 455 |

  My session began at **11:52:47 PM** — 31 s *after* the worker prompt was last written.
* **Inferred (high confidence)** — the running host applied the bundle from a copy taken **before** the
  23:52:16 write, so the newer sentence never reached my prompt. Consistent with this, the plugin-manager
  operation log under `C:\Users\leroy\.dsh\profiles\desktop\.plugin-manager\logs\` contains **no** operation
  after `operation-D7hctf` (2026-11-05 23:54:12) other than two operations early on 2026-11-06
  (00:02:21 and 00:03:50) — i.e. **no re-apply of the bundle after the 23:52 edits**.
* **Inferred** — the lead that the worker prompt and the coordinator prompt (`swarm-prompt.md`, 23:52:12) were
  both edited after the last apply, so **both** variants currently in memory are stale by one edit.

**Impact:** a teammate spawned *now* is told the board exists but is not told the revision discipline
(`expected_revision` compare-and-set, "read the task again" on a refused write). The sentence the Lead added
to teach exactly that protocol does not reach teammates. Any future edit to `swarm-prompt.md` or
`swarm-worker-prompt.md` will likewise not take effect until the bundle is re-applied.

**Recommended action for the Coordinator (not performed by me — plugin/profile state is out of my scope):**
re-apply the bundle (an enable/disable cycle of `include:swarm-workflow`, or a host restart) and then re-run
this verification with a freshly spawned teammate; optionally add a file-watcher to `index.js` so the prompt
text follows the file.

---

## 3. Claim (c) — `team_task_get` reads my own board task — **Verified**

Call: `team_task_get({ task_id: "task-4" })`. Exact result:

```json
{
  "id": "task-4",
  "revision": 1,
  "subject": "Verify the native-team board protocol reaches teammates",
  "description": "Role: Tester. Objective: prove that a native teammate of the swarm-workflow bundle (a) receives the worker prompt, including the new host-fact bullet \"If you run as a native teammate, the board holds your assignment\", (b) can read its own board task with team_task_get, (c) can claim it with team_task_update action=claim using expected_revision, and (d) can complete it with team_task_update action=complete using the fresh revision.\n\nScope: the team-task board only, plus one owned report file.\n\nOwned file (write ONLY this): D:\\project\\.swarm-lab\\rounds\\TEAM-protocol.md\n\nOut of scope / hard boundaries:\n- D:\\project\\dsh-plugins is READ-ONLY for you. Do not create, edit, install, enable or disable any plugin, bundle or profile row. Do not call plugin_manager.\n- Do not touch D:\\project\\.swarm-lab\\lab-repo or any reading-collector repo. No git commands that write (no add/commit/checkout/stash/clean/reset).\n- No network access.\n\nAcceptance criteria:\n- TEAM-protocol.md contains: the prompt bullet quoted verbatim (or its exact absence, if absent), the task id and the revision sequence observed across get/claim/complete, and the exact result of each team_task_update call.\n- The board task ends in status completed.\n\nValidation: report each claim as Verified / Inferred / Not run. Finish by marking the board task completed and messaging the Lead with the verdict.",
  "status": "pending",
  "blockedBy": [],
  "writeScopes": [".swarm-lab/rounds/TEAM-protocol.md"],
  "ready": true,
  "writeScopeWarnings": []
}
```

Observations:

* **Verified** — the task id is `task-4`, the task is mine, and the description agrees with the brief the Lead
  gave me (same objective, same owned file, same boundaries) — the host-fact bullet's instruction
  *"The board entry and your brief must agree"* is satisfied for this task.
* **Verified** — `team_task_get` reports the current `revision` (`1` at read time) and `status` (`pending`).
* **Verified** — `writeScopes` = `[".swarm-lab/rounds/TEAM-protocol.md"]`, matching the owned file in the brief
  (relative to the workspace root `D:\project`). No `writeScopeWarnings` were raised.
* **Verified** — the task was unowned at read time (no `ownerName` field in the result).

---

## 4. Claim (d) — `team_task_update` action=`claim` with `expected_revision` — **Verified**

Call: `team_task_update({ task_id: "task-4", action: "claim", expected_revision: 1 })`.
Exact result (verbatim fields):

```json
{
  "id": "task-4",
  "revision": 2,
  "subject": "Verify the native-team board protocol reaches teammates",
  "status": "in_progress",
  "blockedBy": [],
  "writeScopes": [".swarm-lab/rounds/TEAM-protocol.md"],
  "ownerName": "protocol-checker",
  "ready": false,
  "writeScopeWarnings": []
}
```

(`description` omitted above for length; it was returned unchanged.)

Observations:

* **Verified** — the write was accepted with `expected_revision = 1`, the value `team_task_get` reported.
* **Verified** — the revision advanced `1 → 2` and `status` advanced `pending → in_progress`.
* **Verified** — `ownerName` became `protocol-checker`, i.e. my teammate name was recorded by the claim.
* **Verified** — the compare-and-set behaviour described in the bundle bullet was exercised: the claim
  consumed revision 1 and returned the fresh revision 2, which is what the next write had to use.

---

## 5. Claim (e) — `team_task_update` action=`complete` with the fresh revision — **Verified**

Call: `team_task_update({ task_id: "task-4", action: "complete", expected_revision: 2 })`.
Exact result (verbatim fields):

```json
{
  "id": "task-4",
  "revision": 3,
  "subject": "Verify the native-team board protocol reaches teammates",
  "status": "completed",
  "blockedBy": [],
  "writeScopes": [".swarm-lab/rounds/TEAM-protocol.md"],
  "ownerName": "protocol-checker",
  "ready": false,
  "writeScopeWarnings": []
}
```

Observations:

* **Verified** — the write was accepted with `expected_revision = 2`, the revision returned by the claim.
* **Verified** — the revision advanced `2 → 3` and `status` advanced `in_progress → completed`.
* **Verified** — the board task `task-4` now stands at `status: completed`, `ownerName: protocol-checker`.

---

## 6. Revision sequence observed

| # | Operation | `expected_revision` sent | Revision returned | Status after | Owner after |
|---|---|---|---|---|---|
| 1 | `team_task_get("task-4")` | — (read) | **1** | `pending` | *(unowned)* |
| 2 | `team_task_update` action=`claim` | **1** | **2** | `in_progress` | `protocol-checker` |
| 3 | `team_task_update` action=`complete` | **2** | **3** | `completed` | `protocol-checker` |

**Task id:** `task-4`
**Revision sequence:** `1 → 2 → 3` (each write compared and set on the revision the previous read/write
returned; no write was refused).
**Final board state:** `status: completed`, `revision: 3`.

---

## 7. Scope compliance

* **Verified** — the only file written in this session is this report,
  `D:\project\.swarm-lab\rounds\TEAM-protocol.md`. It did not exist before this session
  (`Test-Path` → `False`), so nothing was overwritten.
* **Verified** — `plugin_manager` was never called by me; no plugin, bundle or profile row was created,
  edited, enabled or disabled. `D:\project\dsh-plugins` was read only
  (`grep`, `read`, and `Get-ChildItem`/`Get-Item` for timestamps).
* **Verified** — no git command was run at all, so no repository was touched by me. The lab repo
  `D:\project\.swarm-lab\lab-repo` was not accessed.
* **Verified** — no network access was used.
* **Verified** — the only board write was to my own task `task-4`; `team_task_list` was read-only.

### Not run, with reason

* **Not run — byte-level diff of the delivered prompt against the on-disk file.** The delivered prompt text
  lives in my model context, not in a file I can diff against; the comparison in §2 was made by direct
  inspection of the two texts (the headings and the single differing sentence). I did not reconstruct the
  delivered prompt into a scratch file to run a mechanical diff, because writing any file other than this
  report is outside my ownership.
* **Not run — `team_task_update` with a deliberately stale `expected_revision`** (to demonstrate the
  refusal path). Doing so would mutate a task the Lead owns and would put the board in a state my brief does
  not authorise; the compare-and-set contract is instead evidenced by the successful 1→2→3 sequence.
* **Not run — inspection of the harness prompt-assembly cache.** `C:\Users\leroy\.dsh\storages\session_projcache\`
  holds session **briefs**, not system prompts: my session's cache file contains the Lead's assignment brief
  and matches the brief's quoted phrase, so it is not evidence of the injected prompt. It was therefore not
  used to support claim (a) or (b).

---

## 8. Exit criteria

| Claim | Result |
|---|---|
| (a) worker prompt received, headings quoted in order | **Verified** |
| (b) board bullet present, quoted verbatim | **Verified** (present; delivered text differs from on-disk text — F1) |
| (c) `team_task_get` reads own task | **Verified** |
| (d) `team_task_update` action=`claim` with `expected_revision` | **Verified** |
| (e) `team_task_update` action=`complete` with fresh revision | **Verified** |

**Overall verification assessment:** the native-team path works end to end. The teammate receives the worker
prompt (not the Coordinator policy), the board holds the assignment, and the claim → complete cycle advances
the task from `pending` to `completed` under strict compare-and-set revision control. The one defect found is
not in the board protocol but in the prompt plumbing (F1): the plugin does not re-read its markdown, so a
teammate receives the prompt text as of the last bundle apply, not as of the files on disk.

**Remaining uncertainty:** whether the Lead intends F1 to be fixed by re-applying the bundle or by adding a
watcher — that decision belongs to the Coordinator; I did not act on it (plugin and profile state are outside
my scope).
