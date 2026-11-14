# HT-R4 — Review of the R3 `pick_daily` fix (Reviewer: `auditor`)

| | |
|---|---|
| Round | R4 of the `head_tree` 10-round ladder (review of R3) |
| Reviewer | `auditor` (Reviewer role) |
| Board task | `task-14` (claimed at revision 2) |
| Repo under review | `D:\project\.swarm-lab\head_tree` (git worktree of `D:\project\reading-collector`, branch `swarm/lab10`) |
| Change under review | commit `4eb8643` — *fix(pick_daily): never write an empty day file* (`4eb86433b7c00a1b61758b132ff45054808a28bb`, vanpipy, Sat Nov 7 01:35:52 2026 +0800) |
| Report date | 2026-11-07 (local, Asia/Shanghai) |
| **Overall verdict** | **ACCEPT** — (a) ACCEPT, (b) ACCEPT, (c) ACCEPT. Three non-blocking findings, no blocking and no material findings. |

Every statement below is marked **Verified** (I ran it and saw the result), **Inferred** (I read the code and
believe it) or **Not run** (out of scope, blocked, or not possible here).

---

## 1. Tooling used (evidence for every command in this report)

| Item | Value |
|---|---|
| git | `C:\Program Files\Git\cmd\git.exe` — **not on PATH**; `cmd` is also not on PATH, it must be called as `C:\Windows\System32\cmd.exe` |
| python | `C:\Python312\python.exe` (`D:\project\.venv-win\Scripts\python.exe` and `uv run` were **not** used) |
| `PYTHONPATH` | `<tree>\src;D:\project\.venv-win\Lib\site-packages` |
| `PATH` | prefixed with `C:\Program Files\Git\cmd;` |
| pytest | 9.1.1, plugin: anyio-4.15.1, platformdirs-4.13.5, asyncio-1.4.0, respx-0.23.1 |
| Write-protection of the real tree | every pytest run used `-p no:cacheprovider` and `PYTHONDONTWRITEBYTECODE=1`, so no `.pytest_cache` and no `.pyc` were written into the worktree |

---

## 2. Claim (a) — guard placement and behaviour → **ACCEPT**

### 2.1 The guard sits between the refuse-to-overwrite check and the write

**Verified** — `scripts/pick_daily.py`, read verbatim:

```
567:     output = args.output or (PICKED_DIR / f"{target_day.isoformat()}.md")
568:     if output.exists() and not args.force:
569:         print(
570:             f"[pick_daily] {output} already exists — refusing to overwrite a"
571:             " curated list (use --force to replace it)"
572:         )
573:         return 1
574:
575:     if not items:
576:         # Nothing survived the filter: every candidate for this day was
577:         # recorded on an earlier day. Writing the file anyway would close
578:         # the day behind an empty list — ``--newest-unpicked`` never
579:         # offers a day that already has a file, so that announcement
580:         # would never be offered again. A quiet morning is not a
581:         # failure, so nothing is written and the day stays open.
582:         picked_before = sum(1 for paper in candidates if paper.source_id in exclude)
583:         print(
584:             f"[pick_daily] nothing to pick for {target_day.isoformat()}: "
585:             f"{len(candidates)} candidate(s) that day, {picked_before} of them"
586:             " already picked on an earlier day"
587:         )
588:         print(f"[pick_daily] no day file written — {target_day.isoformat()} stays open")
589:         return 0
590:
591:     output.parent.mkdir(parents=True, exist_ok=True)
592:     output.write_text(
593:         render(target_day, items, taste, urls, len(papers), len(candidates)),
594:         encoding="utf-8",
595:     )
596:     print(f"[pick_daily] wrote {output}")
597:     return 0
```

* `scripts/pick_daily.py:568-573` — the refuse-to-overwrite check, `return 1`.
* `scripts/pick_daily.py:575-589` — the new guard, `return 0`.
* `scripts/pick_daily.py:591` — `output.parent.mkdir(...)`; the only write is `output.write_text(...)` at
  `scripts/pick_daily.py:592-595`.

Ordering: **573 (return 1) < 575 (guard) < 591 (mkdir)** — the guard is **after** the refuse check and
**before** the mkdir. **Verified.**

Consequences, all **Verified** by reading the control flow of `main()` (single write site at `:592-595`,
single mkdir at `:591`):

* The guard returns **0** (`:589`) and reaches neither the mkdir nor the write → **no file is written** and
  **no parent directory is created** when the ranked list is empty. The default path
  (`data/picked/<day>.md`) is the `PICKED_DIR / f"{target_day.isoformat()}.md"` branch of
  `scripts/pick_daily.py:567`; an explicit `--output` path takes the other branch of the same line, and
  **both** are computed before the guard, so the guard applies to both.
* `--force` does not change the outcome: the force flag is only consulted at `:568` (`output.exists() and
  not args.force`), never after the guard, so `--force` cannot make the guard write an empty file.
* A **curated** file that exists is left untouched when the list is empty: with `--force` the guard at
  `:575-589` returns before the write at `:592`; without `--force` the script returns 1 at `:573` (pre-existing
  behaviour, unchanged).

### 2.2 Empirical confirmation of the no-file rule

**Verified** — the six new tests in the real tree (full output in §5.2) assert exactly this for the default
path, the explicit `--output` path, with and without `--force`, and for a curated file.

**Verified** — an extra end-to-end probe I ran myself (not part of the commit) with `--max 0`, writing to a
temp path outside the repository, `fetch_papers` stubbed so no network was touched:

```
[pick_daily] feed: 1 unique papers, announced 2026-11-04..2026-11-04
[pick_daily] 20 paper(s) already picked on earlier days
[pick_daily] 0 pick(s) of 1 candidate(s)
[pick_daily] nothing to pick for 2026-11-04: 1 candidate(s) that day, 0 of them already picked on an earlier day
[pick_daily] no day file written — 2026-11-04 stays open
EXIT 0 | OUTPUT FILE WRITTEN: False
```

(The `��` in the console echo is the GBK console code page failing on the em dash `—`; the file itself is
UTF-8 and the em dash is intact at `scripts/pick_daily.py:588`. Cosmetic console artefact, **Not run**: not
applicable — it is not a defect.)

---

## 3. Claim (b) — nothing else changed → **ACCEPT**

**Verified** — `git show --numstat --format='' 4eb8643`:

```
16	0	scripts/pick_daily.py
186	0	tests/scripts/test_pick_daily.py
```

**Verified** — `git show --stat --format='' 4eb8643`:

```
 scripts/pick_daily.py            |  16 ++++
 tests/scripts/test_pick_daily.py | 186 +++++++++++++++++++++++++++++++++++++++
 2 files changed, 202 insertions(+)
```

* `scripts/pick_daily.py`: **16 insertions, 0 deletions** — exactly the number the brief expects. A pure
  insertion with zero deletions means **no existing line was removed or reworded anywhere in the file**.
* `tests/scripts/test_pick_daily.py`: **186 insertions, 0 deletions** — additions only.
* The whole `scripts/pick_daily.py` hunk is the single guard (one `@@ -572,6 +572,22 @@` hunk, 6 context
  lines, 16 added lines) — **Verified** from `git show 4eb8643 -- scripts/pick_daily.py`.

Specific behaviours the brief asked about, all **Verified** by reading the post-commit file:

| Behaviour | Location | Result |
|---|---|---|
| `MAX_PICKS_PER_DAY = 20` | `scripts/pick_daily.py:70` (docstring `:68-69`) | unchanged — outside the hunk |
| `--newest-unpicked` selection rule | `scripts/pick_daily.py:522-535` | unchanged — the newest announcement day with **no day file** (`pending = [d for d in days if not (PICKED_DIR / f"{d.isoformat()}.md").exists()]`, then `filter_day = pending[-1]`), which is precisely the rule the fix protects |
| exit codes | `scripts/pick_daily.py:483` (2), `:488` (2), `:491` (2), `:509` (2), `:514` (1), `:530` (0), `:548` (0), `:565` (0), `:573` (1), **`:589` (0, new)**, `:597` (0) | every pre-existing exit code is unchanged; the commit **adds** one new `return 0` at `:589` and changes no existing one |
| wording of the other paths | whole file | unchanged — 0 deletions means no other print statement was touched |
| pre-existing `--force` / overwrite tests | `tests/scripts/test_pick_daily.py:494` (`test_existing_file_is_not_overwritten`), `:516` (`test_force_replaces_the_file`) | unchanged, still present, still passing (they are outside the 186 added lines) |

**Verified** — the worktree copy of the script *is* the committed version: `git status --porcelain` in
`D:\project\.swarm-lab\head_tree` lists `scripts/check_site_links.py`, `src/arxiv_collector/cli.py` and
`tests/arxiv_collector/test_sync_feed_health.py` (other lanes' uncommitted work) and **not**
`scripts/pick_daily.py`.

---

## 4. Claim (c) — the six new tests are discriminating → **ACCEPT**

### 4.1 What the six tests are

**Verified** — `tests/scripts/test_pick_daily.py:833-1011`, `class TestQuietDay` (the whole 186-line
addition is the block `:826-1011`, which matches `186 insertions` exactly):

| # | Test | Line | What it pins |
|---|---|---|---|
| 1 | `test_no_day_file_is_written_when_everything_was_picked_before` | `:876` | exit 0, **no** `2026-11-04.md`, and the three message fragments (`"nothing to pick for 2026-11-04"`, `"1 candidate(s) that day"`, `"1 of them already picked on an earlier day"`) |
| 2 | `test_the_day_stays_open_for_a_later_pick` | `:899` | a second run with one new paper writes the day file containing **only** `2611.03651` — the guard does not break normal picking |
| 3 | `test_newest_unpicked_offers_the_quiet_day_again` | `:931` | the job's mode still offers the quiet day; `picked/` holds only `2026-11-03.md` |
| 4 | `test_force_does_not_write_an_empty_day_file` | `:956` | `--force` does not create an empty day file |
| 5 | `test_force_keeps_a_curated_file_instead_of_emptying_it` | `:974` | a hand-written `2026-11-04.md` survives byte-for-byte (`== "# curated by hand\n"`) |
| 6 | `test_an_explicit_output_path_gets_no_empty_file` | `:994` | the rule holds for an explicit `--output` path |

**Verified** — the tests are black-box and offline: `fetch_papers` is stubbed
(`tests/scripts/test_pick_daily.py:851`), `PICKED_DIR` is redirected into `tmp_path` (`:852`), and the day
file that makes the candidates "already picked" is written by the helper at `:866-874` in a form
`already_picked()` really parses (`scripts/pick_daily.py:284-293`, `_ARXIV_ABS_RE` at `:76`). No network, no
repository data.

### 4.2 The revert probe (mandatory) — **the new code was removed and the six tests still failed**

**Scratch directory** — `D:\project\.swarm-lab\r4-probe`, built with:

```
New-Item -ItemType Directory -Path D:\project\.swarm-lab\r4-probe -Force
Copy-Item D:\project\.swarm-lab\head_tree\scripts   -Destination D:\project\.swarm-lab\r4-probe -Recurse -Force
Copy-Item D:\project\.swarm-lab\head_tree\src       -Destination D:\project\.swarm-lab\r4-probe -Recurse -Force
Copy-Item D:\project\.swarm-lab\head_tree\tests     -Destination D:\project\.swarm-lab\r4-probe -Recurse -Force
Copy-Item D:\project\.swarm-lab\head_tree\config    -Destination D:\project\.swarm-lab\r4-probe -Recurse -Force
Copy-Item D:\project\.swarm-lab\head_tree\pyproject.toml -Destination D:\project\.swarm-lab\r4-probe -Force
```

**Verified** — the scratch copy contains **no** `.git` entry (the worktree's `.git` is a hidden *file*,
`-a-h--`, pointing at the parent repo's worktree metadata — copying it would have let git commands in the
scratch dir operate on the real worktree):

```
== .git entries inside scratch (must be none) ==
NONE
```

The copied `__pycache__` directories were deleted from the copy (not from the real tree) so no stale
byte-code could be imported.

**Restoring the pre-fix file** — the exact command:

```
C:\Windows\System32\cmd.exe /c ""C:\Program Files\Git\cmd\git.exe" -C "D:\project\.swarm-lab\head_tree" show 4eb8643~1:scripts/pick_daily.py > "D:\project\.swarm-lab\r4-probe\scripts\pick_daily.py""
```

> **Probe trap worth recording (see finding F3).** The first attempt used `4eb8643^:scripts/pick_daily.py`
> inside `cmd.exe`. `cmd` treats `^` as its escape character and **silently stripped it**, so git received
> `4eb8643:scripts/pick_daily.py` and restored the **post-fix** blob. The byte verification below caught it
> (the restored blob id equalled the post-fix id and the guard was still present). Using `~1` instead of
> `^` avoids the metacharacter entirely.

**Verified** — the restored file is byte-identical to the pre-fix blob:

```
pre-fix  blob: 4666e107cdb50f70b241e711cd1fbc91b33e655e
post-fix blob: dbed85f3f9034684c20b2f628203ee7d64c5cdee
restored blob: 4666e107cdb50f70b241e711cd1fbc91b33e655e
RESTORE MATCHES PRE-FIX : True
RESTORE DIFFERS FROM FIXED: True
bytes=20126  sha256=0D88ECC632E22C49502213AC922DA77EE9AAB79C53C3C4FA35EB51E4055CA46F
guard present? False
restored line count: 585
```

(`git hash-object --no-filters` on the restored file = `git rev-parse 4eb8643~1:scripts/pick_daily.py`;
601 lines → 585 lines, i.e. exactly the 16 lines of the fix removed; SHA-256 recorded for the record.)

### 4.3 The six tests against the PRE-FIX code — **they fail**

**Verified** — in the scratch dir, with the pre-fix `scripts/pick_daily.py`:

```
$env:PYTHONPATH="D:\project\.swarm-lab\r4-probe\src;D:\project\.venv-win\Lib\site-packages"
$env:PATH="C:\Program Files\Git\cmd;"+$env:PATH
$env:PYTHONDONTWRITEBYTECODE="1"
C:\Python312\python.exe -m pytest "tests/scripts/test_pick_daily.py::TestQuietDay" -v -p no:cacheprovider
```

```
=============================== short test summary info ===============================
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_no_day_file_is_written_when_everything_was_picked_before
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_the_day_stays_open_for_a_later_pick
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_newest_unpicked_offers_the_quiet_day_again
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_force_does_not_write_an_empty_day_file
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_force_keeps_a_curated_file_instead_of_emptying_it
FAILED tests/scripts/test_pick_daily.py::TestQuietDay::test_an_explicit_output_path_gets_no_empty_file
============================== 6 failed in 1.04s ==============================
```

**All six fail — none passes against the pre-fix code, so all six discriminate.** The representative failure
shows the defect exactly as it was (the pre-fix script wrote the empty file):

```
>       assert not out.exists()
E       AssertionError: assert not True
E        +  where True = exists()

tests\scripts\test_pick_daily.py:1011: AssertionError
---------------------------- Captured stdout call -----------------------------
[pick_daily] feed: 1 unique papers, announced 2026-11-04..2026-11-04
[pick_daily] 1 paper(s) already picked on earlier days
[pick_daily] 0 pick(s) of 1 candidate(s)
[pick_daily] wrote C:\Users\leroy\AppData\Local\Temp\pytest-of-leroy\pytest-95\test_an_explicit_output_path_g0\elsewhere.md
```

and for the curated-file test:

```
E         - # curated by hand
E         + # Reading list … 2026-11-04
...
tests\scripts\test_pick_daily.py:992: AssertionError
```

### 4.4 The same six tests against the FIXED code in the real tree — **they pass**

**Verified** — run in `D:\project\.swarm-lab\head_tree` (read-only: `-p no:cacheprovider` +
`PYTHONDONTWRITEBYTECODE=1`, no output written into the worktree):

```
$env:PYTHONPATH="D:\project\.swarm-lab\head_tree\src;D:\project\.venv-win\Lib\site-packages"
$env:PATH="C:\Program Files\Git\cmd;"+$env:PATH
$env:PYTHONDONTWRITEBYTECODE="1"
C:\Python312\python.exe -m pytest "tests/scripts/test_pick_daily.py::TestQuietDay" -v -p no:cacheprovider
```

```
============================= test session starts =============================
platform win32 -- Python 3.12.0, pytest-9.1.1, pluggy-1.7.0 -- C:\Python312\python.exe
rootdir: D:\project\.swarm-lab\head_tree
configfile: pyproject.toml
plugins: anyio-4.15.1, platformdirs-4.13.5, asyncio-1.4.0, respx-0.23.1
collecting ... collected 6 items

tests/scripts/test_pick_daily.py::TestQuietDay::test_no_day_file_is_written_when_everything_was_picked_before PASSED [ 16%]
tests/scripts/test_pick_daily.py::TestQuietDay::test_the_day_stays_open_for_a_later_pick PASSED [ 33%]
tests/scripts/test_pick_daily.py::TestQuietDay::test_newest_unpicked_offers_the_quiet_day_again PASSED [ 50%]
tests/scripts/test_pick_daily.py::TestQuietDay::test_force_does_not_write_an_empty_day_file PASSED [ 66%]
tests/scripts/test_pick_daily.py::TestQuietDay::test_force_keeps_a_curated_file_instead_of_emptying_it PASSED [ 83%]
tests/scripts/test_pick_daily.py::TestQuietDay::test_an_explicit_output_path_gets_no_empty_file PASSED [100%]

============================== 6 passed in 0.36s ==============================
```

The discriminating proof is therefore a clean **6 failed → 6 passed** across the single-variable change
(the 16 added lines).

---

## 5. Findings

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| **F1** | Non-blocking | The guard's diagnostic can misreport the *reason* for an empty list. The list is empty not only when "every candidate was picked earlier" but also when the limit is zero (`--max 0`, or a taste profile with `daily_limit: 0`). In that case the message reads *"1 candidate(s) that day, 0 of them already picked on an earlier day"* — the "0 of them already picked" clause is false, and "nothing to pick" hides the fact that the user asked for zero picks. Behaviour is otherwise correct (exit 0, no file written). A cheap fix is to phrase the clause as "N of them already picked on an earlier day" only when `picked_before > 0`, or to report the limit. | `scripts/pick_daily.py:582-587`; verified output in §2.2 (`--max 0` probe) |
| **F2** | Non-blocking | With `--max 0 --apply` the pre-fix code wrote a day file with zero entries and the post-fix code writes none. That is the intended direction ("never write an empty day file"), but it is a second, untested behaviour change inside the same guard, and no test covers it. | `scripts/pick_daily.py:575-589`; no test in `tests/scripts/test_pick_daily.py:833-1011` uses `--max 0` |
| **F3** | Non-blocking (process, not a defect in the commit) | The revert probe as written in the brief (`git show 4eb8643^:scripts/pick_daily.py` redirected through `cmd.exe`) **silently restores the wrong revision**: `cmd` eats `^` as an escape character, so git resolves `4eb8643:scripts/pick_daily.py` (the post-fix blob). I hit this and it was caught only by the blob-id verification. Any later lane that repeats this probe should use `4eb8643~1:` (as I did) or run git without `cmd.exe` redirection, and must always verify the restored blob id. | probe transcript in §4.2 — first restore gave `restored blob: dbed85f3…` (= post-fix) instead of `4666e107…` |
| **F4** | Non-blocking (observation) | The shared worktree carries uncommitted modifications from other lanes while I reviewed: `scripts/check_site_links.py` (the R8 lane), `src/arxiv_collector/cli.py` and `tests/arxiv_collector/test_sync_feed_health.py`. `scripts/pick_daily.py` is **not** among them, so the commit under review is not polluted. I did not touch any of them. | `git status --porcelain` in `D:\project\.swarm-lab\head_tree` |
| **F5** | Non-blocking (observation) | The worktree's `scripts/pick_daily.py` is a CRLF checkout (601 CRLF, 0 bare LF, 21 583 bytes) while the committed blob is LF (585 LF, 20 126 bytes). `core.autocrlf` is on. Content is identical, `git status` is clean for this file, and the test runs are unaffected — but a byte-level reviewer must compare like with like. | byte counts measured in the probe (§4.2) |

**Blocking findings: none. Material findings: none.**

---

## 6. Verification status of every claim in this report

| Statement | Status |
|---|---|
| Commit `4eb8643` adds 16 lines to `scripts/pick_daily.py` and 186 to the test file, with 0 deletions | **Verified** (`git show --numstat`) |
| The guard is at `:575-589`, after the refuse check (`:568-573`, `return 1`) and before `output.parent.mkdir` (`:591`) | **Verified** (file read) |
| The guard returns 0 and is the only path between the refusal check and the write | **Verified** (file read) |
| No file and no directory are written when the list is empty — default path, explicit `--output`, with/without `--force`, curated file | **Verified** (six tests, §4.4; extra `--max 0` probe, §2.2) |
| `MAX_PICKS_PER_DAY = 20` at `:70` | **Verified** (file read) |
| The `--newest-unpicked` rule (newest announcement day without a day file) at `:522-535` | **Verified** (file read) |
| Existing exit codes (2/2/2/2/1/0/0/0/1/0) unchanged; one new `return 0` at `:589` | **Verified** (file read + 0 deletions in the diff) |
| The six new tests are the only change to the test file and they are offline/black-box | **Verified** (file read; `fetch_papers` stubbed at `:851`) |
| All six tests fail against the pre-fix code (revert probe) | **Verified** (§4.3: `6 failed in 1.04s`) |
| All six tests pass against the fixed code | **Verified** (§4.4: `6 passed in 0.36s`) |
| The restored pre-fix file is byte-identical to the pre-fix blob | **Verified** (blob id + SHA-256 + line count, §4.2) |
| The `--force` flag cannot make the guard write an empty file | **Inferred** from `scripts/pick_daily.py:568` (the only use of `args.force` is in that check) — corroborated by test 4/5, §4.4 |
| The guard cannot be reached with `target_day is None` | **Inferred** from `scripts/pick_daily.py:463-484` and `:522-535` (every branch sets `target_day`, and the `--newest-unpicked` branch returns at `:530` if there is nothing pending) — not exercised by a dedicated test |
| The whole `tests/scripts/test_pick_daily.py` file still passes against the fixed code | **Not run** — out of scope for this round (I ran only `::TestQuietDay`, the class the brief named; the R3 lane owns the full-suite run) |
| The full repository test suite (`pytest -q -m "not slow"`) is green | **Not run** — out of scope for this round; the two unrelated worktree modifications from other lanes (`src/arxiv_collector/cli.py`, `tests/arxiv_collector/test_sync_feed_health.py`) would make a full-suite result ambiguous |
| `ruff check` / `ruff format --check` on the changed files | **Not run** — out of scope for this round; the commit adds only a Python `if` block and test methods, and `ruff` was not installed for this review |
| The other lanes' uncommitted work does not change the behaviour under review | **Inferred** — `scripts/pick_daily.py` and `tests/scripts/test_pick_daily.py` are unmodified in the worktree (`git status --porcelain`), so the code I reviewed is exactly the committed code |

---

## 7. What I did and did not touch

**Written by me (the only file I own):**

* `D:\project\.swarm-lab\rounds\HT-R4.md` — this report.

**Scratch (not part of any repository, created for the revert probe):**

* `D:\project\.swarm-lab\r4-probe\` — a copy of `scripts/`, `src/`, `tests/`, `config/` and `pyproject.toml`
  with **no** `.git` entry, containing the restored **pre-fix** `scripts/pick_daily.py`
  (blob `4666e107cdb50f70b241e711cd1fbc91b33e655e`). It may be deleted by the next round; it is inert.

**Not touched (verified):**

* `D:\project\.swarm-lab\head_tree` — no file in the worktree was created, modified or deleted. `git status
  --porcelain` shows only the three other lanes' modifications (F4); `scripts/pick_daily.py` and
  `tests/scripts/test_pick_daily.py` are clean. No git write command (`add`, `commit`, `checkout`, `reset`,
  `stash`, `clean`) was run in the real tree — only `log`, `show`, `rev-parse`, `hash-object`, `status` and
  `diff --no-index`, all read-only. The `.pytest_cache` was suppressed and `PYTHONDONTWRITEBYTECODE=1` was
  set, so no test artefact was written into the worktree (the `__pycache__` directories that are present were
  created at 01:04–01:25 by earlier lanes; my run was at 01:39).
* `D:\project\reading-collector` (the parent repo), `D:\project\dsh-plugins`, the DSH profile — not touched.
* No network was used: `fetch_papers` is stubbed in every test and in my extra probe.
* No commit was made.

---

## 8. Verdict

**ACCEPT.** The guard is correctly placed — after the refuse-to-overwrite check
(`scripts/pick_daily.py:568-573`), before `output.parent.mkdir` (`:591`) — returns 0, and writes neither a
file nor a directory for an empty ranked list; the diff is 16 added lines and 0 removed lines in
`scripts/pick_daily.py` and additions only in the test file, with `MAX_PICKS_PER_DAY = 20` (`:70`), the
`--newest-unpicked` rule (`:522-535`) and every existing exit code untouched; and all six new tests
discriminate (6 failed against the reverted pre-fix script, 6 passed against the fix). Three non-blocking
notes are recorded: a misleading diagnostic in the zero-limit case (F1), an untested second behaviour change
in the same guard (F2), and a `cmd.exe` caret trap in the revert-probe recipe itself (F3).
