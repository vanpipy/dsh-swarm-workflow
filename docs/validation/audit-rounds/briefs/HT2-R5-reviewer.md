# HT2-R5 - the Reviewer lane for work item B (the picker's feed verdict)

Role: Reviewer (skill section 5). Load the `swarm-engineering` skill before the work.
Section 16 binds you: one verdict per requirement with its evidence.

## The authority is a file

`D:\project\.swarm-lab\head_tree2\.swarm\requirements\pick-daily-feed-verdict.md` is the
authority for this work item. It defines four requirements, each a block with the
requirement, an observable check and a source:

- "The picker says which case it is" (the block at :8-21)
- "A quiet feed is not a failure" (the block at :23-37)
- "A broken feed still fails loudly" (the block at :39-50)
- "The existing refusals survive" (the block at :52-63)

Read that file. It is where the requirement text comes from.

## What was built

The Developer's lane for this work item changed `scripts/pick_daily.py` only. Read the
current file and `git diff` against the branch base to see exactly what changed.

## What you own

Nothing in the worktree. You are read-only there.

## The seams to check

- `scripts/pick_daily.py` - the implementation the Developer changed.
- `src/arxiv_collector/base.py:29-56` - `FeedHealth` with `urls`, `items`, `failures`,
  `.empty` and `.failed`; `BaseCollector.feed_health()` at :87. This is where the
  difference between "fetched but empty" and "could not be fetched" already lives.
- `tests/scripts/test_pick_daily.py:475` and `:796` - the existing suite stubs
  `fetch_papers` with a lambda that returns a list, and no existing test drives an
  empty feed. The existing suite must keep passing unchanged and must never reach the
  network. If the Developer's change makes the picker call the collector's health
  lookup on a path the existing tests drive, the existing tests would reach the
  network - that is a finding.
- `tests/scripts/test_pick_daily_profile.py` - the previous round's requirement-clause
  file for work item A. It is not this round's subject, but a change that breaks it is
  a finding.

## What to do

For each of the four requirements decide a verdict - met, not met, not demonstrated,
or not in scope - with evidence. A verdict without evidence is not demonstrated, never
met. Cite the requirement as `<file>:<line>` and the evidence as `file:line`.

Run both checks for every requirement you judge:

- discrimination: would the check fail if the behaviour were wrong? Mutate the
  behaviour in a scratch copy and show the requirement's check failing. Copy the code
  to `D:\project\.swarm-lab\proof-scratch\ht2-r5` WITHOUT the `.git` entry - in this
  worktree `.git` is a FILE pointing at the parent repository's worktree metadata, so a
  copy carrying it would make git operate on the real worktree.
- intent: is the behaviour the one the requirement asked for? Read the requirement's
  own words and the code's behaviour, not the Developer's description of it.

One requirement is expected to be disputed: the Developer's brief and the requirements
file disagree about the exit code for the quiet-feed case. Judge the requirement as
the FILE states it. If the code does not do what the file says, the verdict is "not
met" and the acceptance is blocked - report the block plainly, with the evidence, and
do not decide the product question yourself. A requirement the Developer reported as
conflicted and stopped is judged on the evidence: if the code does not meet the
requirement as the file states it, the verdict is "not met"; if the requirement cannot
be judged from the evidence you have, the verdict is "not demonstrated". Both block
acceptance.

Apply the acceptance gate: a requirement that is not met or not demonstrated blocks
acceptance until it is checked, or until the Coordinator records an explicit waiver
with a reason in the ledger row.

Also judge the coverage: a requirement with no test is a reported coverage gap. Say
which requirements have no test in the worktree today.

## Constraints

Never deploy, never push, never commit, never write inside the worktree. No network.
Write only inside `D:\project\.swarm-lab\proof-scratch\ht2-r5`. Report honestly:
Verified (you ran it and saw the result), Inferred (you read the code and believe it),
Not run (out of scope or blocked).

## Toolchain

    $env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
    $env:PYTHONPATH = "D:\project\.swarm-lab\head_tree2\src;D:\project\.venv-win\Lib\site-packages"
    $env:PYTHONDONTWRITEBYTECODE = "1"
    Set-Location D:\project\.swarm-lab\head_tree2
    C:\Python312\python.exe -m pytest -q -p no:cacheprovider tests\scripts
    D:\project\.venv-win\Scripts\ruff.exe check --no-cache scripts\pick_daily.py

`git` is not on PATH by default; Get-Content needs `-Encoding UTF8`; no `uv` and no
venv inside the worktree.

## The deliverable

Your own report with a section headed exactly `## Requirement verdicts`, one line per
requirement:

    <requirement heading> - <requirements file>:<line> - <verdict> - <evidence pointer with file:line>

Then: the coverage gaps; the findings with severity; what each of the two checks
showed; the acceptance verdict (accepted or blocked, and why); the assumptions; and
what you ran and what you did not run.
