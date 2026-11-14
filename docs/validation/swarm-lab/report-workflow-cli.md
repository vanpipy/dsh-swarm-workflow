# swarm-lab — CLI lane report (R5, R10)

Lane: `cli` · Work item: swarm-lab, round R7 · Requirement carrier:
`.swarm/requirements/swarm-lab.md` (read in full, R5 at lines 60–70, R10 at
lines 115–128).

## What this lane checked

All commands were run from `D:\project\swarm-lab-python` with the interpreter
`C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe`
(Python 3.12.14). Nothing under `swarmlab/`, `tests/`, `tools/`, the requirement
file or `D:\project\dsh-plugins` was modified; the only file created is this
report.

**Stream separation harness.** stdout and stderr were captured into two
*separate* pipes, never merged, so the two streams are proven apart. For the
byte-level runs the raw bytes were read from `StandardOutput.BaseStream` /
`StandardError.BaseStream` and decoded with codepage 936 (the process's own
`sys.stderr.encoding` is `gbk`, confirmed by
`python -c "import sys; print(sys.stderr.encoding)"` → `gbk`).

```powershell
$py = "C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $py; $psi.Arguments = '<args>'
$psi.WorkingDirectory = (Get-Location).Path
$psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$p = New-Object System.Diagnostics.Process; $p.StartInfo = $psi; [void]$p.Start()
$outMs = New-Object System.IO.MemoryStream; $errMs = New-Object System.IO.MemoryStream
$p.StandardOutput.BaseStream.CopyTo($outMs); $p.StandardError.BaseStream.CopyTo($errMs)
$p.WaitForExit()
# -> $p.ExitCode, $outMs.ToArray(), $errMs.ToArray()
```

Scenarios executed (each with stdout and stderr captured apart):

1. `python -m swarmlab` — no file given (usage path).
2. `python -m swarmlab does-not-exist.txt` — missing file, single argument.
3. `python -m swarmlab tests/fixtures/sample.txt` — success, single file.
4. `python -m swarmlab tests/fixtures/sample.txt tests/fixtures/sample.txt` — two blocks, R10 check.
5. `python -m swarmlab tests/fixtures/sample.txt does-not-exist.txt` — later file missing.
6. `python -m swarmlab does-not-exist.txt tests/fixtures/sample.txt` — first file missing.
7. `python -m swarmlab does-not-exist.txt also-does-not-exist.txt` — two missing files.
8. `python -m swarmlab README.md swarmlab/__init__.py` and the reversed order — order of blocks with two *distinct* files.
9. `python -m swarmlab tests/fixtures` — an existing **directory** as argument.
10. `python -m swarmlab tests/fixtures/sample.txt tests/fixtures README.md` — summary, then a directory, then a file.
11. `python -m unittest tests.test_cli -v` and `python -m unittest discover -s tests -t .` — the repository's own CLI clause tests and the full suite.

## Findings

### F1 — Non-blocking — `swarmlab/__main__.py:19-22` (with `:44-45`)

The failure message says `no such file` for **any** unreadable path, including a
path that exists but is a directory, so the message is not precise about the
actual cause.

Evidence — command:

```
python -m swarmlab tests/fixtures
```

Output (stdout and stderr captured apart, exit code as shown):

```
### ARGS: [-m swarmlab tests/fixtures]
EXITCODE=2
STDOUT_BEGIN<<>>STDOUT_END
STDERR_BEGIN<<swarmlab: no such file: tests/fixtures>>STDERR_END
```

The path `tests/fixtures` **does** exist — it is a directory. The underlying
exception is not "not found":

```
python -c "import pathlib; p=pathlib.Path('tests/fixtures');
try: p.read_text(encoding='utf-8', errors='replace')
except OSError as e: print('EXC_TYPE='+type(e).__name__); print('EXC_STR='+str(e))"
```

```
EXC_TYPE=PermissionError
EXC_STR=[Errno 13] Permission denied: 'tests\\fixtures'
IS_OSERROR=True
```

`_print_summary` catches bare `OSError` at `swarmlab/__main__.py:21-22` and
returns `False`, and `main` then emits `swarmlab: no such file: {path}` at
`swarmlab/__main__.py:45` for *every* `False`. The same conflation applies to
any other `OSError` subclass (a file that exists but is not readable would
also be reported as "no such file"). The exit status (2) and the stream
(stderr) are still correct, so R5 and R10 are not violated — only the wording
misleads a user who passes a directory or an unreadable file.

### F2 — Non-blocking — `swarmlab/__main__.py:8`

The usage string embeds a non-ASCII character (U+2026 HORIZONTAL ELLIPSIS), so
its rendering depends on the console/locale encoding of the machine that runs
it. In this environment the bytes are correct and round-trip exactly, so this
is a portability note rather than a defect here.

Evidence:

```
python -c "from swarmlab.__main__ import USAGE; print(ascii(USAGE)); print('codepoints='+' '.join(str(ord(c)) for c in USAGE))"
```

```
'usage: python -m swarmlab <file> [<file> \u2026]'
codepoints=117 115 97 103 101 58 32 112 121 116 104 111 110 32 45 109 32 115 119 97 114 109 108 97 98 32 60 102 105 108 101 62 32 91 60 102 105 108 101 62 32 8230 93
```

Raw bytes actually written to stderr (read from the pipe before any .NET
decoding), which decode to exactly the string the decision record
`.swarm/decisions/2026-11-11-cli-multiple-files.md:40` specifies:

```
RAW_STDERR_HEX=75 73 61 67 65 3a 20 70 79 74 68 6f 6e 20 2d 6d 20 73 77 61 72 6d 6c 61 62 20 3c 66 69 6c 65 3e 20 5b 3c 66 69 6c 65 3e 20 a1 ad 5d 0d 0a
RAW_STDERR_GBK=usage: python -m swarmlab <file> [<file> …]
```

(`a1 ad` is the GBK encoding of U+2026.) On a console whose codepage cannot
represent U+2026 the glyph would degrade, so an ASCII `...` would be more
portable.

### No findings against the specified behaviour

Everything else required by R5 and R10 was observed to be exactly as
specified; the evidence is in the requirement verdicts below. In particular:

* The error message never reaches stdout (byte-level proof in R10's verdict).
* A missing **first** file leaves stdout completely empty.
* A missing **later** file keeps the earlier summaries on stdout.
* Only the first missing file is reported; the run stops there.

## Requirement verdicts

### R5 — the package runs as a module — **met**

Requirement (`swarm-lab.md:60-70`): `python -m swarmlab <file>` prints a
human-readable summary of the file's tokens — the total, the unique count and
the five most frequent tokens — and exits `0`. A missing file prints
`swarmlab: no such file: <path>` on stderr and exits `2`.

Evidence — command `python -m swarmlab tests/fixtures/sample.txt`
(stdout and stderr captured apart):

```
EXITCODE=0
STDOUT_BEGIN<<file: tests/fixtures/sample.txt
total: 16
unique: 11
top tokens:
  the: 4
  dog: 2
  fox: 2
  and: 1
  barks: 1
>>STDOUT_END
STDERR_BEGIN<<>>STDERR_END
```

The three required numbers are present (`total: 16`, `unique: 11`, and five
`top tokens:` entries), stdout is clean and stderr is empty. The counts agree
with a hand count of the fixture
(`tests/fixtures/sample.txt`: the quick brown fox jumps over the lazy dog. /
The dog barks, and the fox runs. → 16 tokens, 11 distinct, the=4, dog=2,
fox=2, and=1, barks=1).

Evidence — command `python -m swarmlab does-not-exist.txt`:

```
EXITCODE=2
STDOUT_BEGIN<<>>STDOUT_END
STDERR_BEGIN<<swarmlab: no such file: does-not-exist.txt>>STDERR_END
```

Exit status `2`, the exact message on stderr, stdout empty. The check in
`swarm-lab.md:67-69` names both commands and both behave as specified.

Additional evidence — the repository's own clause tests for R5 pass:

```
python -m unittest tests.test_cli -v
```

```
test_the_summary_is_printed_and_the_run_exits_zero (tests.test_cli.TestSingleFileRun.test_the_summary_is_printed_and_the_run_exits_zero) ... ok
test_the_summary_reports_the_tokens_of_the_fixture (tests.test_cli.TestSingleFileRun.test_the_summary_reports_the_tokens_of_the_fixture) ... ok
test_a_missing_file_exits_two_with_the_message_on_stderr (tests.test_cli.TestSingleFileRun.test_a_missing_file_exits_two_with_the_message_on_stderr) ... ok
test_a_missing_file_prints_nothing_on_stdout (tests.test_cli.TestSingleFileRun.test_a_missing_file_prints_nothing_on_stdout) ... ok
----------------------------------------------------------------------
Ran 10 tests in 0.729s
OK
```

(R10's five additional tests are listed in R10's verdict; the same run reports
`Ran 10 tests ... OK` for the module as a whole.)

### R10 — the command line summarises several files — **met**

Requirement (`swarm-lab.md:115-128`): one summary block per file, in the order
the files were given, exit `0` when every file exists; the first missing file
stops the run, the message `swarmlab: no such file: <path>` goes to stderr, the
run exits `2`, and the summaries printed before it stay on stdout.

Evidence — command `python -m swarmlab tests/fixtures/sample.txt tests/fixtures/sample.txt`
(the literal check in `swarm-lab.md:123-124`):

```
EXITCODE=0
STDOUT_BEGIN<<file: tests/fixtures/sample.txt
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
>>STDOUT_END
STDERR_BEGIN<<>>STDERR_END
```

Two blocks, exit `0`, stderr empty.

Evidence — order with two *distinct* files, `python -m swarmlab README.md swarmlab/__init__.py`:

```
EXITCODE=0
STDOUT_BEGIN<<file: README.md
total: 228
...
file: swarmlab/__init__.py
total: 42
...
>>STDOUT_END
STDERR_BEGIN<<>>STDERR_END
```

and the reversed invocation `python -m swarmlab swarmlab/__init__.py README.md`:

```
EXITCODE=0
STDOUT_BEGIN<<file: swarmlab/__init__.py
total: 42
...
file: README.md
total: 228
...
>>STDOUT_END
STDERR_BEGIN<<>>STDERR_END
```

The block order follows the argument order in both directions.

Evidence — the literal check in `swarm-lab.md:125-127`,
`python -m swarmlab tests/fixtures/sample.txt does-not-exist.txt`, captured at
**raw byte level** with the two pipes separate:

```
EXITCODE=2
RAW_STDOUT_BYTES=file: tests/fixtures/sample.txt|total: 16|unique: 11|top tokens:|  the: 4|  dog: 2|  fox: 2|  and: 1|  barks: 1|
RAW_STDOUT_HAS_ERRORWORD=False
RAW_STDERR_BYTES=swarmlab: no such file: does-not-exist.txt|
RAW_STDERR_HAS_SUMMARYWORD=False
```

The summary of the first file survives on stdout, the message is on stderr, the
run exits `2`, and neither stream contains the other's text.

Evidence — a missing **first** file, `python -m swarmlab does-not-exist.txt tests/fixtures/sample.txt`:

```
EXITCODE=2
STDOUT_BEGIN<<>>STDOUT_END
STDERR_BEGIN<<swarmlab: no such file: does-not-exist.txt>>STDERR_END
```

stdout is empty — the later file is not summarised after the failure.

Evidence — only the first missing file is reported,
`python -m swarmlab does-not-exist.txt also-does-not-exist.txt`:

```
EXITCODE=2
STDOUT_BEGIN<<>>STDOUT_END
STDERR_BEGIN<<swarmlab: no such file: does-not-exist.txt>>STDERR_END
```

`also-does-not-exist.txt` is not mentioned and its summary is not printed.

Additional evidence — the repository's R10 clause tests pass (same run as
above):

```
test_two_files_produce_two_summary_blocks_and_exit_zero (tests.test_cli.TestMultipleFileRun.test_two_files_produce_two_summary_blocks_and_exit_zero) ... ok
test_each_file_is_identified_in_the_output (tests.test_cli.TestMultipleFileRun.test_each_file_is_identified_in_the_output) ... ok
test_the_blocks_are_printed_in_the_order_the_files_were_given (tests.test_cli.TestMultipleFileRun.test_the_blocks_are_printed_in_the_order_the_files_were_given) ... ok
test_reversing_the_arguments_reverses_the_order_of_the_blocks (tests.test_cli.TestMultipleFileRun.test_reversing_the_arguments_reverses_the_order_of_the_blocks) ... ok
test_the_first_missing_file_stops_the_run_and_keeps_the_earlier_summaries (tests.test_cli.TestMultipleFileRun.test_the_first_missing_file_stops_the_run_and_keeps_the_earlier_summaries) ... ok
test_only_the_first_missing_file_is_reported (tests.test_cli.TestMultipleFileRun.test_only_the_first_missing_file_is_reported) ... ok
```

Whole suite, for context:

```
python -m unittest discover -s tests -t .
```

```
Ran 54 tests in 1.474s
OK
```

### Usage string when no file is given — observed, not a requirement

`python -m swarmlab` with no argument:

```
EXITCODE=2
STDOUT_BEGIN<<>>STDOUT_END
STDERR_BEGIN<<usage: python -m swarmlab <file> [<file> …]>>STDERR_END
```

The usage text goes to **stderr** and stdout stays empty, with exit status `2`
(the conventional code for a usage error). The text is exactly the string
specified by `.swarm/decisions/2026-11-11-cli-multiple-files.md:40`. No
requirement in `swarm-lab.md` R5 or R10 specifies this case, so this is
recorded as observed behaviour, not as a requirement verdict.

### Source read for the failure path — `swarmlab/__main__.py`

Read in full (50 lines). The failure path is:

* `swarmlab/__main__.py:11-14` — `_fail(message)` prints to `sys.stderr` and
  returns `2`.
* `swarmlab/__main__.py:17-30` — `_print_summary(path)` reads the file inside
  `try: ... except OSError: return False` (`:19-22`), otherwise prints the
  block `file:` / `total:` / `unique:` / `top tokens:` + five entries (`:24-29`).
* `swarmlab/__main__.py:40-42` — no arguments → `_fail(USAGE)`.
* `swarmlab/__main__.py:43-46` — the loop over `args`; the first `False`
  returns `_fail(f"swarmlab: no such file: {path}")` and stops the run
  (`:44-45`).
* `swarmlab/__main__.py:49-50` — `sys.exit(main())` propagates the status.

**Is the error message precise?** For the case the requirement names (a file
that does not exist) it is precise and exact: the text is
`swarmlab: no such file: <path>` with the path exactly as the user typed it,
it is on stderr, and the exit status is `2`. For other `OSError` causes it is
not precise — see F1: an existing directory is reported as `no such file`.

## Not checked (and why)

* **R9 (behaviour must not change during remediation)** — not assigned to this
  lane, and its check is git-based (`git diff --stat cb51065 …`), while this
  lane is read-only over the code and forbidden from running git
  commit/add/checkout. No git evidence gathered here.
* **R1–R4, R6–R8** — not assigned to this lane. The CLI output values were
  hand-checked against `tests/fixtures/sample.txt` only to confirm the CLI
  prints the required fields; the correctness of `normalize_ws`,
  `tokenize`, `word_frequency` and `summarize` was not this lane's call.
* **The `permission denied` variant of F1 on a regular file** — not executed:
  demonstrating it needs a file whose read permission is revoked, and this
  lane may create no file other than this report. The directory case already
  raises the same `PermissionError` on this platform and is reported as
  `no such file`, so the code path is demonstrated; only the regular-file
  instance is inferred.
* **Behaviour on a console with a non-GBK codepage** — not tested; the only
  encoding available here is cp936/gbk, where the usage string is byte-exact.
* **Non-Windows behaviour of the directory case** — not tested; on POSIX the
  exception would be `IsADirectoryError` rather than `PermissionError`, but
  both are `OSError` and both would be reported as `no such file`.
* **No modification of `swarmlab/`, `tests/`, `tools/` or the requirement
  file was made or attempted.**

## Suggested remediation

Minimal and concrete; neither change alters the behaviour R5, R10 or R9
require.

1. **Make the failure message match the cause (F1)** — in
   `swarmlab/__main__.py`, distinguish the reason instead of catching bare
   `OSError`. The smallest change that keeps the required text for the
   required case:

   ```python
   # swarmlab/__main__.py:17-22
   def _print_summary(path: str) -> str:
       """Print the summary block of the file; return "" on success or an error message."""
       try:
           content = pathlib.Path(path).read_text(encoding="utf-8", errors="replace")
       except FileNotFoundError:
           return f"swarmlab: no such file: {path}"
       except IsADirectoryError:
           return f"swarmlab: not a file: {path}"
       except PermissionError:
           return f"swarmlab: cannot read: {path}"
       except OSError as error:
           return f"swarmlab: cannot read: {path} ({error.strerror})"
       ...
       return ""
   ```

   and in `main` (`swarmlab/__main__.py:43-46`) use the returned message:

   ```python
   for path in args:
       error = _print_summary(path)
       if error:
           return _fail(error)
   ```

   The `FileNotFoundError` branch keeps the exact required string
   `swarmlab: no such file: <path>`, so R5 and R10 keep holding; the exit
   status stays `2` and the message stays on stderr. The existing clause
   tests in `tests/test_cli.py:53-61` and `:107-118` must still pass
   unchanged — add one case for the directory path to pin the new wording.

   A still smaller variant, if only the directory case matters: keep the
   `except OSError` and add `except IsADirectoryError` **before** it.

2. **Optional portability of the usage string (F2)** — replace the U+2026
   ellipsis in `swarmlab/__main__.py:8` with an ASCII `...` so the usage text
   renders identically on every console codepage. This changes only the usage
   text, which no requirement fixes; if the human wants the ellipsis kept,
   leave `swarmlab/__main__.py:8` as it is.
