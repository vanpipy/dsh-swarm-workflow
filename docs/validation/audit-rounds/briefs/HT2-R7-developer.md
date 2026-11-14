# HT2-R7 - implement the recorded decision, plus what the reviewers reported as not met

Role: Developer (skill section 3). Load the `swarm-engineering` skill before the work.

## The authority is a file

`D:\project\.swarm-lab\head_tree2\.swarm\requirements\pick-daily-feed-verdict.md` is the
authority for this work item. It was changed by the Coordinator after the reader decided
the disputed exit code - the block "A quiet feed is not a failure" now carries the
decision, its reason and its date. Read the file; do not work from a copy of the old
text.

## What you own

`D:\project\.swarm-lab\head_tree2\scripts\pick_daily.py` only.

## What is not yours

- `tests/scripts/**` - the Tester owns the clause files.
- `.swarm/requirements/**` - the Coordinator owns them.
- `src/arxiv_collector/**` - read only.
- `tests/scripts/test_pick_daily.py` and `tests/scripts/test_pick_daily_profile.py` -
  never edit, skip, xfail or delete anything in them.

## What to implement

1. The recorded decision: the quiet feed - fetched fine, holding no entries - exits 0
   (it is currently `return 1` at scripts/pick_daily.py:651), and the module docstring's
   exit-code list says so (the "Exit codes" section near the top of the file). Keep the
   message and the "no day file" behaviour as they are. Do not change any other exit
   code: a broken feed stays 1, bad input stays 2.
2. Whatever the Reviewer reported as not met or not demonstrated, with its evidence -
   the Reviewer's report is the second part of this brief (it is handed to you with
   the assignment; if you do not have it, ask for it before you change anything).

## The constraints that shaped the decision

- The change must be small: the quiet branch returns a different number and the
  docstring says so. Do not restructure the function.
- The existing test suite must keep passing unchanged, and the network must never be
  touched.
- Do not write a test: the Tester owns the clause file for this work item.

## Constraints

Never deploy, never push, never commit (the Coordinator commits per lane). Never weaken
a test. Write only in scripts/pick_daily.py. Report honestly: Verified / Inferred / Not
run. Format only the file you touched.

## Toolchain

    $env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
    $env:PYTHONPATH = "D:\project\.swarm-lab\head_tree2\src;D:\project\.venv-win\Lib\site-packages"
    $env:PYTHONDONTWRITEBYTECODE = "1"
    Set-Location D:\project\.swarm-lab\head_tree2
    C:\Python312\python.exe -m pytest -q -p no:cacheprovider tests\scripts
    D:\project\.venv-win\Scripts\ruff.exe check --no-cache scripts\pick_daily.py
    D:\project\.venv-win\Scripts\ruff.exe format --check --no-cache scripts\pick_daily.py

Get-Content needs `-Encoding UTF8`; no `uv` and no venv inside the worktree; no network.

## Acceptance

The quiet feed exits 0 with the message it has today and writes no day file; a broken
feed still exits 1 and names the source and the reason; bad input still exits 2; the
existing suite passes unchanged; ruff clean; `git status --short` shows only
scripts/pick_daily.py.

## The report

What you changed, each change with its file:line. Then the requirement it satisfies, by
heading and by the `file:line` of that requirement's block in the requirements file.
Then the Reviewer's findings you did not implement, and why. Then what you ran and what
you did not run. Keep it short.
