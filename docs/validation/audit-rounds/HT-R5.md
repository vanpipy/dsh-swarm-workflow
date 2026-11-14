# HT-R5 — the `sync` exit-code contract: documented and pinned

Lane: Developer (`eff-dev`) · Round 5 of the head_tree ladder · 2026-11-07
Repo: `D:\project\.swarm-lab\head_tree` (worktree, branch `swarm/lab10`)

---

## 1. What I changed — exactly two owned files, no behaviour change

### 1.1 `src/arxiv_collector/cli.py` (comment + docstring only)

* **`cli.py:55-87` (NEW)** — the contract block *"The exit-code contract of
  `arxiv-collector sync`"*, placed directly under the two constants
  (`EXIT_BROKEN_SOURCE = 1` at `cli.py:48`, `EXIT_EMPTY_SOURCE = 2` at
  `cli.py:52`). It states, in the order requested:
  * **0** — every configured source produced entries: nothing broken, nothing
    empty. A source that produced entries but lost one of its feed URLs is
    only a WARNING and still exits 0. A run with no sources configured exits 0.
  * **1** — at least one source is BROKEN (request failed / non-200 /
    unparsable body / unknown source type / unusable configuration). A broken
    source OUTRANKS an empty one, so a run that has both exits 1.
  * **2** — at least one source yielded no entries although none of its feed
    URLs failed (a quiet announcement day), and no source was broken.
  * **how the CLI uses the values** — the verdict is taken in `_async_sync`
    after every configured source has been attempted; a non-zero code becomes
    the process status through `raise typer.Exit(code=exit_code)`
    (`cli.py:176`), a zero code simply returns.
  * **what the unattended 02:00 job does with each value** (AGENTS.md "The
    daily job", `AGENTS.md:267-275`) — 0 → proceed to the pick; 2 → a quiet
    day: proceed to the pick and do NOT treat the non-zero status as a
    failure (no alert, no retry); 1 → a real failure, worth alerting on.
* **`cli.py:200-203`** — one pointer sentence in the `_async_sync` docstring
  (docstring text only) so the two places cannot drift apart.

No executable line of `cli.py` was touched. (Verified — the diff contains
only comment/docstring lines; see §3.)

### 1.2 `tests/arxiv_collector/test_sync_feed_health.py` (7 new tests, 1 new helper)

* **`test_sync_feed_health.py:159-167` (NEW helper)** —
  `_assert_exit_code(result, expected)`: the exact exit code, plus the same
  "exited deliberately, did not crash" check that the existing
  `_assert_exited_non_zero` performs (`result.exception is None or
  isinstance(result.exception, SystemExit)`).
* **`test_sync_feed_health.py:15-18`** — the module docstring gained the R5
  clause (the file documents R1…R4 there).
* **`test_sync_feed_health.py:547-693` (NEW section "R5 — the exact exit
  codes of the contract")** — 7 new test functions:

| # | test (line) | pins |
|---|---|---|
| a | `test_healthy_run_exits_exactly_zero_and_keeps_the_summary_line` (:552) | **exit exactly 0** and the summary line keeps its shape (`[sync] good-feed: processed=2 skipped=0 failed=0`, matched by the existing `_SUMMARY_LINE_RE`) |
| b | `test_fetched_but_empty_feed_exits_exactly_two` (:571) | **exit exactly 2** for a fetched-but-empty feed; the aggregate line names the source as `empty-feed (empty)` (kind *empty*, not *broken*) |
| c | `test_connection_error_in_feed_exits_exactly_one` (:589) | **exit exactly 1** — connection error |
| c | `test_non_200_feed_response_exits_exactly_one` (:609) | **exit exactly 1** — non-200 (503) |
| c | `test_unparsable_feed_body_exits_exactly_one` (:628) | **exit exactly 1** — unparsable body |
| c | `test_unknown_source_type_exits_exactly_one` (:650) | **exit exactly 1** — a source that cannot be collected at all (`unknown source type`), the "unusable configuration / unknown type" clause of code 1 |
| d | `test_broken_source_outranks_empty_source_and_exits_exactly_one` (:667) | **exit exactly 1** when one source is broken and another is empty; both sources were still attempted (`[sync] running …`) and both are reported with their kind (`broken-feed (broken)`, `empty-feed (empty)`) |

* **`test_sync_feed_health.py:429` (STRENGTHENED, not weakened)** — the
  existing `test_every_configured_source_is_attempted_and_reported` now
  asserts the exact code `1` instead of merely "non-zero"
  (`_assert_exit_code(result, 1)` replaces `_assert_exited_non_zero(result)`).
  Exact-1 implies non-zero, and the "did not crash" assertion is kept inside
  `_assert_exit_code`, so requirement (e) — *every configured source is still
  attempted and reported* — keeps its existing coverage and gains the exact
  code. No existing test was deleted or weakened.

---

## 2. Discrepancy check (code vs. the requested contract) — **NONE FOUND**

I read `_async_sync`, `_feed_failure_kind`, `_empty_feed_reason`,
`_report_uncollectable` and `_warn_about_failed_feed_urls` before writing
anything. Every clause of the requested contract matches the code, so **no
behaviour was changed**:

| requested clause | code (post-edit line numbers) | verdict |
|---|---|---|
| broken outranks empty | `cli.py:310-313` — `if any(f.kind == "broken" …): return EXIT_BROKEN_SOURCE` is checked **before** `if no_entry_sources: return EXIT_EMPTY_SOURCE` | matches (Verified) |
| 1 = broken | `cli.py:328` (`_report_uncollectable` → `kind="broken"`), `cli.py:348-357` (`_feed_failure_kind` → "broken" when the feed health holds a failure), `cli.py:311` | matches (Verified) |
| request failed / non-200 / unparsable body are all "broken" | `src/arxiv_collector/collector.py:148-162` — a failed request, a non-200 and a parse error each produce a `failures` entry, which `_feed_failure_kind` turns into "broken" | matches (Verified) |
| unknown source type / unusable configuration are "broken" | `cli.py:250-258` (unknown type) and `cli.py:246-249` / `cli.py:317-328` (config that cannot be built) both call `_report_uncollectable` | matches (Verified) |
| 2 = fetched fine but zero entries | `cli.py:360-385` (`_empty_feed_reason` → "the feed was fetched successfully but contained no entries" when no feed URL failed) and `cli.py:312-313` | matches (Verified) |
| the CLI hands the code to the shell | `cli.py:174-176` — `if exit_code: raise typer.Exit(code=exit_code)` | matches (Verified) |
| a source that produced entries but lost one feed URL still exits 0 | `cli.py:331-345` (`_warn_about_failed_feed_urls` — a warning only, the source keeps exit code 0) | matches (Verified) |

One nuance that is **not** a contradiction but is worth stating, and which
the contract block reflects: a source with **several** feed URLs where some
failed and the rest were empty is classified **broken** (exit 1), because
`_feed_failure_kind` (`cli.py:348-357`) looks at *any* feed-URL failure.
Exit 2 therefore means "no feed URL of any failing source failed".

---

## 3. Evidence

### 3.1 pytest — the owned test file

Exact command:

```
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
$env:PYTHONPATH = "D:\project\.swarm-lab\head_tree\src;D:\project\.venv-win\Lib\site-packages"
Set-Location 'D:\project\.swarm-lab\head_tree'
C:\Python312\python.exe -m pytest -q -p no:cacheprovider tests/arxiv_collector/test_sync_feed_health.py
```

Final output line: **`21 passed in 21.48s`** (Verified — 14 pre-existing tests
+ 7 new ones, all green).

### 3.2 ruff

Exact command:

```
& 'D:\project\.venv-win\Scripts\ruff.exe' check --no-cache src/arxiv_collector/cli.py tests/arxiv_collector/test_sync_feed_health.py
```

Output line: **`All checks passed!`** (Verified).

### 3.3 the whole suite (extra evidence, not required by the acceptance list)

```
C:\Python312\python.exe -m pytest -q -p no:cacheprovider
```
→ **`7 failed, 451 passed, 15 skipped in 517.14s (0:08:37)`** (Verified).

All 7 failures are in `tests/site/test_adsense_skeleton.py`, every one of them
marked `@pytest.mark.slow`, and every one of them fails because the mkdocs
build output `site/` does not exist in this worktree
(`Test-Path site` → False; `mkdocs.yml` → True) (Verified). They are
build-dependent tests of the generated site — unrelated to the two files I
touched, and failing before my change as well (Inferred: my diff is comments
in `cli.py` plus one test file; the fast loop below is green).

The repo's own fast loop (which excludes the build-dependent `slow` marker,
`pyproject.toml:80`) is green:

```
C:\Python312\python.exe -m pytest -q -p no:cacheprovider -m "not slow"
```
→ **`449 passed, 24 deselected in 383.58s (0:06:23)`** (Verified — exit code 0).

### 3.4 `git status --short` (full output, with attribution)

```
 M scripts/check_site_links.py                     <- NOT mine (another concurrent lane)
 M src/arxiv_collector/cli.py                      <- MINE
 M tests/arxiv_collector/test_sync_feed_health.py  <- MINE
 M tests/scripts/test_check_site_links.py          <- NOT mine (another concurrent lane)
```

* My two lines: `src/arxiv_collector/cli.py` and
  `tests/arxiv_collector/test_sync_feed_health.py` (Verified — `git diff --
  src/arxiv_collector/cli.py tests/arxiv_collector/test_sync_feed_health.py`
  shows only those two files; the diffstat attributes **39** changed lines to
  `cli.py` and **165** to `test_sync_feed_health.py`, 203 insertions / 1
  deletion in total — the 1 deletion is the one strengthened assertion
  `_assert_exited_non_zero(result)` → `_assert_exit_code(result, 1)`).
* The other two lines belong to a concurrent lane working on the site-link
  checker; I did not write them and did not revert them (Verified that I
  wrote only my two files — every write call in this round targeted only
  those two paths; Inferred that `scripts/check_site_links.py` +
  `tests/scripts/test_check_site_links.py` are that lane's files, based on
  the file names).
* The shared tree changed **during** this round: when I started, the dirty
  files were `scripts/pick_daily.py`, `src/arxiv_collector/index.py`,
  `tests/arxiv_collector/test_index.py` and `tests/scripts/test_pick_daily.py`
  (other lanes); those have since been committed by the Coordinator, and the
  site-links lane is now in flight. Both states are recorded here for the
  audit trail (Verified — two `git status --short` runs, one at ~01:34 and
  one at the end of the round).

---

## 4. Boundaries respected

* Wrote only `src/arxiv_collector/cli.py` and
  `tests/arxiv_collector/test_sync_feed_health.py` (Verified).
* No commit, no push, no network, no `uv` (Verified).
* `D:\project\reading-collector`, `D:\project\dsh-plugins` and the DSH profile
  were not touched (Verified).
* No other agent spawned, no goal of my own created (Verified).
* `site/` was **not** built with mkdocs — that would have written build
  artefacts into the shared tree and polluted `git status` (Verified: the
  `site/` directory still does not exist).
* The `swarm-engineering` skill was loaded earlier in this session (round E1)
  and stayed in context — I did not re-load it this round (Verified).

## 5. Board protocol — no board task exists for R5

`team_task_list` lists task-1 … task-13; none of them is the R5 assignment
(task-13 is the R3 picker lane, task-11 the R1 comment lane). There was
therefore nothing to claim or complete for this round: the report went to
this file and to the Lead's inbox (Verified).

## 6. Open items / not completed

* The 7 `slow` site tests need a `mkdocs build` to pass; building `site/`
  was out of scope for this round (a build artefact would pollute the shared
  tree), so they remain red in the full-suite run above and are excluded by
  the repo's own fast loop (Verified).
* Nothing else was left undone.
