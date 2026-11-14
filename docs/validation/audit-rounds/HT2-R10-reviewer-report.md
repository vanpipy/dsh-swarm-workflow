# HT2-R10 — final review of branch `swarm/lab11` (Reviewer)

Worktree: `D:\project\.swarm-lab\head_tree2` (read-only for this review)
Base: `4525f25` · HEAD: `36beb18` · diff: 5 files, +1422/−13
Scratch (all mutations): `D:\project\.swarm-lab\proof-scratch\ht2-r10` (not a git repo)

---

## Requirement verdicts

A malformed daily number is refused - .swarm/requirements/pick-daily-profile.md:20 - met - scripts/pick_daily.py:200, scripts/pick_daily.py:583-587, scripts/pick_daily.py:162, tests/scripts/test_pick_daily_profile.py:218-223
The hard ceiling still wins - .swarm/requirements/pick-daily-profile.md:38 - met - scripts/pick_daily.py:92, scripts/pick_daily.py:165, scripts/pick_daily.py:430, tests/scripts/test_pick_daily_profile.py:255-273
The existing refusals survive - .swarm/requirements/pick-daily-profile.md:52 - met - scripts/pick_daily.py:571, scripts/pick_daily.py:576, scripts/pick_daily.py:579, scripts/pick_daily.py:593, scripts/pick_daily.py:706-711, tests/scripts/test_pick_daily_profile.py:291-455
The picker says which case it is - .swarm/requirements/pick-daily-feed-verdict.md:8 - met - scripts/pick_daily.py:609-612, scripts/pick_daily.py:626-631, scripts/pick_daily.py:648-651, tests/scripts/test_pick_daily_feed_verdict.py:219-222, tests/scripts/test_pick_daily_feed_verdict.py:277-281
A quiet feed is not a failure - .swarm/requirements/pick-daily-feed-verdict.md:25 - met - scripts/pick_daily.py:648-652, scripts/pick_daily.py:668, scripts/pick_daily.py:686, tests/scripts/test_pick_daily_feed_verdict.py:297-314, tests/scripts/test_pick_daily_feed_verdict.py:316-337
A broken feed still fails loudly - .swarm/requirements/pick-daily-feed-verdict.md:55 - met - scripts/pick_daily.py:609-613, scripts/pick_daily.py:626-632, tests/scripts/test_pick_daily_feed_verdict.py:436-454, tests/scripts/test_pick_daily_feed_verdict.py:503-527
The existing refusals survive - .swarm/requirements/pick-daily-feed-verdict.md:68 - met - scripts/pick_daily.py:291, scripts/pick_daily.py:293, scripts/pick_daily.py:706-711, tests/scripts/test_pick_daily_feed_verdict.py:545-627

Every verdict above is stated on the **behaviour** (which I ran and observed), not on the strength of the
branch's checks alone. Two of the seven checks are weaker than the behaviour they guard — findings F1 and F2.

---

## What each of the two checks showed

Mutants were applied to `scripts/pick_daily.py` **in the scratch copy only** and the relevant tests were run there.
"SURVIVED" = the mutant passes the whole test set, i.e. nothing decides that behaviour.

| Requirement | Discrimination (mutant → result) | Intent (code reading + a direct run) |
|---|---|---|
| A/1 malformed number refused | M1 message loses the literal `daily_limit` → **SURVIVED** (F1) · M1b also drops the profile path from the print → KILLED (3 failures) · M2 exit 2→1 → KILLED (3) · M2b drop the `return 2` → KILLED (3) | `scripts/pick_daily.py:179-201` refuses bool/None/non-int/non-integral-float/≤0; `:583-587` prints and returns 2 before any fetch. Ran it: exit 2, stdout `[pick_daily] taste profile …: daily_limit must be a positive integer, got 0`, no day file. |
| A/2 hard ceiling wins | M3 remove the clamp at `:165` → KILLED · M4 remove the cap sentence at `:430` → KILLED (clause test + 2 existing tests) | `MAX_PICKS_PER_DAY = 20` (`:92`), `daily_limit=min(limit, MAX_PICKS_PER_DAY)` (`:165`), the day file states the cap in force (`:430`). A profile asking 50 yields 20 and the file says "the daily cap is 20". |
| A/3 existing refusals survive | M5 drop the `not args.force` guard (`:706`) → KILLED · M6 ignore `--max` (`:593`) → KILLED · M7 the four bad-input `return 2` → `return 1` → KILLED (7 failures) | The five refusals keep their codes: overwrite-without-`--force` → 1, bad date / missing profile / missing feeds / no arxiv feeds → 2, `--max` honoured below the profile limit. |
| B/1 which case it is | M18 the **raise** branch prints the quiet wording → KILLED (3) · M8 the **production (health)** branch prints the quiet wording → **SURVIVED** (F2) · M8b M8 + drop the per-failure lines → KILLED | Production run with the transport stubbed: broken → "the feed could not be fetched — a broken source: 2 of 2 feed URL(s) failed:" + one line per URL, exit 1; empty → "the feed was fetched and is empty — it held no entries, so the day is quiet and there is nothing to pick", exit 0. The two messages differ and each names its cause. |
| B/2 quiet feed is not a failure | M9 quiet branch exit 0→1 → KILLED (4) · M10 drop "the day is quiet" → KILLED (2) · M7 (bad-input codes) → KILLED | `:644-652` prints the quiet wording and returns 0, writing no day file; the two other "nothing to pick" cases still exit 0 (`:668`, `:686`); broken stays 1 (`:613`, `:632`); bad input stays 2. |
| B/3 broken feed fails loudly | M11a raise branch exit 1→0 → KILLED (3) · M11b health branch exit 1→0 → KILLED · M12 drop the per-failure detail lines → KILLED · M8 (summary wording) → **SURVIVED** (F2, not a B/3 violation: source and reason are still named) | Exit 1 on both broken paths; the health path names each failing URL and its reason (`:626-631`); no day file is written. |
| B/4 existing refusals survive | M5 overwrite guard → KILLED · M13 `return scored[:limit]` → `scored` → KILLED (7) · M14 drop the already-picked filter (`:291`) → KILLED (3) · guard mutants: delete / `@pytest.mark.skip` / rename a named existing test → the branch's own guard test FAILS in each case | The cap, the no-re-pick rule and the overwrite refusal are unchanged; the guard tests (`test_pick_daily_profile.py:457-485`, `test_pick_daily_feed_verdict.py:629-643`) really decide. |

---

## Round-9 claims — confirmed, refuted, undecided

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | A/1 "prints a message that names daily_limit" is decided by nothing | **CONFIRMED** | Mutant M1 (message → "the daily number must be a positive integer, got {value!r}") passes all 75 tests in the scratch. Cause: `scripts/pick_daily.py:586` prints the profile **path**, and pytest's `tmp_path` is named after the test id `test_a_malformed_daily_limit_is_refused[zero]`, so the key leaks into stdout. M1b (also drop the path) is KILLED → the leak is the tmp_path. |
| 2 | B/1 "the two messages differ" is not decided for the collector-health path | **CONFIRMED, and stronger than claimed** | Mutant M8 (health branch prints the quiet wording) survives the **whole test set**: the scratch's full `tests/scripts` run with M8 applied = **242 passed in 392.13s**, identical to the unmutated worktree run (242 passed). `grep pick_daily` hits only the three `tests/scripts` files, so nothing else could have caught it. |
| 3 | 33 citations in the two clause test files are off by +2 | **CONFIRMED in direction, REFUTED in number and in the uniform offset** | 49 citation occurrences were resolved against the current files: **11** now point at a line that is no longer the requirement heading and **6** block ranges end 2 lines short. The offsets are not uniform: commit `36beb18` grew `pick-daily-profile.md` by 4 lines (2 in block A, 2 in block B) and `pick-daily-feed-verdict.md` by 2, so the profile's third heading moved +4 (`:48` → 52) and the feed's three headings moved +2 (`:23`→25, `:53`→55, `:66`→68). See F3. |
| 4 | Eight bare line pointers in the profile file's Decision paragraph do not resolve, and "a bad input is an error, not a quiet day" is not in AGENTS.md section 4 | **CONFIRMED** | All eight checked against HEAD: `:528-529`→bad date is at 570-571; `:533-534`→missing profile 575-576; `:536-537`→missing feeds 578-579; `:558-560`→no arxiv feeds 601-602; `:99-107`→`ProfileError` is 106-112; `:172-193`→`_daily_limit` is 179-201; `:155`→the read is 162; `:551-556`→the refusal is 581-587. `grep` over AGENTS.md finds "quiet" only at 147, 286, 321 — the sentence is nowhere in the file, and section 4 does not contain it. See F4. |
| 5 | The partial-failure path is shipped behaviour with no requirement block and no test | **CONFIRMED** | `scripts/pick_daily.py:634-642`: some URLs fail, some entries arrive → a `WARNING`, the run continues, exit 0, the day file is written. `grep WARNING` over `tests/` hits only `tests/arxiv_collector/test_cli_integration.py` (the collector's own CLI); `grep` over `.swarm/requirements/` hits nothing. See F5. |
| 6 | No existing test was edited, skipped, xfailed or deleted; the existing suite file is byte-identical to the base | **CONFIRMED** | `git diff --stat 4525f25..HEAD` lists 5 paths, none of them an existing test file; `tests/scripts/test_pick_daily.py` SHA256 `5FDD653D…19ACD` is identical to the base copy. The guard tests also decide (deleting / skipping / renaming a named existing test makes them fail). |

---

## Coverage gaps

- **No requirement lacks a test.** All seven have dedicated clause tests
  (`tests/scripts/test_pick_daily_profile.py`, 12 tests; `tests/scripts/test_pick_daily_feed_verdict.py`, 16 tests).
- **Tests that do not decide their requirement:**
  - `tests/scripts/test_pick_daily_profile.py:220` — the A/1 "names `daily_limit`" assertion (F1).
  - `tests/scripts/test_pick_daily_feed_verdict.py:199-281` — B/1 decides the *raise* path only; the path
    production actually runs is undecided (F2).
  - `tests/scripts/test_pick_daily_feed_verdict.py:503-527` — B/3 decides the exit code, the source and the
    reason, but not the summary wording (M8 survives).
- **Shipped behaviour with no requirement and no test:** the partial-failure path (F5).

---

## Findings

**F1 — Material.** `tests/scripts/test_pick_daily_profile.py:220` (`assert "daily_limit" in out`) does not
discriminate. The refusal prints the profile path (`scripts/pick_daily.py:586`) and pytest's `tmp_path` is named
after the test id, so the key is in the output even when the message no longer names it (mutant M1 survives).
The behaviour is correct today — the message itself names the key (`scripts/pick_daily.py:200`) — but a future
edit could drop it and the suite would stay green. Smallest fix: assert on the message text
(`"daily_limit must be a positive integer" in out`), or strip the profile path before asserting.

**F2 — Material.** The production broken-feed branch `scripts/pick_daily.py:626-629` is not decided by any test.
Mutant M8 (that branch prints the quiet-feed wording) survives the whole test set — 242 passed with the mutant
in place, the same count as without it. The B/1 tests stub a fetch that *raises* (`:215`), but the collector
absorbs `httpx.HTTPError` first (`src/arxiv_collector/collector.py:148-152`) and reports it through the health
report, so production runs `:621-632`, not `:604-613`. The shipped behaviour is correct (verified: the two
production messages differ and each names its cause), but a regression that made a broken feed say "the day is
quiet" in production would pass every test. Fix: assert `"could not be fetched" in out` in
`test_a_feed_the_collector_could_not_read_exits_one`, or add a test that stubs `fetch_papers` with a
`FeedHealth` carrying failures and checks the two messages apart.

**F3 — Minor (documentation).** The citations in the two clause test files point at requirement lines that
moved in `36beb18`. 11 occurrences no longer land on the heading and 6 ranges end 2 lines short:
`test_pick_daily_profile.py:18,23,59,234,246,284,298,325,352,379,407,435,458,476` and
`test_pick_daily_feed_verdict.py:18,24,29,292,304,324,346,370,394,431,443,464,487,511,538,552,579,610,630`.
Each clause test names the requirement it covers in prose, so the coverage is still traceable; only the line
numbers are wrong.

**F4 — Minor (documentation).** The Decision paragraph of `.swarm/requirements/pick-daily-profile.md:8-18`
carries eight bare line pointers, none of which resolves against HEAD (details in the table above). The text
does say the first four are the survey's pre-change numbers, but the four "the implementation now lives at…"
pointers are presented as current and are not. Separately, the A/1 source at
`.swarm/requirements/pick-daily-profile.md:36` attributes "a bad input is an error, not a quiet day" to
AGENTS.md section 4; that sentence does not exist in AGENTS.md. The nearest true statement is
`AGENTS.md:286` ("a quiet morning, not a failure"), which is in section 3 — and it is the *opposite* gloss.
(The feed file's AGENTS.md pointers are correct: section 3 at `AGENTS.md:286`.)

**F5 — Medium (traceability).** The partial-failure path `scripts/pick_daily.py:634-642` ships behaviour that
neither requirements file governs and no test covers (F5 details in the claims table). Its verdict is
undecidable by construction: B/3 says "when the feed could not be fetched, the picker exits 1", and here some
feed URLs could not be fetched yet the picker exits 0 and writes the day file. The code mirrors the
collector's own verdict (comment at `:635-637`), but the requirements file is silent, so I cannot judge the
behaviour against it.

**F6 — Info.** `scripts/pick_daily.py:604-613` (the `except httpx.HTTPError` branch) is not the branch
production runs for a feed that could not be fetched — the collector catches the error first
(`src/arxiv_collector/collector.py:148-152`). It is a harmless safety net, but it is the branch the B/1 tests
cover, which is the root of F2.

---

## Weakened-check sweep (`git diff 4525f25..HEAD -- tests/`)

- The branch adds **two new test files** (`test_pick_daily_profile.py` +485, `test_pick_daily_feed_verdict.py`
  +643) and **edits no existing test file**. `git diff --stat 4525f25..HEAD` lists exactly five paths: the two
  requirements files, `scripts/pick_daily.py`, and the two new test files.
- `tests/scripts/test_pick_daily.py` is byte-identical to the base commit (SHA256 `5FDD653DE2724464089A88E0A1846CD9F173790221B7D1BBE0D29140DC419ACD`).
- No deleted, skipped, xfailed, renamed or loosened check; no threshold was lowered; no requirement heading was
  renamed. The new assertions are at least as strong as the behaviour they replace (e.g. `test_pick_daily_profile.py:271-273`
  asserts both "the daily cap is 20" and the absence of "the daily cap is 50").
- The branch's own guard is not a rubber stamp: deleting, `@pytest.mark.skip`-ing or renaming
  `test_a_bad_date_is_rejected` in `tests/scripts/test_pick_daily.py` makes
  `test_pick_daily_profile.py::TestExistingRefusalsSurvive::test_the_named_existing_tests_are_present_and_not_skipped`
  and `::test_no_existing_test_is_marked_skip_or_xfail` fail (all three verified).
- The only weakened *checks* on the branch are the two assertions behind F1 and F2 — both new, not edits.

---

## Tree state

- `git status --porcelain -uall` → empty. HEAD = `36beb183e5111a9c2981bced24018b5d178b6f10`.
- Ignored artefacts in the worktree: `.pytest_cache/` (creation 2026-11-07 12:48:45, i.e. **before** this review
  began at 13:56 — pre-existing, and every pytest run I made used `-p no:cacheprovider` with
  `PYTHONDONTWRITEBYTECODE=1`, so I neither created nor updated it) and `nav.yml` (gitignored, pre-existing).
  No `__pycache__`, no `.ruff_cache`.
- No file outside the branch's five changed paths; no file owned by another lane; nothing stray inside the repo.
- The worktree was never written to: every mutation happened in `D:\project\.swarm-lab\proof-scratch\ht2-r10`,
  which is not a git repository (`git rev-parse --show-toplevel` there → "fatal: not a git repository") and
  whose `scripts/pick_daily.py` and `tests/scripts/test_pick_daily.py` hash-identical to the worktree's.

---

## Acceptance verdict

**Accepted on the requirement verdicts** — none of the seven requirements is "not met" or "not demonstrated",
and each verdict is backed by a run, not by reading alone. Nothing in the brief's gate blocks acceptance.

**Two conditions I would put on the Coordinator's ledger row** (neither fails a requirement verdict):

1. F1 and F2 are *check* weaknesses, not behaviour failures. The behaviour is right in both cases and I verified
   it directly. But the suite would not catch a regression in either one, so I recommend the branch either
   fixes the two assertions (both are one-line changes) or the Coordinator records an explicit waiver with a
   reason. Round 9 called both "Material"; I agree with that severity for the checks.
2. F5 (the ungovoured, untested partial-failure path) is a traceability gap in the **requirements files**, not
   in the code. It needs either a requirement block or an explicit "out of scope" note; I cannot judge that
   behaviour against a file that is silent about it.

---

## Assumptions

- The two requirements files **as they stand at HEAD** are the authority; I judged B/2 against the file's
  recorded decision (exit 0), not against the disputed brief text.
- The scratch copy is faithful to the worktree: 824 files copied file-for-file (plus `.github/`, needed by
  `tests/site/test_deploy_workflow.py`), no `.git`; `scripts/pick_daily.py` and `tests/scripts/test_pick_daily.py`
  hash-identical to the worktree's; the scratch's unmutated `tests/scripts` run gives the same 242 tests as the
  worktree's, so the M8 result transfers.
- "The whole worktree test set" is read as the repository's pytest suite minus the `slow`-marked site tests
  (24 deselected; they need a built site and touch no picker behaviour).
- `ruff` was run with `--no-cache`, so it wrote nothing into the worktree.

---

## What I ran and what I did not run

**Verified (ran, saw the result):**

- `pytest -q -p no:cacheprovider tests\scripts` in the worktree → **242 passed** in 490.20s.
- `pytest -q -p no:cacheprovider -m "not slow"` in the worktree (full suite) → **463 passed, 24 deselected**
  in 715.97s.
- The two clause files alone → **28 passed** (12 + 16).
- **19 source mutants** in the scratch (M1, M1b, M2, M2b, M3, M4, M5, M6, M7, M8, M8b, M9, M10, M11a, M11b, M12,
  M13, M14, M18) and **3 guard mutants** (delete / skip / rename an existing named test).
- The scratch's **full `tests/scripts` suite with M8 applied → 242 passed** (the strongest form of claim 2).
- Three **production-path observations** with `httpx.Client.get` stubbed (no network): broken feed, empty feed,
  malformed profile — exit codes, stdout, and the health report printed.
- `ruff check --no-cache scripts/pick_daily.py tests\scripts` → **All checks passed**.
- `git log/diff --stat/diff/status`, the commit `36beb18` diff, a citation resolver over both requirement files
  (49 occurrences), and `grep` sweeps over `AGENTS.md`, `tests/` and `.swarm/requirements/`.

**Inferred (read, not run):**

- That `scripts/pick_daily.py:604-613` is unreachable for feed failures — supported by
  `src/arxiv_collector/collector.py:148-152` plus the stubbed-transport run (no exception escaped `fetch_papers`).
- That the nightly job chain (another session) will need to learn the new exit codes — stated in
  `pick-daily-feed-verdict.md:48-49`; that chain is not in this repository.

**Not run:**

- The `slow`-marked site tests (24 deselected) and the mkdocs strict build: the branch changes no build input,
  and they need a built site.
- Any network access. The real arXiv feeds were never contacted; every fetch was stubbed.
- The picker's behaviour against a live feed, and the nightly job chain's handling of the exit codes.
