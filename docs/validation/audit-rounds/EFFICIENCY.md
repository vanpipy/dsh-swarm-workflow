# Swarm efficiency — five measured rounds

Goal: `goal-5f725ed6-db64-4af3-a78a-50381f87d5c3` · plugin reloaded live before the study · all
numbers below come from the session logs themselves, not from worker self-reports.

## Method

- **Reload**: `set_plugin include:swarm-workflow` enabled=false → the `<available_skills>` catalog lost
  `swarm-engineering` → enabled=true → it returned with the user's verbatim description. Live proof that
  the row drives the skill.
- **Lab repo**: `D:\project\.swarm-lab\eff-repo` (package `effdemo`), commit `12ea0cc`, disposable.
- **Measurement**: `D:\project\.swarm-lab\eff\measure.mjs` decodes every session log
  (`session.v4.jsonl.zstd`, zstd frames, magic `28 B5 2F FD`) and counts `tool/call` entries, wall time,
  duplicate calls (identical name + arguments), assistant turns, steps and the served system-prompt size.
  Raw output: `D:\project\.swarm-lab\eff\measure-all.jsonl` (58 logs) and `measure-final.jsonl`.
- **Attribution**: the six agent sessions of this study were isolated by their first timestamp
  (2026-11-07 00:30 →), and the two resumed teammates were split at the `send_message` boundary (00:35:50).

## The five rounds

| Round | Surface | Agent | Task | Tool calls | Wall | Served prompt |
|---|---|---|---|---|---|---|
| E1 | native teammate (fresh) | `eff-dev` (Developer) | `longest_word` + 4 tests | 17 | 462 s | 15,254 chars |
| E2 | native teammate (fresh, parallel lane) | `eff-tester` (Tester) | 10-clause spec test, failing on purpose | 16 | 469 s | 15,254 chars |
| E3 | `workflow` fan-out — **3 agents in ONE call** | children 1-3 (prompt / skill / runtime lenses) | review the shipped bundle | 15 + 19 + 12 = **46** | 223 / 161 / 263 s (parallel span 263 s) | 12,930 chars |
| E4a | `subagent` (one-shot) | `ab37d584` | `char_counts` + 6 tests | 13 | 110 s | 12,701 chars |
| E4b | native teammate (**resumed**, warm context) | `eff-dev` | `first_last_letter` + 5 tests | **9** | — | (same session) |
| E5 | native teammate (**resumed**, warm context) | `eff-tester` | honest-failure probe of E1 | **9** | — | (same session) |
| probe | `subagent` (no-tool task) | `b685b392` | quote the served worker prompt | **1** | 23 s | 13,225 chars |

**Totals**: 7 agent sessions, **111 agent tool calls**; the Coordinator spent **42** tool calls for the
whole study — of which 13 were the measurement harness itself and 2 were ledger compression, so the real
dispatch overhead for **8 assignments** is **≈19 calls**.

## What the numbers say

1. **Dispatch overhead is about one call per agent, if you pick the right surface.**
   `workflow` turned three reviews into **one** Coordinator call; a native teammate costs spawn + board
   create + board bookkeeping. 19 Coordinator calls for 8 assignments, against 111 agent-side calls.

2. **The fan-out is the cheapest per agent and the fastest in wall-clock.** Three reviews that would cost
   3 × ~465 s serially finished in **263 s** together, for one dispatch call.

3. **A warm member is 31 % cheaper than a fresh one for the same work.** E4b (9 calls) vs E4a (13 calls).
   The saved calls are exactly the orientation work: the `skill` load (1), the repo reads (4) and one
   `pwsh`. The warm lane spent those calls on the board instead (3). Context reuse is the saving.

4. **The board costs 3-4 calls per teammate task** (get → claim → get → complete) — 22 % of a 17-call
   task. For a bounded one-shot task a `subagent` is cheaper; for a member you may steer later, the board
   is what makes the task resumable (E4b and E5 were both resumed through it).

5. **A task that needs no tools costs one call.** The prompt-verification probe used a single
   `send_message` and 23 s.

6. **Waste actually observed**: 1 duplicate call in E1 and 2 in E2 (identical name + arguments — repeated
   `git status`); one garbled self-report in E1 that cost a second `send_message`; one failed
   `spawn_teammate` (roster limit 8) — but its fallback turned out to be *cheaper* than the fresh spawn it
   replaced; and the parallel lanes in one tree could not run the full suite while a sibling held an
   in-flight file (two lanes had to report the collection `ImportError` rather than a green run). One
   lane also refused to delete `__pycache__` while a sibling could be inside pytest — correct, and it
   named the hazard instead of acting on it.

7. **The honest-failure lane was cheap and found more than the requirement did.** E5 used 9 calls to
   report that E1's implementation returns the first maximum-length word **in input order**
   (`core.py:19`, strict `>`) and not the alphabetically first — and then found that E1's tie test was
   **non-discriminating** ("ccc" is alphabetically first too), so it would pass under either rule. No code,
   no test and no spec was touched.

8. **A live host fact the capability gating surfaced**: a plain `subagent` gets a **reduced registry** —
   **58 tools against the Lead's 64** — with no `spawn_teammate` and no `team_task_create`. The served
   worker prompt therefore dropped the native-teams bullets and printed
   `- **Absent in this session:** `spawn_teammate` · `team_task_create` — do not plan around these.`
   A delegated worker cannot spawn teammates; only a native teammate can.

## Verdict

The swarm is **efficient in dispatch and honest in execution**: one Coordinator call can fan out to many
agents, a resumed member costs a third less than a fresh one, and the lanes report defects instead of
papering over them. The waste that remains is small and structural — board bookkeeping on one-shot tasks,
orientation calls on fresh agents, and one tool call per re-measurement. Two of the three findings the
fan-out review produced were real defects in the plugin's own gating (fixed in R13, see `FINDINGS.md`).

## Artefacts

- `D:\project\.swarm-lab\eff\measure.mjs` — the measurement tool
- `D:\project\.swarm-lab\eff\measure-all.jsonl` — every session log, measured
- `D:\project\.swarm-lab\eff\eff-r5-discrepancy.md` — E5's honest-failure report
- `D:\project\.swarm-lab\eff-repo` — the disposable lab repo (left dirty on purpose, as the lab state)
