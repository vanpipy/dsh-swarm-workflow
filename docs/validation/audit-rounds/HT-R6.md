# HT-R6 — Developer report: "the catalog never silently shrinks" enforced by code and pinned by tests

- **Lane:** HT-R6, role Developer
- **Repo:** `D:\project\.swarm-lab\head_tree` (git worktree of *reading-collector*, branch `swarm/lab10`, HEAD `fb2ebae`, base `cb1be29`)
- **Date:** 2026-11-07 (local, Asia/Shanghai)
- **Owned files touched:** `src/arxiv_collector/index.py`, `tests/arxiv_collector/test_index.py` — and nothing else
- **No commit, no push, no deploy.** The change is left in the working tree for the Coordinator.

---

## 1. What the change is

AGENTS.md §2 says `data/index.json` is a *cumulative* catalog and must never be replaced wholesale.
The merge that guarantees this existed in the code but was implicit and untested against the
2026-10-22 regression (491 of 494 entries vanished, every converted paper disappeared, the build
still succeeded). This lane makes the guarantee **enforced by a guard** and **pinned by tests**.

I chose the contract's second option — *keep the merge AND add the guard as a final safety net* —
so the public behaviour of the writer is unchanged for the normal case.

### 1.1 The guard

| Item | Location | What it is |
|---|---|---|
| `CatalogShrinkError` | `src/arxiv_collector/index.py:49-62` | New public exception (`RuntimeError`), exported in `__all__` at `src/arxiv_collector/index.py:269` |
| `IndexWriter._assert_catalog_not_smaller()` | `src/arxiv_collector/index.py:160-199` | **The guard itself** |
| Call site | `src/arxiv_collector/index.py:115` (inside `IndexWriter.write()`, `:75-117`) | The guard runs **before** `self._atomic_write(...)` at `src/arxiv_collector/index.py:117` |
| `IndexWriter._merge_entries()` | `src/arxiv_collector/index.py:119-158` | The merge body, moved out of `write()` **verbatim** (no logic change) so the guard can be exercised end-to-end against a deliberately broken merge |
| `_catalog_keys()` | `src/arxiv_collector/index.py:253-266` | Helper returning the `(source, source_id)` keys of a list of catalog entries |

**What the guard does** (Verified by reading the code I wrote and by the tests in §2):

1. Computes the keys of the catalog it read (`existing`, already deduped by `(source, source_id)`
   in `_load_existing()`) and the keys of the catalog it is about to write (`entries`).
2. If **any** key of the catalog on disk is missing from the new catalog, **or** the new catalog
   holds fewer entries than the one on disk, it raises `CatalogShrinkError` and **abandons the
   write**. The file on disk keeps the catalog it had — the refusal happens before the atomic
   write, so nothing is truncated or half-written.
3. The message names the file, both sizes, the entries that would have been lost (up to five as
   `source:source_id`, then `... and N more`), and states that the file was left unchanged.

The key comparison is the primary check and the row count is the secondary one. The key check
subsumes the count check, but both are kept: the contract asks for a catalog that is "smaller than
the one it read", and the key check additionally catches a *swap* (one entry dropped, one added —
same row count, still a lost paper). That case is pinned by its own test (§2, test 4).

### 1.2 The invariant it protects

**After `IndexWriter.write(...)`, the catalog on disk holds every `(source, source_id)` key it held
before the write, plus the keys of the papers seen in this run.**

This matters because `scripts/gen_docs.py::_published_records()` iterates `data/index.json`, not the
filesystem: a paper needs both a record directory on disk *and* a catalog entry. A dropped catalog
entry silently unpublishes that paper's page — exactly the 2026-10-22 failure, and exactly the
failure mode `tests/scripts/test_gen_docs_enrichment.py::TestEmitRecords::test_paper_page_was_written`
was written for on the generator side.

The second half of the contract — *the `downloaded` flag of an existing entry survives a run that
did not re-download that paper* — is the existing behaviour and is now pinned by a test. The
historical-flag rule lives in `_merge_entries` at `src/arxiv_collector/index.py:141-145`:
`downloaded_flag = paper.source_id in downloaded`, and when the paper was not downloaded this run
the previous entry's flag is carried over (`downloaded_flag = bool(previous.get("downloaded"))`).

### 1.3 Public behaviour unchanged (contract §4)

- `FILENAME = "index.json"` — unchanged (`src/arxiv_collector/index.py:68`). (Verified)
- Ordering — unchanged: papers seen this run first in collection order, then the catalog entries
  not seen this run, newest-first; the writer does not re-sort. The carried entries are still
  sorted at `src/arxiv_collector/index.py:152-156` by `(published, title)` reversed, and the
  ordering contract is still documented on `write()` at `src/arxiv_collector/index.py:97-103`.
  (Verified: the merge body was moved verbatim; `git diff` shows no logic change inside it.)
- `downloaded` semantics — unchanged (see §1.2). (Verified)
- The only new public name is the exception class `CatalogShrinkError`. (Verified)

### 1.4 Who sees the failure

`IndexWriter.write()` is called from `Pipeline.run()` at `src/arxiv_collector/pipeline.py:115`.
The CLI catches a per-source exception at `src/arxiv_collector/cli.py:223-225`, prints
`[sync] ERROR <source>: <message>` (`_report_uncollectable`, `src/arxiv_collector/cli.py:278-289`),
marks the source `kind="broken"`, so `_async_sync` returns `EXIT_BROKEN_SOURCE` (1) and the CLI
exits with `raise typer.Exit(code=exit_code)` (`src/arxiv_collector/cli.py:140-141`).
**Inferred** (read the code; I did not execute the CLI path in this lane — see §5): a refused write
is loud in the operator's console and in the 02:00 job's exit code, and the catalog on disk is
untouched, so the site keeps publishing everything it published before.

---

## 2. Tests added — `tests/arxiv_collector/test_index.py`

The file was 7,624 B / 12 tests; it is now 357 lines / 16 tests. New helpers follow the file's
existing style (module-level helper, `from arxiv_collector.index import ...` **inside** the test
body, `tmp_path` fixture).

| # | Test | Line | Requirement |
|---|---|---|---|
| — | `_catalog_entries(tmp_path)` / `_catalog_keys(tmp_path)` | `:31-35`, `:37-42` | helpers |
| — | section banner "The catalog only grows." | `:230-238` | documentation |
| a | `test_write_never_drops_an_entry_the_run_did_not_see` | `:241-261` | **the invariant** |
| b | `test_downloaded_flag_survives_a_run_that_did_not_redownload` | `:264-283` | `downloaded` survives |
| c | `test_write_refuses_to_shrink_the_catalog` | `:286-322` | **loud refusal** |
| d | `test_write_refuses_to_drop_a_single_catalog_entry` | `:325-357` | extra: guard counts keys, not rows |

**(a) the invariant** — three pre-existing entries (`"a"`, `"b"` on source `arxiv`, `"c"` on source
`local`, so the key really is `(source, source_id)`) and one new paper (`"d"`). Asserts
`before <= after` and `after == before | {("arxiv", "d")}`.

**(b) the `downloaded` flag** — first run `write([a, b], downloaded={"a"})`; second run
`write([a])` (seen again, not re-downloaded). Asserts `by_id["a"]["downloaded"] is True` and
`by_id["b"]["downloaded"] is False` — the flag is neither lost nor flipped.

**(c) the loud refusal** — a local subclass `_ReplacingWriter(IndexWriter)` overrides
`_merge_entries` to return only this run's papers, i.e. the 2026-10-22 regression. The test
asserts `pytest.raises(CatalogShrinkError)`, that the message contains `"index.json"`,
`"3 entries on disk"` and `"arxiv:a"`, and that `index.json` on disk is **byte-identical** to
before the refused write.

**(d)** — `_SwappingWriter` drops `("arxiv", "a")` and adds `"b"`: the row count is unchanged, so
a size-only guard would wave it through. The guard must still refuse, name `arxiv:a`, and leave
the file untouched.

---

## 3. Validation

### 3.1 The tests (Verified)

Exact command:

```
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
$env:PYTHONPATH = "D:\project\.swarm-lab\head_tree\src;D:\project\.venv-win\Lib\site-packages"
Set-Location 'D:\project\.swarm-lab\head_tree'
C:\Python312\python.exe -m pytest -q -p no:cacheprovider tests/arxiv_collector/test_index.py
```

Final output line:

```
16 passed in 0.37s
```

(12 pre-existing tests + 4 new ones.)

### 3.2 The package suite (Verified)

```
C:\Python312\python.exe -m pytest -q -p no:cacheprovider -m "not slow" tests/arxiv_collector
```

Final output line:

```
224 passed in 225.01s (0:03:45)
```

Note on an earlier run: the first package-wide run reported `4 failed, 208 passed, 5 errors in
196.70s`. **All 9 were environmental, not caused by this change** — that pytest process had no
`git` on `PATH`, so `subprocess` raised
`FileNotFoundError: [WinError 2] The system cannot find the file specified`
(`C:\Python312\Lib\subprocess.py:1538`) in `tests/arxiv_collector/test_git_sync.py` and
`tests/arxiv_collector/test_cli_integration.py`. Re-running exactly those two files with `git` on
`PATH` gave `26 passed in 35.75s`, and the full package run with `git` on `PATH` gave
`224 passed` as above. (Verified)

### 3.3 Lint (Verified)

```
& 'D:\project\.venv-win\Scripts\ruff.exe' check --no-cache src/arxiv_collector/index.py tests/arxiv_collector/test_index.py
```

Output line:

```
All checks passed!
```

`ruff format` was run on the two owned files only (the test file was reformatted: one comprehension
collapsed to a single line and a trailing blank line removed; `index.py` was already formatted).
The repository is not format-clean overall (11 pre-existing files) — I did not touch them.

### 3.4 Bite check — the tests really bite (Verified)

On a scratch copy **outside the repository** (`C:\Users\leroy\AppData\Local\Temp\verify_guard.py`;
note `C:\Users\Administrator\...` is not writable on this host):

- with the guard stubbed out → **both guard tests FAIL**;
- with a replacing merge → `test_write_never_drops_an_entry_the_run_did_not_see` and
  `test_downloaded_flag_survives_a_run_that_did_not_redownload` FAIL with `CatalogShrinkError`
  (the guard converts the silent regression into a loud failure);
- with the real code → all four PASS.

So the new tests are not vacuous, and the guard is what turns the silent regression into a loud
one.

---

## 4. Working tree — full `git status --short` and attribution

```
 M scripts/pick_daily.py
 M src/arxiv_collector/cli.py
 M src/arxiv_collector/index.py
 M tests/arxiv_collector/test_index.py
 M tests/arxiv_collector/test_sync_feed_health.py
 M tests/scripts/test_pick_daily.py
```

| Line | Owner | Note |
|---|---|---|
| ` M scripts/pick_daily.py` | **another lane** | not mine — untouched by me |
| ` M src/arxiv_collector/cli.py` | **another lane** | not mine — comment-only change documenting the exit-code contract (I read the diff; the per-source `except Exception` handling is unchanged) |
| ` M src/arxiv_collector/index.py` | **MINE (HT-R6)** | the guard + merge extraction — 115 lines changed |
| ` M tests/arxiv_collector/test_index.py` | **MINE (HT-R6)** | 4 new tests + 2 helpers — 147 lines changed |
| ` M tests/arxiv_collector/test_sync_feed_health.py` | **another lane** | not mine — untouched by me |
| ` M tests/scripts/test_pick_daily.py` | **another lane** | not mine — untouched by me |

`git diff --stat` for the whole tree:

```
 scripts/pick_daily.py                          |  16 +++
 src/arxiv_collector/cli.py                     |  39 ++++++
 src/arxiv_collector/index.py                   | 115 ++++++++++++++-
 tests/arxiv_collector/test_index.py            | 147 +++++++++++++++++++
 tests/arxiv_collector/test_sync_feed_health.py | 165 +++++++++++++++++++++-
 tests/scripts/test_pick_daily.py               | 186 +++++++++++++++++++++++++
 6 files changed, 663 insertions(+), 5 deletions(-)
```

**My two files account for 115 + 147 = 262 of those lines; the other 401 belong to the concurrent
lanes.** My diff touches no file outside the two I own. (Verified via `git status --short` and
`git diff --stat`; the other lanes' files were modified concurrently by other workers, not by me —
I never opened them for writing.)

**No commit and no push were performed** — the change is left uncommitted in the working tree, as
instructed. (Verified: `git log --oneline -3` still shows `fb2ebae`, `8120554`, `cb1be29`.)

---

## 5. Honest status

**Verified**

- The four new tests exist, pin the invariant, the `downloaded` survival and the loud refusal, and
  pass; the whole `tests/arxiv_collector/test_index.py` file passes (`16 passed in 0.37s`).
- The whole `tests/arxiv_collector` package passes with `git` on `PATH` (`224 passed in 225.01s`).
  The 9 failures/errors of the first run were caused by `git` missing from `PATH` in that process
  and disappear when it is present.
- `ruff check --no-cache` on both owned files: `All checks passed!`. `ruff format` applied to the
  two owned files only.
- The new tests fail when the guard is removed or the merge is replaced (bite check on a scratch
  copy outside the repo).
- The change touches exactly the two owned files; the four other modified files belong to
  concurrent lanes.
- No commit, no push, no deploy, no network, nothing written outside
  `D:\project\.swarm-lab\head_tree` and `D:\project\.swarm-lab\rounds\HT-R6.md` (plus the scratch
  verification script in the user temp directory).

**Inferred**

- The CLI failure path: a `CatalogShrinkError` raised inside `Pipeline.run()` is caught by the
  per-source handler at `src/arxiv_collector/cli.py:223-225`, printed as
  `[sync] ERROR <source>: <message>`, and the run exits 1 (`EXIT_BROKEN_SOURCE`). I read this in
  the code; I did **not** execute the CLI in this lane.
- The invariant now holds for every `IndexWriter.write()` call site: the only production call is
  `src/arxiv_collector/pipeline.py:115`. (Read, not executed.)

**Not run**

- The full repository suite (`pytest -q` over all of `tests/`, including `tests/scripts/` and
  `tests/site/`) — out of scope for this lane, and `tests/site/` slow tests need a mkdocs build
  (`uv` is unavailable on this host anyway). The `tests/arxiv_collector` package and my own test
  file are green.
- `mkdocs build --clean --strict` — out of scope; no build input was changed by this lane.
- The CLI end-to-end (`arxiv-collector sync`) — needs network, which is forbidden here.

**Could not complete**

- Nothing from the assignment itself. One environment note for whoever reruns this: `git` is not
  on `PATH` by default on this host, and `tests/arxiv_collector/test_git_sync.py` /
  `test_cli_integration.py` fail with `FileNotFoundError: [WinError 2]` unless
  `$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH` is set first. That is pre-existing and
  unrelated to this change.
