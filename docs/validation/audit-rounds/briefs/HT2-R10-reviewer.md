# HT2-R10 - the final review and the acceptance

Role: Reviewer (skill section 5). Load the `swarm-engineering` skill before the work.
Section 16 binds you: one verdict per requirement with its evidence.

## What is under review

The whole of branch `swarm/lab11` in the worktree `D:\project\.swarm-lab\head_tree2`,
base commit `4525f25`, against the two requirements files:

- `D:\project\.swarm-lab\head_tree2\.swarm\requirements\pick-daily-profile.md`
- `D:\project\.swarm-lab\head_tree2\.swarm\requirements\pick-daily-feed-verdict.md`

Read both files. They are the authority; this brief does not repeat their text.

Work item A is the picker's daily number (a malformed number is refused, the hard
ceiling still wins, the existing refusals survive). Work item B is the picker's feed
verdict (the picker says which case it is, a quiet feed, a broken feed, the existing
refusals survive). One requirement in work item B was disputed between the brief and
the requirements file and was put to the human; the resolution and its reason are
recorded in the requirements file. Judge the requirement as the file now states it.

## What you own

Nothing in the worktree. Read-only there. Mutate only inside
`D:\project\.swarm-lab\proof-scratch\ht2-r10`, and copy the code there WITHOUT the
`.git` entry - in this worktree `.git` is a FILE pointing at the parent repository's
worktree metadata, so a copy carrying it would make git operate on the real worktree.

## What to do

0. First, the round-9 fan-out ran three read-only lenses over this same branch and
   produced claims. They are CLAIMS, not facts - verify each one yourself before you
   use it, and say which you confirmed, which you refuted, and which you could not
   decide. The claims (the fan-out's own words, shortened):
   - "The requirement A/1 clause 'prints a message that names daily_limit' is decided
     by nothing: the test asserts the key appears in the captured stdout, but pytest's
     tmp_path is named after the test (test_a_malformed_daily_limit_is_refused[zero]),
     so the path contains the key. A mutant that drops the key from the message still
     passes all 12 profile-clause tests." (Material)
   - "The requirement B/1 clause 'the two messages differ' is not decided for the
     collector-health broken path: a mutant that replaces the health path's summary
     line with the quiet-feed wording still passes all 16 feed-clause tests and the
     whole worktree test set." (Material)
   - "The citations in the two clause test files point at requirement lines that moved
     when the source pointers were refreshed (commit 36beb18); 33 of them are now off
     by +2 lines." (Material)
   - "Eight bare line pointers in the Decision paragraph of pick-daily-profile.md do
     not resolve, and one source attributes 'a bad input is an error, not a quiet day'
     to AGENTS.md section 4, which does not contain it." (Material)
   - "The picker's partial-failure path (some feed URLs fail, some entries arrive ->
     a WARNING, the run continues, exit 0, the day file is written) is shipped
     behaviour with no requirement block and no test." (Material)
   - "No existing test was edited, skipped, xfailed or deleted anywhere on the branch;
     the existing suite file is byte-identical to the base commit." (to confirm)

1. For every requirement in both files: a verdict - met, not met, not demonstrated or
   not in scope - with evidence. A verdict without evidence is not demonstrated, never
   met. Cite the requirement as `<requirements file>:<line>` and the evidence as
   `file:line`.
2. Both checks, for every requirement you judge:
   - discrimination: would the check fail if the behaviour were wrong? Mutate it in the
     scratch copy and show the requirement's check failing.
   - intent: is the behaviour the one the requirement asked for?
3. The coverage: which requirement has no test, and which test does not decide its
   requirement.
4. The weakened-check sweep: compare the tests against the base commit
   (`git diff 4525f25..HEAD -- tests/`) and look for a deleted, skipped or loosened
   check, a changed threshold, a renamed requirement, or a test that asserts less than
   before.
5. The tree state: uncommitted changes, files no lane owns, stray artefacts inside the
   worktree.
6. The acceptance gate: a requirement that is not met or not demonstrated blocks
   acceptance until it is checked or until the Coordinator records an explicit waiver
   with a reason in the ledger row.

## Constraints

Never deploy, never push, never commit, never write inside the worktree. No network.
No plugin or profile change. Report honestly: Verified, Inferred, Not run.

## Toolchain

    $env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
    $env:PYTHONPATH = "D:\project\.swarm-lab\head_tree2\src;D:\project\.venv-win\Lib\site-packages"
    $env:PYTHONDONTWRITEBYTECODE = "1"
    Set-Location D:\project\.swarm-lab\head_tree2
    C:\Python312\python.exe -m pytest -q -p no:cacheprovider tests\scripts
    D:\project\.venv-win\Scripts\ruff.exe check --no-cache scripts\pick_daily.py tests\scripts

`git` is not on PATH by default; Get-Content needs `-Encoding UTF8`; no `uv` and no
venv inside the worktree.

## The deliverable

Your own report with a section headed exactly `## Requirement verdicts`, one line per
requirement:

    <requirement heading> - <requirements file>:<line> - <verdict> - <evidence pointer with file:line>

Then: the coverage gaps; the findings with severity; what each of the two checks
showed; the acceptance verdict (accepted or blocked, and why); the assumptions; and
what you ran and what you did not run.
