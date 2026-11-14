# Decision — the command line summarises several files

Date: 2026-11-11
Status: accepted by the human (Team Lead asked, user answered)

## What was decided

`python -m swarmlab` accepts several files and prints **one summary block per
file**, in the order the files were given.

`python -m swarmlab a.txt b.txt` prints the summary of `a.txt`, then the summary
of `b.txt`, and exits `0` when both files exist. The first missing file stops
the run: the message `swarmlab: no such file: <path>` goes to standard error,
the exit status is `2`, and the summaries printed before it stay on standard
output.

This is recorded as requirement R10 in `.swarm/requirements/swarm-lab.md`.

## Options considered

1. **One summary per file** — the human chose this. Every file is summarised, in
   order, and each block reads independently.
2. **One merged summary** — all files counted into a single total. Rejected: it
   hides which file contributed what, and the user reads each file on its own.
3. **One file only, extra arguments are an error** — the behaviour before this
   decision. Rejected: it makes the tool useless for a quick sweep over a
   directory.

## Why

The tool exists to make the swarm workflow observable on real work. A sweep over
several files is the common case, and one block per file keeps each result
attributable to its source. Failing fast on a missing file keeps the exit
status meaningful for a script that checks it.

## Consequences

- `swarmlab/__main__.py` stops rejecting a second argument and loops over the
  given paths instead.
- The usage string becomes `usage: python -m swarmlab <file> [<file> …]`.
- The exit status contract is unchanged for the single-file case, so R5 and R9
  still hold.
