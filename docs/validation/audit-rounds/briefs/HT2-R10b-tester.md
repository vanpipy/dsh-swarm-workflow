# HT2 - R10b: the Tester remediation lane (the two requirements that are not demonstrated)

## Your role

You are the **Tester** of the ladder. Round 10 (the acceptance review) found that two
requirements are **not demonstrated**: the behaviour is right, but the checks do not
decide the clauses. Your job is to fix the checks so that they decide them, and to
repair the citations that drifted. You write NO production code.

## The authority

Two requirement files in the worktree (read-only for you):

- `.swarm/requirements/pick-daily-profile.md` (work item A - the picker's daily number)
- `.swarm/requirements/pick-daily-feed-verdict.md` (work item B - the picker's feed verdict)

Each requirement is one block: `Requirement` / `Check` / `Source`. The requirement text
decides what is required; the Check says how it is observed; the Source says where the
behaviour lives.

## The files you own (and only these)

- `tests/scripts/test_pick_daily_profile.py`
- `tests/scripts/test_pick_daily_feed_verdict.py`

**Not yours**: `scripts/pick_daily.py`, `src/**`, `config/**`, the requirements files,
every other test file. If a fix seems to need a production change, report it - do not
make it.

## The order of work - read this first

The Coordinator repairs the two requirements files **before** this lane starts:
the eight stale pointers in the profile file's Decision paragraph, the wrong
`AGENTS.md` attribution, the base.py range, and **one new requirement block**
("A partly broken feed is a warning, not a failure") that the round-9 lens found
shipped with no requirement and no test. That insert moves the line numbers of
the blocks after it.

So: **read the two requirements files fresh when you start**, and fix the
citations against the line numbers you find there - not against the ones quoted
below. The numbers below describe the state at the time of writing; the heading
lines will have moved again.

## The five defects to repair

### 0. The new requirement has no test (Material - a coverage gap you must close)

The requirements file will carry a fifth block for work item B:

    ### A partly broken feed is a warning, not a failure

When the feed yielded entries although some of its feed URLs failed, the picker
prints a warning that names how many URLs failed and why, and carries on: the
entries that arrived are still picked, the day file is still written and the run
still succeeds.

The implementation is `scripts/pick_daily.py:634-642` (the WARNING line), and
the run continues into the normal path.

**What to do**: write the test that decides this clause - a stubbed feed that
yields one entry and reports one failed URL, then assert the warning line, the
written day file and exit 0. The network is never touched. A requirement with no
test is a reported coverage gap - but here you can close it, so close it.

### 1. The "names `daily_limit`" clause is decided by nothing (Material)

The requirement A/1 says the refusal message must **name `daily_limit`**. The test
asserts `"daily_limit" in out`, where `out` is the captured stdout **including the
command line**, and pytest names `tmp_path` after the test
(`test_a_malformed_daily_limit_is_refused[zero]`), so the PATH contains the string
`daily_limit` and the assertion is satisfied by the path, not by the message.

Proof it is not decided: a mutant that rewrites the message to *"the number must be a
positive integer, got 0"* still passes all 12 profile-clause tests.

**What to do**: make the assertion decide the clause. Assert on the refusal line
itself (the line the picker prints), not on the whole output - for example find the
line that starts with `[pick_daily] taste profile` and assert that this line contains
`daily_limit`. A test that would still pass if the key were dropped from the message is
not acceptable. Do not weaken the requirement; make the check strong.

### 2. The collector-health path's message is not pinned (Material)

Requirement B/1 says the picker must tell a feed that **could not be fetched** apart
from a feed that was **fetched and holds no entries**, and that the two messages
differ. There are two broken-feed mechanisms in the implementation:

- the **raising** path - `fetch_papers` raises (`scripts/pick_daily.py:604-613`);
- the **collector-health** path - the collector reports a failure through
  `feed_health()` and the picker prints it (`scripts/pick_daily.py:621-632`).

The B/1 tests drive only the raising path. The health path is stubbed once and that
test asserts only the exit code, the URL and the reason - all three of which are
supplied by the shared per-failure lines. The **distinguishing summary line** of the
health path (`scripts/pick_daily.py:626-629`) is therefore pinned by nothing: a mutant
that replaces it with the quiet-feed wording still passes all 16 feed-clause tests.

**What to do**: add a test that drives the collector-health path and pins the wording
that tells the two apart - the broken feed must not be announced with the quiet-feed
wording. Assert on the summary line, so that swapping the two wordings fails.

### 3. Thirty-three citations point at the wrong lines (Material)

Commit `36beb18` refreshed the source pointers in the requirements files and, in doing
so, moved the requirement **headings**:

- `pick-daily-profile.md`: the headings moved from lines [20, 36, 48] to [20, 38, 52]
- `pick-daily-feed-verdict.md`: the headings moved from [8, 23, 53, 66] to [8, 25, 55, 68]

Every test in both clause files cites the requirement it covers by line number, so 33
citations are now off. **What to do**: re-point every citation at the requirement block
it actually covers. A citation that resolves to a line inside a *different* requirement
is worse than no citation - check each one against the text it names.

A checker is ready for you - run it before and after your fix:

```
C:\Python312\python.exe D:\project\.swarm-lab\proof-scratch\check_citations.py
```

It prints one `STALE` line per broken citation and ends with
`citations checked: N | stale: M`; it exits 1 while anything is stale. Its rule: a
single-line citation (`file.md:NN`) must point at a requirement HEADING line, and a
range citation (`file.md:NN-MM`) must start at a heading line and end inside that
requirement's own block. The current state is `42 citations checked | 33 stale`. You may
use the checker, extend it, or write your own - but the acceptance is that no citation
resolves to a requirement other than the one it names.

### 4. The anti-skip guard only sees `pytestmark` (non-blocking)

`tests/scripts/test_pick_daily_profile.py` has a guard that asserts no existing test
carries a skip or an xfail. It scans only module- and class-level `pytestmark`, so a
runtime `skip` (there is one at `tests/scripts/test_pick_daily.py:933`) is invisible to
it. **What to do**: widen the guard so it sees the marks it claims to see - and if you
cannot do that faithfully, say so in your report rather than leaving the guard's name
claiming more than it checks.

## The rules

- One test per condition. Each test cites the requirement it covers, as
  `<requirements file>:<line>`, and that citation must resolve to the requirement's own
  text.
- A requirement with no test is a **reported coverage gap**, never a silent pass.
- The two checks (discrimination and intent) are the Reviewer's job - but after your
  fix, say in your report which mutant your new or repaired check now kills, and show
  the evidence.
- Never weaken a test, never skip a check, never lower a threshold, never delete a
  failing test to make the suite green. If a check is wrong, the intended behaviour
  genuinely changed - then fix it deliberately, explain it, and make the change in the
  same commit as the behaviour change. In this round there is no behaviour change: the
  production code is correct and your checks must decide it.
- The network is never touched: stub the fetch the way the existing suite does
  (`tests/scripts/test_pick_daily.py:475` and `:796`).
- Leave no `__pycache__`, `.pytest_cache` or `.ruff_cache` inside the worktree: run
  pytest with `-p no:cacheprovider` and `PYTHONDONTWRITEBYTECODE=1`, and ruff with
  `--no-cache`.
- Do not commit, push, deploy, install anything, or touch the network.

## The toolchain (this host; the usual commands do not work)

```
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
$env:PYTHONPATH = "D:\project\.swarm-lab\head_tree2\src;D:\project\.venv-win\Lib\site-packages"
$env:PYTHONDONTWRITEBYTECODE = "1"
C:\Python312\python.exe -m pytest -q -p no:cacheprovider tests\scripts
D:\project\.venv-win\Scripts\ruff.exe check --no-cache tests\scripts\test_pick_daily_profile.py tests\scripts\test_pick_daily_feed_verdict.py
```

- Python is `C:\Python312\python.exe`. NEVER the venv python, NEVER `uv run` - they fail
  with `PermissionError` inside this repository.
- git is `C:\Program Files\Git\cmd\git.exe` (not on PATH by default). You may READ git
  state; you may not write.
- `Get-Content` needs `-Encoding UTF8`.
- If a subprocess captures bytes, decode with `.decode("utf-8")` - the default GBK
  decode raises `UnicodeDecodeError`.

## Acceptance

0. The new requirement ("A partly broken feed is a warning, not a failure") has
   a test that decides it, and the test cites it by its heading line.
1. The profile clause file's "names `daily_limit`" assertion now decides the clause:
   show the mutant that drops the key from the message FAILING (put the mutated copy in
   a scratch directory OUTSIDE the worktree, without the `.git` entry - in this worktree
   `.git` is a FILE pointing at the parent repository's worktree metadata, and copying
   it would make git commands operate on the real worktree).
2. The new health-path test kills the mutant that swaps the health summary line with
   the quiet-feed wording.
3. Every citation in both clause files resolves to the requirement text it names.
4. The whole `tests/scripts` suite passes, and the existing suite file is still
   byte-identical to the base commit - check with
   `git diff 4525f25 -- tests/scripts/test_pick_daily.py` (it must be empty).
5. ruff is clean on your two files, and both are formatted
   (`ruff format --check`).
6. No cache artefacts inside the worktree.

## What you report back

- The "## Requirement verdicts" section: one line per requirement you touched, as
  `<requirement heading> - <requirements file>:<line> - <verdict> - <evidence>`, where
  the verdict is `met`, `not met`, `not demonstrated` or `not in scope`. A verdict
  without evidence is `not demonstrated`, never `met`.
- The defects you repaired, each with: what, where (`file:line`), why it mattered, how
  you can tell the difference now, and Verified / Inferred / Not run.
- The mutants you killed, with the command output that shows them dying.
- The coverage gaps you noticed, if any.
- What you did not run.
