# swarm-lab — acceptance report (round R10)

The acceptance decision for the ten-round test phase of the `dsh-swarm-workflow`
refactor. This report is the Lead's, not a lane's: every lane report it cites is
evidence, and the verdicts below were re-checked by the Lead against the
repository and by execution.

- **Requirement carrier**: `.swarm/requirements/swarm-lab.md` (R1–R10, each a
  `requirement` / `check:` / `source:` block).
- **Work item**: `D:\project\swarm-lab-python` (the workflow arm).
  `D:\project\swarm-lab-control` is the control arm: the same specification
  implemented in one pass, with no swarm workflow, by a child that never read the
  workflow arm.
- **Plugin under test**: `D:\project\dsh-plugins\dsh-swarm-workflow`, installed in
  the desktop profile as a junction to the source tree
  (`link:D:\project\dsh-plugins\dsh-swarm-workflow`, version 2.0.0, installed true).
- **Date**: 2026-11-11.

## 1. Verdict in one line

**R1–R10 all `met`. The four goals are demonstrated by execution, with two
recorded boundaries and one live defect in the plugin found by the phase and
fixed, re-tested and committed.**

## 2. Requirement verdicts

| Req | Requirement (short) | Verdict | Evidence |
|---|---|---|---|
| R1 | `swarmlab.text.normalize_ws(text: str) -> str` collapses whitespace runs, strips the ends, preserves order, `""` for blank input | **met** | live `inspect.signature` → `swarmlab.text.normalize_ws(text: str) -> str`; `python -m unittest tests.test_text.TestNormalizeWs` → 7 tests, OK, exit 0 (`swarm-lab-workflow-api.md`) |
| R2 | `swarmlab.text.tokenize(text: str) -> list[str]` lowercase alphanumeric tokens in order | **met** | live signature; `tests.test_text.TestTokenize` → 10 tests, OK; live probe `tokenize unicode: ['héllo','wörld','42']` |
| R3 | `swarmlab.stats.word_frequency(tokens: list[str]) -> list[tuple[str,int]]` count desc, then token asc | **met** | live signature; `tests.test_stats.TestWordFrequency` → 9 tests, OK |
| R4 | `swarmlab.report.summarize(tokens: list[str]) -> dict[str,object]` with `total`, `unique`, `top` | **met** | live signature; `tests.test_report.TestSummarize` → 9 tests, OK |
| R5 | `python -m swarmlab <file>` prints the summary and exits 0; a missing file prints `swarmlab: no such file: <path>` on stderr and exits 2 | **met** | stdout and stderr captured apart: exit 0 with `total: 16`, `unique: 11`, five `top tokens:` entries; missing file → exit 2, stdout empty, stderr exactly the required line |
| R6 | every public function annotated, every public module documented | **met** | `tools/quality_report.py --json` → `annotation_coverage` 1.0, `docstring_coverage` 1.0, `module_docstring_coverage` 1.0; independently re-derived from the AST by the fan-out lane, which agreed |
| R7 | every public function is exercised by a test | **met** | `public_functions_without_tests: []`, count 0 — and the check now discriminates: the Lead's own probe (a public function named only in a test comment) is reported as untested, count 1 |
| R8 | the package exposes one public surface, five modules, no import side effects | **met** | `public_function_names` = main, normalize_ws, summarize, tokenize, word_frequency; `package_modules` 5; an audit hook installed before the import recorded no side effect |
| R9 | the behaviour of R1–R5 does not change while the round-R4 findings are remediated | **met** | `git diff --stat cb51065 4ce9aa8 -- tests` → empty; `git diff --stat cb51065 4ce9aa8 -- swarmlab` → empty; the suite still runs 54 tests, OK, exit 0 — all re-run by the Lead, not only by the lane |
| R10 | `python -m swarmlab a.txt b.txt` prints one summary per file, in order, and exits 0; the first missing file stops the run with exit 2 | **met** | two files → two blocks in order, exit 0; `sample.txt does-not-exist.txt` → exit 2, the first block still on stdout, the error on stderr; a single missing file → exit 2, stdout empty |

Requirement sources: `swarm-lab-developer.md` (R2), `swarm-lab-tester.md` (R3),
`swarm-lab-reviewer.md` (R4), `swarm-lab-workflow-*.md` (R7 fan-out and merge),
`swarm-lab-remediation.md` (R9), `swarm-lab-r9-primitives.md` and
`swarm-lab-r10.md` (R9, R10).

## 3. The four goals

| Goal (as the user stated it) | Verdict | What proves it |
|---|---|---|
| 1. "the workflow can work as wish" | **demonstrated** | Ten rounds ran end to end on the installed bundle: bootstrap, Developer lane, Tester lane, Reviewer lane, remediation lane, native-teammate lane, delegated-`subagent` lane, scripted `workflow` fan-out with a merge stage, human decision round, primitives round, acceptance. The bundle was installed locally from the source tree and its composed prompts were printed from the REAL host runtime (`tools/host_prompt_probe.mjs`: ALL CHECKS PASSED — Coordinator 41108 chars / 730 lines, Worker 28670 chars / 501 lines, no plugin marker surviving in either). |
| 2. "the dsh features enabled under workflow" | **demonstrated, with two recorded boundaries** | See the matrix in §4. Every surface the runtime note names was exercised under the workflow; `swarm_worktree` is absent on this host and `subagent_fork` was deliberately not used. |
| 3. "the code quality can upgrade when agentic coding" | **demonstrated against a control arm** | See §5: the same specification, measured by the same instrument. The workflow arm is shorter, less nested, duplicate-free and carries more tests; the coverage metrics are equal. |
| 4. "the docs can saved `.swarm` locally in each workspace" | **demonstrated** | See §6: the requirement file, the decisions, the lane reports and the measurement snapshots all live under `D:\project\swarm-lab-python\.swarm\`, and the plugin's runtime note now tells the Coordinator that this is where the work of a work item is written down. |

## 4. The DSH feature matrix (goal 2)

Every surface the runtime note names, and what it did under the workflow.

| Surface | Exercised how | Verdict |
|---|---|---|
| `spawn_teammate` + `send_message` + `interrupt_agent` + `list_agents` + `wait_agent` | eight native teammate lanes (plugin Developer, Tester, Reviewer, the `swarm_task` fix lane, the lab Developer, Tester, Reviewer and remediation lanes), each with its own context, its own board task and its own write scope | **works** |
| `team_task_create` / `team_task_get` / `team_task_list` / `team_task_update` | the shared board carried task-1 … task-10, with requirement text in the task description, `claim` and `complete` under a compare-and-set revision, and the requirement cited by task id | **works** |
| `todo_write` | the round ledger, one row per round (R1 … R10) | **works** |
| `create_goal` / `get_goal` / `update_goal` | the session goal carried the phase objective across rounds | **works** |
| `subagent` | two delegated children with their own context: the R6 audit of the requirement set, and the control-arm implementation that never read the workflow arm | **works** |
| `workflow` | a scripted fan-out (background job `workflow-548d264dea144d3e`): three independent lanes over disjoint requirement slices, each with one write scope, then a merge lane that folded the three reports into one verdict table; every lane returned a structured verdict object | **works** (the first attempt failed on `subagent limit reached (active child limit: 8)`; four orphaned children were stopped and the fan-out re-run with the budget free) |
| `swarm_task` | list, get, claim, complete, release against the real board — and the phase found a live defect here (see §7) | **works after the fix** |
| `swarm_child` | `list` against the real host: five continuable lanes observed | **works** |
| `swarm_worktree` | not exercisable: this host provides no `worktrees` service, and the bundle that would supply one (`@deepseek-ai/dsh-experimental-tool-worktree@0.2.1-alpha.2`) is refused by the host as `incompatible-version` against dsh 0.2.2-rc.1 | **recorded boundary**, not a gap — `.swarm/decisions/2026-11-11-worktree-boundary.md`, the user's decision was to keep it disabled |
| `ask_user_question` | two product decisions put to the human mid-phase (the worktree exemption, the multi-file CLI shape) | **works** |
| `schedule_create` / `schedule_list` / `schedule_edit` | a far-future probe task was created, listed and deleted in the same minute, so the surface is proven without leaving a trace | **works** |
| `skill` | the `swarm-engineering` skill loaded live from the installed bundle and showed the composed v2 content (runtime-note skill blocks + the user's skill text verbatim) | **works** |
| `list_subagent_models` | the provider registry answered `minimax-cn → minimax-cn`, which is the host's real model-routing surface | **works** |
| `plugin_manager` | the GitHub-sourced bundle was removed and reinstalled from the local tree (`link:`), and the live skill catalog changed with it | **works** |
| `job_list` / `job_output` / `job_kill` | the background fan-out job was observed and its orphaned children stopped | **works** |
| `subagent_fork` | deliberately not exercised: a fork inherits the whole conversation and the host's own memory records a fork in a long session acting on the inherited request instead of the brief (one such child installed an unauthorised bundle); this session's context is also past the host's fork preflight size limit | **deliberately not used** |
| `/autoreview`, `/autojudge`, `/review`, `/judge` | these commands do not exist on this host — the strings are absent from the host asar and the host's plugin inventory has no review or judge surface; independent verification was therefore done by a Reviewer lane instead | **not available, by design of the host** |

## 5. The quality comparison (goal 3)

The same instrument (`tools/quality_report.py`, the fixed version) over both arms.
The control arm is the same specification implemented in ONE pass without the
swarm workflow. Numbers: `.swarm/reports/swarm-lab-quality-comparison.json`.

| Metric | Control (one pass) | Workflow (rounds) | Verdict |
|---|---|---|---|
| `package_modules` | 5 | 5 | same |
| `public_functions` | 5 | 5 | same |
| `annotation_coverage` | 1.0 | 1.0 | same |
| `docstring_coverage` | 1.0 | 1.0 | same |
| `module_docstring_coverage` | 1.0 | 1.0 | same |
| `public_functions_without_tests_count` | 0 | 0 | same |
| `avg_function_length` | 15.8 | 5.6 | **better** (2.8× shorter on average) |
| `max_function_length` | 25 | 14 | **better** |
| `max_nesting_depth` | 3 | 2 | **better** |
| `duplicate_line_ratio` | 0.1048 | 0.0 | **better** (no duplicated lines) |
| `test_functions` | 42 | 51 | **better** (+9) |
| `test_cases` | 43 | 54 | **better** (+11) |

The mechanism is visible in the history: the control arm wrote one longer
function per behaviour, while the workflow arm's Reviewer lane found that the
18-line CLI entry point mixed two jobs and the remediation round split it into
`_print_summary` and `main` (`swarmlab/__main__.py:17-30` and `:33-46`), which is
where the average and maximum function lengths came from.

Two honest caveats: the metric set is the lab's own instrument, not an
independent quality standard, and the control arm was produced by the same
model family — the comparison shows a difference between one pass and a reviewed
multi-round pass, not a general law.

## 6. The `.swarm` artifacts (goal 4)

```
D:\project\swarm-lab-python\.swarm\
├── requirements\swarm-lab.md            R1–R10, the requirement carrier
├── decisions\
│   ├── 2026-11-11-cli-multiple-files.md     the human decision: one summary per file
│   └── 2026-11-11-worktree-boundary.md      the human decision: swarm_worktree stays disabled
└── reports\
    ├── swarm-lab-developer.md            R2 lane
    ├── swarm-lab-tester.md               R3 lane
    ├── swarm-lab-reviewer.md             R4 lane
    ├── swarm-lab-remediation.md          R4b lane
    ├── swarm-lab-workflow-api.md         R7 fan-out, lane 1
    ├── swarm-lab-workflow-cli.md         R7 fan-out, lane 2
    ├── swarm-lab-workflow-tests-docs.md  R7 fan-out, lane 3
    ├── swarm-lab-workflow.md             R7 fan-out, merged verdict
    ├── swarm-lab-r9-primitives.md        the primitives round
    ├── swarm-lab-r10.md                  the multi-file CLI round
    ├── swarm-lab-acceptance.md           this report
    ├── swarm-lab-quality-r2.json         measurement after R2
    ├── swarm-lab-quality-r2b.json        measurement after R2b
    └── swarm-lab-quality-comparison.json / .md   the workflow arm against the control arm
```

The plugin side of goal 4 is in `runtime-note.md`: the section "Where the work is
written down on this host" tells the Coordinator that the requirement set, the
decisions and the lane reports of a work item live in the `.swarm` directory of
the workspace that work item targets, and that the requirement file wins over the
board task when they disagree. That text was added because the v2 text the user
supplied says "Jcode has no separate requirements file" — true of Jcode, false of
this host.

## 7. What the phase found in the plugin itself

The primitives round (R9) exercised the plugin's three primitives against the
real host and found a **live defect**:

- `swarm_task {action:"list"}` and `{action:"get"}` failed with
  `tool "swarm_task" returned invalid output: value is not lossless JSON`
  whenever ANY board task was unowned.
- Root cause, confirmed in the host source: `ToolsService.createSuccessResult` →
  `snapshotToolValue` → `snapshotJsonValue` returns `undefined` for a result that
  carries an `undefined` property value, and the host then rejects the whole
  result. `projectTask()` copied `owner: task.ownerName` with no fallback, and
  the host leaves `ownerName` undefined for an unowned task.
- Fix (plugin commit `c99d993`, `index.js` 1398 → 1433 lines): `textOrEmpty()` and
  `membershipRole()` helpers; every projected field now matches the type the
  output schema declares; `swarm_worktree` reports an explicit error when the
  host returns no path; `swarm_child` projects `id`/`mode`/`createdAt` safely.
  Sixteen new checks (suite 63 → 79) — and they discriminate: the same test file
  against a reverted copy fails 12 of the 79.
- Independent end-to-end proof: a fresh process loaded the INSTALLED bundle onto
  the real host cordis runtime with an unowned task on the board and ran the
  host's own gate (`snapshotJsonValue` + `validateJsonSchemaValue`) — every step
  passed, and the same gate rejects the pre-fix projection.

The plugin's five suites pass after the fix (`ALL SUITES PASSED (5)`, swarm-tools
at 79 checks), and the three user-owned files are still byte-identical to the
uploads (SHA256 `A86AC8CC18EB` / `706B13064101` / `949D0B9B092C`).

> **Later note (2026-11-11, after this acceptance).** The user then edited
> `prompt-overlay.md` themselves — the code-health section renumbered from
> `7A` to `7.0` with subsections `7.1`–`7.7` — and that edit was committed and
> pushed (`2df6ab1`). The plugin ships the file as the user leaves it, so
> `prompt-overlay.md` is no longer byte-identical to the original upload; the
> other two still are. The byte-identity that matters is the one the plugin
> guarantees: the bundle carries the user's text exactly as written, which the
> `.gitattributes` rule (`build: keep the shipped files byte for byte`,
> `128b800`) now also protects through a clone.

## 8. Commit ledger

Lab repository `D:\project\swarm-lab-python`:

| Commit | Round |
|---|---|
| `120483e` | baseline: requirement set, quality instrument, empty package |
| `6735104` | R2: the swarmlab package implements R1–R8 |
| `d08eac1` | R2b: the CLI summarises several files (R10) |
| `cb51065` | R3: the Tester lane adds the requirement clause tests |
| `622349b` | the requirement set: R9 names its baseline commit; the README lists R1–R10 |
| `0c0f566` | the two human decisions and the round R2b / R9 evidence |
| `8721ae1` | the workflow arm against a single-shot control, same instrument |
| `4ce9aa8` | R4b: the quality instrument checks call sites and exempts self/cls |
| `7612b0b` | R4b: the remediation report and the refreshed quality comparison |

Plugin repository `D:\project\dsh-plugins\dsh-swarm-workflow`: `c99d993` — the
verbatim bundle, the composed prompts and the `swarm_task` fix.

## 9. What was not verified, and known limits

1. **`swarm_worktree`** was never exercised against a real `worktrees` service:
   this host has none, and the bundle that would provide one is refused by the
   host's version check. The new "no path" guard is covered by the stub test
   only.
2. **`subagent_fork`** was deliberately not exercised; the reason is recorded in
   §4.
3. **The Reviewer lane's own scope**: it did not check packaging or installation
   (the lab package has no `pyproject.toml`), a Python version matrix, encoding
   robustness on a non-UTF-8 console, the historical R2/R2b builds, the plugin
   tree, or security.
4. **The remediation round was not independently reviewed.** The Lead verified it
   by execution (the empty diffs, the suite, the instrument numbers and its own
   F1 probe), not by a second reviewer.
5. **Commit `4ce9aa8`'s subject carries a UTF-8 BOM** (written with
   `Set-Content -Encoding UTF8` on Windows PowerShell 5.1). The content, author
   and tree are unaffected, and the id is cited by the reports, so it was left
   standing rather than rewritten. The lesson is in the report the lane wrote.
6. **`tools/quality_compare.py` has no `test_cases` row** in its printed table
   (the metric tuple does not list it); the values live in the JSON.
7. **The comparison in §5 uses the lab's own instrument.** It is a consistent
   measurement of two implementations, not an external quality standard.
8. **The plugin was not pushed.** The desktop profile now installs the bundle
   from the local tree, but the GitHub remote still carries the old 1.0.0.

## 10. The acceptance decision

**Accepted.** R1–R10 are `met` with executed evidence, the four goals are
demonstrated, the one live defect the phase found is fixed, re-tested and
committed, and the limits above are stated rather than hidden. The next
decision that belongs to the human: whether the plugin commit `c99d993` is
pushed to `github.com/vanpipy/dsh-swarm-workflow`.
