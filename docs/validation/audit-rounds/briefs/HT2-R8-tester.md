# HT2-R8 - the requirement-clause test file for work item B (the picker's feed verdict)

Role: Tester (skill section 4). Load the `swarm-engineering` skill before the work.

## The authority is a file

`D:\project\.swarm-lab\head_tree2\.swarm\requirements\pick-daily-feed-verdict.md` is the
authority for this work item. It holds four requirement blocks, each with the
requirement, an observable check and a source:

- "The picker says which case it is"
- "A quiet feed is not a failure"
- "A broken feed still fails loudly"
- "The existing refusals survive"

Read that file. It is where the requirement text comes from - this brief deliberately
does not repeat it. If the file and this brief disagree, report the conflict and stop
that requirement (skill section 17); do not pick a winner.

Two facts about the state of the work, so you test what the file actually says:

- The block "A quiet feed is not a failure" carries a DECISION paragraph (the reader's,
  dated 2026-11-07): a fetched-but-empty feed exits 0 and writes no day file. The
  implementation already does this (commit 43e15b5, `scripts/pick_daily.py:652`), and a
  broken feed still exits 1. Test what the file says, not what the code happens to do -
  if they disagree, that disagreement is a finding.
- The block "The existing refusals survive" states that the checks live in their own
  test file (that is your file). That half is unmet until you write it.

## What you own

- `D:\project\.swarm-lab\head_tree2\tests\scripts\test_pick_daily_feed_verdict.py` -
  create it.

## What is not yours

- `tests/scripts/test_pick_daily.py` - the existing suite. Never edit, skip, xfail or
  delete anything in it.
- `tests/scripts/test_pick_daily_profile.py` - the other work item's clause file. Do
  not edit it; if a change breaks it, that is a finding for your report.
- `scripts/pick_daily.py` - the Developer's file. Read only. You do not mutate
  production code.
- `.swarm/requirements/**` - the Coordinator owns them.

## What to do

Derive the test conditions from the requirements file: one test per condition, each
test citing the requirement it covers - the heading and the `file:line` of that
requirement's block. A requirement with no test is a REPORTED COVERAGE GAP, never a
silent pass. Report each condition as passed, failed, blocked or not tested, and say
which requirement it covers.

The two checks are not yours - the Reviewer runs them. You write the conditions; you
do not mutate production code. The network is never touched: the feed fetch is
stubbed, the way the existing suite stubs it (see
`tests/scripts/test_pick_daily.py:475` and `:796` - the existing suite stubs
`pick_daily.fetch_papers` with a lambda that returns a list; do the same, and keep
the existing suite's behaviour unchanged).

A hint, not a source of truth: the R5 Reviewer left a working harness OUTSIDE the
repository at `D:\project\.swarm-lab\proof-scratch\ht2-r5` (a scratch copy of the
picker, its checks and its report). You may read it to see how a health-carrying stub
has to be built, but you may not copy from it blindly: it was written for a different
question, and your tests must follow the requirements file. Write your own file in the
repository.

Report each requirement as covered or as a gap, with the test name and the
`file:line` of the requirement it covers.

## Constraints

Never deploy, never push, never commit (the Coordinator commits per lane). Never
weaken or delete a test. No network. Report honestly (Verified / Inferred / Not run).
Format only the files you touched. CI runs pytest only, so run ruff yourself. Leave
no `__pycache__`, `.pyc`, `.pytest_cache` or `.ruff_cache` inside the repository.

## Toolchain

    $env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
    $env:PYTHONPATH = "D:\project\.swarm-lab\head_tree2\src;D:\project\.venv-win\Lib\site-packages"
    $env:PYTHONDONTWRITEBYTECODE = "1"
    Set-Location D:\project\.swarm-lab\head_tree2
    C:\Python312\python.exe -m pytest -q -p no:cacheprovider tests\scripts
    D:\project\.venv-win\Scripts\ruff.exe check --no-cache tests\scripts\test_pick_daily_feed_verdict.py
    D:\project\.venv-win\Scripts\ruff.exe format --check --no-cache tests\scripts\test_pick_daily_feed_verdict.py

Get-Content needs `-Encoding UTF8`; no `uv` and no venv inside the worktree.

## Acceptance

The new test file exists; every requirement in the file is either covered by at least
one test or reported as a gap; each test names the requirement it covers; the existing
test files are untouched; the new file's tests pass against the current
implementation; ruff clean; `git status --short` shows only the new file.

## The report

The requirement you covered, the test name, the `file:line` of the requirement it
covers, and the result (passed / failed / blocked / not tested). Then the coverage
gaps. Then what you ran (command and output) and what you did not run. Keep it short.
