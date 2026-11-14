# Go lane report — the `ledger` module

Lane: Go. Files owned by this lane: `ledger.go`, `ledger_test.go`, `go.mod`,
this report. Nothing else was written.

The contract answered to: `docs/contract.md` (64 lines, read whole before any
code was written).

## 1. What you read

Three craft files, loaded with the skill tool by name: `swarm-craft-shared`,
`swarm-craft-developer`, `swarm-craft-go`. Also read: `docs/contract.md` whole,
`fixtures/ledger.jsonl` whole, `README.md`, `.swarm/requirements/mixed-lab.md`.

The rules below are the ones that actually changed a decision. Where a rule
did not apply, it is not cited.

| craft file | section | rule | the decision it shaped |
| --- | --- | --- | --- |
| `swarm-craft-shared` | §3.2 | say how a function fails; parse at the boundary | `Summarize` returns `(Summary, error)`; the error is the last value. All JSON parsing happens once, at the boundary, in `parseRecord`; nothing downstream re-parses a value. |
| `swarm-craft-shared` | §3.3 | one diagnostic per failure on stderr, results on stdout, exit codes are a contract | `run` writes the JSON line to stdout and nothing else; every diagnostic goes to stderr; the exit codes are the contract's 0 / 2 / 3 (plus 1 for an internal fault, which the contract does not name). `run` returns the code instead of calling `os.Exit`, so a test can assert it without a process. |
| `swarm-craft-shared` | §3.7 | validate and convert at the boundary; be explicit about encoding; normalise newlines | The label is trimmed once in `parseRecord` and used trimmed everywhere else (the contract's shared rule). Newlines are normalised by trimming each line, so CRLF files read the same as LF files. Encoding is explicit: `SetEscapeHTML(false)` so a label is written as raw UTF-8. |
| `swarm-craft-shared` | §3.9 | one behaviour per test; cover the boundary, not the middle; pin the wording when the wording is the contract | Four table-driven tests, one `t.Run` per case. The contract names the boundaries (negative, zero, blank line, padded label, label outside ASCII, malformed record, empty file) and each has its own case. The exact output line and the exact stderr wording are pinned, because the contract fixes both. |
| `swarm-craft-shared` | §3.12 | names carry intent; a comment says why | `parseRecord`, `requiredString`, `requiredAmountCents`, `isISODate`, `encodeJSONString` each say why they behave the way they do; comments explain intent, not mechanics. |
| `swarm-craft-developer` | §2 | name the target before the edit; smallest coherent change; keep the public surface stable | One implementation file (`ledger.go`) because the write scope allows only one; the command and the API it exposes therefore share `package main`. No other file in the repo was touched. |
| `swarm-craft-developer` | §4 | the contract is visible in the signature; a doc comment is a promise | `Summary`, `MalformedRecordError`, `Summarize`, `FormatSummary` are exported and documented; every doc comment starts with the name it documents and states the contract rule it implements. |
| `swarm-craft-developer` | §5 | prove it as you go; a check that cannot fail is not a check; re-derive every number a second way; report what could not be run | Every number in this report is derived twice (below). The checks that could be executed were executed; the checks that could not be executed are named in §3 and §5. |
| `swarm-craft-go` | §1 | one module, one `go.mod` at the root; the checks are `go build`, `go vet`, `gofmt -l .`, `go test` | `go.mod` at the repo root: `module ledger`, `go 1.21` (the `slices` package needs 1.21). The four checks are named in §5 of this report with their status. |
| `swarm-craft-go` | §5 | map iteration order is randomised | `FormatSummary` copies the label keys into a slice and sorts it with `slices.Sort` before writing. The output order does not depend on the map's order. |
| `swarm-craft-go` | §6 | the error is the last return value; wrap with `%w`; use `errors.Is`/`errors.As`, not text comparison; `panic` only in main and tests; `os.Exit` skips defers | `Summarize` and `FormatSummary` return `(value, error)`. `Summarize` wraps the read failure with `fmt.Errorf("read %s: %w", path, err)`. `run` finds a malformed record with `errors.As(err, &malformed)`, not by matching text. No `panic` outside tests. `main` is `os.Exit(run(os.Args[1:], os.Stdout, os.Stderr))`; there is no `defer` anywhere in the program, so nothing is skipped by `os.Exit`. |
| `swarm-craft-go` | §8 | `os.ReadFile`; `bufio.Scanner` has a 64 KiB line limit | The file is read whole with `os.ReadFile`, so a long line cannot hit a scanner limit. |
| `swarm-craft-go` | §12 | stdlib `testing`; table-driven with one `t.Run` per case; `t.Helper()`; `t.TempDir()`; `go test ./... -count=1` | `ledger_test.go` uses `testing` only, one `t.Run` per case, `t.Helper()` in the file-writing helper, and `t.TempDir()` for every fixture file it writes. The test command to run is `go test ./... -count=1`. |
| `swarm-craft-go` | §13 | `flag` for a simple binary; parse in `main`, not in `init`; exit 0 on success and a documented non-zero on failure; the message goes to stderr | `run` builds a `flag.NewFlagSet("ledger", flag.ContinueOnError)` with its output set to stderr, takes exactly one positional path, and prints `usage: ledger <path>` on stderr when the argument count is wrong. |
| `swarm-craft-go` | §15 | a doc comment starts with the name it documents; `gofmt` is the style of record | Every exported and every unexported function has a doc comment starting with its name. Formatting was written to `gofmt` rules by hand (see §5 for what could not be checked). |
| `swarm-craft-go` | §16 | standard library first | The imports are `bytes`, `encoding/json`, `errors`, `flag`, `fmt`, `io`, `os`, `slices`, `strconv`, `strings`. No third-party dependency, no `go.sum`. |
| `swarm-craft-go` | §19 | traps: `map[string]any` turns every number into a float64; an ignored error; map iteration order | The trap that matters here is the first one, and it is avoided by construction: no `map[string]any` is used anywhere. The amount is read from the raw JSON text with `strconv.ParseInt(..., 10, 64)`, so a `float64` never appears in the computation. Every error is checked. Map iteration order is handled by sorting (§5 above). |

## 2. What you built

### `ledger.go` (290 lines, `package main`)

Exported surface:

| name | kind | contract rule it serves |
| --- | --- | --- |
| `Summary` | struct: `BalanceCents int64`, `ByLabel map[string]int64` | the exact sum of every `amount_cents`, and the exact sum per trimmed label |
| `MalformedRecordError` | struct: `Line int`, `Reason string`; method `Error() string` → `line %d: %s` | the message names the 1-based line number and the reason, on stderr |
| `Summarize(path string) (Summary, error)` | function | reads the file and returns the summary; `*MalformedRecordError` when a record is malformed, a wrapped error when the file cannot be read |
| `FormatSummary(summary Summary) (string, error)` | function | renders the one JSON line, `balance_cents` first, `by_label` keys sorted by code point |

Unexported helpers: `summarize`, `splitLines`, `parseRecord`, `requiredString`,
`isISODate`, `requiredAmountCents`, `encodeJSONString`, `run`, `main`.

Behaviour, rule by rule:

- **Blank lines.** `summarize` trims each line and skips it when nothing is
  left (`ledger.go:83-86`). The line number still counts those lines.
- **Three keys, exact types.** `parseRecord` decodes the line into a
  `json.RawMessage`, requires it to start with `{`, then decodes it into a
  `map[string]json.RawMessage` and checks each key separately
  (`ledger.go:108-142`).
- **The amount is an integer end to end.** `requiredAmountCents` parses the raw
  JSON text with `strconv.ParseInt(string(bytes.TrimSpace(raw)), 10, 64)`
  (`ledger.go:191-201`). `12.5`, `1e3` and `"450"` are all rejected. No
  `float64` exists anywhere in the program.
- **The label is trimmed once** in `parseRecord` (`ledger.go:134`) and the
  trimmed value is what is stored, summed and printed.
- **The date is compared, never parsed.** `isISODate` checks the shape
  `YYYY-MM-DD` with byte comparisons (`ledger.go:161-183`); no date object is
  built, so no date can drift into a timezone.
- **The output.** `FormatSummary` writes the line by hand in the contract's
  shape, `{"balance_cents": N, "by_label": {"a": 1, "b": 2}}`, with the label
  keys sorted by code point (`slices.Sort`) and the labels encoded as JSON
  strings with HTML escaping off, so `café` stays `café`.
- **Exit codes.** `run` returns 0 (read and printed), 2 (the file could not be
  read; the message names the path, and the same code covers a usage error),
  3 (the file was read but a record is malformed; the message names the line
  number and the reason), 1 (an internal fault, which the contract does not
  name; it is unreachable in practice).

### `ledger_test.go` (369 lines, `package main`)

Four table-driven tests plus three single-purpose tests, all in stdlib
`testing`:

- `TestSummarize` — valid records: empty file, a file of blank lines, a
  negative amount, a zero amount, a blank line between records, a padded
  label, a label outside ASCII, and an amount too large for a `float64`
  (`9007199254740993`) that must stay exact.
- `TestSummarizeMalformed` — the malformed reasons, each pinned with its line
  number: not valid JSON, not a JSON object, a missing key, a fractional
  amount, a quoted amount, an amount in exponent form, a label that is not a
  string, a label that is empty after trimming, a date that is not a string, a
  date that is not an ISO date, and a case where the line number counts the
  blank lines too.
- `TestFormatSummary` — the exact output line: the empty summary, the labels
  sorted by code point (`café` before `coffee` before `rent`), a negative
  amount, and a large amount.
- `TestRun` — the exit codes: 0 with one JSON line on stdout, 2 for a missing
  file with the path in the message, 3 for a malformed record with `line 3:`
  and the reason in the message, and 2 for a missing path argument.
- `TestSharedFixture` — the shared fixture through `Summarize`,
  `FormatSummary` and `run`, with the expected line pinned.
- `TestSharedMalformedCase` — the malformed case `tools/oracle.md` fixes for
  every language: the fourth line is missing `amount_cents`, so the message
  names line 4, the physical line, and not line 3, the record count. The exit
  code is 3 and stdout stays empty.
- `TestCarriageReturnsAreTrimmed`, `TestByteOrderMarkIsIgnored` — the two
  tolerances the implementation grants (CRLF files, a leading UTF-8 BOM).

### `go.mod`

```
module ledger

go 1.21
```

## 3. How you checked it

**This host has no Go toolchain.** `go` and `gofmt` are not on `PATH`, and no
`go.exe` was found at `C:\Program Files\Go\bin`, `C:\Go\bin`,
`%LOCALAPPDATA%\Programs\Go\bin` or the chocolatey location. That is the
round's own decision: `.swarm/decisions/2026-11-14-executability.md` keeps
Go, Java and Rust read-only, so **every verdict in this report is marked
`read`, never `executed`**. Nothing in this lane was compiled, vetted,
formatted or executed.

A correction to an earlier note in this report: the `python` alias on `PATH`
is the Microsoft Store stub and does not run, but a real CPython 3.12 does
exist on this host — the Python lane's run left `__pycache__/ledger.cpython-312.pyc`
behind — so Python *is* executable here and the round's decision to execute
Python and TypeScript stands. The earlier claim that Python does not run on
this host was wrong and is withdrawn.

What was executed, and what it proved:

1. **Byte scan of all three files** (a PowerShell byte pass): `ledger.go` 290
   lines, 0 CR bytes, 290 LF bytes, no BOM; `ledger_test.go` 369 lines, 0 CR,
   369 LF, no BOM; `go.mod` 3 lines, 0 CR, 3 LF, no BOM. The line endings are
   LF, as required.
2. **Encoding check**: the `café` in `ledger_test.go` decodes to the code
   points U+0063 U+0061 U+0066 U+00E9, so the file is UTF-8 and the label is
   the intended one. (The console renders it as `caf茅`; that is the console
   code page, not the file.)
3. **Delimiter balance**: a small Go-aware scanner (it skips line comments,
   block comments, raw strings, interpreted strings and rune literals) ran
   over both Go files: braces 0, parentheses 0, brackets 0, and the scanner
   ended in code state, so no string or comment is left open. A raw brace count
   of the whole file differs by one because of the rune literal `'{'` at
   `ledger.go:113`; the scanner ignores it, correctly.
4. **Indentation check**: no line in either Go file starts with a space, and
   there is no pair of consecutive blank lines. The files are tab-indented, as
   `gofmt` requires.
5. **Read-through against the contract**, step by step:
   - *UTF-8 JSON Lines* — `os.ReadFile` reads the bytes as they are;
     `splitLines` splits on `\n`; each line is trimmed, so CRLF and a leading
     BOM are handled (`ledger.go:97-104`).
   - *A blank or whitespace-only line is ignored* — `summarize` skips a line
     whose trimmed content is empty (`ledger.go:83-86`).
   - *Three keys, exact types* — `parseRecord` checks `date` and `label` with
     `requiredString` (a `*string` tells a JSON `null` apart from a string)
     and `amount_cents` with `requiredAmountCents` (`ledger.go:123-141`).
   - *Malformed = not an object, missing a key, or a non-integer amount* — the
     three are detected, each with its own reason, and `summarize` stops at
     the first one and returns `*MalformedRecordError` with the 1-based line
     number (`ledger.go:87-90`).
   - *The message names the line number and the reason, on stderr* —
     `MalformedRecordError.Error()` returns `line %d: %s`; `run` prints it to
     stderr and returns 3 (`ledger.go:52-55`, `ledger.go:266-275`).
   - *One JSON object on one line, keys in this order* — `FormatSummary` writes
     `balance_cents` first, then `by_label` (`ledger.go:203-232`).
   - *The balance is the exact sum, an integer, no floating point anywhere* —
     every amount is an `int64` from `strconv.ParseInt`; there is no float
     type in the program.
   - *`by_label` maps each trimmed label to the exact sum, keys sorted by code
     point* — `summarize` accumulates into `map[string]int64` under the
     trimmed label; `FormatSummary` sorts the keys with `slices.Sort`, and Go
     compares strings by byte value, which for UTF-8 is code-point order.
   - *A file with no records prints `{"balance_cents": 0, "by_label": {}}`* —
     `summarize` starts with an empty map and a zero balance, and
     `FormatSummary` writes exactly that line for an empty map.
   - *The output is on stdout and the program exits 0* — `run` writes the line
     with `fmt.Fprintln(stdout, line)` and returns 0.
   - *Exactly one path on the command line* — `flags.NArg() != 1` prints the
     usage on stderr and exits 2.
   - *Exit codes 0 / 2 / 3* — `run` returns them; the missing-file message
     comes from `fmt.Errorf("read %s: %w", path, err)`, so it names the path;
     the malformed message names the line and the reason.
   - *Integer arithmetic only* — the only arithmetic is `+=` on `int64`.
   - *The label is trimmed once, at the boundary, and used trimmed
     everywhere* — trimmed in `parseRecord`; `summarize` and `FormatSummary`
     never trim again.
   - *The dates are read, compared and reported, never parsed into a
     timezone-aware object* — the date is compared byte-wise by `isISODate`;
     the program imports no date library and builds no date object.
   - *Nothing is printed except the one JSON line on stdout* — the only writes
     to stdout are `fmt.Fprintln(stdout, line)`; every diagnostic goes to
     stderr.
6. **The numbers were derived twice.** The balance: 450 − 150 + 120000 + 0 +
   300 = 120600, and the sum of the positives (450 + 120000 + 300 = 120750)
   minus 150 = 120600. The per-label sums: 450 − 150 + 0 = 300 for coffee,
   120000 for rent, 300 for café; and the three label sums add up to
   120600, which matches the balance. The sort order was checked twice: by
   the first differing character (`c`=`c`, then `a` 0x61 < `o` 0x6F), and by
   UTF-8 byte order (`café` = 63 61 66 C3 A9, `coffee` = 63 6F 66 66 65 65,
   `rent` = 72 65 6E 74), which agree.

## 4. The result you expect on the shared fixture

`fixtures/ledger.jsonl` holds six lines: a normal coffee record of 450, a
blank line, a `"  coffee  "` record of −150, a rent record of 120000, a coffee
record of 0, and a `café` record of 300.

The line the command prints on stdout, and nothing else:

```
{"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}
```

Exit code 0. The balance is 450 − 150 + 120000 + 0 + 300 = 120600; `coffee`
sums to 300, `rent` to 120000 and `café` to 300; the three label sums add up
to the balance; the labels sort as `café` (U+0063 U+0061 U+0066 U+00E9) before
`coffee` before `rent`.

This line was derived by hand before the round's oracle was published, and it
is **byte for byte** the line in `tools/oracle.md` §4, and it carries the same
values as `tools/expected.json` (balance 120600; `café` 300, `coffee` 300,
`rent` 120000). The two derivations agree on the bytes, not only on the
numbers.

The shared malformed case of `tools/oracle.md` §5 is answered the same way:
the file's fourth line is missing `amount_cents`, so this implementation
exits 3, prints nothing on stdout, and writes `line 4: missing key
"amount_cents"` on stderr. The line number is the physical line, 4, not the
record count, 3 — `summarize` numbers the lines of the file, and the blank
line 2 is counted but skipped.

**One judgement call the Lead has to reconcile across the lanes:**

1. **A date that is not `YYYY-MM-DD` is treated as a malformed record.** The
   contract's malformed definition names three conditions
   (`docs/contract.md:18-21`) and does not mention the date, but the per-key
   table (`docs/contract.md:12-16`) states that a date *is* an ISO date, and
   the same reasoning is applied to the label, whose table rule ("not empty
   after trimming") is also absent from the malformed list. If another lane
   accepts a non-ISO date instead of exiting 3, this is the reason, and it
   shows up as a difference in the error table, not in the totals. The shape
   is checked, not the calendar: `2026-02-31` passes. The shared fixture and
   the shared malformed case are unaffected either way.

The spacing of the output line is no longer an open question: the round's
oracle (`tools/oracle.md` §4) prints the same spacing this implementation
does, so the two are byte-identical.

**For the round as a whole:** the decision file
`.swarm/decisions/2026-11-14-executability.md` settles the executability
question — Python and TypeScript are executed, Go, Java and Rust are judged
by reading. This lane's contribution to the cross-language check is therefore
the byte-exact expected line and the shared malformed case, both derived by
hand and both checked against the oracle text rather than against a running
program.

## 5. What you did not check

- **The code was never compiled.** `go build ./...` was not run: there is no Go
  toolchain on this host. A compile error would be invisible to me.
- **The code was never vetted.** `go vet ./...` was not run, so the printf
  checks, the `errors.As` check and the `stringintconv` check were reasoned
  about by reading the format strings one by one, not confirmed by the tool.
- **The code was never executed.** `go test ./... -count=1` was not run, so
  none of the twenty-odd cases in `ledger_test.go` has actually passed. Their
  expected values were derived by hand from the contract and the fixture.
- **The code was never formatted.** `gofmt -l .` was not run, so the claim
  "gofmt-clean" is a hand-check of tabs, alignment and blank lines, not a
  tool result. The struct-field and composite-literal alignment in the test
  tables is the most likely place for a `gofmt` diff.
- **The delimiter scan is not a Go parser.** The scanner I used proves that
  braces, parentheses and brackets balance and that no string or comment is
  left open. It cannot see a type error, a wrong argument count, an unused
  variable or a wrong method name. Those were checked by reading each file
  once more, line by line, against the standard library signatures.
- **The shared fixture was read, not run.** The expected line in §4 is a
  derivation, not an observation.
- **The date rule is a shape check.** `2026-02-31` is accepted; no calendar
  validation is done, deliberately, because a calendar check would need a date
  object and the contract forbids parsing dates into one.
- **The exact bytes other lanes print were not compared.** The lines above are
  what this lane would print; cross-language byte agreement is the Lead's to
  check.
