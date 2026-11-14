# HT-R9 — Review of `swarm/lab10` (`cb1be29..16a3d2b`)

**Role:** Reviewer (independent review + mutation probe)
**Worktree under review:** `D:\project\.swarm-lab\head_tree` (branch `swarm/lab10`, base `cb1be29`)
**Scratch copy for the probe:** `D:\project\.swarm-lab\r9-probe` (no `.git` entry — see §0.3)
**Date:** 2026-11-07

**Overall verdict: ACCEPT** (4/4 mandated mutants killed; 1 extra non-blocking gap found; no Blocking or Material finding)

Every statement below is tagged **[Verified]** (read from the files, or produced by a command whose output is quoted here), **[Inferred]** (a conclusion drawn from verified facts) or **[Not run]** (not exercised).

---

## 0. Method and evidence base

### 0.1 What was run

| Run | Command (abridged) | Result |
|---|---|---|
| Baseline, whole worktree | `pytest -q -p no:cacheprovider -m "not slow"` in `head_tree` | **454 passed, 24 deselected in 684.62s** — exit 0 **[Verified]** |
| Baseline, scratch (the 6 files the ladder touched) | `pytest -q -p no:cacheprovider tests/arxiv_collector/test_cli.py tests/arxiv_collector/test_cli_integration.py tests/arxiv_collector/test_index.py tests/arxiv_collector/test_sync_feed_health.py tests/scripts/test_pick_daily.py tests/scripts/test_check_site_links.py` | **133 passed, 2 skipped in 114.53s** — exit 0 **[Verified]** |
| Mutation probe M1–M4 (+ extra M5) | see §2 | see §2 **[Verified]** |
| "No executable change" proof for R5 | AST comparison `cb1be29` vs `HEAD` (§1.5) | identical ignoring docstrings **[Verified]** |
| "Byte-identical without `--json`" proof for R8 | base script vs HEAD script, same site, same args (§1.6) | stdout/stderr/exit code identical **[Verified]** |

Environment (as mandated): `C:\Python312\python.exe`, `PYTHONPATH=<worktree>\src;D:\project\.venv-win\Lib\site-packages` (scratch: `<scratch>\src`), `PATH` prefixed with `C:\Program Files\Git\cmd;`, `PYTHONDONTWRITEBYTECODE=1`, `pytest -p no:cacheprovider`. **[Verified]**

### 0.2 The head tree was not modified

- `git -C D:\project\.swarm-lab\head_tree status --porcelain` → empty output, before and after the review. **[Verified]**
- The six `__pycache__` directories in the worktree have timestamps `01:04–01:40`, i.e. they pre-date this review session (started 01:57) and were left by the ladder agents' own runs; my runs used `PYTHONDONTWRITEBYTECODE=1` and added nothing. **[Verified]**
- No `.pytest_cache` exists in the worktree. **[Verified]**
- No git write command was issued anywhere (`show`/`log`/`diff`/`status` only). **[Verified]**

### 0.3 Scratch-copy fidelity (why the mutants really ran)

- Scratch contents: `config/`, `scripts/`, `src/`, `tests/`, `pyproject.toml`, plus `.github/` (needed by `tests/scripts/test_pick_daily.py::TestPickedIsNotABuildInput::test_not_in_the_deploy_workflow`, which reads `REPO_ROOT/.github/workflows/deploy.yml` at `tests/scripts/test_pick_daily.py:1035`). `Test-Path <scratch>\.git` → `False`. **[Verified]**
- `Get-FileHash` of every file the probe touches is identical between scratch and worktree before each mutant: `scripts/pick_daily.py` = `313B3879BE705E9726CF5A438199014E75810629610271D6A4D125812CEDE497`, `src/arxiv_collector/index.py` = `CB21AAB53F…`, `scripts/check_site_links.py` = `CF61507DC3254DD925F0070017C1E9056D16ADA43A0E11A87CC0EC4378E7AEE3`. **[Verified]**
- An import-path probe (`<scratch>\_review\ast_cmp.py` sibling probe) resolved `scripts.pick_daily` → `D:\project\.swarm-lab\r9-probe\scripts\pick_daily.py`, `arxiv_collector.index` → `D:\project\.swarm-lab\r9-probe\src\arxiv_collector\index.py`, `tests.scripts.test_pick_daily` → the scratch copy. The editable install in site-packages (`_editable_impl_reading_collector.pth` → `D:\project\reading-collector`) is appended by `site` and therefore loses to `PYTHONPATH`; it does **not** shadow the scratch. **[Verified]**

### 0.4 One cosmetic pytest artifact (not a defect)

In early scratch runs the traceback header printed `..\head_tree\tests\scripts\test_pick_daily.py:1011` although the scratch module was the one executing. Cause: the copied `__pycache__` directories carried `.pyc` files whose code objects kept the original `co_filename`; the source content was identical, so behaviour was unaffected. After deleting all `__pycache__` directories from the scratch, the display switched to the scratch-relative path and the M1 kill set was **re-verified unchanged** (§2, M1 re-run). **[Verified]**

---

## 1. Per-commit verdicts

### 1.1 `8120554` — R1 — "the unattended collector job fires at 02:00, not 06:00" — **ACCEPT**

- The commit touches **one file, one line**: `tests/arxiv_collector/test_cli_integration.py`, comment `# the unattended 06:00 job failed silently every morning.` → `# the unattended 02:00 job failed silently every morning.` (1 insertion, 1 deletion). **[Verified]**
- `AGENTS.md` is **not** in the commit diff — it already said 02:00: `AGENTS.md:269-270` — "The ritual runs unattended: a scheduled task in DSH fires at **02:00 local time** and runs the whole pipeline." **[Verified]**
- "Nothing else changed": confirmed by `git show 8120554 --stat` (1 file, 1 insertion, 1 deletion). **[Verified]**

### 1.2 `fb2ebae` — R2 — "drop the weaker duplicate of the no-sources test" — **ACCEPT (legitimate de-duplication, NO coverage lost)**

**The question asked:** did the deletion lose a behaviour the survivor no longer accepts?

- Deleted test (`tests/arxiv_collector/test_cli.py`, formerly lines 66-87) asserted:
  `result.exit_code == 0 and ("no sources configured" in result.output.lower() or "done" in result.output.lower())`. **[Verified]**
- Survivor `tests/arxiv_collector/test_cli.py:73-91` asserts: `result.exit_code == 0` (:89), `"no sources configured" in result.output.lower()` (:90), and `"ERROR" not in result.output` (:91). **[Verified]**

**What the CLI actually prints with no sources** — `src/arxiv_collector/cli.py:469`: `typer.echo("no sources configured — nothing to do")` (inside `_load_config`, `cli.py:464-470`). A grep for `done|Done|DONE` over `src/arxiv_collector/cli.py` returns **no matches** — the word "done" never appears in the module. **[Verified]**

Empirical confirmation (probe `<scratch>\_review\cli_empty_sources.py`, `CliRunner().invoke(cli, ["sync", "--config", <empty sources yaml>, ...])`):

```
exit_code: 0
--- output ---
no sources configured — nothing to do
[git] no git repo above data-root — skipping commit
--- 'done' in output.lower(): False
--- 'no sources configured' in output.lower(): True
--- 'ERROR' in output: False
```
**[Verified]**

**Conclusion:** the deleted test's `"done" in output` branch was **unreachable**, so its assertion collapsed to `exit 0 AND "no sources configured" in output` — a strict subset of what the survivor asserts (the survivor adds `"ERROR" not in output`). The deletion therefore **removed a redundant, weaker test and lost no coverage**. **[Inferred from the verified facts above]**

Two extra notes: the deleted test also allowed exit 0 **with** an "ERROR" in the output; the survivor forbids that — again strictly stronger. The section comment above the test (`test_cli.py:66-70`) was kept. **[Verified]**

### 1.3 `4eb8643` — R3 — "never write an empty day file" — **ACCEPT**

Guard, `scripts/pick_daily.py:575-589`:

```
575:    if not items:
576:        # Nothing survived the filter: every candidate for this day was
...
583:        print(
584:            f"[pick_daily] nothing to pick for {target_day.isoformat()}: "
585:            f"{len(candidates)} candidate(s) that day, {picked_before} of them"
586:            " already picked on an earlier day"
587:        )
588:        print(f"[pick_daily] no day file written — {target_day.isoformat()} stays open")
589:        return 0
```
**[Verified]**

- **Ordering** — the guard sits **after** the refuse-to-overwrite check (`pick_daily.py:567-573`: `if output.exists() and not args.force:` … `return 1`) and **before** `output.parent.mkdir(parents=True, exist_ok=True)` (`pick_daily.py:591`) and `output.write_text(...)` (`:592-595`). Exactly as required. **[Verified]**
- **Returns 0** (`pick_daily.py:589`) — the quiet morning is not a failure. **[Verified]**
- **Writes no file when the ranked list is empty** — default path, explicit `--output`, and `--force` are each covered: `tests/scripts/test_pick_daily.py:876` (default path: `assert not (picked / "2026-11-04.md").exists()`), `:956` (`--force` writes no empty file), `:974` (`--force` leaves a curated file byte-identical: `assert curated.read_text(...) == "# curated by hand\n"`), `:994` (explicit `--output`: `assert not out.exists()`), plus `:899` (the day stays open — a later run with a new paper writes the file) and `:931` (`--newest-unpicked` keeps offering the quiet day). All six assert `code == 0`. **[Verified]**
- **Untouched:** `MAX_PICKS_PER_DAY` is still `20` at `scripts/pick_daily.py:70`; the `--newest-unpicked` selection rule at `scripts/pick_daily.py:522-535` is not in the commit diff (`git show 4eb8643 --stat` = `scripts/pick_daily.py | 16 +++` plus the new test class). **[Verified]**
- **Behaviour change is minimal and intentional:** the guard runs *after* the dry-run early return (`:563-565`), so the two "nothing to pick" lines are only printed in `--apply` mode; the dry-run output is unchanged. **[Verified]**

### 1.4 `24bedad` — R6 — "refuse a catalog write that would shrink the catalog" — **ACCEPT**

- `CatalogShrinkError(RuntimeError)` at `src/arxiv_collector/index.py:49`. **[Verified]**
- `IndexWriter.write()` ordering (`index.py:112-117`):

```
114:        entries = self._merge_entries(existing, papers, downloaded_set)
115:        self._assert_catalog_not_smaller(existing, entries)
116:        payload = {"papers": entries}
117:        self._atomic_write(self._index_path, payload)
```
  The guard at **:115 runs before** the atomic write at **:117**, so a refused write never touches `index.json`. **[Verified]**
- **Byte-identical on refusal** — pinned by the new tests: `tests/arxiv_collector/test_index.py:322` `assert (tmp_path / "index.json").read_bytes() == before` and `:357` `assert (tmp_path / "index.json").read_bytes() == before`. **[Verified]**
- **Merge semantics unchanged** — `_merge_entries` (`index.py:119-158`) is the base merge body extracted verbatim; the only change is the parameter rename `downloaded_set` → `downloaded`. The 14 pre-existing `test_index.py` tests still pass. **[Verified]**
- **Export** — `__all__ = ["CatalogShrinkError", "IndexWriter"]` at `index.py:269`; the new tests import it as `from arxiv_collector.index import CatalogShrinkError, IndexWriter` (`test_index.py:295`, `:333`). **[Verified]**
- **Guard semantics** (`index.py:160-199`): refuses when any catalog key present on disk is missing from the merged set **or** when the merged entry count is smaller — so a *swap* (one entry dropped, one added) is caught too, not just a shrink. **[Verified]**

### 1.5 `8723290` — R5 — "pin the sync exit-code contract 0/1/2" — **ACCEPT**

- The contract is documented next to the constants: `EXIT_BROKEN_SOURCE = 1` (`cli.py:48`), `EXIT_EMPTY_SOURCE = 2` (`cli.py:52`), and the comment block "The exit-code contract of ``arxiv-collector sync``" at `cli.py:55-87` (0 = all sources produced entries; 1 = a source is broken, broken outranks empty; 2 = a source was empty and none broken; plus what the unattended 02:00 job does with each value). **[Verified]**
- Implementation behind it: `_async_sync` returns 1 when a source is broken (`cli.py:310-311`), 2 when a source is empty and none broken (`cli.py:312-313`), 0 otherwise (`cli.py:314`); `_sync_command` hands the code to the shell with `raise typer.Exit(code=exit_code)` (`cli.py:175-176`). **[Verified]**
- **PROOF that no executable behaviour changed.** Two independent checks:
  1. *Textual:* `git diff cb1be29..HEAD -- src/arxiv_collector/cli.py` adds only comment lines (`cli.py:55-87`) and four docstring lines inside `_async_sync` (`cli.py:201-203`). **[Verified]**
  2. *Structural (stronger):* an AST comparison of `cb1be29:src/arxiv_collector/cli.py` against HEAD, with every module/class/function docstring stripped, gives:

     ```
     src/arxiv_collector/cli.py: AST equal = False | AST equal ignoring docstrings = True
     src/arxiv_collector/index.py: AST equal = False | AST equal ignoring docstrings = False
     scripts/pick_daily.py: AST equal = False | AST equal ignoring docstrings = False
     scripts/check_site_links.py: AST equal = False | AST equal ignoring docstrings = False
     ```
     (probe `<scratch>\_review\ast_cmp_nodoc.py`) — the plain comparison differs only because a docstring is itself an AST node; the three files that *did* change behaviour show a real difference, which is the control that proves the probe discriminates. **⇒ the R5 commit changed no executable statement at all.** **[Verified]**
- **The new tests pin the EXACT values**, via the helper `_assert_exit_code(result, expected)` at `tests/arxiv_collector/test_sync_feed_health.py:159-161`: `test_healthy_run_exits_exactly_zero_and_keeps_the_summary_line` (:552, expects 0), `test_fetched_but_empty_feed_exits_exactly_two` (:571, expects 2), `test_connection_error_in_feed_exits_exactly_one` (:589, expects 1), `test_non_200_feed_response_exits_exactly_one` (:609, expects 1), `test_unparsable_feed_body_exits_exactly_one` (:628, expects 1), `test_unknown_source_type_exits_exactly_one` (:650, expects 1), `test_broken_source_outranks_empty_source_and_exits_exactly_one` (:667, expects 1). The pre-existing non-zero assertion at `:429` was tightened from "any non-zero" to exactly `1`. **[Verified]**

### 1.6 `16a3d2b` — R8 — "`check_site_links` writes a machine-readable JSON report" — **ACCEPT (one non-blocking gap, §3 F-1)**

- `REPORT_SCHEMA_VERSION = 1` (`scripts/check_site_links.py:100`); the documented key set is echoed in the `--json` help text (`check_site_links.py:366-369`). **[Verified]**
- `build_json_report` (`:272-307`) builds the payload with keys `schema_version, result, exit_code, site_dir, built_pages, links_checked, distinct_requests, external_link_count, broken_links, broken_fragments, external_links`. **[Verified]**
- `write_json_report` (`:310-329`) writes atomically (`tempfile.mkstemp` in the target directory + `os.replace`, tmp unlinked in `finally`); `emit_json_report` (`:332-346`) catches `OSError`, prints `[check_site_links] failed to write JSON report to {path}: {exc}` on **stderr** and returns `False`. **[Verified]**
- **The report is written on FAIL too** — the final block `check_site_links.py:526-541` builds the payload for PASS *and* FAIL and writes it unconditionally when `--json` is given; the "no built site" path also emits a FAIL report (`:375-395`, `result="FAIL"`, `exit_code=1`) and returns 1. **[Verified]]
- **A write failure is loud** — `emit_json_report` returns `False` → `check_site_links.py:538-541`: `if not emit_json_report(Path(args.json_report), payload) and exit_code == 0: exit_code = 2`. The stderr message is printed unconditionally, and the exit code becomes non-zero. **[Verified]**
- **Exit code 2 when the report cannot be written although the site was fine** — implemented at `check_site_links.py:541` (`exit_code = 2`). **[Verified]**
- **Behaviour without the flag is byte-identical to the pre-change script** — proven two ways:
  1. *Run comparison* (`<scratch>\_review\r8_identical.py`): the `cb1be29` version of the script and the HEAD version were run against the same tiny site (one broken internal link, no external links), same `--site-dir`, same `--port 0`, same cwd:

     ```
     base returncode: 1
     head returncode: 1
     stdout identical: True
     stderr identical: True
     ```
     **[Verified]**
  2. *Diff shape:* the only non-additive edit is `return 0 if ok else 1` → `exit_code = 0 if ok else 1` … `return exit_code` (`check_site_links.py:523`, `:540`), which is value-preserving when `--json` is absent; the new test `test_without_the_flag_no_report_is_written` (`tests/scripts/test_check_site_links.py:316`) also asserts `with_report.stdout == plain.stdout`. **[Verified]**
- **New tests** (`tests/scripts/test_check_site_links.py`): `JSON_REPORT_KEYS` (:50-62), `test_json_report_records_a_pass` (:272), `test_json_report_records_a_failure` (:289), `test_without_the_flag_no_report_is_written` (:316), `test_json_report_carries_the_documented_keys` (:338, `assert set(data) == JSON_REPORT_KEYS`), `test_a_report_that_cannot_be_written_is_loud` (:358-373). **[Verified]**

---

## 2. Mutation probe

**Scratch:** `D:\project\.swarm-lab\r9-probe` (copy of `scripts/ src/ tests/ config/ pyproject.toml .github/`, **no `.git`**).
**Run form:** `pytest -q -p no:cacheprovider --no-header -rf <file>` with `PYTHONPATH=<scratch>\src;D:\project\.venv-win\Lib\site-packages`.
**Procedure per mutant:** mutate one behaviour in the scratch → run the matching test file → record the exact pytest output → restore the file from the pristine worktree copy → re-verify the hash. **[Verified]**

### M1 — `scripts/pick_daily.py:575`: `if not items:` → `if False:`

```diff
-    if not items:
+    if False:  # MUTANT M1: quiet-day guard disabled
         # Nothing survived the filter: every candidate for this day was
```

Command: `pytest -q -p no:cacheprovider --no-header -rf tests/scripts/test_pick_daily.py`

```
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_no_day_file_is_written_when_everything_was_picked_before
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_the_day_stays_open_for_a_later_pick
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_newest_unpicked_offers_the_quiet_day_again
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_force_does_not_write_an_empty_day_file
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_force_keeps_a_curated_file_instead_of_emptying_it
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_an_explicit_output_path_gets_no_empty_file
6 failed, 43 passed, 2 skipped in 3.88s
```
Representative failure: `E AssertionError: assert not True / + where True = exists() / + where exists = WindowsPath('.../elsewhere.md').exists` plus stdout `[pick_daily] wrote C:\...\elsewhere.md`. **[Verified]**

**Killed: 6/6 expected `TestQuietDay` tests. M1 is killed. [Verified]**
(Re-verified after the `__pycache__` cleanup of §0.4 with the identical kill set and the line `6 failed, 43 passed, 2 skipped in 3.44s`.) **[Verified]**

### M2 — `src/arxiv_collector/index.py:115`: neutralise the guard call

```diff
         entries = self._merge_entries(existing, papers, downloaded_set)
-        self._assert_catalog_not_smaller(existing, entries)
+        pass  # MUTANT M2: shrink guard neutralised
         payload = {"papers": entries}
```

Command: `pytest -q -p no:cacheprovider --no-header -rf tests/arxiv_collector/test_index.py`

```
FAILED tests/arxiv_collector/test_index.py::test_write_refuses_to_shrink_the_catalog
FAILED tests/arxiv_collector/test_index.py::test_write_refuses_to_drop_a_single_catalog_entry
2 failed, 14 passed in 2.19s
```
Representative failure: `E Failed: DID NOT RAISE CatalogShrinkError` (at `tests/arxiv_collector/test_index.py:353`). **[Verified]**

**Killed: both expected tests. M2 is killed. [Verified]**

### M3 — `scripts/check_site_links.py`: `build_json_report` returns a payload without the `broken_links` key

```diff
         "external_link_count": len(external_links),
-        "broken_links": {
-            path: sorted(set(items)) for path, items in sorted(broken_links.items())
-        },
+        # MUTANT M3: the "broken_links" key was removed from the payload
         "broken_fragments": {
```

Command: `pytest -q -p no:cacheprovider --no-header -rf tests/scripts/test_check_site_links.py`

```
FAILED tests/scripts/test_check_site_links.py::test_json_report_records_a_pass
FAILED tests/scripts/test_check_site_links.py::test_json_report_records_a_failure
FAILED tests/scripts/test_check_site_links.py::test_json_report_carries_the_documented_keys
3 failed, 8 passed in 25.98s
```
Representative failure: `E AssertionError: assert {'broken_frag...l_links', ...} == {'broken_frag...k_count', ...} / E Extra items in the right set: 'broken_links'` (at `tests/scripts/test_check_site_links.py:348`). **[Verified]**

**Killed: the JSON-key test (and two more). M3 is killed. [Verified]**

### M4 — `scripts/pick_daily.py:589`: guard `return 0` → `return 1`

```diff
         print(f"[pick_daily] no day file written — {target_day.isoformat()} stays open")
-        return 0
+        return 1  # MUTANT M4: quiet day must not be a failure
```

Command: `pytest -q -p no:cacheprovider --no-header -rf tests/scripts/test_pick_daily.py`

```
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_no_day_file_is_written_when_everything_was_picked_before
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_the_day_stays_open_for_a_later_pick
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_newest_unpicked_offers_the_quiet_day_again
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_force_does_not_write_an_empty_day_file
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_force_keeps_a_curated_file_instead_of_emptying_it
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_an_explicit_output_path_gets_no_empty_file
6 failed, 43 passed, 2 skipped in 2.86s
```
Representative failure: `E assert 1 == 0` (at `tests/scripts/test_pick_daily.py:1010`). **[Verified]**

**Killed: all six `TestQuietDay` tests. M4 is killed. [Verified]**

### Extra probe M5 (not mandated) — `scripts/check_site_links.py:541`: `exit_code = 2` → `exit_code = 3`

```diff
-            exit_code = 2
+            exit_code = 3  # MUTANT M5: the documented exit code 2 is not pinned
```

Command: `pytest -q -p no:cacheprovider --no-header -rf tests/scripts/test_check_site_links.py`

```
11 passed in 25.61s
```

**M5 survives — no test kills it.** The exit code is implemented (`check_site_links.py:541`) but the *value* is unpinned: `test_a_report_that_cannot_be_written_is_loud` (`tests/scripts/test_check_site_links.py:358-373`) asserts only `proc.returncode != 0` and `"JSON report" in proc.stderr`. See finding **F-1**. **[Verified]**

### Kill summary

| Mutant | Target | Expected killer(s) | Killed? | Tests that failed |
|---|---|---|---|---|
| M1 | `scripts/pick_daily.py:575` guard disabled | 6 × `TestQuietDay` | **Yes** | 6 |
| M2 | `src/arxiv_collector/index.py:115` guard no-op | 2 × shrink tests | **Yes** | 2 |
| M3 | `scripts/check_site_links.py` missing `broken_links` | JSON-key test | **Yes** | 3 |
| M4 | `scripts/pick_daily.py:589` `return 1` | exit-code test | **Yes** | 6 |
| M5 (extra) | `scripts/check_site_links.py:541` `exit_code = 3` | — | **No** | 0 |

**Mandated mutants killed: 4 / 4.** No passenger test among M1–M4. **[Verified]**

---

## 3. Findings

### Blocking
None. **[Verified]**

### Material
None. **[Verified]**

### Non-blocking

**F-1 — The JSON-report write-failure exit code is implemented but not pinned.**
`scripts/check_site_links.py:541` sets `exit_code = 2` when the report cannot be written although the site was fine, but `tests/scripts/test_check_site_links.py:358-373` asserts only `proc.returncode != 0` and the stderr text. Extra probe **M5** (changing `2` to `3`) killed **zero** tests. A CI consumer that keys on exit code 2 would not notice a drift to 1, 3 or 7.
*Severity:* Non-blocking — the loudness contract (non-zero exit + stderr) is pinned, and the value is documented in the script; but this is exactly the class of contract commit `8723290` set out to pin for the sync command.
*Recommendation:* change the assertion to `proc.returncode == 2`.
*Evidence:* `scripts/check_site_links.py:538-541`; `tests/scripts/test_check_site_links.py:358-373`; M5 in §2. **[Verified]**

**F-2 — The quiet-day success message is only partly pinned.**
`scripts/pick_daily.py:588` prints `no day file written — <date> stays open`, but only the first message is asserted (`tests/scripts/test_pick_daily.py:895-897` checks `"nothing to pick for …"`, `"1 candidate(s) that day"`, `"1 of them already picked on an earlier day"`). A consumer that greps for the "stays open" line is not protected by a test.
*Severity:* Non-blocking (the observable behaviour — no file written, exit 0 — is fully pinned).
*Evidence:* `scripts/pick_daily.py:583-588`; `tests/scripts/test_pick_daily.py:894-897`. **[Verified]**

### Observations (no action required)

- **O-1** — The report written on the "no built site" path (`scripts/check_site_links.py:375-395`) ignores the boolean returned by `emit_json_report`, so a write failure there leaves the exit code at 1 (already non-zero) instead of 2. This is consistent with the documented rule, which reserves 2 for "the site was fine". **[Verified]**
- **O-2** — The `--json` report payload is built even when the crawl failed, and `exit_code` inside the payload is the crawler's verdict (0/1), not the process's final code. Consistent, and documented. **[Verified]**
- **O-3** — The R8 diff refactors `return 0 if ok else 1` into `exit_code = 0 if ok else 1 … return exit_code`; the byte-identical run comparison (§1.6) confirms this is behaviour-preserving. **[Verified]**

---

## 4. Overall verdict

**ACCEPT.**

Reasons: **[Verified]** unless noted.

1. All six commits do what they claim, with the required ordering and no collateral changes; the whole worktree suite is green (`454 passed, 24 deselected`).
2. The four mandated mutants were each killed by exactly the tests that were supposed to catch them — **4/4** — so the new tests discriminate rather than merely pass.
3. The R5 "no executable change" requirement is proven structurally, not just textually (AST equality ignoring docstrings), and R8's "byte-identical without the flag" is proven by running the base script against the HEAD script.
4. The one R2 question — did the deleted test lose coverage — is answered **no**: the deleted test's `"done"` branch was unreachable (`"done"` appears nowhere in `src/arxiv_collector/cli.py`, and the actual output was captured), so the survivor's assertion is a strict superset.
5. Only non-blocking findings (F-1, F-2) remain: F-1 is a genuine gap in value-pinning that a one-line assertion closes.

*Not run / out of scope:* the slow-marked tests (24 deselected, `-m "not slow"`), any test requiring network access, and the `reading-collector` / `dsh-plugins` trees — all outside the review boundary.

---

## 5. Reproduction appendix

```powershell
# worktree (read-only) — baseline
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
$env:PYTHONPATH = "D:\project\.swarm-lab\head_tree\src;D:\project\.venv-win\Lib\site-packages"
$env:PYTHONDONTWRITEBYTECODE=1
Set-Location 'D:\project\.swarm-lab\head_tree'
C:\Python312\python.exe -m pytest -q -p no:cacheprovider -m "not slow"

# scratch — per mutant
Set-Location 'D:\project\.swarm-lab\r9-probe'
$env:PYTHONPATH = "D:\project\.swarm-lab\r9-probe\src;D:\project\.venv-win\Lib\site-packages"
C:\Python312\python.exe -m pytest -q -p no:cacheprovider --no-header -rf tests/scripts/test_pick_daily.py   # M1, M4
C:\Python312\python.exe -m pytest -q -p no:cacheprovider --no-header -rf tests/arxiv_collector/test_index.py # M2
C:\Python312\python.exe -m pytest -q -p no:cacheprovider --no-header -rf tests/scripts/test_check_site_links.py # M3, M5

# review helpers (scratch only)
C:\Python312\python.exe _review\ast_cmp_nodoc.py      # R5 "no executable change" proof
C:\Python312\python.exe _review\r8_identical.py       # R8 byte-identical proof
C:\Python312\python.exe _review\cli_empty_sources.py  # R2 "what does the CLI print" proof
```

Files written by this review (scratch only, outside the worktree):
`D:\project\.swarm-lab\r9-probe\_review\ast_cmp.py`, `_review\ast_cmp_nodoc.py`, `_review\r8_identical.py`, `_review\cli_empty_sources.py`, `_review\check_site_links_base.py` (the `cb1be29` version of the script, used for the byte-comparison).
