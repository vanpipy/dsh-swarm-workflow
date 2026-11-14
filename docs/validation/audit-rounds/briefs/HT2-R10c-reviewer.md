# HT2 - R10c: the re-review of the blocked items only

## Your role

You are the **Reviewer** of the ladder, and this is a re-review. The acceptance review
(round 10) accepted the seven requirements on their verdicts but left two of them
**not demonstrated**: the behaviour is right, but the checks did not decide the clauses.
A remediation lane (R10b) has since repaired the checks. Your job is to decide whether
the repaired checks now decide their clauses - and nothing else.

You write NO production code and NO test code. You read, you run, you mutate a COPY
outside the worktree, and you report.

## The authority

Two requirement files in the worktree `D:\project\.swarm-lab\head_tree2` (read-only for
you):

- `.swarm/requirements/pick-daily-profile.md` (work item A - the picker's daily number)
- `.swarm/requirements/pick-daily-feed-verdict.md` (work item B - the picker's feed verdict)

Each requirement is one block: `Requirement` / `Check` / `Source`. Read both files FRESH.
They carry a THIRD work item's requirement now: "A partly broken feed is a warning, not a
failure" (work item B, the fifth block).

## What is in scope for this re-review

Only the items round 10 left open. Everything else in the ladder was accepted and is out
of scope:

1. **The "names `daily_limit`" clause** (profile file). The check must decide that the
   refusal MESSAGE names the key - not that the captured stdout contains the string
   somewhere. The round-10 mutant M1 (the message loses the literal `daily_limit`)
   survived; it must now die.
2. **The collector-health path's distinguishing summary line** (feed file, requirement
   B/1). The check must decide that a feed that COULD NOT BE FETCHED is not announced
   with the quiet-feed wording. The round-10 mutant M8 (the health summary line is
   swapped for the quiet wording) survived the whole test set; it must now die.
3. **The new requirement** "A partly broken feed is a warning, not a failure": the
   requirement was added by the Coordinator (commit 766ff45) and the test by the R10b
   lane. Decide whether the test decides the clause: a warning that names the failure, a
   day file that is written, exit 0.
4. **The citations**: every citation in the two clause files must resolve to the
   requirement text it names. The checker is
   `C:\Python312\python.exe D:\project\.swarm-lab\proof-scratch\check_citations.py`; it
   prints one `STALE` line per broken citation and ends with
   `citations checked: N | stale: M`, exiting 1 while anything is stale. Re-pointing a
   citation at a DIFFERENT requirement is worse than a stale one - read the text.
5. **The anti-skip guard**: it must not claim more than it checks. Either it sees the
   marks it claims to see, or its name and the requirement's wording say what it really
   does. Round 10 left this non-blocking; it is in scope only as far as item 4's file.

Everything else - the other five requirements, the exit-code map, the profile clamp, the
partly broken feed's production code - is already accepted. Do not re-litigate it.

## The two checks, and how to run them

For every item in scope you must really run BOTH checks:

- **Discrimination**: does the check fail if the behaviour were wrong? Mutate a COPY of
  the code outside the worktree (e.g. `D:\project\.swarm-lab\proof-scratch\ht2-r10c`)
  and show the check dying. Do NOT copy the `.git` entry: in this worktree `.git` is a
  FILE pointing at the parent repository's worktree metadata, and copying it would make
  git commands operate on the real worktree.
- **Intent**: does the behaviour the check exercises match what the requirement asks
  for? Read the production code, not only the green test.

The mutants round 10 used are your starting point (M1: the message loses the key; M8:
the health summary line takes the quiet wording). You may find others - especially for
the new requirement.

## The verdict table

Your report carries a section headed exactly `## Requirement verdicts`, one line per
requirement you judged, in the form:

    <requirement heading> - <requirements file>:<line> - <verdict> - <evidence pointer with file:line>

The verdict is `met`, `not met`, `not demonstrated` or `not in scope`. A verdict without
evidence is `not demonstrated`, never `met`.

You judge the requirements as the FILE states them. If the file and the code disagree,
that is a finding - not a licence to pick a winner.

## The acceptance gate

A `not demonstrated` requirement BLOCKS acceptance. Report it as such, plainly.

## The rules

- Read-only in the worktree: no writes, no commits, no pushes, no installs, no network.
- Mutations only in a scratch directory OUTSIDE the worktree.
- Leave no `__pycache__`, `.pytest_cache` or `.ruff_cache` inside the worktree: run pytest
  with `-p no:cacheprovider` and `PYTHONDONTWRITEBYTECODE=1`, ruff with `--no-cache`.
- Never weaken a test to make it pass. If you find that a check is wrong, say so - do not
  repair it.
- Report honestly: Verified / Inferred / Not run.

## The toolchain (this host; the usual commands do not work)

```
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
$env:PYTHONPATH = "D:\project\.swarm-lab\head_tree2\src;D:\project\.venv-win\Lib\site-packages"
$env:PYTHONDONTWRITEBYTECODE = "1"
C:\Python312\python.exe -m pytest -q -p no:cacheprovider tests\scripts
D:\project\.venv-win\Scripts\ruff.exe check --no-cache tests\scripts
```

Python is `C:\Python312\python.exe` - NEVER the venv python, NEVER `uv run` (they fail
with `PermissionError` in this repository). git is `C:\Program Files\Git\cmd\git.exe`
(you may read git state; you may not write it). `Get-Content` needs `-Encoding UTF8`. If a
subprocess captures bytes, decode with `.decode("utf-8")` - the default GBK decode raises
`UnicodeDecodeError`.

## What you report back

- The `## Requirement verdicts` section (the five items in scope, one line each).
- For each item: what you mutated, the exact command, and the output that shows the check
  dying (or surviving).
- The acceptance verdict for the ladder: is any requirement still `not demonstrated`?
- The citations that still do not resolve, if any.
- Anything you noticed that is outside the five items and you could not leave alone.
- What you did not run.
