# HT2-R4 - the Developer lane for work item B (the picker's feed verdict)

Role: Developer (skill section 3). Load the `swarm-engineering` skill before the work.

## The authority is a file

`D:\project\.swarm-lab\head_tree2\.swarm\requirements\pick-daily-feed-verdict.md` is the
authority for this work item. It defines four requirements, each as a block with the
requirement, an observable check and a source:

- "The picker says which case it is" (the block at :8-21)
- "A quiet feed is not a failure" (the block at :23-37)
- "A broken feed still fails loudly" (the block at :39-50)
- "The existing refusals survive" (the block at :52-63)

Read that file. It is where the requirement text comes from.

## What this work item asks for

The picker cannot tell a feed that could not be fetched from a feed that was fetched
and holds no entries: both are answered with "the feed returned no papers" and exit 1.
The collector itself knows the difference (it reports a fetched-but-empty feed as a
quiet day and a broken source as a failure). This work item makes the picker say
which case it is, and gives the two cases their own outcomes:

- a feed that could not be fetched: exit 1, and the message names the source and the
  reason, the way the collector reports a broken source;
- a feed that was fetched and holds no entries: the picker says the feed held no
  entries, the day is quiet, and it writes no day file. The picker's own contract is
  the picker's own: it keeps the exit code it uses today for this case - the picker
  already exits 1 when the feed holds no entries. Do not change that number in this
  round; see the conflict section below, it is not yours to settle.

## What you own

- `scripts/pick_daily.py` - the implementation.

## What is not yours

- `tests/scripts/**` - the Tester owns the requirement-clause file. Do not write tests.
- `.swarm/requirements/**` - the Coordinator owns the requirements files.
- `src/arxiv_collector/**` - read only. The collector's behaviour is not in scope.
- `tests/scripts/test_pick_daily.py` - the existing suite: never edit, skip, xfail or
  delete anything in it.

## The seams you have to respect

- `scripts/pick_daily.py:308-318` - `fetch_papers(urls: list[str]) -> list[Paper]`. It
  builds the collector (`ArxivCollector(urls, client=client)`) and returns
  `list(collector.collect())`. The collector drops the URLs it could not read, so the
  list alone cannot say whether a URL failed.
- `src/arxiv_collector/base.py:29-56` - `FeedHealth` carries `urls`, `items` and
  `failures`, with `.empty` and `.failed`; `BaseCollector.feed_health()` (:87) returns
  it. That is where the difference between "empty" and "failed" already lives.
- `scripts/pick_daily.py:573-574` - the picker calls `fetch_papers(urls)` and answers
  the empty case with one message and exit 1.
- `tests/scripts/test_pick_daily.py:475` and `:796` - the existing suite stubs
  `fetch_papers` with a lambda that returns a list, and no existing test drives an
  empty feed. Whatever you change, the existing suite must keep passing unchanged and
  must never reach the network.

## If this brief and the requirements file disagree

Report the conflict and stop that requirement; do not pick a winner and do not invent
a requirement. The other requirements are unaffected by the conflict and are still
yours to implement. Say so in the report, with both places: what this brief says and
what the file says, each with its `file:line`.

If you find such a conflict here: the exit code for the quiet-feed case is the
disputed requirement. Leave that number exactly as it is today - implement the
distinction, the messages and the broken-feed behaviour, and change nothing about
which code the quiet case exits with. Report the conflict with both readings and the
question behind them, and let the Coordinator put the question to the human.

## Constraints

Never deploy, never push, never commit (the Coordinator commits per lane). Never
weaken a test. No network. Format only the files you touched. Report honestly:
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

## The report

1. Any conflict between this brief and the requirements file, first and plainly.
2. What you implemented, per requirement: the requirement heading, its `file:line` in
   the requirements file, and the `file:line` of the code that satisfies it.
3. The requirements you did not implement, and why.
4. What you ran (command and output) and what you did not run.
5. `git status --short` at the end, which must show only `scripts/pick_daily.py`.
