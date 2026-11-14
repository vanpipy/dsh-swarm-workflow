# R12 — Live capability block in a fresh teammate's served prompt

- **Role:** Tester (native teammate `prompt-live`)
- **Task:** task-6 — "Verify the live capability block in a fresh teammate's served prompt"
- **Date:** 2026-11-07 (Asia/Shanghai)
- **Subject of test:** the system prompt actually served to this worker session, after the bundle re-apply.

---

## 1. Verbatim quote — "## Host capabilities — probed live" as served to me

This is the block exactly as it appears in my own system prompt. Not paraphrased, not reordered, not re-leveled.

```markdown
## Host capabilities — probed live

Probed from this host's tool registry while this prompt was assembled. This list is the ground truth for this session: a surface that is listed is callable now, and a surface that is absent must not be planned around.

- **Delegation:** `subagent` — a worker with its own context · `subagent_fork` — a worker that inherits this conversation · `workflow` — a scripted fan-out across many workers · native teammate (`spawn_teammate`) — durable, steerable, resumable
- **Coordination:** shared task board (`team_task_create`) · session goal (`create_goal`) · round ledger (`todo_write`) · ask the human (`ask_user_question`) · reminders (`schedule_create`)
- **`/swarm`** — print this block on demand, without spending a model turn
- **Tools visible to this agent:** 64
```

**Placement in my prompt (context for the quote):**

- The plugin section is titled `# Swarm Workflow — Worker`, and inside it the generated block sits under a plugin-prepended heading pair:
  `## Host facts — this runtime` → `Facts about this host, not policy.` → `## Host capabilities — probed live` → *(the block quoted above)*.
- The character immediately following the block is `"\n\n-"`, i.e. the next bullet is `- **Delegation tools.** …` (the per-tool bullet, still present and correctly filtered).
- The block as served is **802 characters / 8 lines** (header + blank + intro paragraph + blank + 4 bullets).
- sha256 of the exact served block text (UTF-8, no trailing newline):
  `7a9decd5a52b169ccd87b6fdf713ca852aab4e0002f8d64e74f4e50c3efd6d71`

---

## 2. Answers (a)–(e)

### (a) Is the block present? — **Verified**

Yes. `## Host capabilities — probed live` is present in my served system prompt, with the full generated body (4 bullets) as quoted in §1.

Evidence: the stored `system/message` entry for my session contains the header at a known offset, and the block text hashes as above. The same block is visible to me directly in my context.

### (b) Does it contain the line "- **`/swarm`** — print this block on demand, without spending a model turn"? — **Verified**

Yes, verbatim and in that exact position — third bullet, between the `- **Coordination:**` bullet and the `- **Tools visible to this agent:**` bullet:

```
- **`/swarm`** — print this block on demand, without spending a model turn
```

### (c) Does it contain "- **Tools visible to this agent:** <n>" — and what is n for me? — **Verified**

Yes. For me **n = 64**:

```
- **Tools visible to this agent:** 64
```

Independent corroboration of the number: I enumerated the callable tool definitions exposed in this session and counted **64** entries. The count agrees with the number the generated block reports. The surfaces named in the block's two list bullets (`subagent`, `subagent_fork`, `workflow`, `spawn_teammate`, `team_task_create`, `create_goal`, `todo_write`, `ask_user_question`, `schedule_create`) are all present in my registry — no bullet is claiming a surface I lack.

### (d) Do any raw marker strings "swarm:capabilities" or "swarm:requires" appear anywhere in my prompt? — **Verified**

**No — neither string appears in the served system prompt.** Measured directly on the stored `system/message` entry (the whole assembled system prompt, 15,254 characters):

| Marker string | Occurrences in served system prompt |
|---|---|
| `swarm:capabilities` | **0** |
| `swarm:requires` | **0** |

The generated block is present and the raw markers are stripped, i.e. the per-assembly rendering behaves as specified.

**Precise scope note (so the number is not over-read):** both strings *do* occur elsewhere in my **session**, but never in the served prompt. Attribution by entry type in my own session log:

| Where | `swarm:capabilities` | `swarm:requires` | Origin |
|---|---|---|---|
| `system/message` (the served prompt) | 0 | 0 | — none, correct |
| `user/message` | 1 | 1 | the Lead's task-6 brief, which names the markers in prose (a chat message, not the prompt) |
| `agent/inbox/spliced` | 1 | 1 | the same brief delivered into my inbox |
| `assistant/message`, `tool/call`, `tool/result`, `job/*` | many | many | my own turns quoting the marker names while testing |

So a naive grep of the whole session transcript for `swarm:capabilities` **will** hit — the brief and my own test commands contain the literal names. The plugin-side conclusion is unaffected: the string the plugin would have to strip is absent from the prompt it serves.

### (e) Does the bullet "If you run as a native teammate, the board holds your assignment." still carry the full explanation of team_task_get / team_task_update / expected_revision? — **Verified**

Yes — full bullet, unshortened, verbatim from my served system prompt:

```
- **If you run as a native teammate, the board holds your assignment.** `team_task_get` reads your task and its current revision; `team_task_update` claims it (action `claim`) and completes it, and every write compares and sets on `expected_revision`, so a refused write means your revision was stale — read the task again. The board entry and your brief must agree; if they disagree, report it instead of guessing which one is right. The `write_scopes` on your task are advisory, not a lock, so write only in the files your assignment names. A note from the Coordinator reaches you at your next step boundary: it steers the assignment you already have, it is not a second assignment.
```

All three named elements are present: `team_task_get` (reads the task and its current revision), `team_task_update` (claims it with action `claim`, completes it), and `expected_revision` (every write compares and sets on it; a refused write means the revision was stale). The `write_scopes` advisory note and the "note from the Coordinator" sentence are also intact.

---

## 3. How this was verified (evidence and locations)

Two independent sources agree:

1. **Direct reading of my own live prompt** (primary evidence — this is what a real worker receives). The block in §1 is quoted from it.
2. **My own session store on disk** (corroboration + exact-string measurement):
   - File: `C:\Users\leroy\.dsh\sessions\--D-project--\d827402f-5f08-43bf-a3af-931ce2ef01a7\session.v4.jsonl.zstd`
     (this is the session that carries my teammate identity — it contains the `subagent/descriptor` entry and my task-6 inbox splice).
   - Container: the entry of type `system/message` → `data.message.role = "system"` → `data.message.content[0].text`, **15,254 characters**. Exactly one `system/message` entry exists in this session, so the served system prompt is covered in full.
   - Decoding: the store is a sequence of concatenated zstd frames; I decoded it with Node's `zlib.zstdDecompressSync` by scanning for the zstd frame magic `28 b5 2f fd` (the same technique as `D:\project\.swarm-lab\decode_session_log.mjs`, re-implemented inline so that no file was written outside my scope). Node v24.21.0 from the bundled runtime.
   - Measured on that entry: header present; block = 802 chars / 8 lines; sha256 as in §1; `swarm:capabilities` = 0; `swarm:requires` = 0; teammate bullet present in full.
   - Read-only throughout — the session store was opened for reading only and was not modified.

### Tool registry enumeration (independent count for (c))

64 callable tools exposed to me in this session:

`acp_cache`, `acp_read_original_image`, `acp_status`, `ask_user_question`, `compress`, `cordis_inspect_list`, `cordis_inspect_query`, `create_goal`, `decompress`, `edit`, `exit_plan_mode`, `get_goal`, `glob`, `grep`, `interrupt_agent`, `job_kill`, `job_list`, `job_output`, `list_agents`, `load_workspace_dependencies`, `mnemon_document_create`, `mnemon_document_manage`, `mnemon_document_search`, `mnemon_forget`, `mnemon_link`, `mnemon_memory_bodies`, `mnemon_memory_body_create`, `mnemon_memory_body_merge`, `mnemon_memory_body_update`, `mnemon_recall`, `mnemon_related`, `mnemon_remember`, `mnemon_runtime_memory`, `mnemon_status`, `mnemon_subagent_result`, `mnemon_view_action`, `mnemon_view_route`, `plugin_manager`, `present`, `pwsh`, `read`, `read_image`, `schedule_create`, `schedule_delete`, `schedule_list`, `schedule_update`, `search_context`, `send_message`, `skill`, `spawn_teammate`, `subagent`, `subagent_fork`, `team_task_create`, `team_task_get`, `team_task_list`, `team_task_update`, `todo_write`, `update_goal`, `wait_agent`, `web_fetch`, `web_search`, `workflow`, `working_directory`, `write`

---

## 4. Verdict

The live, per-assembly rendering works as specified for this worker session:

- the generated block is served in full to a fresh native teammate;
- it carries the new `- **`/swarm`**` line;
- it reports the live tool count (`64`), which matches an independent enumeration of the registry;
- no raw `swarm:capabilities` / `swarm:requires` markers leak into the served prompt;
- the native-teammate bullet retains its full `team_task_get` / `team_task_update` / `expected_revision` explanation.

**Not a finding, noted for accuracy:** the block's own bullet list is a filtered *subset* of the registry by design (delegation and coordination surfaces only); the total-tool figure (64) is what covers the full registry.

---

## 5. What I did not run / limits of this verification

- **Did not call `plugin_manager`** (no `list_plugins`, `set_plugin`, `install_bundle`, `list_bundles`) — explicitly out of scope. Therefore I did **not** independently confirm the profile's plugin/bundle state, the bundle version stamp, or that the re-apply is what produced this text. My evidence proves **what was served to me**, not the bundle's on-disk state.
- **Did not read the plugin sources** under `D:\project\dsh-plugins` and did not reconstruct the block from them. The quote in §1 comes from the prompt served to this worker, corroborated by my own session store. (I did read one file outside that tree, `D:\project\.swarm-lab\decode_session_log.mjs`, purely to reuse its known-good zstd frame-scanning technique — read-only, no modification.)
- **Did not modify anything under `D:\project\dsh-plugins`** and did not touch `D:\project\.swarm-lab\lab-repo`.
- **Did not run git, and did not use the network.**
- **Did not spawn any other agent**, and did not change the plugin.
- **Did not execute the `/swarm` command** itself — question (b) is answered on the *presence and exact wording of the line in the prompt*, not on the command's runtime behaviour. A runtime check of the command would need a live session that dispatches it.
- **Did not test the block under other host surfaces** (e.g. a plain `subagent` worker, a non-teammate agent, or the `/swarm` print path). This result is specific to one **native teammate** session.
- **Session-log decoding caveat:** my session store is a concatenation of zstd frames, and 53 of its 154 raw lines are fragments that are not standalone JSON when the frames are joined. The `system/message` entry parsed cleanly and holds the entire served system prompt, so the (d) measurement and the §1 quote are unaffected; but a hypothetical stray marker sitting in one of those unparsable fragments would not have been counted by the per-entry tally. The §2(d) whole-file substring count (which does not parse) was used to rule that out: the only hits are in the entry types attributed in the table above.
- **Not a regression suite:** this is a single-session observation of one worker, not a repeat across hosts or prompt shapes.

---

## 6. Board protocol trace

1. `team_task_get(task-6)` → revision **1**, status `pending`, ready, write scope `.swarm-lab/rounds/R12-live.md`.
2. `team_task_update(task-6, claim, expected_revision=1)` → accepted, revision **2**, owner `prompt-live`, status `in_progress`.
3. This report written (the only file created; nothing else on disk was written).
4. `team_task_update(task-6, complete, expected_revision=2)` → submitted after this file was written.
5. Verdict relayed to the Lead via `send_message(target: lead)`.
