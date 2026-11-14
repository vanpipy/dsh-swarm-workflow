# craft-lab — control arm report

Arm: **control arm** (specification only).
Work directory: `D:\project\swarm-craft-lab\control-arm\`.
Specification: `D:\project\swarm-craft-lab\spec\textnorm-spec.md` (read in full before any code was written).

---

## 1. What you built

### Files

| Path (relative to `control-arm/`) | What it holds |
| --- | --- |
| `textnorm/__init__.py` | The package: `normalize`, `stats`, and the punctuation table they use. |
| `textnorm/cli.py` | The command line: `build_parser()`, `main(argv=None) -> int`, `EXIT_OK`, `EXIT_ERROR`. |
| `textnorm/__main__.py` | The `python -m textnorm` entry point; calls `sys.exit(main())`. |
| `tests/__init__.py` | Makes `tests` a package, which the discovery command in the acceptance criteria needs. |
| `tests/test_normalize.py` | 23 tests for `normalize` (whitespace, punctuation, whole texts). |
| `tests/test_stats.py` | 21 tests for `stats` (keys, characters, words, lines). |
| `tests/test_cli.py` | 11 tests for the command line (8 run it as a program, 3 call `main` directly). |
| `tests/fixtures/sample.txt` | Two-line fixture with typographic quotes and dashes; a trailing newline. |
| `demo.txt` | The file I created for the command-line acceptance check. |

Nine files in total; standard library only, no third-party dependency, no packaging metadata.

### Public surface

The package exports exactly the two names the specification documents:

```text
textnorm.normalize(text: str) -> str
textnorm.stats(text: str) -> dict
```

`textnorm/__init__.py` sets `__all__ = ["normalize", "stats"]` and does **not** import the CLI module, so
the command line stays out of the package's namespace. Observed on the host:

```text
$ python -c "import textnorm; print(sorted(n for n in dir(textnorm) if not n.startswith('_'))); print(textnorm.__all__)"
['normalize', 'stats']
['normalize', 'stats']
```

The command line is the third documented entry point: `python -m textnorm <file>`, implemented by
`textnorm/__main__.py` on top of `textnorm.cli.main()`. `textnorm.cli` is reachable as a module but is
not part of the exported surface of `textnorm`.

Behaviour of the two functions, as implemented:

* `normalize` folds the six typographic characters (U+2018, U+2019, U+201C, U+201D, U+2013, U+2014)
  into their ASCII counterparts and then reduces every run of whitespace to one plain space, with no
  leading or trailing space.
* `stats` returns a dict with exactly the keys `chars`, `words`, `lines`: `chars` and `words` count the
  **normalised** text, `lines` counts the **original** text.

---

## 2. The decisions the specification left open

Each row: what the specification is silent about, what I chose, and why.

| # | Open point | Choice | Reason |
| --- | --- | --- | --- |
| 1 | Which characters count as "every Unicode whitespace character". | Python's own whitespace set, i.e. what `str.split()` treats as a separator: the Unicode `White_Space` property plus `U+001C`–`U+001F`. The non-breaking space `U+00A0`, the ideographic space `U+3000`, the thin and narrow spaces, tabs and line breaks are all included. | The specification names the non-breaking space, tabs and line breaks as examples ("That includes …"), and this set is the one a reader of the specification would expect a Python implementation to use. The set is a superset of the specification's examples, so no named example is missed. |
| 2 | The zero-width space `U+200B` is not whitespace by any of these rules. | It is left in place, so it also counts as a character. | It is not whitespace in Unicode and not whitespace in Python; the specification does not list it, and folding it would be an extra rule it never states. |
| 3 | Which characters count as a line break for `lines` ("split on universal newlines (`\r\n`, `\r`, `\n` all count)"). | `str.splitlines()`: `\r\n`, `\r`, `\n`, `\v`, `\f`, `U+001C`–`U+001E`, `U+0085`, `U+2028`, `U+2029`. | The three edge rules the specification states (a trailing newline does not add an empty line; empty text has zero lines; a text of only spaces has one line) are exactly `splitlines()` semantics. The parenthetical reads as a clarification of the common cases, in the same way the earlier parenthetical names examples rather than an exhaustive list. The two readings differ **only** for `\v`, `\f`, `U+001C`–`U+001E`, `U+0085`, `U+2028` and `U+2029`, which the specification does not mention either way. |
| 4 | The specification says the package has "three public functions" but then documents two functions plus a command line. | Two exported names (`normalize`, `stats`); the command line is the third entry point but is not a function of the package. | The specification's own headings and code blocks name exactly `normalize` and `stats`, and the third item it describes is a program, not a function. Counting the program as a "public function" would export a name the specification never gives. |
| 5 | The type of the dict `stats` returns. | Annotated `-> dict`, exactly as written in the specification (not `dict[str, int]`). | The specification writes the signature literally; matching it keeps the implementation comparable with the text. |
| 6 | How the command line reads the file. | `open(path, "r", encoding="utf-8", newline="")`. | "Reads the file as UTF-8" is taken literally: no `utf-8-sig`, so a byte-order mark is not stripped and remains a character. `newline=""` leaves the line endings in the text as they are, so `lines` counts the lines of the file rather than of a translated copy. |
| 7 | A file that exists but cannot be decoded as UTF-8. | The same handling as a missing file: `textnorm: no such file: <path>` on stderr, nothing on stdout, exit code 2. | The specification says "If the file cannot be read", and an undecodable file cannot be read as the specification requires. It defines exactly one failure message, so an undecodable file gets that message. |
| 8 | The command line with no file argument. | argparse prints its usage message on stderr and exits 2. | The specification is silent. argparse's usage-error exit code is 2, which matches the exit code the specification reserves for a failure. |
| 9 | Two dashes next to each other, e.g. `a—–b`. | `a--b`: each dash becomes one hyphen; only runs of **whitespace** collapse. | The specification collapses whitespace runs and folds each typographic character into one ASCII character; it never says that adjacent folds merge. |
| 10 | Whether the package needs packaging metadata (`pyproject.toml`, `setup.py`). | None. | The specification describes an in-directory package that is run and tested from its own directory; the acceptance criteria run both the tests and the module from that directory. |
| 11 | The end-of-line bytes of the three output lines on stdout. | Whatever `print()` produces on the host. | The specification gives the content of the lines, not their byte-level terminator. On this Windows host the bytes end with `\r\n`; on POSIX they would end with `\n`. The lines are separated by a newline either way. |
| 12 | A file for the command-line acceptance check. | `demo.txt` in `control-arm/`. | The acceptance criterion asks for "a file you create"; this one carries typographic quotes, an em dash, a tab and a non-breaking space, so the run exercises more than plain ASCII. |

---

## 3. How you checked it

Every command below was run with the working directory `D:\project\swarm-craft-lab\control-arm` and the
interpreter `C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe`
(Python 3.12.14; there is no `python` on PATH on this host).

### 3.1 The test suite — acceptance criterion 1

```text
$ & "C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" -m unittest discover -s tests -t .
.......................................................
----------------------------------------------------------------------
Ran 55 tests in 6.391s

OK
EXITCODE=0
```

The same run with `-v` lists all 55 test ids, each ending in `ok`
(`tests.test_normalize`, `tests.test_stats`, `tests.test_cli`). `tests/fixtures/` holds no test module,
so discovery skips it without an error.

### 3.2 The command line — acceptance criterion 2

```text
$ & "C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" -m textnorm demo.txt
chars: 84
words: 17
lines: 2
EXITCODE=0
```

`demo.txt` holds two lines:

```text
“Hello,” said the fox — and left.
  A second line	with a tab and a non‑breaking space.
```

The three counts were re-derived by a separate script that **does not import `textnorm`** (it folds the
six characters one by one, maps whitespace with `str.isspace()`, and splits lines on `\r\n|\r|\n`):

```text
normalised: '"Hello," said the fox - and left. A second line with a tab and a non\u2011breaking space.'
chars: 84
words: 17
lines: 2
```

The independent computation agrees with the program. The same script re-derived the fixture's counts
(`chars: 47`, `words: 9`, `lines: 2`) that `tests/test_cli.py` pins as literals, so those expected values
are not copies of the implementation's output.

### 3.3 The failure path of the command line

```text
$ python -m textnorm no-such-file.txt
EXITCODE=2
STDOUT=[]
STDERR=[textnorm: no such file: no-such-file.txt]
```

captured with `subprocess` to see the exact bytes:

```text
rc= 2
stdout= ''
stderr= 'textnorm: no such file: no-such-file.txt\n'
```

### 3.4 The public surface — acceptance criterion 3

```text
$ python -c "import textnorm; print(sorted(n for n in dir(textnorm) if not n.startswith('_'))); print(textnorm.__all__)"
['normalize', 'stats']
['normalize', 'stats']
EXITCODE=0
```

### 3.5 Checks made to fail on purpose

A check that has never been seen to fail is a claim, not a check. I mutated the implementation twice,
ran the suite against each mutation, and then restored the original file. Both mutations were reverted
and the suite was re-run green afterwards.

**Mutation A** — the em dash mapped to two hyphens instead of one
(`"\u2014": "--"` in `textnorm/__init__.py`):

```text
FAIL: test_quotes_and_dashes_are_folded_inside_a_word
AssertionError: '"don\'t--stop"' != '"don\'t-stop"'
FAIL: test_a_whole_text_is_normalised_in_one_step
AssertionError: '"Smart" -- quotes\'' != '"Smart" - quotes\''
----------------------------------------------------------------------
Ran 55 tests in 6.479s

FAILED (failures=6)
EXITCODE=1
```

**Mutation B** — the line count taken from the normalised text instead of the original
(`len(normalized.splitlines())` in `textnorm/__init__.py`):

```text
FAIL: test_lines_counts_the_lines
AssertionError: 1 != 3
FAIL: test_text_of_only_spaces_has_one_line
AssertionError: 0 != 1
----------------------------------------------------------------------
Ran 55 tests in 5.586s

FAILED (failures=10)
EXITCODE=1
```

After both mutations were reverted:

```text
----------------------------------------------------------------------
Ran 55 tests in 6.391s

OK
EXITCODE=0
```

So the suite does discriminate on the punctuation folding and on the original-versus-normalised line
count: both behaviours are pinned by tests that fail when the behaviour is broken.

### 3.6 File hygiene

A byte-level scan of every file in `control-arm/` (the generated `__pycache__` directories were removed
afterwards, so the tree holds only the nine listed files):

```text
demo.txt                                      bytes=    95 crlf=0 cr=0
tests/__init__.py                             bytes=   139 crlf=0 cr=0
tests/fixtures/sample.txt                     bytes=    56 crlf=0 cr=0
tests/test_cli.py                             bytes=  3934 crlf=0 cr=0
tests/test_normalize.py                       bytes=  3741 crlf=0 cr=0
tests/test_stats.py                           bytes=  3334 crlf=0 cr=0
textnorm/__init__.py                          bytes=  2609 crlf=0 cr=0
textnorm/__main__.py                          bytes=   130 crlf=0 cr=0
textnorm/cli.py                               bytes=  1642 crlf=0 cr=0
```

Every file is LF-only (`crlf=0`, `cr=0`).

### 3.7 Commands that were **not** used

No git command was run; the Lead commits. No file outside `control-arm/` was written except this report.

---

## 4. What you did not check

The boundary of this work — what the checks above do **not** cover.

* **The hidden case set.** It lives outside the repository and I never saw it. Every check above is
  derived from the text of the specification; it does not show that the implementation agrees with the
  hidden cases on any input they contain. Where the specification is silent (§2, rows 1, 3, 7, 8), a
  hidden case could reasonably expect the other reading.
* **Other Python versions.** The suite ran on CPython 3.12.14 only. `str.splitlines()`, `str.split()` and
  `str.maketrans()` are long-stable, but I did not run the suite on another interpreter, and I did not
  check whether the Unicode tables of another version would move a character in or out of the whitespace
  set.
* **Other platforms.** This host is Windows: stdout bytes end with `\r\n`, and the path separator in the
  error message is whatever the caller typed. I did not test POSIX, where the stdout terminator would be
  `\n`.
* **Installation and packaging.** There is no `pyproject.toml`; I checked only "run and test from the
  package's own directory". Importing `textnorm` from another working directory, or installing it, was
  not tested and is not supported by the files as they stand.
* **Input shapes outside the specification.** A file with a UTF-8 byte-order mark (kept as a character, by
  decision §2 row 6), a file that is a directory (covered: exit 2), a file with no read permission, a
  named pipe, an empty file (covered by the unit tests), a file of many megabytes (the whole file is read
  into memory), and a file whose content is not valid UTF-8 (covered: exit 2 with the same message as a
  missing file).
* **Command-line surface beyond the one positional argument.** Extra arguments, `--help`, and option
  parsing in general are argparse defaults; only the missing-file path and the no-argument path were
  exercised.
* **Static analysis, linting, type checking and coverage.** No tool of that kind was run: the constraint
  is the standard library only, and no checker is part of it. The line counts in this report are the
  test runner's own, not a coverage measurement, so the suite may well leave branches unexercised.
* **The other arm.** I did not look at the craft arm's package, its report, or its numbers; the two arms
  were kept apart, and no comparison was made.
