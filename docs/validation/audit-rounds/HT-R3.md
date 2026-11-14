# HT-R3 — Developer report — empty curated day file in `scripts/pick_daily.py`

**Lane:** HT-R3 (Developer) · **Worktree:** `D:\project\.swarm-lab\head_tree` (branch `swarm/lab10`, base `cb1be29`)
**Role:** Developer — fix the real defect, add the regression tests, leave the change in the working tree.
**Commit/push:** none. No network. No deployment. Only the two owned files were written by me.

---

## 1. What changed

### 1.1 `scripts/pick_daily.py` — new guard in `main()`

**Symbol:** `main()` (the `--apply` write path).
**New guard: lines 575–589** (`if not items:` block). It sits **after** the refuse-to-overwrite check (`:567-573`) and **before** `output.parent.mkdir(...)` (`:591`).

```python
575:    if not items:
576:        # Nothing survived the filter: every candidate for this day was
577:        # recorded on an earlier day. Writing the file anyway would close
578:        # the day behind an empty list — ``--newest-unpicked`` never
579:        # offers a day that already has a file, so that announcement
580:        # would never be offered again. A quiet morning is not a
581:        # failure, so nothing is written and the day stays open.
582:        picked_before = sum(1 for paper in candidates if paper.source_id in exclude)
583:        print(
584:            f"[pick_daily] nothing to pick for {target_day.isoformat()}: "
585:            f"{len(candidates)} candidate(s) that day, {picked_before} of them"
586:            " already picked on an earlier day"
587:        )
588:        print(f"[pick_daily] no day file written — {target_day.isoformat()} stays open")
589:        return 0
```

**Exact behaviour change (Verified by the new tests and by an end-to-end run):**

- **Before:** with `--apply`, the day file was written unconditionally, even when the ranked list `items` was empty — an empty curated day file was created. Because `--newest-unpicked` selects the newest announcement day that has **no** day file, that day was then closed forever behind that empty file.
- **After:** when `items` is empty, **no file is written at all** (default `data/picked/<date>.md` path *and* an explicit `--output` path, with or without `--force`), and the run **returns 0**.
- The message names the **day**, the **number of candidates for that day** (`len(candidates)`) and **how many of those candidates were already picked on an earlier day** (`picked_before` = candidates whose `source_id` is in `exclude`, i.e. ids recorded on a day other than `target_day`, because `exclude = already_picked(..., exclude_day=target_day.isoformat())`).
- Because no file exists, the day **stays open**: a later run in which new papers for that day are available can still write it.

**Contract points, one by one:**

| # | Contract | Where | Status |
|---|---|---|---|
| 1 | Never write an empty day file (default path and explicit `--output`, with or without `--force`) | `scripts/pick_daily.py:575-589` | Verified |
| 2 | Message names day + candidate count + already-picked-earlier count | `scripts/pick_daily.py:583-588` | Verified |
| 3 | Exit 0, no new exit code (1 and 2 unchanged) | `scripts/pick_daily.py:589` (`return 0`); exit 1 still returned by the refuse-to-overwrite path at `:573`; exit 2 unchanged | Verified |
| 4 | Day stays open (no file → later run can write it) | `scripts/pick_daily.py:575-589` + test `test_the_day_stays_open_for_a_later_pick` | Verified |
| 5 | Everything else unchanged — `MAX_PICKS_PER_DAY = 20` (`:70`), refuse-to-overwrite-without-`--force`, the `--newest-unpicked` selection rule, the wording of the other paths, the exit codes | only the 16 lines at `:575-589` were added; no other line of the file changed | Verified |

**Verified:** `git diff --stat` for this file is `scripts/pick_daily.py | 16 +++` — 16 added lines, **0 removed**, **0 modified**. The only edit is the guard.

### 1.2 `tests/scripts/test_pick_daily.py` — new class `TestQuietDay`

**Location:** lines **833–1011**, under a new section header (`# The quiet day`, lines 828–832), inserted before the existing "The reading list is not a build input" section.

Helpers in the class: `_run(monkeypatch, tmp_path, *, papers, args)` monkeypatches `pick_daily.fetch_papers` and points `pick_daily.PICKED_DIR` at `tmp_path/"picked"`; `_args(taste_file, feeds_file, *extra)` builds the CLI argv (`--date 2026-11-04 --taste ... --feeds ...`); `_yesterday(tmp_path)` writes `picked/2026-11-03.md` containing `- **arXiv**: [2611.03650](https://arxiv.org/abs/2611.03650)`.

The six new black-box tests:

1. `test_no_day_file_is_written_when_everything_was_picked_before` — **(a)** `--apply`, the only candidate was already picked on an earlier day → exit code 0, `picked/2026-11-04.md` does **not** exist, stdout contains `nothing to pick for 2026-11-04`, `1 candidate(s) that day` and `1 of them already picked on an earlier day`.
2. `test_the_day_stays_open_for_a_later_pick` — **(b)** a second run in which a new paper (`2611.03651`) exists for the same day writes the day file, and it contains exactly `{"2611.03651"}` (the earlier-picked paper is not repeated).
3. `test_newest_unpicked_offers_the_quiet_day_again` — with `--newest-unpicked`, after a quiet run the only file left in `picked/` is `2026-11-03.md`, i.e. the quiet day was not closed by an empty file.
4. `test_force_does_not_write_an_empty_day_file` — **(c)** `--apply --force` → still no day file.
5. `test_force_keeps_a_curated_file_instead_of_emptying_it` — `--apply --force` against an existing curated file leaves that file's content intact (not emptied, not truncated).
6. `test_an_explicit_output_path_gets_no_empty_file` — `--apply --output elsewhere.md` → `elsewhere.md` is not created.

**Verified:** `git diff --stat` for this file is `tests/scripts/test_pick_daily.py | 186 +++++++++++++` — additions only; no existing test was edited, weakened, skipped or re-thresholded.

### 1.3 Red-before-green evidence

- **Verified:** with the tests added and the fix *not* yet in place: `6 failed, 45 passed in 0.77s`. The captured stdout of the failing test showed the defect directly: `[pick_daily] 0 pick(s) of 1 candidate(s)` followed by `[pick_daily] wrote ...\elsewhere.md`.
- **Verified:** after the fix: `51 passed in 0.95s` (45 pre-existing + 6 new).

---

## 2. Commands run and their results (all Verified)

### pytest — the owned test file

```powershell
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
$env:PYTHONPATH = "D:\project\.swarm-lab\head_tree\src;D:\project\.venv-win\Lib\site-packages"
Set-Location 'D:\project\.swarm-lab\head_tree'
C:\Python312\python.exe -m pytest -q -p no:cacheprovider tests/scripts/test_pick_daily.py
```

**Final output line:** `51 passed in 0.95s`

(Before the fix, same command: `6 failed, 45 passed in 0.77s`. Baseline before any change of mine: `45 passed in 0.53s`.)

### pytest — the whole non-slow suite (regression check)

```powershell
C:\Python312\python.exe -m pytest -q -p no:cacheprovider -m "not slow"
```

**Final output line:** `442 passed, 24 deselected in 522.27s (0:08:42)` — exit code 0.
(This run happened while the other lane was mid-edit in the same tree; it passed anyway.)

### ruff

```powershell
& 'D:\project\.venv-win\Scripts\ruff.exe' check --no-cache scripts/pick_daily.py tests/scripts/test_pick_daily.py
```

**Output line:** `All checks passed!`

```powershell
& 'D:\project\.venv-win\Scripts\ruff.exe' format --check --no-cache scripts/pick_daily.py tests/scripts/test_pick_daily.py
```

**Output line:** `2 files already formatted`
(`ruff format` was run on **only** these two files; no other file in the repo was touched or reformatted.)

### git status --short (final read, at report time)

```
 M scripts/pick_daily.py
 M src/arxiv_collector/cli.py
 M src/arxiv_collector/index.py
 M tests/arxiv_collector/test_index.py
 M tests/arxiv_collector/test_sync_feed_health.py
 M tests/scripts/test_pick_daily.py
```

`git diff --stat` at the same moment:

```
 scripts/pick_daily.py                          |  16 +++
 src/arxiv_collector/cli.py                     |  39 ++++++
 src/arxiv_collector/index.py                   | 115 ++++++++++++++-
 tests/arxiv_collector/test_index.py            | 147 +++++++++++++++++++
 tests/arxiv_collector/test_sync_feed_health.py | 165 +++++++++++++++++++++-
 tests/scripts/test_pick_daily.py               | 186 +++++++++++++++++++++++++
 6 files changed, 663 insertions(+), 5 deletions(-)
```

---

## 3. What I could NOT fully satisfy — the `git status --short` acceptance criterion

**Verified:** at the start of my lane the tree was **clean** (`git status --short` printed nothing; `git log -1` = `fb2ebae` on `swarm/lab10`). During my session four files outside my ownership changed, none of them by me:

| File | Diff | Belongs to |
|---|---|---|
| `src/arxiv_collector/cli.py` | +39 | another lane (exit-code contract documentation for `arxiv-collector sync`) |
| `src/arxiv_collector/index.py` | +115 | another lane |
| `tests/arxiv_collector/test_index.py` | +147 | another lane |
| `tests/arxiv_collector/test_sync_feed_health.py` | +165 | another lane (appeared in the final read) |

**Inferred (high confidence):** a second worker is editing this same worktree concurrently. File mtimes for those four files fall inside my session window (01:24–01:35), while the tree was clean at 01:23.

**What I did about it:** nothing destructive. Per AGENTS.md §7 ("Respect other people's work") I did **not** revert, stash, stage or touch those files — I only wrote my two owned files. **I did not commit**, so the extra files are not attributable to my change.

**Consequence:** the acceptance criterion "git status --short shows EXACTLY the two owned files" **cannot hold in this shared tree at this moment**. It held for my own contribution: exactly two files are modified by me (`scripts/pick_daily.py`, `tests/scripts/test_pick_daily.py`), and `git diff --stat` attributes 16 and 186 added lines to them respectively.

**Recommended action for the Coordinator:** before committing, verify that only the intended lane's files are staged (e.g. `git add scripts/pick_daily.py tests/scripts/test_pick_daily.py` and check `git diff --cached --stat`), and keep the other lane's four files out of this commit. The full non-slow suite passed with all six files modified, so the tree is consistent as it stands.

---

## 4. Honesty ledger

**Verified** (I ran it and saw the result):

- Baseline `tests/scripts/test_pick_daily.py` = `45 passed in 0.53s`; after adding the tests only = `6 failed, 45 passed in 0.77s`; after the fix = `51 passed in 0.95s`.
- Full non-slow suite = `442 passed, 24 deselected in 522.27s (0:08:42)`, exit 0.
- `ruff check --no-cache` on both owned files = `All checks passed!`; `ruff format --check` on both owned files = `2 files already formatted`.
- `git diff --stat` shows my two files as additions-only (16 and 186 lines).
- The tree was clean at the start of my lane (`git status --short` empty, HEAD `fb2ebae`).
- End-to-end manual run (temp script under `%TEMP%`, deleted afterwards; not in the repo): with `--apply` and every candidate already picked → exit code 0, **no** `2026-11-04.md` created, stdout
  `[pick_daily] nothing to pick for 2026-11-04: 1 candidate(s) that day, 1 of them already picked on an earlier day`
  and
  `[pick_daily] no day file written — 2026-11-04 stays open`;
  a following `--newest-unpicked --apply` run with one new paper printed `[pick_daily] 1 pick(s) of 2 candidate(s)`, wrote `2026-11-04.md` containing only `2611.03651`, exit code 0.
  (In the captured console text the em dash appears mangled as `��`; that is the PowerShell code page, not the file — the file is written UTF-8 and the pytest assertions match the em dash.)
- No commit, no push, no network, no Firebase deploy, no changes outside the two owned files.

**Inferred** (read the code / reasoning, did not execute):

- The four foreign modified files belong to a concurrent worker rather than to a stray script of mine — supported by the clean-tree start and their mtimes.
- The guard's placement after the refuse-to-overwrite check is what keeps the exit-1 path and its wording untouched; I reasoned about the ordering rather than testing the exit-1 wording in the new tests (that path is covered by pre-existing tests, which still pass).

**Not run:**

- The `slow` pytest marker (needs a built `site/` tree; out of scope and not required by this lane).
- `mkdocs build --clean --strict` and `scripts/check_site_links.py` — the site is not a build input of `data/picked/`, and this lane touched no site input. AGENTS.md is explicit that `data/picked/` is not a build input.
- The full suite with the `slow` marker, and any CI run.

**Unresolved / for the Coordinator:**

- The `git status --short` acceptance criterion cannot be met while another lane works in the same tree (section 3). My contribution is exactly the two owned files.
- A commit is still owed by the Coordinator (I did not commit).
