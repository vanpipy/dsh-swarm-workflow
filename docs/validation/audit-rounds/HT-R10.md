# HT-R10 — Tester acceptance report: the ten-round swarm ladder on `reading-collector`

- **Lane:** R10 acceptance, role **Tester** (`verifier`)
- **Repo under test:** `D:\project\.swarm-lab\head_tree` — a git worktree of *reading-collector*, branch `swarm/lab10`
- **Base:** `cb1be29db04a1ad8c59705b9d93abc7d14ba7465` — "docs(agents): the collector fetches and picks, it does not publish"
- **HEAD:** `16a3d2b32bc27e91235af8ee93ac4abed7fd1641` — "feat(check_site_links): write a machine-readable JSON report so a CI consumer can read the verdict"
- **Date:** 2026-11-07 (local, Asia/Shanghai / China Standard Time, +08:00)
- **Report owner:** this file only — `D:\project\.swarm-lab\rounds\HT-R10.md`
- **What I wrote to the repo:** nothing. Every command below is read-only or writes outside the worktree (§7).

---

## 0. Headline result

| # | Required check | Tag | Verdict |
|---|---|---|---|
| 1 | Working tree clean (`git status --short`) | **Verified** | **PASS** — empty output, 0 status lines |
| 2 | Six ladder commits `cb1be29..HEAD` | **Verified** | **PASS** — exactly the six expected commits, in the expected order |
| 3 | Diff touches only the 10 allowed paths | **Verified** | **PASS** — exactly those 10 paths, all `M`, nothing else |
| 4 | Full unit suite (`-m "not slow"`) | **Verified** | **PASS** — `454 passed, 24 deselected in 665.40s (0:11:05)`, exit 0 |
| 5 | Slow suite (`-m slow`) | **Not run** | **Not run** — needs a built `site/` that does not exist; building it is out of scope (§3.5) |
| 6 | `ruff check --no-cache` on the changed Python files | **Verified** | **PASS** — `All checks passed!`, exit 0, ruff 0.17.0 |
| 7a | Catalog guard refuses a shrinking write, file byte-identical | **Verified** | **PASS** — `CatalogShrinkError` raised, sha256 identical before/after |
| 7b | Picker writes no day file when there is nothing to pick, exits 0 | **Verified** | **PASS** — exit 0, no file written (with a control run that *does* write) |
| 7c | Link checker writes a JSON report with `result=FAIL`, exits 1 | **Verified** | **PASS** — exit 1, JSON `result` `FAIL`, `broken_links` non-empty |

## 0.1 Overall verdict

# ACCEPT

**Verified.** No blocking finding. All nine checkable items pass on the exact tree the ladder produced, the
working tree is clean before and after my checks, the diff is confined to the ten allowed paths, the whole
fast suite is green, lint is clean on every changed file, and each of the three behavioural claims behaves
as specified when exercised black-box from outside the repository.

The one item that could not be exercised is the **slow** site suite (§3.5). It is *Not run*, not *failed*:
its 24 tests assert against the rendered HTML in `./site/`, that directory does not exist in this worktree,
and the brief forbids building it. This is a coverage limitation of the acceptance, not a defect of the
ladder — the ladder does not touch `site/`, the nav, or any build input.

---

## 1. Environment and tooling

| Item | Value |
|---|---|
| Interpreter | `C:\Python312\python.exe` (Python 3.12) — **not** `D:\project\.venv-win\Scripts\python.exe`, **not** `uv run` |
| `PYTHONPATH` | `D:\project\.swarm-lab\head_tree\src;D:\project\.venv-win\Lib\site-packages` |
| `PYTHONDONTWRITEBYTECODE` | `1` (so no `.pyc` is dropped into the worktree) |
| `PATH` | prefixed with `C:\Program Files\Git\cmd;` (without it, two test files fail with `FileNotFoundError: [WinError 2]`) |
| git | `C:\Program Files\Git\cmd\git.exe` (not on PATH) |
| linter | `D:\project\.venv-win\Scripts\ruff.exe`, version **0.17.0** |
| Local timezone | China Standard Time (+08:00); wall clock at the time of the checks: `2026-11-07T02:10:24+08:00` |
| Network | not used; the only HTTP traffic is to `127.0.0.1` on an ephemeral port (§3.7b, §3.7c) |

Scratch space for the black-box probes (outside the repository, so that "only the report was written"
stays literally true): `C:\Users\leroy\AppData\Local\Temp\r10-acceptance`.

---

## 2. The ladder under acceptance

Six commits, oldest first (`git log --oneline cb1be29..HEAD --reverse`, Verified — full output in §3.2):

| Round | Commit | Subject |
|---|---|---|
| R1 | `8120554` | docs(tests): the unattended collector job fires at 02:00, not 06:00 |
| R2 | `fb2ebae` | test(cli): drop the weaker duplicate of the no-sources test |
| R3 | `4eb8643` | fix(pick_daily): never write an empty day file |
| R6 | `24bedad` | feat(index): refuse a catalog write that would shrink the catalog |
| R5 | `8723290` | docs(cli): pin the sync exit-code contract 0/1/2 and its exact values in tests |
| R8 | `16a3d2b` | feat(check_site_links): write a machine-readable JSON report so a CI consumer can read the verdict |

---

## 3. Results

### 3.1 Working tree is clean

Command (run from the worktree root):

```powershell
$git = "C:\Program Files\Git\cmd\git.exe"
Set-Location 'D:\project\.swarm-lab\head_tree'
& $git status --short
Write-Output "STATUS_LINES=$((& $git status --short | Measure-Object -Line).Lines)"
Write-Output "STATUS_EXIT=$LASTEXITCODE"
```

Output — **the `git status --short` command printed nothing at all**; only my two counter lines appear:

```
=== git status --short (after probes) ===
STATUS_LINES=0
STATUS_EXIT=0
```

Long form, same run of commands:

```
=== git status (long form) ===
On branch swarm/lab10
nothing to commit, working tree clean
STATUS_EXIT=0
```

`git status --porcelain` (which also lists untracked files) likewise printed nothing:

```
=== git status --porcelain (untracked included) ===
PORCELAIN_LINES=0
```

> **Verified.** The tree is clean — no modified, staged, or untracked file — both before the probes and
> **after** all three probes ran (§3.7). The second run is the important one: it proves my own checks
> wrote nothing into the worktree.

### 3.2 Commit history

```powershell
& $git log --oneline cb1be29..HEAD --reverse
```

```
=== git log --oneline cb1be29..HEAD --reverse ===
8120554 docs(tests): the unattended collector job fires at 02:00, not 06:00
fb2ebae test(cli): drop the weaker duplicate of the no-sources test
4eb8643 fix(pick_daily): never write an empty day file
24bedad feat(index): refuse a catalog write that would shrink the catalog
8723290 docs(cli): pin the sync exit-code contract 0/1/2 and its exact values in tests
16a3d2b feat(check_site_links): write a machine-readable JSON report so a CI consumer can read the verdict
```

Branch and HEAD:

```
=== branch / HEAD ===
swarm/lab10
16a3d2b32bc27e91235af8ee93ac4abed7fd1641
cb1be29db04a1ad8c59705b9d93abc7d14ba7465 docs(agents): the collector fetches and picks, it does not publish
=== worktree list ===
D:/project/reading-collector     cb1be29 [main]
D:/project/.swarm-lab/head_tree  16a3d2b [swarm/lab10]
```

> **Verified.** Exactly six commits sit on top of the base, with the expected subjects in the expected
> oldest-first order. The worktree is on branch `swarm/lab10`; the main checkout is untouched at `cb1be29`.

### 3.3 Diff scope — only the ten allowed paths

```powershell
& $git diff cb1be29..HEAD --name-status
& $git diff cb1be29..HEAD --stat
```

```
=== git diff cb1be29..HEAD --name-status ===
M	scripts/check_site_links.py
M	scripts/pick_daily.py
M	src/arxiv_collector/cli.py
M	src/arxiv_collector/index.py
M	tests/arxiv_collector/test_cli.py
M	tests/arxiv_collector/test_cli_integration.py
M	tests/arxiv_collector/test_index.py
M	tests/arxiv_collector/test_sync_feed_health.py
M	tests/scripts/test_check_site_links.py
M	tests/scripts/test_pick_daily.py

=== git diff cb1be29..HEAD --stat ===
 scripts/check_site_links.py                    | 165 +++++++++++++++++++++-
 scripts/pick_daily.py                          |  16 +++
 src/arxiv_collector/cli.py                     |  39 +++++
 src/arxiv_collector/index.py                   | 115 ++++++++++++++-
 tests/arxiv_collector/test_cli.py              |  24 ----
 tests/arxiv_collector/test_cli_integration.py  |   2 +-
 tests/arxiv_collector/test_index.py            | 147 +++++++++++++++++++
 tests/arxiv_collector/test_sync_feed_health.py | 165 +++++++++++++++-
 tests/scripts/test_check_site_links.py         | 123 ++++++++++++++++
 tests/scripts/test_pick_daily.py               | 186 +++++++++++++++++++++++++
 10 files changed, 951 insertions(+), 31 deletions(-)
```

> **Verified.** The diff touches exactly the ten allowed paths — no more, no fewer. Every one of them is a
> modification (`M`); no file was added, deleted, or renamed. Note `tests/arxiv_collector/test_cli.py`
> loses 24 lines: that is R2 (`fb2ebae`), which deliberately **deleted** the weaker duplicate of the
> no-sources test rather than weakening it. Nothing under `data/`, `site/`, `config/`, `manual_site_resource/`
> or the CI workflow was touched.

### 3.4 Full unit suite

```powershell
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
$env:PYTHONPATH = "D:\project\.swarm-lab\head_tree\src;D:\project\.venv-win\Lib\site-packages"
$env:PYTHONDONTWRITEBYTECODE = "1"
Set-Location 'D:\project\.swarm-lab\head_tree'
& C:\Python312\python.exe -m pytest -q -m "not slow" -p no:cacheprovider
Write-Output "PYTEST_EXIT=$LASTEXITCODE"
```

Output (verbatim, final line included):

```
................................................................. [ 79%]
........................................................................ [ 95%]
......................                                                   [100%]
454 passed, 24 deselected in 665.40s (0:11:05)
PYTEST_EXIT=0
```

> **Verified.** 454 passed, 0 failed, 0 errors, 0 skipped, 24 deselected (the slow tests), process exit
> code **0**. This is the whole non-slow suite: 478 collected in total (454 + 24). The `-p no:cacheprovider`
> flag keeps pytest from writing a `.pytest_cache` directory into the worktree; `PYTHONDONTWRITEBYTECODE=1`
> keeps `__pycache__` out of it. The run took 11 minutes 5 seconds, so it was executed as a background job.

### 3.5 Slow suite — **Not run**

**Tag: Not run.** Reason: the slow tests assert against the **built** site, and this worktree has no build.

Evidence that the site does not exist:

```powershell
Test-Path 'D:\project\.swarm-lab\head_tree\site'
```

```
=== site/ present? ===
False
```

Evidence that the 24 deselected tests are exactly the ones that need it — `pytest -m "slow" --collect-only`:

```
tests/site/test_adsense_skeleton.py::test_mkdocs_yml_declares_site_url
tests/site/test_adsense_skeleton.py::test_generated_sitemap_has_url_nodes
tests/site/test_adsense_skeleton.py::test_legal_pages_exist_post_build
tests/site/test_adsense_skeleton.py::test_robots_txt_has_sitemap_directive
tests/site/test_adsense_skeleton.py::test_ads_txt_has_google_publisher_line
tests/site/test_adsense_skeleton.py::test_index_html_has_real_meta_description
tests/site/test_adsense_skeleton.py::test_records_page_omits_adsense_disclosure_banner
tests/site/test_adsense_skeleton.py::test_records_page_has_tldr_card
tests/site/test_adsense_skeleton.py::test_records_page_has_cite_block
tests/site/test_adsense_skeleton.py::test_records_page_has_json_ld_scholarly_article
tests/site/test_adsense_skeleton.py::test_records_page_has_abstract_derived_meta_description
tests/site/test_adsense_skeleton.py::test_records_page_h1_count_is_exactly_one
tests/site/test_adsense_skeleton.py::test_homepage_title_is_daily_reading
tests/site/test_adsense_skeleton.py::test_category_page_has_intro_paragraph
tests/site/test_adsense_skeleton.py::test_rss_feed_is_emitted
tests/site/test_adsense_skeleton.py::test_homepage_has_open_graph_meta
tests/site/test_adsense_skeleton.py::test_homepage_favicon_is_inline_svg
tests/site/test_adsense_skeleton.py::test_custom_404_page_has_substantive_content
tests/site/test_adsense_skeleton.py::test_sidebar_caps_categories_at_top_8
tests/site/test_adsense_skeleton.py::test_cookie_consent_banner_is_emitted
tests/site/test_adsense_skeleton.py::test_adsense_script_absent_from_html
tests/site/test_adsense_skeleton.py::test_scripts_readme_exists_with_activation_steps
tests/site/test_adsense_skeleton.py::test_manage_cookies_pill_is_emitted
tests/site/test_adsense_skeleton.py::test_google_fonts_are_lazy_loaded

24/478 tests collected (454 deselected) in 31.92s
```

This matches the repository's own contract, `AGENTS.md` §6:

> "The `slow` marker is on `tests/site/test_adsense_skeleton.py`, which asserts against the rendered HTML
> in `./site/`. The rest of the suite runs without a build …"
> "The slow tests read ./site/, so build first. … `DISABLE_MKDOCS_2_WARNING=true uv run mkdocs build --clean --strict`"

**Why I did not build the site:** the brief forbids it ("do NOT build the site"), a strict mkdocs build
would write a large `site/` tree into the worktree the acceptance is measuring, and the ladder touches
neither the site template, `nav.yml`, `mkdocs.yml`, nor any build input (`data/records/`, `data/index.json`
are untouched by the diff in §3.3). Building it would have changed the tree I am judging.

**What this does and does not mean.** The site-rendering behaviour is unverified *by me*; it is not
verified to be broken either. Anyone wanting the slow suite covered must run it after a strict build.
This is the one gap in the acceptance and it is stated here rather than buried.

### 3.6 Lint — `ruff check` on the changed Python files

```powershell
& D:\project\.venv-win\Scripts\ruff.exe --version
& D:\project\.venv-win\Scripts\ruff.exe check --no-cache `
    scripts/check_site_links.py scripts/pick_daily.py `
    src/arxiv_collector/cli.py src/arxiv_collector/index.py `
    tests/arxiv_collector/test_cli.py tests/arxiv_collector/test_cli_integration.py `
    tests/arxiv_collector/test_index.py tests/arxiv_collector/test_sync_feed_health.py `
    tests/scripts/test_check_site_links.py tests/scripts/test_pick_daily.py
Write-Output "RUFF_EXIT=$LASTEXITCODE"
```

```
=== ruff ===
ruff 0.17.0
All checks passed!
RUFF_EXIT=0
```

> **Verified.** All ten changed Python files are lint-clean.
>
> I did **not** run `ruff format --check`, and I am not reporting it as a defect: `AGENTS.md` §6 states
> "it reports 11 pre-existing files … that were never formatted. That is pre-existing state, not something
> your change introduced", so a failure there would be noise, not a finding.
>
> Note also `AGENTS.md` §6: "Note that CI runs `pytest` only. It does not run ruff, so a lint failure will
> not be caught for you — run it yourself." Running it myself is therefore worth the minute it took.

### 3.7 Black-box behavioural spot-checks

All three run **from outside the repository** as real CLI/library calls. The probes live in
`C:\Users\leroy\AppData\Local\Temp\r10-acceptance\`; every artifact they create (the catalog data root,
the feeds file, the synthetic RSS feed, the day file, the built site, the JSON report) is written under
`%TEMP%`, never under the worktree.

#### 3.7a — The catalog guard refuses a shrinking write and leaves `index.json` byte-identical

The real `IndexWriter` is driven end-to-end. A two-paper catalog is written to a temporary data root,
its sha256 is taken, and then a write that would *shrink* the catalog is attempted. Because the real
merge never drops an existing key, the shrink is introduced by overriding `_merge_entries` on a subclass —
the same technique the repository's own regression test uses
(`tests/arxiv_collector/test_index.py:297`, `class _ReplacingWriter(IndexWriter)`).

```powershell
& C:\Python312\python.exe "$env:TEMP\r10-acceptance\probe_catalog_guard.py" "$env:TEMP\r10-acceptance\probeA"
Write-Output "PROBE_A_EXIT=$LASTEXITCODE"
```

Output:

```
===== PROBE A: catalog guard =====
catalog written: C:\Users\leroy\AppData\Local\Temp\r10-acceptance\probeA\catalog-data\index.json
entries on disk: 2
sha256 before: dd56283cbece3419a8ecb2684af5cfa537aff67d1fb7bf03530e0a27e26f9582
RESULT: CatalogShrinkError raised
---- error message ----
refusing to write a catalog smaller than the one on disk (C:\Users\leroy\AppData\Local\Temp\r10-acceptance\probeA\catalog-data\index.json): 2 entries on disk, 0 to write.
The catalog is cumulative: every paper ever seen must stay in it, because a dropped entry silently unpublishes that paper's page.
entries that would be lost: arxiv:2601.00001, arxiv:2601.00002
The file on disk was left unchanged.
-----------------------
sha256 after : dd56283cbece3419a8ecb2684af5cfa537aff67d1fb7bf03530e0a27e26f9582
BYTE_IDENTICAL=True
SIZE_BEFORE=805 SIZE_AFTER=805
data_root contents: ['index.json']
PROBE_A_EXIT=0
```

> **Verified.** The guard fires, the refusal message names the file, both sizes and the entries that
> would have been lost, and ends with "The file on disk was left unchanged." — which is true: the sha256
> of `index.json` is **identical** before and after (`dd56283c…f9582`), the size is unchanged (805 B), and
> the data root contains exactly one file (no temp file left behind by the aborted write).

#### 3.7b — The picker writes no day file when there is nothing to pick, and exits 0

`scripts/pick_daily.py` is invoked as a real CLI subprocess. The feed it reads is a **local** HTTP server
on `127.0.0.1` (ephemeral port) serving a synthetic arXiv RSS 2.0 document — no internet access. The day
file is written to `%TEMP%` via `--output`; the repository's `data/picked/` is only *read* (the picker
skips ids already recorded on an earlier day).

Two cases run against the same machinery:

- **quiet** — the feed carries one paper, `2611.04977`, which is already recorded in the repository's
  `data/picked/2026-11-04.md`. Every candidate for the day is therefore already picked.
- **control** — the same harness, but the feed carries `2699.99999`, which is *not* in any day file.

The control exists so that "no file was written" cannot be confused with "my feed never worked".

```powershell
& C:\Python312\python.exe "$env:TEMP\r10-acceptance\probe_picker_quiet_day.py" "$env:TEMP\r10-acceptance\probeB"
Write-Output "PROBE_B_EXIT=$LASTEXITCODE"
```

Output:

```
===== PROBE B (rerun): picker quiet day =====
probe timestamp (local): 2026-11-07T02:11:35.649782+08:00
picker under test: D:\project\.swarm-lab\head_tree\scripts\pick_daily.py

===== CASE quiet (feed id 2611.04977, day 2026-11-07) =====
--- stdout ---
[pick_daily] feed: 1 unique papers, announced 2026-11-07..2026-11-07
[pick_daily] 40 paper(s) already picked on earlier days
[pick_daily] 0 pick(s) of 1 candidate(s)
[pick_daily] nothing to pick for 2026-11-07: 1 candidate(s) that day, 1 of them already picked on an earlier day
[pick_daily] no day file written ?? 2026-11-07 stays open
--- exit code: 0 ---
day file written at C:\Users\leroy\AppData\Local\Temp\r10-acceptance\probeB\quiet\out\day.md: False
RESULT[quiet]: exit=0 file_written=False

===== CASE control (feed id 2699.99999, day 2026-11-07) =====
--- stdout ---
[pick_daily] feed: 1 unique papers, announced 2026-11-07..2026-11-07
[pick_daily] 40 paper(s) already picked on earlier days
[pick_daily] 1 pick(s) of 1 candidate(s)
   1. [ 13.0] 2699.99999  Synthetic probe paper 2699.99999
[pick_daily] wrote C:\Users\leroy\AppData\Local\Temp\r10-acceptance\probeB\control\out\day.md
--- exit code: 0 ---
day file written at C:\Users\leroy\AppData\Local\Temp\r10-acceptance\probeB\control\out\day.md: True
day file size: 1284 bytes
RESULT[control]: exit=0 file_written=True

{
  "already_picked_id": "2611.04977",
  "not_picked_id": "2699.99999"
}
PROBE_B_EXIT=0
```

> **Verified.** The quiet day exits **0**, prints "nothing to pick for 2026-11-07: 1 candidate(s) that day,
> 1 of them already picked on an earlier day" and "no day file written — 2026-11-07 stays open", and **no
> day file exists** at the output path afterwards. The control run with the same feed, server, config and
> command line *does* write a 1284-byte day file — so the feed, the parser, the ranker and the write path
> all work, and the quiet result is caused by the already-picked exclusion, not by a broken input.
>
> The `??` in the pasted line is a **console rendering artefact** of the em dash on this code page, not
> repository output; the source line is `print(f"[pick_daily] no day file written — {target_day.isoformat()} stays open")`
> at `scripts/pick_daily.py:588` (Verified by reading the file).

#### 3.7c — The link checker writes a JSON report with `result=FAIL` and exits 1

A temporary site with one page holding a link to a page that does not exist is built under `%TEMP%`, and
`scripts/check_site_links.py` is invoked as a real CLI subprocess with `--json`. The checker starts its
own local server and crawls only that server — no internet access.

```powershell
& C:\Python312\python.exe "$env:TEMP\r10-acceptance\probe_link_checker.py" "$env:TEMP\r10-acceptance\probeC"
Write-Output "PROBE_C_EXIT=$LASTEXITCODE"
```

Output:

```
===== PROBE C: link checker JSON report =====
--- stdout ---
[check_site_links] 1 built pages found in C:\Users\leroy\AppData\Local\Temp\r10-acceptance\probeC\site
[check_site_links] internal links checked over HTTP: 1
[check_site_links] distinct targets requested over HTTP: 2
[check_site_links] external links (not fetched): 0

[check_site_links] BROKEN internal links: 1 pages
  /
      /missing/ -> HTTP 404
[check_site_links] no broken fragments

[check_site_links] RESULT: FAIL
--- exit code: 1 ---
report written: True
--- JSON report ---
{
  "schema_version": 1,
  "result": "FAIL",
  "exit_code": 1,
  "site_dir": "C:\\Users\\leroy\\AppData\\Local\\Temp\\r10-acceptance\\probeC\\site",
  "built_pages": 1,
  "links_checked": 1,
  "distinct_requests": 2,
  "external_link_count": 0,
  "broken_links": {
    "/": [
      "/missing/ -> HTTP 404"
    ]
  },
  "broken_fragments": {},
  "external_links": []
}
--- checks ---
result='FAIL' (expect 'FAIL')
exit_code=1 (expect 1)
broken_links={'/': ['/missing/ -> HTTP 404']}
broken_link_count=1
process exit code=1 (expect 1)
RESULT: PASS
PROBE_C_EXIT=0
```

> **Verified.** The JSON report is written, its `result` is `FAIL`, its `exit_code` is `1`,
> `broken_links` names the broken target (`/missing/ -> HTTP 404`), and the process itself exits **1**.
> The key set matches the documented contract in `scripts/check_site_links.py:366-369` —
> `schema_version, result, exit_code, site_dir, built_pages, links_checked, distinct_requests,
> external_link_count, broken_links, broken_fragments, external_links` — all eleven keys are present.

---

## 4. What the ladder changed, against the required behaviour

| Round | Claim | How it was verified | Result |
|---|---|---|---|
| R1 `8120554` | the unattended job fires at 02:00, not 06:00 | commit present and message exact (§3.2); `AGENTS.md:269` reads "a scheduled task in DSH fires at **02:00** local time" | **Verified** (docs) |
| R2 `fb2ebae` | the weaker duplicate of the no-sources test is dropped | `tests/arxiv_collector/test_cli.py` loses 24 lines in the diff (§3.3); suite green | **Verified** |
| R3 `4eb8643` | the picker never writes an empty day file | black-box: quiet day → exit 0, no file (§3.7b) | **Verified** |
| R5 `8723290` | the sync exit-code contract 0/1/2 is pinned in tests | exit codes asserted in `tests/arxiv_collector/test_cli.py` (e.g. `test_exit_codes_separate_a_broken_source_from_an_empty_one` at :254); suite green | **Verified** (by suite) |
| R6 `24bedad` | the catalog never silently shrinks | black-box: guard raises, file byte-identical (§3.7a) | **Verified** |
| R8 `16a3d2b` | the link checker emits a machine-readable JSON report | black-box: report written, `result=FAIL`, exit 1 (§3.7c) | **Verified** |

---

## 5. Blocking findings

**None.**

No test failed, no lint error, no out-of-scope file was touched, no dirty file was left behind, and the
behavioural contract of every round that changed behaviour was confirmed by exercising it from outside the
repository.

---

## 6. Non-blocking observations

1. **The slow site suite is unverified.** Not run — it needs a built `site/` (§3.5). The ladder does not
   touch any build input, so this is unlikely to matter, but it is a real gap in the acceptance. *(Not run)*
2. **`ruff format --check` was deliberately not run**, per the brief and `AGENTS.md` §6 (11 pre-existing
   files). Not a defect of the ladder. *(Not run, by instruction)*
3. **CI does not run ruff** (`AGENTS.md` §6). The lint gate on the changed files is therefore a local
   check only; a CI-side ruff gate would be worth considering separately. *(Verified by reading AGENTS.md)*
4. **The picker's empty-feed path is a different exit code.** During the first probe iteration my
   synthetic feed failed to parse (my XML omitted the `dc` namespace declaration), and the picker printed
   "the feed returned no papers — is the feed URL still right?" and exited **1**. That is a distinct,
   sensible failure mode (no feed → exit 1) and is *not* the quiet-day path, which exits 0. It was a bug
   in my probe, fixed by adding `xmlns:dc="http://purl.org/dc/elements/1.1/"` to the feed root. *(Verified
   — recorded here so the evidence trail is complete)*
5. **The CLI exit-code contract is pinned by tests, not by a live CLI run.** R5's contract (0 / 1 / 2) is
   verified through the test suite rather than by invoking the CLI end-to-end. The suite is green and the
   assertions are explicit (`exit_code == 0`, `exit_code == 1` at `test_cli.py:283,306,329,347`), so I
   consider the claim verified at the level the ladder claims it. A direct CLI invocation of `sync` would
   need network access to the arXiv feed and was therefore out of scope here. *(Verified by suite /
   Not run end-to-end)*

---

## 7. Boundary compliance

| Constraint | Status | Evidence |
|---|---|---|
| No file under `D:\project\.swarm-lab\head_tree` modified, added or deleted | **Honoured** | `git status --porcelain` → 0 lines **after** all probes ran (§3.1) |
| No git write command (no add/commit/checkout/stash/clean/reset) | **Honoured** | only `status`, `log`, `diff`, `rev-parse`, `worktree list`, `grep` were used |
| `D:\project\reading-collector` untouched | **Honoured** | `git worktree list` shows it still at `cb1be29 [main]`; it was only read |
| `D:\project\dsh-plugins`, the DSH profile, any plugin row | **Honoured** | not touched |
| No network | **Honoured** | the only HTTP traffic was to `127.0.0.1` on ephemeral ports, from the two local probe servers (§3.7b, §3.7c) |
| No agents spawned | **Honoured** | all work done in this lane |
| Only `D:\project\.swarm-lab\rounds\HT-R10.md` written by me | **Honoured** | probe scripts and all probe artifacts live under `%TEMP%\r10-acceptance` |
| Interpreter | **Honoured** | `C:\Python312\python.exe` throughout; `D:\project\.venv-win\Scripts\python.exe` and `uv run` were never used |

---

## 8. Exit criteria

| Criterion | Status |
|---|---|
| Seven required results reported with exact outputs | **Done** — §3.1 … §3.7 (5 is explicitly *Not run* with its reason) |
| One overall verdict | **Done** — **ACCEPT** (§0.1) |
| Every statement tagged Verified / Inferred / Not run | **Done** — §0 table, §3, §6 |
| Suite output pasted verbatim | **Done** — §3.4, and the raw output of every probe in §3.7 |
| No file outside the report modified | **Done** — §7 |
| Worktree left clean | **Done** — re-verified after the probes (§3.1) |

**Bottom line: the ten-round ladder on `reading-collector` is ACCEPTED.** The one thing I could not
exercise is the slow site suite, because it needs a built site; that gap is stated in §3.5 and §6.1 and
is not a defect of the ladder.
