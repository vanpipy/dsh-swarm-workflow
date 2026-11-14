# Ten-round swarm test — `head_tree` worktree of reading-collector

Goal: prove the `@local/swarm-workflow` plugin can drive **real** engineering work in a **real**
repository copy, from simple tasks to complex ones, and that every round ends in working code.

## The substrate

- `D:\project\.swarm-lab\head_tree` — a **git worktree** of `D:\project\reading-collector`
  (the reader's arXiv paper collector), branch `swarm/lab10`, base commit `cb1be29`.
- Created with `git worktree add -b swarm/lab10 <path> HEAD` after `git worktree prune` removed a
  stale, prunable entry from an earlier attempt (`/home/leroy/Project/reading-collector-wt`, a WSL
  path that no longer exists). The host also exposes a `worktrees` service
  (`ctx.worktrees.create(agent, {name, from})` → `{path, branch, baseCommit, repositoryRoot}`),
  but it is only reachable from plugin code, not from a tool, so the swarm used the git mechanism
  the service wraps.
- The main checkout `D:\project\reading-collector` is **read-only** for every worker. Nothing is
  pushed; the Coordinator commits locally on `swarm/lab10`.

## Baseline in the worktree

Full suite: `435 passed` equivalent — the first run reported `11 failed, 426 passed, 15 skipped,
5 errors`; every one of those 16 was an environment artefact, not a defect:

| Artefact | Cause | Fix |
| --- | --- | --- |
| 5 errors in `test_git_sync.py` + 4 failures in `test_cli_integration.py` | `git` is not on `PATH` → `FileNotFoundError` | prepend `C:\Program Files\Git\cmd` to `$env:PATH` |
| 7 failures in `tests/site/test_adsense_skeleton.py` | the site is not built (`site/` is empty) | excluded from the ladder's suite command |

Standard suite command for every worker:

```powershell
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
$env:PYTHONPATH = "D:\project\.swarm-lab\head_tree\src;D:\project\.venv-win\Lib\site-packages"
Set-Location 'D:\project\.swarm-lab\head_tree'
C:\Python312\python.exe -m pytest -q -p no:cacheprovider <paths>
```

`uv run` does not work in this workspace (no venv in the worktree; `uv run` fails with
PermissionError), and `D:\project\.venv-win\Scripts\python.exe` must never be used.

## The ladder (simple → complex)

| Round | Surface | Role | Task | Owned files |
| --- | --- | --- | --- | --- |
| R1 | native teammate (warm) | Developer | correct the stale "06:00 job" comment | `tests/arxiv_collector/test_cli_integration.py` |
| R2 | native teammate (parallel lane) | Developer | remove the redundant duplicate CLI test | `tests/arxiv_collector/test_cli.py` |
| R3 | `subagent` (fresh) | Developer | **real bug**: `pick_daily.py` must never write an empty day file | `scripts/pick_daily.py`, `tests/scripts/test_pick_daily.py` |
| R4 | native teammate | Reviewer | independent review of R1–R3 + revert probe | report only |
| R5 | native teammate (warm) | Developer | document the sync exit-code contract (0 / 1 / 2) | `src/arxiv_collector/cli.py`, `tests/arxiv_collector/test_sync_feed_health.py` |
| R6 | `subagent` (fresh) | Developer | catalog shrink guard — `IndexWriter` must not silently lose entries | `src/arxiv_collector/index.py`, `tests/arxiv_collector/test_index.py` |
| R7 | `workflow` (ONE call, 3 lenses) | read-only | correctness / test coverage / rules-compliance review of R1–R6 | 3 report files |
| R8 | native teammate (warm) | Developer | `check_site_links.py` gains a machine-readable JSON report | `scripts/check_site_links.py`, `tests/scripts/test_check_site_links.py` |
| R9 | `subagent` (fresh) | Reviewer | final review of the whole change set + mutation probe | report only |
| R10 | native teammate (warm) | Tester | acceptance: full suite green, honest report, local commit | `tests/` only |
| R10b | `subagent` (fresh) | Tester | live proof that the re-applied bundle serves the current prompt (a fresh agent, not a warm one) | report only |
| R11 | native teammate (warm) | Tester | remediation: close the two findings the R9 review left open (test-only) | `tests/scripts/test_check_site_links.py`, `tests/scripts/test_pick_daily.py` |

Surfaces exercised: native teammates (warm and cold), `subagent` (fresh, isolated), `workflow`
fan-out. `subagent_fork` is not used — a fork inherits the parent transcript, and this parent is
long (see the plugin's §14 rule).

## Rules every brief carries

- Own only the named files; the board's `write_scopes` are advisory, not a lock.
- Do not commit, do not push, do not deploy, do not touch the main checkout or the plugin bundle.
- Fix the real behaviour; never weaken a test to make a build go green.
- Report **Verified** / **Inferred** / **Not run** per claim, against the assignment contract.

## The rounds, as they happened

| Round | Surface | Worker | Outcome | Commit |
| --- | --- | --- | --- | --- |
| R1 | native teammate (warm) | `eff-dev` | the comment now names 02:00; the file's pytest stayed green | `8120554` |
| R2 | native teammate (parallel lane) | `r9-developer` | the weaker duplicate deleted, the section comment kept, the collected count down by exactly one | `fb2ebae` |
| R3 | `subagent` (fresh) | `3cda22be` | **real defect fixed**: `pick_daily.py:575-589` refuses to write an empty day file; 6 new black-box tests; revert probe proved them non-passengers | `4eb8643` |
| R4 | native teammate | `auditor` | **ACCEPT** — guard placement, "nothing else changed" and test discrimination all proved by a byte-verified revert probe in a scratch copy | — |
| R5 | native teammate (warm) | `eff-dev` | the sync exit-code contract (0 / 1 / 2) written down next to the constants and pinned by 7 exact-value tests; no executable line touched | `8723290` |
| R6 | `subagent` (fresh) | `2f8228d5` | **real defect fixed**: `IndexWriter` now refuses a catalog write that would shrink the catalog (`CatalogShrinkError`), and the refusal happens before the atomic write | `24bedad` |
| R7 | `workflow` (ONE call → 3 lenses) | 3 read-only children | 5 prompt findings + 3 runtime-logic gaps + 2 user-text findings — all fixed in the plugin, see the ledger | — |
| R8 | `subagent` (fresh) | `9e637b3e` | `check_site_links.py` gained `--json PATH` (11-key schema, written on FAIL too, loud on write failure, exit 2 for a failed report on a healthy site); 5 new black-box tests | `16a3d2b` |
| R9 | `subagent` (fresh) | `8fee5e3e` | **ACCEPT** on all six commits — no Blocking, no Material; the 4 mandated mutants were all killed; the extra mutant M5 (`exit_code = 2` → `3`) **survived**, which exposed two real gaps in the test suite (F-1, F-2) | — |
| R10 | native teammate (warm) | `verifier` | **ACCEPT** — clean tree, exactly six commits, exactly the ten allowed paths ("10 files changed, 951 insertions(+), 31 deletions(-)"), `454 passed, 24 deselected in 665.40s` exit 0, ruff "All checks passed!" on the changed files, and three black-box probes (catalog guard raised `CatalogShrinkError` with `index.json` sha256 unchanged; the picker wrote no day file and left the day open, with a control run that did write one; the link checker wrote a FAIL JSON report and exited 1). Slow suite: **Not run** (needs a built `site/`) | — |
| R10b | `subagent` (fresh) | `8c4ad186` | **live proof**: the served worker prompt carries "There is no `swarm` model-routing command here", "The global execution policy reaches you through this prompt and the skill", a probed capability block with "Tools visible to this agent: 58" (independently confirmed against the live registry — 58 schemas), the "Absent in this session" line naming the four board tools, no raw marker strings, and the skill loading with §14 + §15 | — |
| R11 | native teammate (warm) | `eff-tester` | **remediation of the review's own findings** (test-only): the exit code 2 for an unwritable JSON report is pinned exactly (`test_check_site_links.py:375`) and the quiet-day "no day file written — `<date>` stays open" line is asserted (`test_pick_daily.py:898`). "62 passed in 21.41s", ruff clean, 16 tool calls. The Coordinator re-proved it independently: M5 is now killed and a new M6 (`stays open` → `stays closed`) is killed too | `c415a38` |

### What each round actually changed

- **R1** (trivial, one comment): `tests/arxiv_collector/test_cli_integration.py:159-166` — the comment
  claimed the unattended job ran at **06:00**; `AGENTS.md:267-275` says **02:00**. One wrong fact,
  one line of code, one commit.
- **R2** (trivial, one test): `tests/arxiv_collector/test_cli.py` — `test_cli_sync_succeeds_with_empty_feeds`
  was a weaker duplicate of `test_cli_reports_no_failed_source_when_no_sources_are_configured`.
  Deleted only the duplicate; the section comment at the old `:90-94` was kept.
- **R3** (small but real): `scripts/pick_daily.py:575-589` — with `--apply` the picker wrote
  `data/picked/<day>.md` even when every candidate for that day was already picked on an earlier
  day. The empty curated file then made `--newest-unpicked` (which selects the newest day WITHOUT
  a day file) skip that announcement day forever. The guard prints the day, the candidate count and
  the already-picked count, exits 0 (a quiet morning is not a failure) and leaves the day open.
  6 new tests in `tests/scripts/test_pick_daily.py:833-1011` (class `TestQuietDay`).
- **R5** (medium, documentation + tests): `src/arxiv_collector/cli.py:55-87` — the exit-code
  contract of `arxiv-collector sync` written down next to `EXIT_BROKEN_SOURCE = 1` (`:48`) and
  `EXIT_EMPTY_SOURCE = 2` (`:52`), including what the unattended 02:00 job must do with each code.
  7 new tests in `tests/arxiv_collector/test_sync_feed_health.py:547-693` pin the **exact** values.
  No executable line of `cli.py` changed.
- **R6** (medium, real): `src/arxiv_collector/index.py` — `CatalogShrinkError` (`:49-62`) and
  `IndexWriter._assert_catalog_not_smaller()` (`:160-199`), called at `:115`, **before** the atomic
  write at `:117`, so a refused write leaves `data/index.json` byte-identical. The merge body moved
  verbatim into `_merge_entries()` (`:119-158`). 4 new tests in `tests/arxiv_collector/test_index.py:241-357`.
  This is the defect `AGENTS.md` §2 remembers: on 2026-10-22 a replacing sync dropped 491 of 494
  catalog entries and the build stayed green.
- **R8** (complex): `scripts/check_site_links.py` — `--json PATH` writes an 11-key report
  (`REPORT_SCHEMA_VERSION = 1` at `:100`, `build_json_report` at `:272-308`, `write_json_report`
  at `:310-330` with an atomic `mkstemp` + `os.replace`, `emit_json_report` at `:332-346`). The
  report is written when the result is FAIL — that is when it matters — and a report that cannot be
  written is loud; a healthy site whose report cannot be written exits **2** (the site was fine, the
  tool was not). Without the flag the output and the exit code are byte-identical to the old
  script. 5 new tests in `tests/scripts/test_check_site_links.py`; the 6 existing ones untouched.

### The ladder's commits (branch `swarm/lab10`)

```
16a3d2b feat(check_site_links): write a machine-readable JSON report so a CI consumer can read the verdict
8723290 docs(cli): pin the sync exit-code contract 0/1/2 and its exact values in tests
24bedad feat(index): refuse a catalog write that would shrink the catalog
4eb8643 fix(pick_daily): never write an empty day file
fb2ebae test(cli): drop the weaker duplicate of the no-sources test
8120554 docs(tests): the unattended collector job fires at 02:00, not 06:00
cb1be29 docs(agents): the collector fetches and picks, it does not publish   <- base
```

