# Python lane report — `ledger`

Work item: `mixed-lab`. Lane: Python. Status: implemented and checked.

All commands below were run with `workdir = D:\project\swarm-mixed-lab` and this
interpreter (there is no `python` on PATH on this host):

```
C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe
```

which reports Python 3.12.14.

---

## 1. What you read

| File | Read as |
| --- | --- |
| `D:\project\swarm-mixed-lab\docs\contract.md` | the contract; the only source of truth for behaviour |
| `D:\project\swarm-mixed-lab\fixtures\ledger.jsonl` | the shared fixture, as bytes (319 bytes, LF only, `é` = U+00E9 precomposed) |
| `D:\project\swarm-mixed-lab\tools\oracle.md`, `tools\expected.json`, `tools\check_python.py` | the shared oracle written by another lane; the independent second method for the numbers |
| `.swarm\requirements\mixed-lab.md` | the requirement set (R1–R8) |
| craft: `swarm-craft-shared` (`skills/swarm-engineering/shared.md`) | the core |
| craft: `swarm-craft-developer` (`skills/swarm-engineering/developer.md`) | the developer's craft |
| craft: `swarm-craft-python` (`skills/swarm-engineering/languages/python.md`) | the Python idioms |

### The rule from which file shaped which decision

| Rule | File § | Where it shows up in the code |
| --- | --- | --- |
| §2.1 Make the check falsifiable | shared | Every check was made to fail on purpose (section 3, mutations A–C). One check was found *not* to discriminate — the line-ending test captured stdout in text mode, where Python translates CRLF into LF, so it could never fail; it now captures raw bytes (`assertNotIn(b"\r", result.stdout)`). |
| §2.2 Re-derive every number a second way | shared | `test_the_balance_is_the_sum_of_the_per_label_totals` re-derives 120600 by summing the per-label totals; the hand-derived oracle in `tools/oracle.md` §2–§3 is the second method for the same number, and `tools/check_python.py` compares against it independently. |
| §2.3 Validate where the artifact runs | shared | Everything was run in the repository root with the real interpreter, through the real entry point `python -m ledger <path>` (a subprocess test), not only in-process. |
| §3.1 Boundaries and modules | shared | One module, `ledger.py`, with one reason to change: the contract's ledger format. |
| §3.2 Types and contracts | shared | Parse at the boundary, trust inside: `parse_record` validates once and returns a typed `Record`; the summing code never re-checks. The failure mode is in the signature — `parse_record` raises `MalformedRecordError`, `read_records` raises `UnreadableFileError`. |
| §3.3 Errors, exit codes and streams | shared | One diagnostic per failure, on stderr; the result on stdout. Exit codes are constants with documented meanings: `EXIT_OK=0`, `EXIT_UNREADABLE=2`, `EXIT_MALFORMED=3`. No traceback ever reaches stdout. |
| §3.7 Input, output and the outside world | shared | Encoding is explicit everywhere (`encoding="utf-8"` on read, `reconfigure(encoding="utf-8", newline="\n")` on write) — the platform default is not a contract. Newlines are normalised to `\n` on write. |
| §3.9 Tests and test design | shared | One behaviour per test; the names state the behaviour; the boundaries the contract names are all covered (empty, negative, zero, blank, padded, unicode, malformed); the one line of output is *pinned* as a string, because for a command's output format the wording **is** the contract. |
| §3.10 Security and secrets | shared | "Validate what you did not produce" — section 5 lists what was not checked. No secret, no external command, no `eval`. |
| §2 Name the target before the edit | developer | The files owned were named first: `ledger.py`, `tests/test_ledger.py`, this report. The files **not** touched are named in section 5, including the one exception that had to be reported: `tests/__init__.py`. |
| §3 Shape the change | developer | Types, failure channel and exit codes were settled before the body was written; the change is one requirement's worth of edits in the files that own the behaviour. |
| §4 Make the code say what it means | developer | The contract is visible in the signatures; each error class carries its context as data (`.line_number`, `.reason`, `.path`); comments say why (the bool-is-an-int trap, the label trimmed once, why `sorted` is code-point order). |
| §5 Prove it as you go | developer | The check was written with the code; three mutations were run and the failing observations are reported below; the suite was re-run after the last edit. |
| §1 The surface | python | `python -m ledger` runs the module, and the entry point is guarded by `if __name__ == "__main__":`, so importing the module does not run it. `from __future__ import annotations` carries the `X | Y` annotations. |
| §3 Data modelling | python | `@dataclass(frozen=True, slots=True)` for `Record` and `Summary` — value objects that cannot be mutated into an illegal state. |
| §4 Collections | python | `defaultdict` for the per-label totals; `dict` preserves insertion order, and the label map is built in `sorted(totals)` order because code-point order *is* the contract. |
| §5 Iteration and laziness | python | `enumerate(lines, start=1)` over **all** physical lines (blank ones included, so the line number is the file's line number, not the record's); a generator streams the file instead of building a list. |
| §6 Errors | python | The narrowest exception that can actually happen: `except OSError` and `except UnicodeDecodeError` — never `except Exception`. `raise MalformedRecordError(...) from exc` keeps the cause. |
| §7 Resources | python | `with open(...)` for the file; `tempfile.TemporaryDirectory()` in the tests, so a test never writes into the repository. |
| §8 Files and paths | python | `Path` objects in the tests, explicit `encoding="utf-8"` on every read and write, `newline="\n"` when writing text. |
| §9 The shell and the outside world | python | `subprocess.run([sys.executable, "-m", "ledger", ...])` — an argument list, never a shell string. |
| §12 Testing | python | `unittest` from the standard library, one test module per source module; table-driven cases through `subTest` for the ten malformed-record shapes; the pinned output line carries a comment saying why the wording is pinned. |
| §13 The command line | python | `argparse` with one positional; exit 0 on success, a documented non-zero on failure, the message on stderr. |
| §15 Style, naming and docstrings | python | `snake_case` functions, `PascalCase` classes, `UPPER_CASE` constants; a module docstring that names the public surface, and docstrings that say what the caller must know — including the failure modes. |
| §19 The common traps | python | `bool` is a subclass of `int`, so `True` is rejected as an amount (`isinstance(amount_cents, bool)` check); no float ever touches money, and a float amount is malformed; `except Exception: pass` appears nowhere; a `datetime` is never built from the date, so no timezone is ever implied; an `OSError` is reported with its own `strerror`, so a permission error is not mislabelled "not found". |

---

## 2. What you built

### `D:\project\swarm-mixed-lab\ledger.py` (232 lines, LF)

The public surface:

| Name | Kind | What it is |
| --- | --- | --- |
| `EXIT_OK`, `EXIT_UNREADABLE`, `EXIT_MALFORMED` | constants | 0, 2, 3 — the contract's exit codes |
| `REQUIRED_KEYS` | constant | `("date", "label", "amount_cents")` |
| `LedgerError` | exception | base of the two failure modes |
| `UnreadableFileError` | exception | `.path`, `.reason`; message `cannot read <path>: <reason>` |
| `MalformedRecordError` | exception | `.line_number`, `.reason`; message `malformed record at line <n>: <reason>` |
| `Record` | frozen dataclass | `date`, `label` (trimmed), `amount_cents` (int) |
| `Summary` | frozen dataclass | `balance_cents: int`, `by_label: dict[str, int]` |
| `parse_record(line, line_number)` | function | one non-blank line → `Record`, or raises `MalformedRecordError` |
| `iter_records(lines)` | function | lines → records; ignores blank lines; numbers every physical line |
| `read_records(path)` | function | file → records; raises `UnreadableFileError` / `MalformedRecordError` |
| `summarize(records)` | function | records → `Summary` |
| `summarize_file(path)` | function | file → `Summary` |
| `format_summary(summary)` | function | `Summary` → the one JSON line |
| `main(argv)` | function | the command line; returns the exit code |

Private helpers: `_read_lines`, `_ISO_DATE`, `_force_utf8_lf`, `_build_parser`.

Behaviour decisions worth naming, because the contract leaves room:

- **The line number is the physical file line, 1-based.** Blank lines are still
  counted. The shared malformed case in `tools/oracle.md` §5 is the 4th line of
  the file but only the 3rd record, and the contract names "the line number" —
  so it must be 4. A record counter would answer 3 and be wrong.
- **Integer arithmetic only.** `amount_cents` must be a real `int`; a float
  (`4.5`), a numeric string (`"450"`) and a boolean (`true`) are all malformed.
  The contract says the amount is never a float, and a total in cents that went
  through a float would be a rounding bug waiting to happen.
- **The label is trimmed exactly once, at the boundary** (`parse_record`), and
  the trimmed value is what is stored, summed and printed. `str.strip()` also
  removes Unicode whitespace, which is the reading of "trimmed" that the
  contract's "used trimmed everywhere" implies.
- **Sorting is by code point**: `sorted(totals)`. The contract says "by code
  point", and for this fixture code-point, UTF-8 byte and UTF-16 code-unit
  order agree (`tools/oracle.md` §4).
- **The output is not normalised.** `é` stays one code point (U+00E9, bytes
  `C3 A9`); the module never calls `unicodedata.normalize`.
- **The date is checked by shape, not by calendar.** The contract gives
  `YYYY-MM-DD`; `2026-13-45` has the right shape and is accepted, because the
  contract fixes no calendar rule. A date is never parsed into a `datetime`,
  so no timezone is ever implied.
- **A UTF-8 BOM is not tolerated.** JSON Lines forbids it, and `json.loads`
  rejects it, so a BOM at the start of the file is reported as a malformed
  record at line 1. Every other lane's JSON parser does the same, so the five
  implementations fail the same way on the same input.
- **An unexpected fourth key is malformed.** The contract fixes the record as
  exactly three keys; a record with a fourth key is not that record.
- **An unreadable file is exit 2 with the real reason** (`exc.strerror`), so a
  permission error is not reported as "not found" (python.md §19).

### `D:\project\swarm-mixed-lab\tests\test_ledger.py` (20 tests, LF)

| Class | Tests |
| --- | --- |
| `SummarizeTests` | the fixture's totals; the balance re-derived as the sum of the per-label totals; a negative amount; a zero amount kept in the totals; a blank line ignored; a blank line between records changing nothing; a padded label merging with the unpadded one; a label outside ASCII kept and sorted by code point; an empty file |
| `ParseRecordTests` | a record read with its label trimmed; an error carrying its line number and reason; ten malformed shapes in one table-driven `subTest`, each expecting line 3 |
| `CommandLineTests` | the fixture printing the pinned JSON line; an empty file printing the pinned empty line; a malformed record exiting 3 with the line number and the reason on stderr and nothing on stdout; **the shared malformed case from `tools/oracle.md` §5, where the number must be 4 and not 3**; a missing file exiting 2 with the path on stderr; a missing argument exiting 2; the `python -m ledger` entry point in a subprocess printing exactly one line; the same output carrying LF endings and no CR |

### `D:\project\swarm-mixed-lab\.swarm\reports\mixed-lab-python.md`

This report.

---

## 3. How you checked it

Every command was run from `D:\project\swarm-mixed-lab`.

### 3.1 The suite

```
& "C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" -m unittest discover -s tests -t .
```

```
----------------------------------------------------------------------
Ran 20 tests in 1.463s

OK
```

Exit code **0**.

**A failure that was found and fixed, not hidden:** the same command *failed*
before `tests/__init__.py` existed:

```
ImportError: Start directory is not importable: 'D:\project\swarm-mixed-lab\tests'
```

`unittest` will not discover a start directory that is not importable. The file
`tests/__init__.py` (a docstring, 5 lines) was added so the acceptance command
runs. **This is one file beyond the write scope the brief gave me**, and it is
reported here as developer.md §2 requires ("Touching one is an event you
report, not a detail you fix quietly"). It touches no other lane's file.

### 3.2 The command line on the fixture

```
& "...\python.exe" -m ledger fixtures/ledger.jsonl
```

Exit code **0**. stdout, captured with `cmd`'s raw redirection and dumped as
bytes (PowerShell's `>` would have written UTF-16 and lied about the bytes):

```
7B 22 62 61 6C 61 6E 63 65 5F 63 65 6E 74 73 22 3A 20 31 32 30 36 30 30 2C 20 22 62 79 5F 6C 61 62 65 6C 22 3A 20 7B 22 63 61 66 C3 A9 22 3A 20 33 30 30 2C 20 22 63 6F 66 66 65 65 22 3A 20 33 30 30 2C 20 22 72 65 6E 74 22 3A 20 31 32 30 30 30 30 7D 7D 0A
```

That is one line, ending `0A` (LF) with no `0D` anywhere, `C3 A9` for `é`, and
stderr empty (0 bytes).

### 3.3 The shared oracle — an independent second method

```
& "...\python.exe" tools/check_python.py
```

```
oracle check: the Python implementation against tools/expected.json
  oracle   : D:\project\swarm-mixed-lab\tools\expected.json
  fixture  : D:\project\swarm-mixed-lab\fixtures\ledger.jsonl
  expected : balance_cents=120600 by_label={"café": 300, "coffee": 300, "rent": 120000}
  running  : ...python.exe -m ledger D:\project\swarm-mixed-lab\fixtures\ledger.jsonl
  exit code: 0
  stdout   : {"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}
  malformed: the shared malformed case from tools/oracle.md (line 4)
  compared : balance_cents, by_label, their types, the key order and the malformed case
  RESULT   : the implementation agrees with the oracle
```

Exit code **0**. (The `caf??` in the console echo of this transcript is this
console's code page; the checker decoded the bytes as UTF-8 and compared them
against the oracle successfully, and section 3.2 shows the raw bytes.)

### 3.4 The two failure paths, measured

| Case | Exit | stdout | stderr |
| --- | --- | --- | --- |
| missing file | **2** | empty | `cannot read 'C:\...\nope.jsonl': No such file or directory` |
| malformed record (line 2, `"amount_cents": "450"`) | **3** | empty (0 bytes) | `malformed record at line 2: amount_cents is not an integer` |
| the shared malformed case (line 4) | **3** | empty | names line 4 |
| empty file | **0** | `{"balance_cents": 0, "by_label": {}}\n` | empty |

### 3.5 The checks made to fail on purpose

Three mutations of `ledger.py`, each run against the suite, each restored
afterwards from the bytes held in memory. The file's SHA-256 was identical
before and after all three (`C4A881EA82A969076286D120064DBD110248C7C45975D5D4265E37F846EEA23E`),
so the source was not left mutated.

| # | Mutation | Result |
| --- | --- | --- |
| A | `trimmed = label.strip()` → `trimmed = label` (the label is no longer trimmed) | `Ran 19 tests ... FAILED (failures=6)`, exit 1. The failure showed `{'  coffee  ': -150, 'café': 300, 'coffee': 450, 'rent': 120000}` against the expected totals — the padded label no longer merged. |
| B | `for label in sorted(totals)` → `for label in totals` (the label map is no longer sorted) | `Ran 19 tests ... FAILED (failures=3)`, exit 1. `Lists differ: ['coffee', 'café'] != ['café', 'coffee']`. |
| C | `reconfigure(encoding="utf-8", newline="\n")` → `reconfigure(encoding="utf-8")` (stdout is no longer forced to LF) | `Ran 20 tests ... FAILED (failures=1)`, exit 1: `AssertionError: b'\r' unexpectedly found in b'{"balance_cents": 120600, ...}}\r\n'`. Without the fix, Windows' text-mode stdout would have written CRLF, and only the byte-level check sees it. |

### 3.6 Two measurement traps, recorded because they nearly produced false evidence

- **PowerShell's `>` writes UTF-16LE.** The first byte dump of stdout came back
  as `FF FE 7B 00 ...`, which is the shell, not the program. The measurement was
  repeated with `cmd`'s raw redirection.
- **PowerShell's `Set-Content -Encoding utf8` writes a BOM.** The first malformed
  file was therefore malformed for the wrong reason ("invalid JSON: Unexpected
  UTF-8 BOM"). The file was rewritten with
  `[System.IO.File]::WriteAllText(path, text, (New-Object System.Text.UTF8Encoding($false)))`
  and the case then failed for the intended reason. (The BOM behaviour of the
  module itself was kept — see section 2 — and is now a known boundary.)

---

## 4. The result on the shared fixture

The exact line the program prints for `fixtures/ledger.jsonl` (one line, LF,
UTF-8, on stdout; stderr empty; exit code 0):

```
{"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}
```

It matches `tools/oracle.md` §4 and `tools/expected.json` character for
character, including the raw `é` (U+00E9), the key order
`balance_cents` then `by_label`, and the code-point order `café`, `coffee`,
`rent`.

---

## 5. What you did not check

- **The other four implementations.** I ran the Python implementation against
  the shared oracle (`tools/check_python.py`) and against the shared malformed
  case; I did not run, read or judge the TypeScript, Go, Java or Rust lanes.
- **The exit-2 path for a permission error.** The missing-file case is checked
  (exit 2, the path is named). A file that exists but cannot be read was not
  created on this host; the code reports `exc.strerror` rather than assuming
  "not found" (python.md §19), but that path was not executed.
- **A file that is not valid UTF-8.** The code path exists (exit 2, "not valid
  UTF-8"), but no such file was exercised in a test.
- **A file that is a directory, or a path with a wildcard or a `~` in it.** The
  path is passed to `open()` as given; only the "does not exist" case was
  exercised.
- **Calendar validity of `date`.** `2026-13-45` has the required shape and is
  accepted; the contract fixes the shape only. No test asserts a rejection,
  because the contract does not ask for one.
- **The calendar/timezone question was never reached.** No `datetime` is built
  from the `date` string at all, so there is nothing to test.
- **A record with a fourth key is malformed.** This is my reading of "exactly
  three keys"; the contract does not spell out what to do with an extra key.
  It is a judgement call, not a derived requirement, and it is the one place
  where a different lane might reasonably differ.
- **A UTF-8 BOM at the start of the file** is treated as a malformed record at
  line 1 (JSON Lines forbids a BOM; `json.loads` rejects it). Observed while
  measuring, not covered by a test of mine.
- **Large files.** No test writes more than a handful of records; the reading
  is streaming (a generator over the file), but the memory behaviour at
  scale was not measured (python.md §14 asks for a measurement, and there is
  none).
- **Timing.** No performance claim is made; the suite runs in about 1.5 s, but
  that number is not a budget.
- **The other files in the repository** — `ledger.ts`, `ledger.test.ts`,
  `ledger.go`, `package.json`, `README.md`, `tools/*`, `fixtures/*`,
  `docs/contract.md` — were read where the work needed them and **not
  modified**. The only file I created outside my three is `tests/__init__.py`
  (section 3.1).
- **`__pycache__`** directories are created by running the suite in the
  repository root; they are build artefacts, were removed again, and are not
  part of the change.
- **No git command was run.** The Lead commits.
