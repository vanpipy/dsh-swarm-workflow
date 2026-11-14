# HT2-R3 - the Reviewer lane for work item A

Role: Reviewer (skill section 5). Load the `swarm-engineering` skill before the work;
section 16 binds you.

## The authority is a file

`D:\project\.swarm-lab\head_tree2\.swarm\requirements\pick-daily-profile.md` is the
authority for this work item. It defines three requirements, each as a block with the
requirement, an observable check and a source:

- "A malformed daily number is refused" (the block at :20-34)
- "The hard ceiling still wins" (the block at :36-46)
- "The existing refusals survive" (the block at :48-62)

Do not work from a copy of that text; read the file. If this brief and the file
disagree, the file wins and you report the conflict (skill section 17).

## What was built

- The implementation: `scripts/pick_daily.py`, committed as `2696f9e` on branch
  `swarm/lab11` (the parent commit `467fbe3` added the requirements file). The
  relevant code is `ProfileError` at :99-107, `_daily_limit()` at :172-193, the read of
  the profile's number at :155 and the refusal in `main()` at :551-556.
- The requirement-clause test file: `tests/scripts/test_pick_daily_profile.py`, written
  by the Tester lane (R2). Every test in it cites the requirement it covers.
- The existing test file `tests/scripts/test_pick_daily.py` (47 tests) must be untouched.

## What you must do

1. For each of the three requirements, decide a verdict and gather the evidence:
   - `met` - the evidence shows the requirement is satisfied.
   - `not met` - the evidence shows it is not.
   - `not demonstrated` - no evidence either way.
   - `not in scope` - outside this assignment.
   A verdict without evidence is `not demonstrated`, never `met`. Cite the requirement
   as `<file>:<line>` and the evidence as `file:line`.
2. Run BOTH checks per requirement (skill section 16):
   - **discrimination** - would the check fail if the behaviour were wrong? Prove it:
     copy the code into a scratch directory OUTSIDE the repository
     (`D:\project\.swarm-lab\proof-scratch\ht2-r3`), change the behaviour there (for
     example make `_daily_limit` accept 0, or make the refusal exit 1), and show the
     requirement's check failing. Do NOT copy the `.git` entry: in this worktree `.git`
     is a FILE pointing at the parent repository's worktree metadata, so a copy that
     carries it would make git operate on the real worktree.
   - **intent** - is the behaviour the one the requirement asked for, not merely one
     that passes the test?
3. Check the coverage: a requirement with no test is a reported coverage gap, never a
   silent pass. If the Tester's file does not cover a requirement, say so.
4. Apply the acceptance gate: a review is complete only when every requirement carries a
   verdict and its evidence, or is reported as `not demonstrated`. A `not demonstrated`
   requirement blocks acceptance until it is checked, or until the Coordinator records
   an explicit waiver with a reason in the ledger row.
5. Do not invent requirements. If the file defines a requirement your assignment does not
   cover, report it as a gap.

## The deliverable

Your own report, with a section headed exactly:

    ## Requirement verdicts

One line per requirement, in the order of the file:

    <requirement heading> - <file>:<line> of the requirement - <verdict> - <evidence pointer with file:line>

Then: the coverage gaps; the findings (severity, what is wrong, where, the impact); the
two checks and what each one showed; the acceptance verdict (accepted / blocked, and by
which requirement); the assumptions and their confidence; what you ran and what you did
not run.

## Boundaries

- Read-only on `D:\project\.swarm-lab\head_tree2`. Mutations only in
  `D:\project\.swarm-lab\proof-scratch\ht2-r3`.
- No git writes, no commits, no pushes, no network, no plugins, no agents, no goals.
- Never weaken, skip, xfail or delete a test; never edit a file you do not own.
- Report honestly: Verified (you ran it and saw the result), Inferred (you read the code
  and believe it), Not run (out of scope or blocked).

## Toolchain

    $env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
    $env:PYTHONPATH = "D:\project\.swarm-lab\head_tree2\src;D:\project\.venv-win\Lib\site-packages"
    $env:PYTHONDONTWRITEBYTECODE = "1"
    Set-Location D:\project\.swarm-lab\head_tree2
    C:\Python312\python.exe -m pytest -q -p no:cacheprovider tests\scripts
    D:\project\.venv-win\Scripts\ruff.exe check --no-cache scripts\pick_daily.py tests\scripts\test_pick_daily_profile.py

`git` is not on PATH by default; Get-Content needs `-Encoding UTF8`; no `uv` and no
venv inside the worktree.
