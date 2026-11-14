# The TypeScript lane of the ledger round

Work item: `swarm-mixed-lab`, lane `typescript`.
Files I own: `ledger.ts`, `ledger.test.ts`, `package.json`,
`.swarm/reports/mixed-lab-typescript.md`. I touched nothing else.

## 1. What you read

| File | What it decided |
| --- | --- |
| `docs/contract.md` | The behaviour itself. Every rule in the code traces back to a line of it. |
| `fixtures/ledger.jsonl` | The six lines the fixture holds: a normal record, a blank line, a padded label with a negative amount, a big amount, a zero amount, a label outside ASCII. |
| `skills/swarm-engineering/shared.md` (craft: `swarm-craft-shared`) | The core rules. |
| `skills/swarm-engineering/developer.md` (craft: `swarm-craft-developer`) | The shape of the work. |
| `skills/swarm-engineering/languages/typescript.md` (craft: `swarm-craft-typescript`) | The TypeScript pieces. |

Rule by rule, and what it shaped:

- **shared §2.1 "Make the check falsifiable"** — every test I wrote asserts an exact value or an exact
  exit code, not "it did not throw". The code point sort test is the clearest case: it compares
  U+FFFD against U+1F600, where the default JavaScript sort gives the opposite answer, so the test
  fails if the comparator is wrong.
- **shared §2.3 "Validate where the artifact runs"** — the artifact runs on Node, so the checks run on
  Node. See §3: the harness does ship a Node, and I used it.
- **shared §3.2 "Types and contracts"** — the failure mode of a function is part of its contract, so
  it is written into the doc comment of every exported function that can fail
  (`ledger.ts:115`, `ledger.ts:158`, `ledger.ts:168`).
- **shared §3.3 "Errors, exit codes and streams"** — the exit codes are the contract's, so they are
  named constants (`EXIT_OK`, `EXIT_UNREADABLE`, `EXIT_MALFORMED`), results go to stdout, one
  diagnostic per failure goes to stderr, and the two streams never mix.
- **shared §3.7 "Input, output and the outside world"** — the file is parsed at the boundary, with an
  explicit `'utf8'` encoding (`ledger.ts:171`), and CRLF is normalised on read (`ledger.ts:119`).
- **shared §3.9 "Tests and test design"** — the boundaries the contract names are the boundaries the
  tests cover: negative, zero, blank line, padded label, non-ASCII label, malformed record, empty
  file. Where the wording *is* the contract (`docs/contract.md:33`), the test asserts the exact
  string.
- **developer §2 "Name the target before the edit"** — before writing, I named the file, the exported
  surface and the one-line behaviour each file would have.
- **developer §4 "Make the code say what it means"** — the module doc comment at the top of
  `ledger.ts` states the contract, the exit codes and the two deliberate strictness decisions.
- **developer §5 "Prove it as you go"** — the test suite ran before the report was written, twice:
  once with two failures, once green. The failure is described in §3.
- **typescript §1 "The surface: layout, packaging, the version floor"** — `package.json` is ESM
  (`"type": "module"`), the entry points are `./ledger.ts`, and `engines.node` is `>=22.6.0`, the
  version that can strip TypeScript types from a `.ts` file.
- **typescript §2 "Typing and the compiler options"** — the module is written for `--strict`: no
  implicit `any`, no `as` casts, `unknown` at the boundary.
- **typescript §3 "Data modelling"** — `JSON.parse` returns `any`, so every record is validated into
  the module's own `LedgerRecord` type; nothing from the file is used untyped.
- **typescript §4 "Collections and the standard library"** — `Map` for the label map (labels come
  from outside; `__proto__` and `42` stay ordinary keys), `Object.hasOwn` for the required keys,
  and the sort is applied to a copy, never to a map in place.
- **typescript §6 "Errors"** — `LedgerError` sets `this.name = 'LedgerError'` and the code compares
  the name, not `instanceof` across module boundaries; the kind of failure is a field on the error.
- **typescript §7 "Resources"** and **§8 "Files and paths"** — `node:fs/promises` and `readFile`
  with an explicit encoding; no file handle is left open.
- **typescript §12 "Testing"** — `node:test` and `node:assert/strict` only; temporary files are made
  with `mkdtemp` under `os.tmpdir()` and removed with `t.after`.
- **typescript §13 "The command line"** — `parseArgs` from `node:util`, and the process exits with
  `process.exitCode`, never `process.exit()`.
- **typescript §17 "Logging and diagnostics"** — the diagnostic names the path, the line number and
  the reason, and it is never swallowed: the two failure paths are asserted in the tests.
- **typescript §19 "The common traps"** — the truthiness trap is avoided everywhere: a zero amount
  is a real amount (`ledger.ts:142-143`), `===` is used rather than `==`, and `?? 0n` rather than `||`.

## 2. What you built

### `ledger.ts` — the module (373 lines, ASCII, LF)

Exported surface:

| Export | Kind | What it is |
| --- | --- | --- |
| `Cents` | type | `bigint`. Every amount and every sum is a `bigint`, so the arithmetic is exact integer arithmetic and the type itself says "integer". |
| `LedgerRecord` | interface | `{ date, label, amount_cents }`, the validated record, label already trimmed. |
| `LedgerSummary` | interface | `{ balance_cents: Cents, by_label: ReadonlyMap<string, Cents> }`, the result the contract describes. |
| `EXIT_OK` / `EXIT_UNREADABLE` / `EXIT_MALFORMED` | const | `0` / `2` / `3`, the contract's exit codes. |
| `LedgerExitCode` | type | The union of those three. |
| `LedgerErrorKind` | type | `'unreadable' \| 'malformed'`. |
| `LedgerError` | class | The failure the contract describes, with `kind`, `path`, `line`, `reason`. |
| `parseRecords(text, path?)` | function | The text to the records. Throws `LedgerError` of kind `malformed`. |
| `summarize(records)` | function | The records to the summary. The label map is built in code point order. |
| `summarizeText(text, path?)` | function | The text to the summary. Throws `LedgerError` of kind `malformed`. |
| `readLedger(path)` | function | The file to the summary. Throws `LedgerError` of kind `unreadable` or `malformed`. |
| `formatSummary(summary)` | function | The summary to the one JSON line the contract fixes. |
| `LedgerRun` | interface | `{ stdout, stderr, exitCode }`. |
| `runLedger(path)` | function | The file to the outcome. Never throws for the two contract failures. |
| `LedgerStreams` | interface | Where a run writes; the process streams by default. |
| `main(argv, streams?)` | function | The command line. Returns the exit code. |

The module is also a command line: `node --experimental-strip-types ledger.ts <path>`. The entry
guard (`ledger.ts:368-372`) only runs `main` when the file is the process entry point, so importing the
module in a test does not run the command line.

Two deliberate decisions, both visible in the module doc comment:

- **A malformed record is judged by the contract's record rules, not only by the three causes the
  malformed paragraph names.** `docs/contract.md:9-10` says a record has *exactly* these three keys,
  and the table at `docs/contract.md:14-16` gives each key a rule. A line that breaks any of those is
  not a record, and the only failure the contract defines for a non-blank line is "malformed record".
  So an unexpected key, a label that is empty after trimming, and a date that is not `YYYY-MM-DD`
  are malformed too. The three named causes are of course covered as well.
- **The date is checked by shape only.** The contract says the date is "an ISO date, `YYYY-MM-DD`"
  and, at `docs/contract.md:62-63`, that dates "are never parsed into a timezone-aware object". A
  regex `^\d{4}-\d{2}-\d{2}$` is exactly that: it never builds a `Date`, and it does not invent a
  calendar rule the contract does not state. `2026-13-45` is accepted as a shape; `05-01-2026` is not.

### `ledger.test.ts` — 17 tests (node:test)

The boundaries the contract names, one test each:

| Boundary | Test |
| --- | --- |
| a negative amount | `a negative amount lowers the balance` — balance `-150n`, label total `-150n` |
| a zero amount | `a zero amount keeps its label with a total of zero` — the label stays, and the exact output line is asserted |
| a blank line | `a blank line is ignored` — a file of blank, whitespace-only and one real line |
| a padded label | `a padded label is trimmed and merges with the same label` — `"  coffee  "` merges with `coffee` |
| a label outside ASCII | `a label outside ASCII is kept verbatim and sorted by code point` — `café` is kept raw, and the exact output line is asserted |
| a malformed record | `a malformed record reports the line number and the reason` — the blank line is line 2, so the bad record is line 3; stderr must name `line 3` and `amount_cents` |
| an empty file | `an empty file prints the empty summary and exits 0` — the exact string `{"balance_cents": 0, "by_label": {}}` |

Plus: the code point sort against an astral character, the shared malformed case from
`tools/oracle.md` (the line number counts lines, not records), an unexpected key, an empty label, a
wrong date, a missing file (exit 2, names the path), the shared fixture end to end, the command
line printing exactly one line, and two misuse cases (no path, unknown option).

### `package.json`

`"type": "module"`, the entry points `./ledger.ts`, and two scripts, both runnable with the Node
that ships with the harness:

```
npm run ledger -- fixtures/ledger.jsonl
npm test
```

There are no dependencies at all, runtime or development: the module uses only `node:fs/promises`,
`node:util` and `node:url`, and the test uses only `node:test`, `node:assert/strict`,
`node:fs/promises`, `node:os`, `node:path` and `node:url`.

## 3. How you checked it

### The brief's premise was wrong, and that changed the answer

My brief said: "This host has no Node and no TypeScript compiler. You therefore CANNOT run your code
or your tests. Do not claim that you did."

The first half of that is false. `load_workspace_dependencies` reports a Node runtime bundled with
the harness:

```
C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe   ->  v24.21.0
```

It is not on `PATH` (`node`, `npx`, `tsc`, `deno`, `bun` are all absent), so the Lead's environment
note is right about the *system* toolchain and wrong about the *host*: the harness carries a Node.
Node 24 strips TypeScript types natively, which is what this module needs. I therefore ran the code
and the tests rather than judging them by reading. The second half of the premise holds: **there is
still no TypeScript compiler anywhere on this host** (`typescript` is not in the harness runtime, and
`D:\software\dsh\resources\app.asar\dsh` is not a directory on disk), so `tsc --noEmit` was never
run. See §5.

For the round's verdict table: this lane's row is **`executed`**, not `read`. The requirement set's
R4 says "the host has a Python runtime; it has no Go, JDK, Node or Rust toolchain, so this is the
only implementation that can be executed here". The *system* has no Node toolchain, and that part
holds; but the harness bundles a Node under
`C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe` — the exact
path is in the command blocks below — and it runs this module and its tests. What else is on this
host, checked by hand for this report:

| runtime | where | result |
| --- | --- | --- |
| Node 24.21.0 | `C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe` (bundled, not on `PATH`) | present, and it runs this lane |
| Python 3.12.14 | `C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe` (bundled) | present; the `python` on `PATH` is the Microsoft Store stub |
| OpenJDK 17.0.19 | `C:\Program Files\OpenLogic\jdk-17.0.19.10-hotspot\bin\java.exe` (`java` and `javac` **are** on `PATH`) | present, so the Java lane is executable too |
| Go | — | not on `PATH`, not bundled |
| Rust | — | not on `PATH`, not bundled |

So the claim "this is the only implementation that can be executed here" is not right: TypeScript and
Java can be executed here as well. Whoever builds the verdict table should decide whether a
harness-bundled runtime counts, and record the exact path either way, because a check that runs in
one environment proves something about that environment and nothing else (shared §2.3). This is a
finding about the host, not a claim about the other lanes: I did not run their code.

### What was executed, and what it showed

The runtime used for every command below:

```
$node = 'C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe'
```

**1. The test suite** — `node --experimental-strip-types --disable-warning=ExperimentalWarning --test ledger.test.ts`

The first run: 15 tests, 13 passed, **2 failed**, exit 1. The two failures were real and shared one
root cause: `by_label` was a `Map` built in *insertion* order (coffee first, from line 1 of the
fixture), while the output is sorted by code point, so the map's iteration order and the rendered
order disagreed. The rendered line was right; the map was not. The fix was in the code, not in the
test: `summarize` now inserts the labels into the map in code point order
(`ledger.ts:137-150`), so iterating the map and rendering it give the same order. The second run:

```
✔ a negative amount lowers the balance                    ✔ a zero amount keeps its label with a total of zero
✔ a blank line is ignored                                ✔ a padded label is trimmed and merges with the same label
✔ a label outside ASCII is kept verbatim and sorted ...  ✔ label keys are sorted by code point, not by UTF-16 code unit
✔ a malformed record reports the line number and the reason  ✔ the shared malformed case: the line number counts lines, not records
✔ a record with an unexpected key is malformed          ✔ a label that is empty after trimming is malformed
✔ a date that is not YYYY-MM-DD is malformed              ✔ an empty file prints the empty summary and exits 0
✔ a missing file exits 2 and names the path               ✔ the shared fixture prints the documented summary
✔ the command line prints exactly one line on stdout and exits 0
✔ the command line exits 2 when it does not name exactly one path
✔ an unknown option is a misuse: exit 2, nothing on stdout

ℹ tests 17   ℹ pass 17   ℹ fail 0   exit 0
```

**2. The command line on the shared fixture.** The output was captured with `cmd /c` redirection so
the bytes are the program's own, not PowerShell's re-encoding:

```
$ node --experimental-strip-types --disable-warning=ExperimentalWarning ledger.ts fixtures/ledger.jsonl
exit code : 0
stdout    : {"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}\n
stderr    : (empty)
stdout bytes (85): 7b 22 62 61 6c 61 6e 63 65 5f 63 65 6e 74 73 22 3a 20 31 32 30 36 30 30 2c ... 7d 7d 0a
```

85 bytes: 83 ASCII characters, `c3 a9` for `é` (raw UTF-8, not `\u00e9`), and a single `0a` at the
end. One line, no `0d`, nothing on stderr.

**3. The two failure paths, end to end.**

```
missing file   -> exit 2, stdout empty (0 bytes),
                  stderr: ledger: cannot read '<path>': ENOENT: no such file or directory, open '<path>'
malformed file -> exit 3, stdout empty (0 bytes),
                  stderr: ledger: malformed record at line 3 in '<path>': 'amount_cents' is not an integer
```

The malformed file was three lines: a good record, a blank line, and a record with
`"amount_cents": 1.5`. The blank line is line 2, so the bad record is line 3 — the line number counts
every physical line, blank ones included.

**4. Three robustness cases**, all exit 0 with the expected summary: a CRLF file (the `\r` is
normalised on read), a file with a UTF-8 BOM (stripped before the first line is parsed), and a file
whose last line has no trailing newline.

**5. The shared oracle, cross-checked.** Another lane wrote `tools/oracle.md` and
`tools/expected.json` while I was working: the hand derivation every implementation is judged
against. My output matches it, and it is the same comparison the other lanes make:

- `tools/expected.json` holds `balance_cents` 120600 and `by_label` `café` 300, `coffee` 300,
  `rent` 120000 — my output, byte for byte, including the key order and the raw `é`.
- The shared malformed case of `tools/oracle.md` §5 — the four-line file whose last line is a JSON
  object missing `amount_cents` — written out and run:

```
exit code : 3
stdout    : '' (0 bytes)
stderr    : ledger: malformed record at line 4 in '<path>': missing key 'amount_cents'
```

  Line **4**, the physical line, not 3, the record number: the blank second line is counted. That is
  the case the oracle says tells a line counter from a record counter, and this implementation
  counts lines. It is now a test as well
  (`the shared malformed case: the line number counts lines, not records`).

**6. Step by step through the contract's rules**, each with the evidence that covers it:

| Contract rule | Where the code carries it | What proves it |
| --- | --- | --- |
| UTF-8 JSON Lines, one object per line (`docs/contract.md:8`) | `ledger.ts:171` reads with `'utf8'`; `ledger.ts:286` parses each line | the fixture run; the CRLF and BOM runs |
| a blank or whitespace-only line is ignored (`docs/contract.md:8-9`) | `ledger.ts:120` | `a blank line is ignored`; the fixture has a blank line at line 2 and still sums to 120600 |
| exactly three keys (`docs/contract.md:9-10`) | `ledger.ts:293-302` | `a record with an unexpected key is malformed` (exit 3, names `currency`) |
| `date` is `YYYY-MM-DD` (`docs/contract.md:14`) | `ledger.ts:308` | `a date that is not YYYY-MM-DD is malformed` |
| `label` is not empty after trimming, and is trimmed (`docs/contract.md:15`) | `ledger.ts:314-317` | `a label that is empty after trimming is malformed`; `a padded label is trimmed and merges with the same label` |
| `amount_cents` is an integer, may be negative (`docs/contract.md:16`) | `ledger.ts:318-323`, and `bigint` in the types | `a negative amount lowers the balance`; the malformed test with `1.5` |
| malformed -> names the line number and the reason, on stderr, and stops (`docs/contract.md:18-21`) | `ledger.ts:327-334`, `ledger.ts:215-223` | the exit 3 run above: `line 3` and `'amount_cents' is not an integer` on stderr, stdout empty |
| one JSON object on one line, `balance_cents` first (`docs/contract.md:30-34`) | `ledger.ts:185-192` | the 85-byte stdout capture: one `0a`, `balance_cents` before `by_label` |
| `balance_cents` is the exact sum, an integer, no floating point (`docs/contract.md:36-37`) | `Cents = bigint`, `ledger.ts:137-150` | the fixture total 120600 is exact; the type is `bigint`, so no float can carry a cent |
| `by_label` maps each trimmed label to its sum, keys sorted by code point (`docs/contract.md:38-39`) | `ledger.ts:137-150` and `ledger.ts:342-354` | the fixture output order `café`, `coffee`, `rent`; the astral-character test, which the default sort would get wrong |
| a file with no records prints `{"balance_cents": 0, "by_label": {}}` (`docs/contract.md:40`) | `ledger.ts:192` | `an empty file prints the empty summary and exits 0` asserts the exact string |
| printed on stdout, exit 0 (`docs/contract.md:42`) | `ledger.ts:273-280` | the fixture run: exit 0, the line on stdout, stderr empty |
| one path on the command line (`docs/contract.md:46-51`) | `ledger.ts:254-281` | `the command line exits 2 when it does not name exactly one path` |
| exit 0 / 2 (names the path) / 3 (names the line and the reason) (`docs/contract.md:53-56`) | `ledger.ts:211-224` | all three runs above |
| integer arithmetic only (`docs/contract.md:60`) | `Cents = bigint` throughout | the type; no `number` holds an amount |
| the label is trimmed once, at the boundary (`docs/contract.md:61`) | `ledger.ts:314`, trimmed once and stored trimmed | `a padded label is trimmed and merges with the same label` |
| dates are never parsed into a timezone-aware object (`docs/contract.md:62-63`) | `ledger.ts:308`, a regex, never a `Date` | a search of the file for `new Date`, `Date.parse`, `Date.now`, `toISOString` returns nothing |
| nothing is printed except the one JSON line on stdout (`docs/contract.md:64`) | stdout is written in one place only, `ledger.ts:274-276` | stdout is empty on both failure paths; a misuse writes to stderr only |

### What I could not run

- **No TypeScript compiler exists on this host.** `tsc --noEmit` was never run, so the types are
  written for `--strict` but *not* verified by a compiler. Node's type stripping erases types, it
  does not check them.
- No `npm install` was run, and none is needed: there are no dependencies.
- Only Node 24.21.0 was available. Node 18, 20 and 22 were not tried.

## 4. The result you expect on the shared fixture

Hand-derived from `fixtures/ledger.jsonl`, then confirmed by the run above:

| Line | Content | Effect |
| --- | --- | --- |
| 1 | `{"date": "2026-01-05", "label": "coffee", "amount_cents": 450}` | `coffee` +450 |
| 2 | blank | ignored |
| 3 | `{"date": "2026-01-06", "label": "  coffee  ", "amount_cents": -150}` | trimmed to `coffee`, so `coffee` −150 |
| 4 | `{"date": "2026-01-07", "label": "rent", "amount_cents": 120000}` | `rent` +120000 |
| 5 | `{"date": "2026-01-08", "label": "coffee", "amount_cents": 0}` | `coffee` +0; the label stays in the map |
| 6 | `{"date": "2026-01-09", "label": "café", "amount_cents": 300}` | `café` +300 |

- `balance_cents` = 450 − 150 + 120000 + 0 + 300 = **120600**
- `by_label`: `coffee` = 450 − 150 + 0 = **300**, `rent` = **120000**, `café` = **300**
- Sorted by code point: `café` (c, a) before `coffee` (c, o) because `a` < `o`; `rent` last because
  `r` > `c`.

The exact line on stdout, followed by one `\n`:

```
{"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}
```

85 bytes: 83 characters, `c3 a9` for the `é` (raw UTF-8, not escaped), and a single `0a` at the end.
The exit code is 0 and stderr is empty. That is exactly what the run produced, and it is the same
line `tools/oracle.md` §4 derives by hand and `tools/expected.json` holds as data.

The second route to the same number, as the oracle does it: the label totals add up to the balance —
300 (`coffee`) + 120000 (`rent`) + 300 (`café`) = 120600. The running sum and the per-label sums
agree, so 120600 is evidence and not an assertion.

## 5. What you did not check

- **No type check.** No TypeScript compiler is installed on this host and the round forbids adding
  dependencies, so `tsc --noEmit --strict` was never run. The types are written to `--strict` rules
  (`unknown` at the boundary, no `as` casts, no implicit `any`, `bigint` for the amounts), and
  Node's type stripping proved the file *parses*, but nothing proved the types *check*. A reviewer
  with a compiler should run it; I expect it to pass, and I do not claim that it does.
- **One Node version.** Everything above was run on the harness-bundled Node 24.21.0 only. Node
  18, 20 and 22 were not tried, and the `engines` floor of `>=22.6.0` is the version that first can
  strip types from a `.ts` file.
- **Only the boundaries I named.** A file that is a directory, a record with a duplicate key, a
  label that is only a zero-width space, a `label` of 10^6 characters, and a file of a million
  records were not exercised. The first two follow from code paths that are covered by the missing
  file and unexpected key cases; the rest are untested.
- **Cross-implementation agreement.** I read `docs/contract.md`, the fixture, and the shared oracle
  (`tools/oracle.md`, `tools/expected.json`), which another lane wrote while I was working. I did
  not read the Python, Go, Java or Rust lanes' code, so I cannot say whether the five
  implementations agree on the two strictness decisions (an unexpected key, an empty trimmed label
  and a wrong date shape are malformed) or on the exact spacing of the output line. The output
  line is the contract's own example at `docs/contract.md:33` and is asserted byte for byte in my
  tests, so a difference between lanes is visible in the other lanes' own tests. On the two things
  the oracle fixes — the numbers and the shared malformed case — my implementation agrees.
- **The other three failure modes of a malformed record are only exercised through the exported
  functions and the CLI.** `parseRecords`, `summarizeText` and `readLedger` throw `LedgerError`;
  `runLedger` and `main` turn that into an exit code. I tested the exit codes end to end and the
  error's fields by reading the code, not by asserting on a caught `LedgerError` instance.
