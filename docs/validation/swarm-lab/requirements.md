# swarm-lab — requirement set

Work item: build `swarmlab`, a small pure-Python package, as a live test bed for the
refactored `dsh-swarm-workflow` bundle. This file is the durable carrier of the
requirement set; the shared-board task for each lane carries the same blocks.

Every requirement block below has the form:

    <the requirement>
        check: <the observable check that proves it>
        source: <where the requirement comes from>

A lane that cannot read this file reports its requirements as `not demonstrated`,
never `met`.

---

### R1 — `swarmlab.text.normalize_ws`

`swarmlab.text.normalize_ws(text: str) -> str` returns the text with every run of
whitespace collapsed to a single space and the ends stripped. It preserves the
order of the remaining characters and returns `""` for empty or whitespace-only
input.

    check: `python -m unittest tests.test_text.TestNormalizeWs` passes, and the
        package exposes `swarmlab.text.normalize_ws` with that exact signature.
    source: the assignment — work item swarm-lab, round R2.

### R2 — `swarmlab.text.tokenize`

`swarmlab.text.tokenize(text: str) -> list[str]` returns the lowercase
word tokens of the text, in order, where a token is a maximal run of
alphanumeric characters.

    check: `python -m unittest tests.test_text.TestTokenize` passes, and the
        package exposes `swarmlab.text.tokenize` with that exact signature.
    source: the assignment — work item swarm-lab, round R2.

### R3 — `swarmlab.stats.word_frequency`

`swarmlab.stats.word_frequency(tokens: list[str]) -> list[tuple[str, int]]`
returns one `(token, count)` pair per distinct token, sorted by count descending
and then by token ascending, so the order is total and stable.

    check: `python -m unittest tests.test_stats.TestWordFrequency` passes, and the
        package exposes `swarmlab.stats.word_frequency` with that exact signature.
    source: the assignment — work item swarm-lab, round R2.

### R4 — `swarmlab.report.summarize`

`swarmlab.report.summarize(tokens: list[str]) -> dict[str, object]` returns a
mapping with the keys `total` (the number of tokens), `unique` (the number of
distinct tokens) and `top` (the five most frequent `(token, count)` pairs, or all
of them when fewer than five distinct tokens exist).

    check: `python -m unittest tests.test_report.TestSummarize` passes, and the
        package exposes `swarmlab.report.summarize` with that exact signature.
    source: the assignment — work item swarm-lab, round R2.

### R5 — the package runs as a module

`python -m swarmlab <file>` prints a human-readable summary of the file's
tokens — the total, the unique count and the five most frequent tokens — and
exits with status `0`. A missing file prints the message
`swarmlab: no such file: <path>` on standard error and exits with status `2`.

    check: `python -m swarmlab tests/fixtures/sample.txt` exits `0` and prints the
        summary; `python -m swarmlab does-not-exist.txt` exits `2` and prints the
        message on stderr.
    source: the assignment — work item swarm-lab, round R2.

### R6 — every public function is annotated

Every public function in `swarmlab` carries a parameter annotation and a return
annotation, and every public module carries a module docstring.

    check: `python tools/quality_report.py --json` reports `annotation_coverage`
        of `1.0` and `docstring_coverage` of `1.0` over the public surface.
    source: the assignment — work item swarm-lab, quality requirement.

### R7 — every public function is tested

Every public function in `swarmlab` is exercised by at least one test case in
the `tests` package, and the whole suite passes.

    check: `python -m unittest discover -s tests -t .` exits `0`, and
        `python tools/quality_report.py --json` reports `public_functions_without_tests`
        as `0`.
    source: the assignment — work item swarm-lab, quality requirement.

### R8 — the package has no import-time side effects

Importing `swarmlab` or any of its submodules performs no I/O, prints nothing and
exits no process. The package is importable from a directory other than the
repository root.

    check: `python -c "import swarmlab"` exits `0` and prints nothing, and the
        same holds for `swarmlab.text`, `swarmlab.stats` and `swarmlab.report`.
    source: the assignment — work item swarm-lab, quality requirement.

### R9 — the behaviour must not change during remediation

The public behaviour defined by R1 to R5 must not change while the review
findings of round R4 are remediated. A change that alters an observable result
is a defect, not an improvement. The multi-file command line of R10 is not a
remediation: it is a change the human asked for, and R10 is judged by its own
check.

    check: the round-R3 commit `cb51065` exists (it is the commit that adds the
        clause test files), `git diff --stat cb51065 <remediation commit> --
        tests` is empty, and the suite still exits `0`. Until `cb51065` exists,
        the check is `not demonstrated`.
    source: the behaviour that must not change — R1 to R5.

### R10 — the command line summarises several files

`python -m swarmlab <file> [<file> …]` prints one summary block per file, in the
order the files were given, and exits with status `0` when every file exists. The
first file that does not exist stops the run: the message
`swarmlab: no such file: <path>` goes to standard error, the run exits with
status `2`, and the summaries printed before it stay on standard output.

    check: `python -m swarmlab tests/fixtures/sample.txt tests/fixtures/sample.txt`
        exits `0` and prints two summary blocks in the order given;
        `python -m swarmlab tests/fixtures/sample.txt does-not-exist.txt` exits
        `2`, prints the summary of the first file on stdout and the message on
        stderr.
    source: the human decision of 2026-11-11 — "one summary per file".

---

## Baseline

The repository starts empty apart from this file and the tooling; every
requirement above is `not demonstrated` until a lane reports the evidence that
proves it.
