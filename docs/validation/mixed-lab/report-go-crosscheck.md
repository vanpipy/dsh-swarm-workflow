# Cross-check — the Go implementation against `docs/contract.md`

Lane: go (cross-check). Date: 2026-11-14.

**Nothing was executed.** This host has no Go toolchain: no compiler, no `go
vet`, no `gofmt`, no test runner. `go build ./...`, `go vet ./...`, `gofmt -l .`
and `go test ./...` were **not** run, and the program was never started.
Every row in the table below is a **read** verdict, marked `read`. No row claims
that a test passed. The test file `ledger_test.go` is read as *intent*, not as
evidence of behaviour.

Sources: `docs/contract.md` (the only source of truth), the oracle
`tools/oracle.md` and `tools/expected.json`, the fixture
`fixtures/ledger.jsonl`, and the implementation `ledger.go`, `ledger_test.go`,
`go.mod`. The Go craft file read for the traps and the version floor is
`skills/swarm-engineering/languages/go.md`.

## The verdict table

| # | Clause | What the code does | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Input is UTF-8 JSON Lines, one JSON object per line | The file is read whole with `os.ReadFile`, split on `\n` only, and each non-blank line is handed to `json.Unmarshal`; a leading BOM is dropped first. A line that is not one JSON value is rejected. | read / met | ledger.go:73, ledger.go:101-104, ledger.go:110-112 |
| 2 | A line that is empty or holds only whitespace is ignored | `bytes.TrimSpace(line)` is tested for length 0 and the line is skipped with `continue`; the line still consumes its index, so the numbering is unaffected. | read / met | ledger.go:84-87 |
| 3 | `date` is a string | The field is read into a `*string`; a JSON `null` or a non-string is refused with `"date" is not a string`. | read / met | ledger.go:123-126, ledger.go:147-158 |
| 4 | `date` is an ISO date, `YYYY-MM-DD` | `isISODate` checks the length is 10, that positions 4 and 7 are `-`, and that every other byte is a digit. | read / met | ledger.go:127-129, ledger.go:165-183 |
| 5 | `label` is a string | Read into a `*string`; `null` or a non-string is refused with `"label" is not a string`. | read / met | ledger.go:130-133, ledger.go:147-158 |
| 6 | `label` is not empty after trimming | The label is trimmed and an empty result is refused with `"label" is empty after trimming`. | read / met | ledger.go:134-137 |
| 7 | `amount_cents` is an integer, may be negative, never a float | The raw JSON text of the value is read and parsed with `strconv.ParseInt(..., 10, 64)`; a decimal point, an exponent, a quoted number, `null` and a boolean are all refused with `"amount_cents" is not an integer`. A leading `-` is accepted, so negative amounts are legal. The value never passes through a float. | read / met | ledger.go:191-201 |
| 8 | A record has *exactly* these three keys | The object is unmarshalled into `map[string]json.RawMessage` and only the three named keys are looked up. **No check rejects an unexpected key**: an object with `date`, `label`, `amount_cents` **and** a fourth key is accepted as a valid record. | read / **not met** | ledger.go:118-121, ledger.go:123-141 |
| 9 | Malformed: the line is not a JSON object | Valid JSON that is not an object (a scalar, an array, `null`) is refused with `not a JSON object`; text that is not JSON at all is refused with `not valid JSON`. | read / met | ledger.go:110-121 |
| 10 | Malformed: a key is missing | Each of the three keys is looked up explicitly; a missing one is refused with `missing key "<name>"`. | read / met | ledger.go:147-151, ledger.go:191-195 |
| 11 | Malformed: `amount_cents` is not an integer | Refused with `"amount_cents" is not an integer`. | read / met | ledger.go:196-199 |
| 12 | The malformed message names the line number (1-based) and the reason, and goes to stderr | `MalformedRecordError.Error()` formats `line %d: %s`; `run` writes it with `fmt.Fprintln(stderr, ...)`. | read / met | ledger.go:53-55, ledger.go:268-272 |
| 13 | The line number is the **physical** line, not the record ordinal | The number comes from the index of the line inside the whole file (`i + 1` over the split of the entire content), so blank lines still count. On the shared malformed case the Go code reports **4** — the physical line — not 3, the record ordinal. | read / met | ledger.go:83, ledger.go:90, ledger.go:103; oracle.md:145-152 |
| 14 | The program reports the malformed record and stops | `summarize` returns the error on the first bad line, so no later line is read and nothing is printed. | read / met | ledger.go:88-91 |
| 15 | Output is one JSON object on one line, keys in the order `balance_cents`, then `by_label` | The line is built by hand: `{"balance_cents": ` + the integer + `, "by_label": {` + the label map + `}}`. The order is fixed by the code, not by map iteration order. | read / met | ledger.go:206-232 |
| 16 | `by_label` keys are sorted lexicographically by code point | The keys are collected into a slice and sorted with `slices.Sort`. Go compares strings byte-wise, and UTF-8 byte order is code-point order, so this is code-point order for every label, not only for the fixture's three: `café` (63 61 66 C3 A9) before `coffee` (63 6F …) before `rent` (72 …). | read / met | ledger.go:212-216; oracle.md:99-108 |
| 17 | Integer arithmetic only, no floating point anywhere | The balance and the per-label totals are `int64`; the amount is parsed with `strconv.ParseInt` from the raw text; the output is written with `strconv.FormatInt`. No `float64` appears in the module, and `map[string]any` (which would turn integers into `float64`) is not used. | read / met | ledger.go:38-40, ledger.go:92-93, ledger.go:191-201, ledger.go:209, ledger.go:228 |
| 18 | `balance_cents` is the exact sum of every `amount_cents` | `summary.BalanceCents += rec.amountCents` for every record. Hand-traced over the fixture: 450 → 300 → 120300 → 120300 → **120600**. | read / met | ledger.go:92; oracle.md:42-60 |
| 19 | `by_label` maps each trimmed label to the exact sum of that label's amounts | `summary.ByLabel[rec.label] += rec.amountCents` with the already-trimmed label. Hand-traced: `coffee` 450 − 150 + 0 = 300, `rent` 120000, `café` 300. | read / met | ledger.go:93; oracle.md:64-68 |
| 20 | A file with no records prints `{"balance_cents": 0, "by_label": {}}` | The map is created empty, the balance starts at 0, and `FormatSummary` emits the empty object in the same shape. | read / met | ledger.go:82, ledger.go:206-232 |
| 21 | The label is trimmed once, at the boundary, and used trimmed everywhere | `strings.TrimSpace(label)` runs once, inside `parseRecord`, and the trimmed value is what is stored in the record and what is used as the map key. The line-level `bytes.TrimSpace` at ledger.go:84 trims the *line*, before parsing, and never touches the label value. | read / met | ledger.go:134, ledger.go:142, ledger.go:93 |
| 22 | Exit 0 when the file was read and printed | `run` writes the line to stdout and returns `exitOK` (0); `main` passes that to `os.Exit`. | read / met | ledger.go:284-285, ledger.go:289 |
| 23 | Exit 2 when the file could not be read, and the message names the path | `os.ReadFile`'s error is wrapped as `read %s: %w` with the path, printed to stderr, and `run` returns `exitUnreadable` (2). | read / met | ledger.go:73-76, ledger.go:273-274 |
| 24 | Exit 3 when the file was read but a record is malformed | The error is matched with `errors.As` against `*MalformedRecordError` and `run` returns `exitMalformed` (3). | read / met | ledger.go:267-272 |
| 25 | stdout carries the JSON line and nothing else | The only write to stdout is `fmt.Fprintln(stdout, line)`. The flag package's output is redirected to stderr (`flags.SetOutput(stderr)`), the usage text goes to stderr, every diagnostic goes to stderr, and the JSON encoder writes into a `bytes.Buffer`, never to stdout. On the malformed path nothing is written to stdout at all. | read / met | ledger.go:251-255, ledger.go:270-284, ledger.go:237-246 |
| 26 | The command line takes exactly one path | `flags.NArg() != 1` prints the usage to stderr and returns 2; the single positional argument is the path. | read / met | ledger.go:260-264 |
| 27 | Dates are read and compared, never parsed into a timezone-aware object | The date is kept as a `string` and compared by shape only. The module does not import `time`, and no date object is ever built. | read / met | ledger.go:62-66, ledger.go:127-129, ledger.go:165-183 |
| 28 | Dates are "reported" | The contract's shared clause says dates are read, compared *and reported*, but the fixed output shape has no date field, so no implementation can report one. The Go code reads and shape-checks the date and reports nothing about it. This is a tension inside the contract, not a choice the Go code could resolve. | read / not applicable | docs/contract.md:29-40, docs/contract.md:62-63, ledger.go:62-66 |

## The fixture and the shared malformed case, traced by hand

**The fixture** (`fixtures/ledger.jsonl`), through the Go code path:

| physical line | what the code sees | balance after | `by_label` after |
| --- | --- | --- | --- |
| 1 | `coffee` 450 | 450 | coffee 450 |
| 2 | blank → `continue` at ledger.go:86 | 450 | coffee 450 |
| 3 | `"  coffee  "` trimmed to `coffee`, −150 | 300 | coffee 300 |
| 4 | `rent` 120000 | 120300 | coffee 300, rent 120000 |
| 5 | `coffee` 0 | 120300 | coffee 300, rent 120000 |
| 6 | `café` 300 | 120600 | café 300, coffee 300, rent 120000 |

The line the code would print is therefore

```
{"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}
```

which is byte-for-byte the line in `oracle.md:92` and the values in
`expected.json`. The label order follows from the sort at ledger.go:216 and the
code-point argument in `oracle.md:99-108`. The Go encoder writes `café`
literally (no `\u` escaping): `SetEscapeHTML(false)` is set and Go's encoder
does not escape non-ASCII.

**The shared malformed case** (the four lines of `oracle.md:131-134`): the file
is split into lines 1, 2, 3, 4; line 2 is blank and skipped but still consumes
its index; line 4 is missing `amount_cents`, so `requiredAmountCents` returns
`missing key "amount_cents"` and `summarize` builds
`MalformedRecordError{Line: 4, Reason: ...}`. The message on stderr is

```
line 4: missing key "amount_cents"
```

and the exit code is 3. The number 4 is the **physical** line, as
`oracle.md:145-152` requires, and not the record ordinal 3. The Go test file
pins the same two numbers at `ledger_test.go:360` and `ledger_test.go:374`.

**Cross-language agreement on this point:** the other lanes number physical
lines the same way — `ledger.py:133` (`enumerate(lines, start=1)`),
`ledger.rs:164-165` (`split('\n').enumerate()`, `index + 1`),
`ledger.ts:123` (`index + 1`) and `Ledger.java:148-150`. The Go choice is the
same choice, not a coincidence.

## Findings

### material

1. **The "exactly these three keys" rule is not enforced — the Go lane is the
   only one of the five that accepts an unexpected key.**
   `ledger.go:118-121` unmarshals the object into `map[string]json.RawMessage`
   and then looks up only the three required keys; nothing rejects a fourth.
   The contract's input section says "Every other line is one record with
   **exactly** these three keys" (`docs/contract.md:8-10`), and the other four
   lanes read that as a rule and refuse the record: `ledger.py:100-102`
   (`unexpected key '...'`), `ledger.ts:299-302`,
   `Ledger.java:315`, `ledger.rs:228`. So the same file gives **exit 0 and a
   printed total in Go** and **exit 3 with a malformed-record message in the
   other four**. That is a divergence on the same input under R6, and it is the
   only clause in this report the code does not support.
   *Note on the contract's own wording:* the malformed sentence
   (`docs/contract.md:18-21`) enumerates only "not a JSON object", "missing a
   key" and "`amount_cents` is not an integer", and does not say "only these".
   The Go behaviour is defensible under that narrower sentence and wrong under
   the "exactly these three keys" sentence — the contract admits both readings,
   and the other four lanes and the shared fixture pick the stricter one.

### non-blocking

2. **The malformed set is stricter than the contract's malformed sentence.**
   The Go code treats a non-string `date`, a non-ISO `date`, a non-string
   `label` and an empty-after-trimming `label` as malformed
   (`ledger.go:127-129`, `ledger.go:130-137`), which the contract's malformed
   sentence does not list. The four other lanes make the same stricter choice
   (`ledger.py:104-117`), so this is a shared reading of the contract's field
   table, not a Go-only divergence — but the Coordinator should know that the
   strictness is a decision, not a quotation of the contract.
3. **The reason for an out-of-range integer is inaccurate.** An
   `amount_cents` larger than `int64` is refused with
   `"amount_cents" is not an integer` (`ledger.go:196-199`), although the value
   *is* an integer. Java distinguishes "out of range for a 64-bit integer"
   (`Ledger.java:362`) and TypeScript "is outside the exact integer range"
   (`ledger.ts:322`). The contract does not fix the wording, so the Go message
   is permitted, but the stderr strings of the five lanes differ.
4. **An `int64` overflow in the running sums wraps silently**
   (`ledger.go:92-93`). The contract does not bound the amounts and does not
   mention overflow; Python's arbitrary-precision integers would not wrap, so
   the lanes can diverge on extreme inputs. No shared case reaches this.
5. **Two exit codes sit outside the contract's three.** A wrong argument count
   or a flag parse error exits 2 (`ledger.go:256-263`) and an internal
   formatting fault exits 1 (`ledger.go:277-283`). The contract fixes 0, 2 and
   3 for the three named situations and is silent about these two; the 2-for-
   usage choice is the conventional one and the 1 path is unreachable in
   practice (encoding a Go string cannot fail).
6. **U+2028 and U+2029 are escaped even with HTML escaping off**
   (`ledger.go:237-246`), so a label holding either is written as `\u2028` in Go
   while other languages may write it literally. The fixture holds neither, and
   the contract does not fix the escaping.
7. **The contract's own "reported" clause cannot be met by any implementation.**
   `docs/contract.md:62-63` says the dates are "read, compared and reported",
   but the output shape (`docs/contract.md:29-40`) has no date field. The Go
   code reads and compares the date and reports nothing about it.

### out of scope

8. **The quality, coverage and passing-ness of `ledger_test.go` was not
   judged.** The file was read as intent: it pins the fixture line
   (`ledger_test.go:17`), the physical line number of the shared malformed case
   (`ledger_test.go:344-377`), the exit codes (`ledger_test.go:245-305`) and the
   sort order (`ledger_test.go:202-242`). None of it was run, and a test that
   has never run proves nothing about the program.

## The boundary of this lane

- **Nothing was executed.** No Go compiler, `go vet`, `gofmt` or `go test` is
  available on this host, so no row in this report is an executed verdict and
  no claim of a passing test appears anywhere in it. The verdicts are read
  verdicts, in the sense of `.swarm/decisions/2026-11-14-executability.md`.
- **The standard-library behaviours the verdicts rest on were not run
  either.** `slices.Sort` comparing strings byte-wise, `strconv.ParseInt`
  refusing `12.5` / `1e3` / `"450"`, `json.RawMessage` preserving the raw
  value text, `json.Encoder` leaving `é` literal, `flag` writing to the
  configured output — these are stated from the documented semantics of the Go
  standard library, not from an observation on this host.
- **The code was not compiled.** That it compiles is an inspection result: the
  import set is exactly the set the code uses (an unused import is a compile
  error in Go), and every standard-library API used is at or below the
  `go 1.21` floor in `go.mod` — `slices` is the binding one, and it arrived in
  Go 1.21 (`skills/swarm-engineering/languages/go.md:54`). Because the floor is
  1.21, the per-iteration loop variable of Go 1.22 is **not** available, and
  the test file correctly copies the loop variable (`ledger_test.go:89`,
  `ledger_test.go:180`) — the trap named in the craft file at
  `skills/swarm-engineering/languages/go.md:64` and
  `skills/swarm-engineering/languages/go.md:217`.
- **Formatting was not checked by tool.** `gofmt -l .` was not run; the
  indentation in the two files is consistent by eye only.
- **Other lanes were not judged.** No other lane's report was read. The other
  lanes' *implementation* files were consulted for one purpose only — the
  cross-language agreement that R6 asks about (the unexpected-key rule and the
  line numbering) — and nothing here is a verdict on Python, TypeScript, Java
  or Rust.
- **The arithmetic in the table was done by hand**, from the bytes of
  `fixtures/ledger.jsonl` and the code path in `ledger.go`, and agrees with
  `tools/oracle.md` and `tools/expected.json`.
