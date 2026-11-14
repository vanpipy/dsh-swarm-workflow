# Mixed-lab: the shared oracle

## 1. The requirement

**Board task claimed:** `task-11` — "Mixed-lab: build the shared oracle for the
ledger contract" (claimed by the `pyfix` lane, revision 1 → 2, status
`in_progress`). The requirement is cited here as **`task-11`**.

**The requirement as I read it** (from the board task):

> requirement: The expected result of the shared fixture is derived once, by
> hand, from the contract, and written down as an oracle that every
> implementation can be compared against. The oracle is a file in the
> repository, not a number in a chat message.
>
> check: `tools/expected.json` holds the expected balance and the expected
> per-label totals for `fixtures/ledger.jsonl`, with a short derivation in
> `tools/oracle.md` that shows the record-by-record sum; `tools/check_python.py`
> runs the Python implementation against the oracle and exits 0 when they agree.
>
> source: docs/contract.md and fixtures/ledger.jsonl.

**A disagreement between the task and the requirement file, and how I resolved
it.** The same requirement also lives in
`.swarm/requirements/mixed-lab.md` as the R6 block, and the two texts are not
the same:

- `task-11` asks for the expected balance, the expected per-label totals, the
  derivation, and a Python checker that exits 0 when the implementation and the
  oracle agree.
- The R6 block in the file reads: "Where two implementations can be compared,
  they agree: the same fixture gives the same balance, the same totals **and
  the same error on the same malformed input**", with the check "the Python
  output and the documented expected values are recorded in the report, and
  every other language's output shape is compared against them."

The file adds the shared **malformed-input error case**, which the task's text
leaves out. Per the handover rule, the file wins over the task. So the oracle
also pins the error behaviour, and `tools/check_python.py` checks it:

- the shared malformed case is documented byte for byte in
  `tools/oracle.md` §5 — a four-line file whose fourth line is a JSON object
  missing `amount_cents`;
- the expected behaviour is exit code 3, nothing on stdout, and a stderr
  message naming the **line number 4** (the contract says "the message names
  the line number (1-based)"; the malformed record is the 4th *line* but only
  the 3rd *record*, because line 2 is blank — the case is chosen so that the
  two readings disagree and an implementation that counts records is caught);
- the wording of the reason is not pinned by the contract, so the checker does
  not assert it.

Everything else in the task is inside the file's R6, so the two agree.

**What I own and what I touched.** I wrote exactly four files:
`tools/expected.json`, `tools/oracle.md`, `tools/check_python.py` and this
report. I did not touch `ledger.py`, `ledger.ts`, `ledger.go`, `Ledger.java`,
`ledger.rs`, `tests/`, `package.json`, `go.mod`, `pom.xml` or `Cargo.toml`, and
I did not read the other lanes' reports. I ran no git command; the Lead
commits.

## 2. The craft files I read, and the rules that shaped the decisions

| file | section | the rule | the decision it shaped |
| --- | --- | --- | --- |
| `swarm-craft-shared` | §2.1 Make the check falsifiable | "make it fail on purpose and show that it fails… A check you have never seen fail is a claim, not a check" | The whole fault-injection matrix in §4 below. A checker that only ever returned 0 would have proved nothing. |
| `swarm-craft-shared` | §2.2 Re-derive every number a second way | "compute it again by a different route… When the methods agree, the number is evidence" | The balance was derived three ways (a streaming sum, the sum of the label totals, and an independent re-read of the fixture) before it was written down. `tools/oracle.md` shows two of them side by side. |
| `swarm-craft-shared` | §2.3 Validate where the artifact runs | "the evidence names the environment it ran in" | The report names the interpreter, the host locale and the absence of the other four toolchains. |
| `swarm-craft-shared` | §3.3 Errors, exit codes and streams | "Exit codes are a contract… One diagnostic per failure, on stderr. Results go to stdout." | The checker has three documented exit codes (0 agree, 1 disagree, 2 cannot run) and keeps its own diagnostics on stdout, leaving the implementation's streams alone. |
| `swarm-craft-shared` | §3.7 Input, output and the outside world | "Encoding is explicit. Never rely on the platform default." / "normalise on read and write `\n`" | Every file is read and written as explicit UTF-8; the child process runs with `PYTHONIOENCODING=utf-8` so its bytes are UTF-8 whatever the host locale is; all four of my files are LF-only, with no BOM and a final newline. |
| `swarm-craft-shared` | §3.9 Tests and test design | "Build the smallest fixture that exercises the behaviour." | The malformed case is four lines, not the whole fixture. |
| `swarm-craft-tester` | §2 Choose the oracle | "Derive the expected value from the requirement before you read the implementation, so the implementation cannot tell you what to expect." / "The check is black-box" | The oracle was derived from `docs/contract.md` and the fixture bytes **before** `ledger.py` existed; the checker drives the implementation through the public command line and never imports it. |
| `swarm-craft-tester` | §3 Make the check discriminate | "Name the value that separates the two answers" / "One behaviour per check" | Each comparison in the checker names the discriminating value, and the fault matrix breaks exactly one behaviour at a time. |
| `swarm-craft-tester` | §4 Cover the boundary, not the middle | "Write into a temporary directory, never into the working tree." | The malformed case is written into a `tempfile.TemporaryDirectory()`, never into the repository. The fault-injection copies live in the temporary directory too. |
| `swarm-craft-tester` | §5 Prove the check can fail | "Show the failure: quote the failing output" / "Leave the tree as it was" | The eight variants in §4, with their real output quoted; every variant is a copy in `%TEMP%`, so the repository was never broken. |
| `swarm-craft-tester` | §6 Report honestly | "A check that cannot be run in this environment is `not demonstrated`, never `met`." | The four other languages are reported as not tested here, with the reason. |

## 3. The derivation

The source of every number is `docs/contract.md` plus the bytes of
`fixtures/ledger.jsonl`. The full derivation is in `tools/oracle.md`; this is
the summary.

The fixture is 319 bytes, LF only, ends with a newline, and holds 6 physical
lines of which 5 are records (line 2 is blank and the contract ignores it).

| file line | record | date | label as written | label after trimming | amount_cents | running balance |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 2026-01-05 | `coffee` | `coffee` | 450 | 450 |
| 2 | — | — | *(blank — ignored)* | — | — | 450 |
| 3 | 2 | 2026-01-06 | `␠␠coffee␠␠` | `coffee` | −150 | 300 |
| 4 | 3 | 2026-01-07 | `rent` | `rent` | 120000 | 120300 |
| 5 | 4 | 2026-01-08 | `coffee` | `coffee` | 0 | 120300 |
| 6 | 5 | 2026-01-09 | `café` | `café` | 300 | 120600 |

**The oracle file** — `tools/expected.json`, exactly two top-level keys so that
a JSON parser in any of the five languages can read it without knowing about
fields it does not expect:

```json
{
  "balance_cents": 120600,
  "by_label": {
    "café": 300,
    "coffee": 300,
    "rent": 120000
  }
}
```

**The second route** (the cross-check that makes 120600 evidence rather than an
assertion): every record belongs to exactly one label, so the balance must
equal the sum of the label totals —
`300 (coffee) + 120000 (rent) + 300 (café) = 120600`. It agrees with the
running sum.

**The label order.** `café` (63 61 66 E9), `coffee` (63 6F 66 66 65 65),
`rent` (72 65 6E 74). `café` and `coffee` share the first code point; the
second is `61` (`a`) against `6F` (`o`), so `café` sorts first; `rent` starts
with `72` (`r`), so it sorts last. The `é` is a single code point `U+00E9`
(NFC) — the label is trimmed and nothing else, so an implementation must not
normalise it. Every code point is in the BMP, so code-point order, UTF-16
code-unit order (Java, JavaScript) and UTF-8 byte order (Go, Rust) all give
the same sequence for this fixture.

**The shared malformed case** (`tools/oracle.md` §5, byte for byte):

```
{"date": "2026-01-05", "label": "coffee", "amount_cents": 100}

{"date": "2026-01-07", "label": "rent", "amount_cents": 1200}
{"date": "2026-01-08", "label": "rent"}
```

Expected: exit code **3**, nothing on stdout, a stderr message naming the
**line number 4** and the reason. The fourth line is a JSON object that is
missing `amount_cents`.

## 4. How I checked it

### 4.1 The environment

- Interpreter: `C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe` (Python 3.12.14). There is no `python` on `PATH` on this host.
- Working directory for every run: the repository root, `D:\project\swarm-mixed-lab`.
- The host's locale encoding for Python's stdout is **gbk**, not UTF-8. That is why the checker sets `PYTHONIOENCODING=utf-8` for the child process and reconfigures its own streams to UTF-8: the comparison must not depend on the machine's encoding.
- No Go, JDK, Node or Rust toolchain is present on this host, so the other four implementations could not be run here.

### 4.2 The checker against the real Python implementation

Command:

```
& "C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" "D:\project\swarm-mixed-lab\tools\check_python.py"
```

Output (exit code **0**):

```
oracle check: the Python implementation against tools/expected.json
  oracle   : D:\project\swarm-mixed-lab\tools\expected.json
  fixture  : D:\project\swarm-mixed-lab\fixtures\ledger.jsonl
  expected : balance_cents=120600 by_label={"café": 300, "coffee": 300, "rent": 120000}
  running  : C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe -m ledger D:\project\swarm-mixed-lab\fixtures\ledger.jsonl
  exit code: 0
  stdout   : {"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}
  malformed: the shared malformed case from tools/oracle.md (line 4)
  compared : balance_cents, by_label, their types, the key order and the malformed case
  RESULT   : the implementation agrees with the oracle
EXIT=0
```

This run is against `ledger.py` as it stood at 2026-11-14 11:24:54 (7831
bytes). It is the Python lane's file and it may still change; the numbers
above are the evidence for that file, not for whatever the file becomes later.

**The Python output, recorded for the R6 check** ("the Python output and the
documented expected values are recorded in the report"):

| value | the oracle | the Python implementation |
| --- | --- | --- |
| `balance_cents` | 120600 | 120600 |
| `by_label["café"]` | 300 | 300 |
| `by_label["coffee"]` | 300 | 300 |
| `by_label["rent"]` | 120000 | 120000 |
| key order | `balance_cents`, `by_label` | `balance_cents`, `by_label` |
| label order | `café`, `coffee`, `rent` | `café`, `coffee`, `rent` |
| the malformed case | exit 3, nothing on stdout, stderr names line 4 | agrees |

### 4.3 The check made to fail on purpose

Eight throwaway copies of the repository were built in
`%TEMP%\mixedlab-oracle-cases` (never in the repository): each holds a copy of
`tools/` and `fixtures/` and one deliberately faulty `ledger.py`. Each variant
breaks exactly one behaviour. The command for each was the same as in §4.2,
run against that copy.

| variant | what it breaks | exit | the output that decides it |
| --- | --- | --- | --- |
| `a-no-implementation` | there is no `ledger.py` at all | **2** | `FAILED   : the Python implementation is not there: …\ledger.py does not exist` / `nothing was compared, so this is not a pass` |
| `b-correct` | nothing — a straightforward correct implementation | **0** | `RESULT   : the implementation agrees with the oracle` |
| `c-wrong-balance` | the balance is off by one | **1** | `- balance_cents is 120601, the oracle says 120600` |
| `d-float-balance` | the balance is a float | **1** | `- balance_cents is 120600.0, the contract requires an integer` |
| `e-wrong-key-order` | `by_label` is printed first | **1** | `- the top-level keys are ['by_label', 'balance_cents'], the contract pins ['balance_cents', 'by_label']` |
| `f-unsorted-labels` | the label map keeps the fixture order | **1** | `- the by_label keys are ['coffee', 'rent', 'café'], the contract requires them sorted by code point: ['café', 'coffee', 'rent']` |
| `g-malformed-record-ordinal` | the malformed record is reported by its **record** ordinal, not its line number | **1** | `- the stderr message does not name the malformed record's line number (4): 'malformed record 2'` |
| `h-malformed-exit-0` | the malformed record is reported but the program exits 0 | **1** | `- the malformed record gave exit code 0, the contract says 3` and `- the malformed record printed '{"balance_cents": 1300, …}' on stdout, the contract says stdout carries only the JSON line` |

Two of these are worth naming. `g` is the case that separates "line number"
from "record number" — the contract asks for the line number, and the fixture
makes the two readings differ. `a` is the case that keeps the checker honest:
with no implementation present it exits 2 and says that nothing was compared,
so the checker can never pass by checking nothing.

The temporary copies were deleted after the runs; the repository was never
broken.

### 4.4 The files themselves

```
tools\expected.json      bytes=107    CR=0   LF=8    no-BOM endsWithLF=True
tools\oracle.md          bytes=6596   CR=0   LF=163  no-BOM endsWithLF=True
tools\check_python.py    bytes=12337  CR=0   LF=331  no-BOM endsWithLF=True
```

All four files are LF-only, carry no BOM and end with a newline. The fixture
was not modified (SHA-256
`A21EB790CEEAFB2C5D4AF13416F7A8D765163B87B38044ECBF9500DEF13660C3`). The `é`
in `tools/expected.json` is one code point `U+00E9` (NFC), verified from the
file's bytes: `['0x63', '0x61', '0x66', '0xe9']`.

### 4.5 What the checker does and does not compare

It compares: `balance_cents`; `by_label` as a map; that both are integers and
not floats or booleans; the top-level key order; the label order (code point);
the exit code of the fixture run; and the malformed case (exit 3, nothing on
stdout, stderr naming line 4).

It does not compare: the whitespace around the JSON — the contract pins the
content and the order, not the spacing — or the wording of the error message,
which the contract does not fix.

## 5. What I did not check

- **The other four implementations.** No Go, JDK, Node or Rust toolchain exists
  on this host, so `ledger.go`, `ledger.ts`, `Ledger.java` and `ledger.rs` were
  never run, and their outputs were not compared against the oracle by me. The
  second half of the R6 check ("every other language's output shape is compared
  against them") is therefore **not demonstrated from this lane**; the oracle
  and the derivation are here for those lanes and for the Coordinator's
  comparison to use.
- **The contract's other paths.** The empty file, the file with no records
  (`{"balance_cents": 0, "by_label": {}}`), the unreadable file (exit 2, the
  message naming the path) and a record with a non-integer `amount_cents` are
  not in the shared oracle; they belong to the implementations' own tests.
- **The implementation's internals.** The checker is black-box: it runs
  `python -m ledger <path>` and compares the output. It says nothing about how
  the implementation computes, and it would not notice a change that kept the
  output identical.
- **The implementations' own test suites.** `tests/` belongs to another lane; I
  did not run them and did not read them.
- **The oracle under a different fixture.** The numbers are derived for
  `fixtures/ledger.jsonl` only.
- **A note for the Lead, not a defect:** the repository root holds a
  `__pycache__/ledger.cpython-312.pyc` build artifact and there is no
  `.gitignore`. It is not mine and I did not delete it. My checker no longer
  creates one (`PYTHONDONTWRITEBYTECODE=1` in the child environment); the
  artifact is from the Python lane's own runs.
