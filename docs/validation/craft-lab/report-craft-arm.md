# craft-lab — craft arm report (Developer lane)

Work item: implement the `textnorm` package from `spec/textnorm-spec.md` in
`craft-arm/`. Arm: **craft** (this lane read the three craft files and applied
them). Scope of the work: `craft-arm/` plus this report. No other path in the
repository was written, and nothing under `swarm-craft-lab-hidden/` was read.

---

## 1. What I read, and what each rule changed

I loaded the three craft files with the skill tool before writing any code:
`swarm-craft-shared`, `swarm-craft-developer`, `swarm-craft-python` (the same
content ships at `D:\project\dsh-plugins\dsh-swarm-workflow\skills\swarm-engineering\shared.md`,
`…\developer.md` and `…\languages\python.md`). I also read the whole
specification (`spec/textnorm-spec.md`, 64 lines) and the requirement set
(`.swarm/requirements/craft-lab.md`).

### shared.md

| Section | Rule | What it changed in the code |
|---|---|---|
| §2.1 Make the check falsifiable | "After you write a check, make it fail on purpose and show that it fails" | Every test asserts an exact expected value, not a truthy result. The suite was re-run against a deliberately broken copy of the package — see §4 below. |
| §2.2 Re-derive every number a second way | "compute it again by a different route: a second tool, a different algorithm, a hand count" | The published counts for `sample.txt` (37 / 8 / 2) were re-derived by a separate script that normalises character by character with an explicit mapping table instead of the package's regex — the two agree. |
| §2.3 Validate where the artifact runs | "The consumer is the environment: the artifact must be validated where it will actually be used" | The suite and the CLI were run from `craft-arm/` with the same interpreter the specification names, and one test spawns `python -m textnorm` with `cwd` set to `craft-arm/`, so the check runs where the artifact runs. |
| §3.1 Boundaries and modules | "A module has one reason to change"; "The public surface is a promise" | Three internal modules, each with one reason to change (`_normalization.py` — which characters are rewritten; `_counting.py` — where each count comes from; `_cli.py` — what is printed and what the exit code is). The package namespace holds exactly the three public names; everything else is underscore-prefixed and free to change. |
| §3.3 Errors, exit codes and streams | "One diagnostic per failure, on stderr. Results go to stdout."; "Exit codes are a contract" | `EXIT_SUCCESS = 0` and `EXIT_CANNOT_READ_FILE = 2` are named constants; the three counts go to stdout, the one diagnostic line goes to stderr, and stdout stays empty on failure. |
| §3.7 Input, output and the outside world | "Encoding is explicit. Never rely on the platform default." | The file is read with `Path(path).open("r", encoding="utf-8", newline="")` — never `Path.read_text()`, never the platform default. |
| §3.9 Tests and test design | "One behaviour per test, and the name states the behaviour"; "Cover the boundaries: empty, one, many, … unicode, malformed" | 33 tests over three modules; empty text, single character, many words, the full Unicode whitespace range, invalid UTF-8 and a missing file are all covered. Where the wording *is* the contract (the three printed lines, the error line) the test pins the exact string. |
| §3.12 Naming, comments and documentation | "A comment explains why; the code says what" | Module docstrings say what each module owns; the comments that exist explain *why* the regex order in `_LINE_BREAK` matters and why the trailing empty segment is dropped — not what the code does. |

### developer.md

| Section | Rule | What it changed in the code |
|---|---|---|
| §2 Name the target before the edit | "Name every file the change touches, before the first edit, with the behaviour each file carries" | The file list and each file's behaviour were fixed before the first write (see §2 of this report). The files deliberately *not* touched are: the specification, the requirement set, the README, the control arm's report and everything outside `craft-arm/`. |
| §3 Shape the change | "settle the input, the output and the failure mode in the signature before the body" | `normalize(text: str) -> str`, `stats(text: str) -> dict[str, int]` and `main(argv: Sequence[str] | None = None) -> int` were written with their failure channel first: `main` returns an exit code rather than raising, and only `SystemExit` from argparse escapes. |
| §4 Make the code say what it means | "A docstring is a promise to the caller: the contract, the arguments, the return value, the failure modes." | Every public function carries a docstring with Args / Returns / Raises; the internal helpers carry one too. |
| §5 Prove it as you go | "Make it fail on purpose, show that it fails, and report the failing observation."; "Run the check again after the last edit" | The mutation run in §4 (11 failures, exit 1) and the final clean run after the last edit (33 tests, exit 0) are both reported. |

### languages/python.md

| Section | Rule | What it changed in the code |
|---|---|---|
| §1 The surface | "`X | Y` in an annotation is evaluated at runtime on Python 3.9, so it needs either Python 3.10 or `from __future__ import annotations`"; "guard the entry point with `if __name__ == \"__main__\":`" | `from __future__ import annotations` is imported in the three modules that carry annotations, so the package stays 3.9-safe; `__main__.py` is guarded so importing it does not run the command. |
| §7 Resources | "`with` for every resource"; "`tempfile.TemporaryDirectory()` over `mkdtemp()`" | The file handle is opened with `with`; every test that touches the filesystem uses `TemporaryDirectory()`, so no test writes into the repository. |
| §8 Files and paths | "`Path` objects … The platform default encoding is not a contract." | All path handling goes through `pathlib.Path`; the read is `Path(path).open("r", encoding="utf-8", newline="")`. `newline=""` keeps the line breaks exactly as they are in the file, which is what the line count depends on. (`Path.read_text()` has no `newline` parameter before Python 3.13, so `open()` is the portable form.) |
| §9 The shell and the outside world | "an argument list, never a shell string" | The subprocess test calls `subprocess.run([sys.executable, "-m", "textnorm", *arguments], …)` — a list, no shell. |
| §12 Testing | "one test module per source module"; "Table-driven cases … `subTest`"; "Assert on the behaviour" | `tests/test_normalization.py`, `tests/test_counting.py` and `tests/test_cli.py` map onto the three modules; the whitespace table and the universal-newline table are driven with `subTest`. |
| §13 The command line | "`argparse`"; "Exit 0 on success, a documented non-zero on failure, and the message on stderr." | The parser is built by `_build_parser()` with `prog="python -m textnorm"`; success is 0, an unreadable file is 2, and the diagnostic is on stderr. |
| §15 Style, naming and docstrings | "One leading underscore marks a name as internal."; "`UPPER_CASE` for constants" | `_normalization`, `_counting`, `_cli`, `_count_lines`, `_read_text`, `_build_parser` are internal; `EXIT_SUCCESS`, `EXIT_CANNOT_READ_FILE`, `_TYPOGRAPHIC_TO_ASCII`, `_TRANSLATION`, `_WHITESPACE_RUN`, `_LINE_BREAK` are constants. |
| §19 The common traps | "Reporting every `OSError` as 'not found' — a permission error is not a missing file." | **This is the one place where I knowingly follow the specification over the craft file.** The specification says that a file that "cannot be read" exits 2 and writes exactly `textnorm: no such file: <path>`. A permission error is a file that cannot be read, so the specification's wording covers it, and I catch `OSError` (missing file, directory, permission) and `UnicodeDecodeError` together. The tension is real and I record it here rather than hiding it: the message says "no such file" for a file that does exist but cannot be read. I did not narrow the catch, because narrowing it would leave an unhandled traceback on the exact path the specification defines. |

---

## 2. What I built

All files are under `D:\project\swarm-craft-lab\craft-arm\`, UTF-8, LF line
endings (verified: 0 CR bytes in every file).

### The package — `craft-arm/textnorm/`

| File | Behaviour it carries |
|---|---|
| `__init__.py` | The public surface: re-exports `normalize`, `stats`, `main`; `__all__ = ["main", "normalize", "stats"]`. |
| `__main__.py` | The entry point behind `python -m textnorm`; guarded with `if __name__ == "__main__": sys.exit(main())`. |
| `_normalization.py` | Which characters textnorm rewrites: the whitespace run `re.sub(r"\s+", " ")` and the translation table for the four typographic quotes, the en dash and the em dash. `normalize(text) -> str`. |
| `_counting.py` | Where each count comes from: `chars` and `words` from the normalised text, `lines` from the **original** text split on `\r\n`, `\r`, `\n`. `stats(text) -> dict[str, int]`. |
| `_cli.py` | What the command prints and what it exits with: `main(argv=None) -> int`, the two exit-code constants, the argument parser, and the file read. |

### The tests — `craft-arm/tests/`

`tests/__init__.py` (a package marker, needed by `unittest discover -s tests -t .`),
`tests/test_normalization.py` (13 tests), `tests/test_counting.py` (11 tests),
`tests/test_cli.py` (9 tests). Standard library only; 33 tests in total.

### The demo file — `craft-arm/sample.txt`

The file the acceptance check runs the command on. Two lines, with a
typographic apostrophe, typographic double quotes, an em dash and a trailing
newline:

```
It’s a “test” — of text.
Second line.
```

### The public surface

```
>>> import textnorm
>>> textnorm.__all__
['main', 'normalize', 'stats']
>>> sorted(n for n in dir(textnorm) if not n.startswith('_'))
['main', 'normalize', 'stats']
```

- `normalize(text: str) -> str` — the normalised text.
- `stats(text: str) -> dict[str, int]` — exactly the keys `chars`, `words`, `lines`.
- `main(argv: Sequence[str] | None = None) -> int` — the command line, returning the exit code.

Nothing else is public: the three implementation modules are underscore-named
and their helpers are private.

---

## 3. The decisions the specification left open

The specification says "where it is silent, the implementer chooses and says so
in the report". These are the choices I made.

1. **The third public function is `main(argv=None) -> int`.** The specification names
   "three public functions and a command line" but documents only `normalize` and
   `stats`. I read the third function as the entry point behind the command line,
   and named it `main` (the conventional name, and the one the guard in
   `__main__.py` calls). It returns the exit code instead of calling `sys.exit`, so
   it can be called from a test without ending the process.
2. **The package namespace holds exactly the three names.** The implementation
   modules are `_normalization`, `_counting` and `_cli`, so importing `textnorm`
   exposes nothing else. I also left `from __future__ import annotations` out of
   `__init__.py` (it carries no annotations): that import binds a visible
   `annotations` name in the module namespace, which would have made
   `dir(textnorm)` show a fourth public name. The future import is present in the
   three modules that do carry annotations.
3. **"Every Unicode whitespace character" is Python's whitespace set** — the set
   `re` matches with `\s`, which is the same set `str.isspace()` and `str.split()`
   use. The normaliser uses `re.sub(r"\s+", " ")` and the word counter uses
   `str.split()`, so the two agree about where a word starts and ends by
   construction. U+FEFF (the byte order mark) is **not** in that set, so a BOM is
   counted as a character (see §5).
4. **Lines are split on `\r\n`, `\r` and `\n` only** — the three the specification
   enumerates — not on Python's wider `str.splitlines()` set, which would also
   break on `\v`, `\f`, `\x1c`–`\x1e`, `\x85`, `U+2028` and `U+2029`.
   The split is done with `re.split(r"\r\n|\r|\n", text)`, in that order, so a
   CRLF counts as one break and not two.
5. **"A trailing newline does not add an empty line."** I read a line break as
   *ending* a line: `"a\nb\n"` has 2 lines, `"a\n\nb"` has 3 lines (the blank
   line between them counts), and `"\n"` has 1 line (an empty one). Empty text
   has 0 lines; text of only spaces has 1 line, 0 characters and 0 words.
6. **"A file that cannot be read" means any `OSError` or a UTF-8 decode error** —
   a missing file, a directory, a permission error, or bytes that are not UTF-8.
   All of them exit 2 with the specified line. This is the place where the
   specification and the Python craft file disagree (see §1, python.md §19).
7. **A malformed command line is argparse's business.** No file given, or more
   than one file given: argparse writes its usage line to stderr and exits 2,
   with nothing on stdout. The specification does not describe this case.
8. **The three lines are printed in the order the specification lists the keys**:
   `chars`, then `words`, then `lines`.
9. **The command prints ASCII only.** The counts and the error line are ASCII;
   the path in the error line is echoed as given. On this host the console
   encoding is GBK, so ASCII-only output cannot raise `UnicodeEncodeError` even
   when the file content is non-ASCII (the content is never echoed).
10. **No `pyproject.toml`, no `src/` layout.** The specification's test command
    is run "from the directory that holds the package", so the package has to be
    importable from that directory. A `src/` layout would put it one level
    deeper and break the specified command. The package is therefore a plain
    source directory; it is not an installable distribution.
11. **`sample.txt` stays in `craft-arm/`** as the file the acceptance check runs
    the command on. It is the only file in the deliverable that is not part of
    the package or the tests.

---

## 4. How I checked it

Interpreter: `C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe`
(Python 3.12.14). There is no `python` on PATH on this host.

### 4.1 The test suite (acceptance criterion 1)

```
> & "C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" -m unittest discover -s tests -t .
```
run with the working directory `D:\project\swarm-craft-lab\craft-arm`.

Output (stdout is empty; unittest writes its report to stderr):

```
................................. (33 dots)
----------------------------------------------------------------------
Ran 33 tests in 0.275s

OK
```

**Exit code: 0.** The suite reports the tests it ran (`Ran 33 tests`).

### 4.2 The command line (acceptance criterion 2)

```
> & "…\python.exe" -m textnorm sample.txt
chars: 37
words: 8
lines: 2
```
**Exit code: 0.** stdout is exactly the three documented lines
(`"chars: 37\nwords: 8\nlines: 2\n"`, 27 bytes), stderr is empty (0 bytes).

The three numbers were re-derived by hand and by a second, independent script
that normalises character by character with an explicit mapping table rather
than with the package's regex (`shared.md` §2.2): both give
`chars: 37 words: 8 lines: 2` — the normalised text is
`It's a "test" - of text. Second line.` (37 characters, 8 space-separated
words, and 2 lines in the original because the trailing newline ends the last
line rather than starting another one).

### 4.3 The failure path of the command line

```
> & "…\python.exe" -m textnorm no-such-file.txt
```
stdout: 0 bytes. stderr:
```
textnorm: no such file: no-such-file.txt
```
**Exit code: 2.** The path in the message is the path as given on the command
line.

### 4.4 The public surface and the line endings

```
>>> import textnorm
>>> textnorm.__all__
['main', 'normalize', 'stats']
>>> sorted(n for n in dir(textnorm) if not n.startswith('_'))
['main', 'normalize', 'stats']
```

A byte scan of every file in `craft-arm/` (excluding `__pycache__`) reports
**0 CR bytes** in each of them — all files are LF.

### 4.5 The check made to fail on purpose (`shared.md` §2.1, `developer.md` §5)

A check that has never been seen fail is a claim, not a check. I copied the
package and the tests to `craft-arm/_mutation-check/` and introduced two
deliberate defects in the copy:

1. `0x2014` (the em dash) was removed from the translation table, so the em dash
   would no longer become a hyphen.
2. `stats()` counted the lines on the *normalised* text instead of the original
   text.

The same suite, run in that copy, failed:

```
> & "…\python.exe" -m unittest discover -s tests -t .
F...F..FFFF..FFF.F...........F.....
----------------------------------------------------------------------
Ran 33 tests in 1.751s

FAILED (failures=11)
```

**Exit code: 1.** The 11 failures are exactly the checks that should catch those
two defects — `test_the_em_dash_becomes_a_single_hyphen` for the first, and the
line-count tests (`test_lines_are_counted_on_the_original_text`,
`test_a_trailing_newline_does_not_add_an_empty_line`,
`test_every_universal_newline_ends_a_line`,
`test_a_blank_line_between_two_lines_counts`,
`test_a_text_of_only_spaces_has_one_line_and_no_characters`,
`test_a_text_of_only_a_newline_has_one_empty_line`) plus the two CLI tests for
the second, with the expected diffs:

```
AssertionError: 'chars: 13\nwords: 3\nlines: 1\n' != 'chars: 13\nwords: 3\nlines: 2\n'
AssertionError: 'a??b' != 'a-b'
```

(The em dash in the actual value did not survive this host's GBK console and
printed as the two replacement characters shown above; the test compared the
normalised em dash against `a-b`.)

The mutated copy was then deleted, and the suite was run again in
`craft-arm/` after the last edit to the code: 33 tests, `OK`, exit code 0.

### 4.6 Other paths probed (not part of the suite)

| Input | Result |
|---|---|
| A file with invalid UTF-8 bytes | exit 2, stdout empty, stderr `textnorm: no such file: <path>` |
| A UTF-8 file that starts with a BOM (`U+FEFF`) | exit 0, `chars: 6` — the BOM is counted as a character, because U+FEFF is not whitespace in Python |
| A UTF-8 file with non-ASCII letters (`héllo wörld`) | exit 0, `chars: 11 words: 2 lines: 1` |
| A directory instead of a file | exit 2, stdout empty, stderr `textnorm: no such file: <path>` |

---

## 5. What I did not check — the boundary

- **The hidden case set (requirement R5) is outside the repository.** I did not
  read it and I did not run it. Everything above is evidence about this
  implementation against the written specification, not about the hidden cases.
- **The control arm (requirements R3 and R6).** I did not build it, did not
  compare against it and did not read the control arm's report. The measurement
  the experiment asks for is the Lead's to make; this report offers the craft
  arm's numbers and the craft rules that produced them.
- **The requirement set, the specification and the README were read, not
  edited.** I did not check whether the requirement file's wording matches the
  specification's; where they differ, I followed the specification, which is the
  more detailed document.
- **Permission errors were not reproduced.** The "cannot be read" path was
  exercised with a missing file, a directory and an invalid-UTF-8 file. A file
  that exists but cannot be opened because of its ACL takes the same branch by
  construction (the same `except OSError`), but I did not create such a file to
  watch it happen.
- **The BOM behaviour is a decision, not a checked requirement.** The
  specification says "reads the file as UTF-8", and plain UTF-8 keeps the BOM as
  a character. Reading with `utf-8-sig` would drop it. I kept the literal
  reading of the specification and reported the resulting number; if the hidden
  cases expect the BOM to be dropped, this implementation will differ.
- **No performance claim.** Nothing was measured beyond the suite's runtime
  (~0.3 s for 33 tests, most of it the exhaustive whitespace sweep over
  `U+0000`–`U+10FFF`). No large-file behaviour was tested, and none is claimed.
- **One platform only.** Everything ran on this Windows host with Python 3.12.14
  and a GBK console encoding. The code itself is platform-independent (the read
  uses `newline=""`, so the line count never depends on the platform's newline
  translation), but I did not run it on another platform or on another Python
  version; the 3.9 floor is a consequence of `from __future__ import annotations`
  and was not tested on 3.9.
- **A path that cannot be encoded in the console encoding** (for example a file
  name containing a character the GBK console cannot encode) would raise
  `UnicodeEncodeError` while printing the error line. The content of a file is
  never echoed, so this can only happen through the path; I did not construct
  that case.
- **The requirement that the report itself follow the craft contract** was
  checked by reading it back against the brief; the Lead's acceptance of the
  report is not mine to claim.
