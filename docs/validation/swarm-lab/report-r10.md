# swarm-lab — R10 report (Developer lane, task-6)

Lane: Developer (`pydev`) · round R2b · work item `swarm-lab` · repository `D:\project\swarm-lab-python`

Requirement carriers read before the work:

- shared board task `task-6` (revision 2 after the claim) — quotes the R10 block below;
- durable file `D:\project\swarm-lab-python\.swarm\requirements\swarm-lab.md` — R10 at lines 112–125,
  R9 at lines 101–110;
- decision `D:\project\swarm-lab-python\.swarm\decisions\2026-11-11-cli-multiple-files.md` — the human
  decision of 2026-11-11 ("one summary per file").

The task and the file carry the same R10 and R9 blocks; no disagreement was found.

## The requirement blocks

R10 — `python -m swarmlab <file> [<file> …]` prints one summary block per file, in the order the files
were given, and exits with status `0` when every file exists. The first file that does not exist stops
the run: the message `swarmlab: no such file: <path>` goes to standard error, the run exits with status
`2`, and the summaries printed before it stay on standard output.

    check: `python -m swarmlab tests/fixtures/sample.txt tests/fixtures/sample.txt`
        exits `0` and prints two summary blocks in the order given;
        `python -m swarmlab tests/fixtures/sample.txt does-not-exist.txt` exits `2`, prints the summary
        of the first file on stdout and the message on stderr.
    source: the human decision of 2026-11-11 — "one summary per file".

R9 — the public behaviour defined by R1 to R5 must not change while the review findings are remediated;
a change that alters an observable result is a defect, not an improvement.

    check: the test files from round R3 are unchanged in their assertions, and the suite still exits `0`.
    source: the behaviour that must not change — R1 to R5.

## Verdicts

| Requirement | Verdict | Evidence |
|---|---|---|
| R10 — the command line summarises several files | **met** | commands and real output below |
| R9 — R1 to R5 observable behaviour unchanged | **met** | single-file output byte-identical to the R2 baseline; clause suite exits `0`; no test file touched |

## R10 evidence

All commands were run from `D:\project\swarm-lab-python` with
`C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe` (3.12.14).

### 1. Two existing files — two summary blocks, exit 0

```
> & "...\python.exe" -m swarmlab tests/fixtures/sample.txt tests/fixtures/sample.txt
file: tests/fixtures/sample.txt
total: 16
unique: 11
top tokens:
  the: 4
  dog: 2
  fox: 2
  and: 1
  barks: 1
file: tests/fixtures/sample.txt
total: 16
unique: 11
top tokens:
  the: 4
  dog: 2
  fox: 2
  and: 1
  barks: 1
exit=0
```

Exact streams (captured with `subprocess.run(..., capture_output=True, text=True)` so that standard
output and standard error are separated unambiguously):

```
ARGS: ['tests/fixtures/sample.txt', 'tests/fixtures/sample.txt']
  returncode: 0
  stdout: 'file: tests/fixtures/sample.txt\ntotal: 16\nunique: 11\ntop tokens:\n  the: 4\n  dog: 2\n  fox: 2\n  and: 1\n  barks: 1\nfile: tests/fixtures/sample.txt\ntotal: 16\nunique: 11\ntop tokens:\n  the: 4\n  dog: 2\n  fox: 2\n  and: 1\n  barks: 1\n'
  stderr: ''
```

Two blocks, in the order the files were given, exit `0`, nothing on standard error.

### 2. First missing file stops the run, earlier summaries stay on stdout

```
> & "...\python.exe" -m swarmlab tests/fixtures/sample.txt does-not-exist.txt
file: tests/fixtures/sample.txt
total: 16
unique: 11
top tokens:
  the: 4
  dog: 2
  fox: 2
  and: 1
  barks: 1
exit=2
[stderr]
swarmlab: no such file: does-not-exist.txt
```

Exact streams:

```
ARGS: ['tests/fixtures/sample.txt', 'does-not-exist.txt']
  returncode: 2
  stdout: 'file: tests/fixtures/sample.txt\ntotal: 16\nunique: 11\ntop tokens:\n  the: 4\n  dog: 2\n  fox: 2\n  and: 1\n  barks: 1\n'
  stderr: 'swarmlab: no such file: does-not-exist.txt\n'
```

The summary of the first file is on standard output, the message is on standard error, exit `2`.

### 3. The single missing file still behaves as in R5

```
ARGS: ['does-not-exist.txt']
  returncode: 2
  stdout: ''
  stderr: 'swarmlab: no such file: does-not-exist.txt\n'
```

### 4. The Tester's own R10 clause file passes

The Tester wrote `tests/test_cli.py` in this round (it covers R5 and R10). It is not my file and I did
not touch it; it is evidence about my implementation, not about my own test.

```
> & "...\python.exe" -m unittest tests.test_cli -v
test_two_files_produce_two_summary_blocks_and_exit_zero ... ok
test_each_file_is_identified_in_the_output ... ok
test_the_blocks_are_printed_in_the_order_the_files_were_given ... ok
test_reversing_the_arguments_reverses_the_order_of_the_blocks ... ok
test_the_first_missing_file_stops_the_run_and_keeps_the_earlier_summaries ... ok
test_only_the_first_missing_file_is_reported ... ok
test_the_summary_is_printed_and_the_run_exits_zero ... ok
test_the_summary_reports_the_tokens_of_the_fixture ... ok
test_a_missing_file_exits_two_with_the_message_on_stderr ... ok
test_a_missing_file_prints_nothing_on_stdout ... ok
Ran 10 tests in 0.934s
OK
exit=0
```

### 5. The whole suite still exits 0

```
> & "...\python.exe" -m unittest discover -s tests -t .
......
----------------------------------------------------------------------
Ran 54 tests in 1.549s

OK
exit=0
```

The other clause files of this round (written by the Tester) also pass:

```
> & "...\python.exe" -m unittest tests.test_text tests.test_stats tests.test_report
Ran 35 tests in 0.003s
OK
exit=0
```

This closes the gap I reported in the R2 report: the clause files that did not exist then now exist and
pass, so R1–R4 now carry their clause evidence as well.

## R9 evidence — the R1 to R5 behaviour did not change

The single-file run is byte-identical to the R2 baseline recorded in
`.swarm/reports/swarm-lab-developer.md:123-133`:

```
R2 baseline (report line 123-133)      now (captured above)
file: tests\fixtures\sample.txt         file: tests/fixtures/sample.txt
total: 16                               total: 16
unique: 11                              unique: 11
top tokens:                             top tokens:
  the: 4                                  the: 4
  dog: 2                                  dog: 2
  fox: 2                                  fox: 2
  and: 1                                  and: 1
  barks: 1                                barks: 1
exit=0                                  exit=0
```

(The path separator differs only because the R2 baseline was run with a backslash argument and this run
used a forward slash; the summary lines are identical.) The missing-file case is unchanged: exit `2`,
standard error exactly `swarmlab: no such file: does-not-exist.txt`, standard output empty.

No file under `tests/` was created, edited or deleted by me in this round — the modification times show
`tests/test_text.py`, `tests/test_stats.py`, `tests/test_report.py` and `tests/test_cli.py` written by
the Tester at 08:56, and the only file I touched is `swarmlab/__main__.py` at 08:55. The R9 check that
asks for `git diff --stat -- tests` is not runnable by me: git is not on PATH in this session and the
Lead owns the commits; the modification-time evidence above is what I can show.

## Quality report — before and after

```
> & "...\python.exe" tools/quality_report.py --json
{
  "annotation_coverage": 1.0,
  "avg_function_length": 5.6,
  "docstring_coverage": 1.0,
  "duplicate_line_ratio": 0.0,
  "max_function_length": 14,
  "max_nesting_depth": 2,
  "module_docstring_coverage": 1.0,
  "package_modules": 5,
  "public_function_names": [
    "main",
    "normalize_ws",
    "summarize",
    "tokenize",
    "word_frequency"
  ],
  "public_functions": 5,
  "public_functions_without_tests": [],
  "public_functions_without_tests_count": 0,
  "test_functions": 51
}
exit=0
```

Against the R2 baseline (`.swarm/reports/swarm-lab-developer.md`):

| Metric | R2 baseline | R10 now | Reading |
|---|---|---|---|
| `public_functions` | 5 | 5 | unchanged — the public surface did not grow |
| `annotation_coverage` | 1.0 | 1.0 | unchanged |
| `docstring_coverage` | 1.0 | 1.0 | unchanged |
| `module_docstring_coverage` | 1.0 | 1.0 | unchanged |
| `public_functions_without_tests_count` | 0 | 0 | unchanged |
| `duplicate_line_ratio` | 0.0 | 0.0 | unchanged |
| `avg_function_length` | 6.4 | 5.6 | shorter functions |
| `max_function_length` | 18 | 14 | shorter longest function |
| `max_nesting_depth` | 1 | 2 | **one level deeper** — see below |
| `test_functions` | 9 | 51 | the Tester's clause files, not my change |

`max_nesting_depth` went from 1 to 2 because `main` now holds a `for` loop with an early `return` inside
it. That shape is what "the first missing file stops the run" requires; a flat alternative would need a
generator expression with a side effect, which reads worse. The metric counts control nodes inside a
control node, so one loop plus one `if` reads as 2. I report it rather than hide it.

## Files changed

- `D:\project\swarm-lab-python\swarmlab\__main__.py` — rewritten (the only code file I own and changed).
- `D:\project\swarm-lab-python\.swarm\reports\swarm-lab-r10.md` — this report.

Nothing else was created, edited or deleted. No commit, no install, no new dependency, standard library
only.

## What changed in `swarmlab/__main__.py`

```python
"""Command line entry point that summarises the tokens of one or more text files."""
import pathlib
import sys

from . import report
from . import text

USAGE = "usage: python -m swarmlab <file> [<file> …]"


def _fail(message: str) -> int:
    """Print the message on standard error and return the failure exit status."""
    print(message, file=sys.stderr)
    return 2


def _print_summary(path: str) -> bool:
    """Print the summary block of the file; report whether the file could be read."""
    try:
        content = pathlib.Path(path).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return False
    summary = report.summarize(text.tokenize(content))
    print(f"file: {path}")
    print(f"total: {summary['total']}")
    print(f"unique: {summary['unique']}")
    print("top tokens:")
    for token, count in summary["top"]:
        print(f"  {token}: {count}")
    return True


def main(argv: list[str] | None = None) -> int:
    """Run the swarmlab command line and return its exit status.

    Every given file is summarised in the order it was given. The first file
    that cannot be read stops the run with status ``2``; the summaries printed
    before it stay on standard output.
    """
    args = list(sys.argv[1:]) if argv is None else list(argv)
    if not args:
        return _fail(USAGE)
    for path in args:
        if not _print_summary(path):
            return _fail(f"swarmlab: no such file: {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## Decisions and why

1. **The usage string carries the real U+2026 ellipsis.** The requirement file, the decision file and
   the task text all write `usage: python -m swarmlab <file> [<file> …]` with U+2026, so the constant is
   that character, not three dots. Verified codepoint by codepoint:
   `USAGE` ends `... 3c 3e 20 5b 3c 66 69 6c 65 3e 20 2026 5d` and the requirement line carries the same
   `2026`.
2. **One block per file, printed as the run goes.** `_print_summary` prints immediately and returns
   `False` when the file cannot be read. The run stops at the first `False`, so the summaries printed
   before it are already on standard output and nothing after it is printed — exactly what R10 asks.
3. **No blank line between blocks.** The output of a multi-file run is the concatenation of the
   single-file outputs. A separator line would be prettier but is not in the requirement, and the
   concatenation is the safest reading of "one summary block per file".
4. **The per-file summary text is untouched.** The block is the same five lines as in R2, in the same
   order, so the single-file output is unchanged (R9) and a multi-file output is a sequence of single-file
   outputs.
5. **`_print_summary` is private, so the public surface stays at five functions.** The tool counts a
   function as public when its name does not start with an underscore, so the helper is `_print_summary`
   and `main` keeps its name and signature.
6. **The usage error is still exit 2 with the usage text on standard error**, now for the empty argument
   list only. A second argument is no longer an error — that is the decision the human made.
7. **The read is unchanged** (`pathlib.Path(path).read_text(encoding="utf-8", errors="replace")`, broad
   `OSError` catch), so an unreadable path still yields the one documented failure contract.

## Limits and notes

- The `…` in the usage message is written in the console code page of the host, not UTF-8: the bytes on
  standard error are `a1 ad` under the host's cp936 code page. A text-mode reader decodes it back to
  `…` correctly (the Tester's clause file passes), but a byte-level comparison against a UTF-8 encoding
  of the string would need `PYTHONIOENCODING=utf-8`. This is a property of the Windows console, not of
  the code.
- The R9 clause "the test files from round R3 are unchanged in their assertions" is checked here by
  modification time, not by `git diff`: git is not on PATH in this session and the Lead owns the commits.
- The multi-file behaviour has no test of my own: `tests/` belongs to the Tester, and the Tester wrote
  the R10 clause file in this round, which passes.
- Acceptance of R10 is the Coordinator's decision; this report is the Developer's evidence, not an
  acceptance.
