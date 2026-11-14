# R5 Reviewer report — the picker's feed verdict

**Lane:** Reviewer (R5) · **Work item:** pick-daily-feed-verdict
**Code under review:** commit `e02e69a` "feat(pick): tell a quiet morning from a broken feed" on `swarm/lab11`, `scripts/pick_daily.py` only, +83/−8 against base `4525f25`.
**Authority:** `.swarm/requirements/pick-daily-feed-verdict.md`.

> **The authority file changed during this review.** Commit `a45ca46` ("docs(swarm): the reader decided the quiet-feed exit code - 0", 2026-11-07 12:09:28) landed at HEAD while I was running the checks. The requirements file is now 77 lines and **"A quiet feed is not a failure" requires exit 0**, not the exit 2 the file said when the Developer's lane was briefed. Every verdict below is judged against the file **as it stands at HEAD `a45ca46`**. The product question is settled by the reader; the code does not yet follow it.

## Requirement verdicts

The picker says which case it is - .swarm/requirements/pick-daily-feed-verdict.md:8 - met - scripts/pick_daily.py:604-613 (fetch raised: "the feed could not be fetched — a broken source: {error} (feeds: …)", exit 1), scripts/pick_daily.py:621-632 (health reports failures: "a broken source: N of M feed URL(s) failed:" plus the per-URL reason lines, exit 1), scripts/pick_daily.py:644-650 (quiet feed: "the feed was fetched and is empty — it held no entries, so the day is quiet and there is nothing to pick"); the two messages differ and each names its cause, and a partly broken feed warns and continues (scripts/pick_daily.py:634-642, the collector's own convention at src/arxiv_collector/cli.py:181-182)

A quiet feed is not a failure - .swarm/requirements/pick-daily-feed-verdict.md:23 - not met - scripts/pick_daily.py:651 returns **1** where the requirement (and the reader's decision of 2026-11-07, requirements file :35-47) requires **0**; the message and the "writes no day file" half are met (scripts/pick_daily.py:644-650, no write on that path)

A broken feed still fails loudly - .swarm/requirements/pick-daily-feed-verdict.md:53 - met - scripts/pick_daily.py:613 and :632 return 1; scripts/pick_daily.py:606-611 names the feed URLs and the reason ("request failed: connection refused"), scripts/pick_daily.py:627-631 names the source URL and its reason from the health report; the format mirrors the collector's broken-source report (src/arxiv_collector/cli.py:288, :302-306); no day file is written on either path

The existing refusals survive - .swarm/requirements/pick-daily-feed-verdict.md:66 - met - scripts/pick_daily.py:705-710 refuses to overwrite an existing day file without `--force` (exit 1); the cap is still clamped (scripts/pick_daily.py:593 — `limit = daily_limit if args.max is None else max(0, min(args.max, daily_limit))`); earlier days' papers are still skipped (scripts/pick_daily.py:687-689); `git show e02e69a --stat` touched **one file, `scripts/pick_daily.py`** — no test was edited, skipped, xfailed or deleted, and the existing suite is green (226 passed). The block's **second check sentence** ("the tests for this work item live in their own file and each one cites the requirement it covers") is **unmet** — see Coverage gaps.

## Coverage gaps

1. **R1, R2, R3 have no test in the worktree at all.** `tests/scripts/test_pick_daily_feed_verdict.py` does not exist, and `e02e69a` added no test file (1 file changed). The only checks that exist for this work item are mine, in the scratch (`D:\project\.swarm-lab\proof-scratch\ht2-r5\tests\scripts\test_r5_review_checks.py`), outside the repository.
2. **The branch the whole work item is about is never executed by the repository's own suite.** The suite's helper stubs the fetch with a plain list (`tests/scripts/test_pick_daily.py:475`, and the same pattern at :796) and no stub ever returns an empty list, so `if not papers:` (scripts/pick_daily.py:644-651) and the health branches (scripts/pick_daily.py:621-642) are dead code as far as `tests/scripts` is concerned. `getattr(papers, "health", None)` (scripts/pick_daily.py:618-619) therefore always yields `None` in the repo's tests.
3. **R4's check, second sentence, is unmet** — the work item's own test file does not exist. R4's *requirement text* is met; the *check* cannot be fully satisfied until the file exists.

## Findings

| # | Severity | Finding | Evidence |
|---|---|---|---|
| 1 | **HIGH — blocks acceptance** | The quiet-feed path exits 1; the requirement requires 0. The reader decided 0 on 2026-11-07 and the file records it; the code still returns today's number. | scripts/pick_daily.py:651; requirements :23-51 (decision :35-47) |
| 2 | **MEDIUM** | The module docstring's exit-code list is self-contradictory and will be wrong the moment the fix lands: `0` covers "a quiet morning" while `1` still lists "the feed held no entries". The commit introduced the contradiction (it rewrote the exit-1 bullet). | scripts/pick_daily.py:44-45 vs :46-48; `git show e02e69a` hunk at the docstring |
| 3 | **MEDIUM** | Zero repository coverage of the new behaviour — no test file, and the existing suite cannot reach the new branches. A later change to `fetch_papers` could silently restore the old "no papers" wording or the old exit code with nothing failing. | `git show e02e69a --stat`; tests/scripts/test_pick_daily.py:475, :796 |
| 4 | **LOW (informational)** | The reader's decision records a cost: a chain that reads only the code cannot tell "picked 20 papers" from "the feed was empty". Inside this repository nothing reads the picker's exit code — the only references to the script are the commands in AGENTS.md:253-276 and the generated day files — so the change is contained here; the nightly job chain lives elsewhere and must learn the codes. | grep for `pick_daily` over *.md; src/arxiv_collector/cli.py:48-52 for the collector's own (different) convention |
| 5 | **LOW (informational)** | `fetch_papers` returns `FetchedPapers()` with `health=None` when the URL list is empty. Unreachable from `main()`, which exits 2 first on "no arxiv feeds" — harmless, but the `health is None` path is also what keeps the old plain-list stubs working. | scripts/pick_daily.py:334-335, :602, :618-619 |

## The two checks

### Discrimination — would each check fail if the behaviour were wrong?

Yes, for every requirement. Each mutation was applied to the scratch copy of `scripts/pick_daily.py`, the relevant checks were re-run, and the pristine file was restored afterwards (verified: "pristine copy restored: True"). Harness: `D:\project\.swarm-lab\proof-scratch\ht2-r5\_r5_discriminate.py`.

| Mutation | Result | Which checks failed |
|---|---|---|
| R1-a: quiet feed reverts to the old "no papers" wording | **FAILED** (2) | `test_an_empty_feed_says_the_feed_held_no_entries`, `test_the_two_messages_differ_and_name_different_causes` |
| R1-b: broken feed speaks the same words as the quiet feed | **FAILED** (2) | `test_a_failed_fetch_via_the_health_report_names_source_and_reason`, `test_the_two_messages_differ_and_name_different_causes` |
| R2-control: quiet feed exits **0** (exactly what the requirement asks) | **PASSED** (5/5) | none — the whole R2 class passes when the behaviour matches the requirement |
| R2-a: quiet feed writes a day file anyway | **FAILED** (3) | `test_a_quiet_feed_writes_no_day_file`, plus the two exit-code checks |
| R2-b: quiet feed message loses "held no entries" | **FAILED** (3) | `test_a_quiet_feed_says_the_feed_was_empty_and_the_day_is_quiet`, plus the two exit-code checks |
| R3-a: broken feed exits 0 | **FAILED** (1) | `test_a_failed_fetch_via_the_health_report_exits_1_and_names_both` |
| R3-b: broken feed drops the source and the reason | **FAILED** (1) | `test_a_failed_fetch_names_the_source_and_the_reason` |
| R4-a: the overwrite refusal is removed | **FAILED** (1) **and the existing suite broke** (1 failed / 46 passed) | my `test_an_existing_day_file_is_not_overwritten_without_force` + `tests/scripts/test_pick_daily.py::TestMain::test_existing_file_is_not_overwritten` |
| R4-b: the cap can be raised with `--max` | **FAILED** (1) **and the existing suite broke** (2 failed / 45 passed) | my `test_the_cap_is_never_exceeded` + `TestMain::test_max_above_the_cap_is_clamped`, `TestMain::test_max_above_the_profile_limit_is_clamped_to_it` |

The R2-control is the load-bearing one: the R2 checks are satisfiable by the required behaviour, so the failure they report against today's code is the code's, not the check's.

### Intent — is the behaviour the one the requirement asked for?

- **R1** — the requirement's words: "tells a feed that could not be fetched apart from a feed that was fetched and holds no entries… The two messages differ and each names the cause." The code does exactly that: a broken feed prints "could not be fetched — a broken source" with the URL and the reason (scripts/pick_daily.py:604-613, :621-632); a quiet feed prints "the feed was fetched and is empty — it held no entries" (scripts/pick_daily.py:644-650). The wording deliberately parallels the collector's own empty-feed reason, "the feed was fetched successfully but contained no entries" (src/arxiv_collector/cli.py:339). **Matched.**
- **R2** — the requirement's words: "the picker exits 0 … and says that the day is quiet. A broken feed stays exit 1 and bad input stays exit 2, so every case the caller can meet keeps its own code." The code matches three of the four parts: the message says the day is quiet ✓, a broken feed stays 1 ✓ (scripts/pick_daily.py:613, :632), bad input stays 2 ✓ (scripts/pick_daily.py:571, :576, :579, :587, :602) — and the picker's own two "nothing new to pick" cases do exit 0 (scripts/pick_daily.py:667, :685), exactly as the decision cites. The quiet feed's own code is the one that does not match: 1 where the file says 0 (scripts/pick_daily.py:651). **Not matched on the exit code only.**
- **R3** — the requirement's words: "exits 1 — a real failure — and names the source and the reason, the way the collector reports a broken source." The code exits 1 on both broken paths, names the source (the feed URL) and the reason (the exception text from the health report, e.g. "http://…/cs.AI: request failed: connection refused", src/arxiv_collector/collector.py:138-162), and formats the report like the collector's ("N of M feed URL(s) failed" with the failures listed, src/arxiv_collector/cli.py:302-306). **Matched.**
- **R4** — the requirement's words: the picker "still refuses to overwrite an existing day file without --force, never re-picks a paper an earlier day recorded, and never exceeds the cap", and those tests are "not edited, skipped, xfailed or deleted". The refusals are intact and the commit touched no test file; the guard added by the previous round (`tests/scripts/test_pick_daily_profile.py`, which fails on any skip/xfail mark in the existing suite) passes. **Matched for the requirement text; the check's "own file" sentence is not.**

## Acceptance verdict

**BLOCKED.**

- **R2 is not met** (finding 1). The gate says a requirement that is not met blocks acceptance until it is checked or waived. This one does not need a waiver: the reader has decided, and the decision is recorded in the authority file. The minimal fix is in the Developer lane's hands — `return 1` → `return 0` at scripts/pick_daily.py:651, and the exit-1 bullet in the docstring must lose "the feed held no entries" (scripts/pick_daily.py:46-48) so the script stops documenting the old code. I did not apply it: I own nothing in the worktree.
- **The coverage gaps block the rest.** R1, R2 and R3 have no test in the repository, and R4's check requires this work item's tests to live in their own file. Until `tests/scripts/test_pick_daily_feed_verdict.py` exists and cites the requirement each test covers, the block's check cannot be satisfied and a later edit could silently undo the whole change.

## Assumptions

- I judged the four requirement blocks against the file **at HEAD `a45ca46`**, not against the version the Developer's lane was briefed against; the reader's decision is part of the authority, so the verdict follows the file as it stands.
- "Met" for R4 means the requirement text; the unmet sentence of its check is reported as a coverage gap rather than folded into the verdict, because it is about test placement, not about behaviour.
- The two "nothing new to pick" exits at scripts/pick_daily.py:667 and :685 are what the decision calls the picker's own precedent; I verified the line numbers and the `return 0` at both.
- The `_run` helper in my harness drives `main()` in-process with the fetch stubbed, so exit codes are the script's real return values — but the process-level exit status of `python scripts/pick_daily.py` was not exercised (no network, and the repo's own suite drives `main()` the same way).

## What I ran, and what I did not

**Verified (ran it, saw the result):**
- `C:\Python312\python.exe -m pytest -q -p no:cacheprovider tests\scripts` in the worktree at HEAD `a45ca46` → **226 passed in 231.34s** (the same at `e02e69a`: 226 passed in 210.01s). `git status --porcelain` empty after both runs — the worktree is clean and I wrote nothing into it.
- `D:\project\.venv-win\Scripts\ruff.exe check --no-cache scripts\pick_daily.py` → **All checks passed!**
- My review harness on the pristine scratch copy → **2 failed, 15 passed**: `test_a_quiet_feed_exits_0` ("the picker exited 1, the requirement says 0") and `test_every_case_the_caller_can_meet_keeps_its_own_code` (`assert (1, 1, 2) == (0, 1, 2)`). Every other check passes.
- The nine mutations of the discrimination harness (table above), with the pristine file restored afterwards.
- `git show e02e69a` (full diff of the commit under review), `git show a45ca46` (the decision commit, requirements file only), `git log`, `git status` in the worktree; `grep` over the repository for `pick_daily` in markdown and for `return 0|1|2` in `scripts/pick_daily.py`.

**Not run:**
- The picker against a real feed, and any network access at all — every fetch was stubbed, as the requirement's check demands ("The network is never touched").
- The rest of the repository's suite (`tests/arxiv_collector`, `tests/site`) and the `mkdocs build --strict` — outside this lane's scope; the commit changes no site input.
- The nightly job chain that consumes the picker's exit code — it lives in another session (the decision's recorded cost).
- Any fix: I own nothing in the worktree, so the exit-code change and the test file are left to the Developer lane.

**Scratch (mine, writable):** `D:\project\.swarm-lab\proof-scratch\ht2-r5` — a `git archive` copy of the worktree **without** `.git` (verified: `Test-Path .git` = False), plus `_r5_discriminate.py`, `_pick_daily.pristine.py` and `tests/scripts/test_r5_review_checks.py`.
