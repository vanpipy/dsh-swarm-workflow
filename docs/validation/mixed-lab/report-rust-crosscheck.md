# Rust cross-check — `ledger.rs` against `docs/contract.md`

Lane: `rust` (cross-check). Date: 2026-11-14.

**Nothing was executed.** This host has no Rust toolchain — no `cargo`, no
compiler, no test runner — so every verdict below is a **read** verdict. No
test was run, no binary was built, no exit code was observed. Where a verdict
says "met" it means *the code as written supports the clause*, not that the
code was observed to do it.

The implementation under judgement: `ledger.rs` (the binary), `ledger_test.rs`
(the test target), `Cargo.toml`. The contract: `docs/contract.md`. The oracle:
`tools/oracle.md`, `tools/expected.json`.

The fixture was inspected at the byte level (read-only): 319 bytes, no `\r`,
the last byte is `\n`, `split('\n')` yields 7 parts of which part 7 is the
empty string after the final newline — 6 physical lines, 5 records, exactly as
`tools/oracle.md` §1 states.

## The clause-by-clause table

| # | Clause (contract) | What the code does | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| 1 | The input is a file of UTF-8 JSON Lines, one JSON object per line | `summarize_file` reads the whole file with `fs::read`, converts it with `String::from_utf8` (a non-UTF-8 file becomes an `Unreadable` error, exit 2), then `summarize` splits the text on `'\n'` and parses each line as one JSON document with a hand-written reader | read/met | `ledger.rs:138-154`, `ledger.rs:161-164`, `ledger.rs:363-393` |
| 2 | A line that is empty or holds only whitespace is ignored | Each split part is `trim()`ed; an empty result is `continue`d before any parsing, so blank and whitespace-only lines never reach the parser and never affect the count | read/met | `ledger.rs:166-169` |
| 3 | `date` is a string | `as_str` rejects anything that is not `json::Value::String` with the reason `date is not a string` | read/met | `ledger.rs:231`, `ledger.rs:294-299` |
| 4 | `date` is an ISO date, `YYYY-MM-DD` | `is_iso_date` checks the **shape** only: 10 bytes, `-` at 4 and 7, ASCII digits elsewhere. It is deliberately not a calendar check, and the doc comment says so (`2026-13-45` is accepted) | read/met | `ledger.rs:232-234`, `ledger.rs:318-330` |
| 5 | `label` is a string, not empty after trimming, surrounding whitespace trimmed | `as_str` enforces the type; the label is then `trim()`ed **once**; an empty result after trimming is a malformed record | read/met | `ledger.rs:235-239`, `ledger.rs:294-299` |
| 6 | `amount_cents` is an integer, may be negative, never a float | The JSON reader keeps every number as its **raw text**, so `450` and `450.0` are distinguishable; `as_amount` rejects any raw text containing `.`, `e` or `E`, rejects non-numbers, and parses the rest with `parse::<i64>()`. A negative sign is ordinary JSON syntax and reaches `parse::<i64>()` intact | read/met | `ledger.rs:306-316`, `ledger.rs:369-372`, `ledger.rs:612-650` |
| 7 | Every record has exactly these three keys | The three keys are required; a fourth key is rejected as `unexpected key "<name>"` (the smallest offending name, for a deterministic message) | read/met | `ledger.rs:211-222`, `ledger.rs:224-229` |
| 8 | A line that is not a JSON object, or is missing a key, or whose `amount_cents` is not an integer, is a malformed record | All three are malformed records: a non-object value yields `not a JSON object`; a missing key yields `missing key "<name>"`; a non-integer amount yields `amount_cents is not an integer` | read/met | `ledger.rs:202-205`, `ledger.rs:224-226`, `ledger.rs:240`, `ledger.rs:306-316` |
| 9 | The program reports it and stops | `summarize` returns `Err` at the first offending line — the `?` on `parse_record` ends the loop — and `run` prints the diagnostic and returns the exit code without printing a summary | read/met | `ledger.rs:170-171`, `ledger.rs:267-278` |
| 10 | The message names the line number (1-based) | The diagnostic is `"{path}: malformed record at line {n}: {reason}"`; `n` and the reason are both present | read/met | `ledger.rs:79-83`, `ledger.rs:107-121` |
| 11 | The line number is the **physical** line, not the record ordinal | The counter is `index + 1` over `text.split('\n').enumerate()`, so blank lines consume a number. On the shared malformed case (record on file line 4, 3rd record because line 2 is blank) the code yields **4** — the physical line. The test asserts `error.line == 4` | read/met | `ledger.rs:164-165`, `ledger.rs:171`, `ledger_test.rs:34-39`, `ledger_test.rs:309-318` |
| 12 | The message goes to stderr | The diagnostic is written with `eprintln!`; stdout is written only on the success path | read/met | `ledger.rs:273`, `ledger.rs:269` |
| 13 | The output is one JSON object on one line, keys in the order `balance_cents`, then `by_label` | The `Display` impl writes `{"balance_cents": N, "by_label": {…}}` literally, in that order, with one space after each `:` and `, ` between entries | read/met | `ledger.rs:54-68` |
| 14 | `balance_cents` is the exact sum of every `amount_cents`, an integer, no floating point anywhere | Every amount is an `i64`; the running balance is `i64::checked_add`; the totals are `i64::checked_add`; the `Display` writes the `i64`. There is no `f32`/`f64` anywhere in the file — the JSON reader keeps number text rather than a float | read/met | `ledger.rs:14-15`, `ledger.rs:42`, `ledger.rs:162`, `ledger.rs:172-187`, `ledger.rs:58` |
| 15 | `by_label` maps each trimmed label to the exact sum of that label's amounts | The map key is `record.label`, i.e. the trimmed label from the boundary; the value is the checked sum of that label's amounts | read/met | `ledger.rs:178-187` |
| 16 | The `by_label` keys are sorted lexicographically by code point | The map is a `BTreeMap<String, i64>`; `String`'s `Ord` is byte-wise, and UTF-8 byte order **is** code-point order for every code point, so this satisfies "by code point" exactly (not merely on this fixture). Iteration of a `BTreeMap` is in ascending key order | read/met | `ledger.rs:19`, `ledger.rs:51`, `ledger.rs:59` |
| 17 | A file with no records prints `{"balance_cents": 0, "by_label": {}}` | With an empty map the loop writes nothing and the impl closes with `}}`, giving exactly that text (no space between the braces) | read/met | `ledger.rs:58-67`, `ledger_test.rs:29-30`, `ledger_test.rs:156-163` |
| 18 | The output is printed on stdout and the program exits 0 | `println!("{}", summary)` then `EXIT_OK`; `main` returns `ExitCode::from(u8)` | read/met | `ledger.rs:28`, `ledger.rs:267-271`, `ledger.rs:284-286` |
| 19 | The command line takes exactly one path | `run` accepts exactly one argument; zero or two arguments fall to the usage branch | read/met | `ledger.rs:255-266` |
| 20 | Exit 2 when the file could not be read, and the message names the path | `fs::read` failure (missing file, a directory) and a non-UTF-8 file both become `LedgerError::Unreadable` → `EXIT_UNREADABLE`; the message is `cannot read '{path}': {io error}` with the path as given | read/met | `ledger.rs:30`, `ledger.rs:139-149`, `ledger.rs:110-112`, `ledger.rs:275` |
| 21 | Exit 3 when the file was read but a record is malformed | A malformed record becomes `LedgerError::Malformed` → `EXIT_MALFORMED` = 3 | read/met | `ledger.rs:32`, `ledger.rs:150-153`, `ledger.rs:276` |
| 22 | Integer arithmetic only; the label is trimmed once at the boundary and used trimmed everywhere | `i64` from the first byte to the last; `Record.label` is the trimmed string and is the only form the map ever sees — the line-level `trim()` at `ledger.rs:166` trims the **whole line**, not the label, and is not a second trim of the label | read/met | `ledger.rs:14-15`, `ledger.rs:236`, `ledger.rs:178` |
| 23 | The dates are read, compared and reported; they are never parsed into a timezone-aware object | **Partially.** The date is read, type-checked, shape-checked and kept as an opaque `String` in `Record.date`; it is never parsed into a date type. But the code never **compares** two dates, and the date is never **reported** — the contract's output shape has no field for it, so there is nowhere to report it. No observable clause depends on the comparison | read/not met (partial; contract under-specified against its own output shape) | `ledger.rs:231-234`, `ledger.rs:242-246`, `ledger.rs:54-68` |
| 24 | Nothing is printed except the one JSON line on stdout | The only `println!` in the file is the success path; every diagnostic uses `eprintln!`. `println!` writes `\n` only — Rust does not translate newlines to `\r\n` on Windows | read/met | `ledger.rs:269`, `ledger.rs:263`, `ledger.rs:273` |

### The numbers, against the oracle

| Oracle value (`tools/expected.json`) | What the code produces, read | Agrees |
| --- | --- | --- |
| `balance_cents` = 120600 | 450 + (−150) + 120000 + 0 + 300 = 120600, summed as `i64` | yes |
| `by_label["café"]` = 300 | line 6 alone, 300 | yes |
| `by_label["coffee"]` = 300 | 450 + (−150) + 0 = 300, merged because line 3's label is trimmed to `coffee` | yes |
| `by_label["rent"]` = 120000 | line 4 alone, 120000 | yes |
| key order `café`, `coffee`, `rent` | `BTreeMap` order; `café` = `63 61 66 E9` < `coffee` = `63 6F …` < `rent` = `72 …` | yes |
| the exact output line | `{"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}` — the `Display` impl writes `{"balance_cents": `, `, "by_label": {`, then `"label": total` joined by `, `, then `}}`. Byte-for-byte the oracle's line at `tools/oracle.md:92` | yes |
| malformed case: exit 3, empty stdout, stderr naming **line 4** and the reason, the reason naming `amount_cents` | `summarize` yields `MalformedRecord { line: 4, reason: "missing key \"amount_cents\"" }`; `run` prints `{path}: malformed record at line 4: missing key "amount_cents"` to stderr and returns 3, printing nothing to stdout | yes |

The one place where the physical/ordinal distinction bites is real here: the
shared malformed ledger's bad record is the 3rd record but the 4th line, and
the implementation counts lines (`ledger.rs:164-165`), not records.

### Where the contract is silent, and the choice this implementation made

| Contract silence | The choice | Where |
| --- | --- | --- |
| the integer width of `amount_cents` | `i64`; a larger integer is malformed (`amount_cents does not fit in a 64-bit integer`) | `ledger.rs:314-315` |
| what happens when a sum overflows | treated as a malformed record at the line that overflows, so exit 3 | `ledger.rs:172-187` |
| the exit code for a wrong argument count | 2, with the message `usage: ledger <path>` on stderr | `ledger.rs:259-266` |
| the wording of the malformed reason | fixed per failure kind: `invalid JSON: …`, `not a JSON object`, `missing key "…"`, `unexpected key "…"`, `date is not a string`, `date "…" is not an ISO date (YYYY-MM-DD)`, `label is not a string`, `label is empty after trimming`, `amount_cents is not an integer` | `ledger.rs:201-240`, `ledger.rs:289-316` |
| whether a JSON object with a duplicated key is valid | accepted, the **last** occurrence wins | `ledger.rs:211-222` |
| whether a non-UTF-8 file is "unreadable" | yes: exit 2 with the path named | `ledger.rs:143-149` |
| CRLF input | tolerated: `trim()` removes the trailing `\r` before parsing (the shared fixture is LF-only) | `ledger.rs:166` |
| whether `date` is checked as a calendar date | no: the shape only, by an explicit choice recorded in the doc comment | `ledger.rs:318-321` |
| whether the label is trimmed before or after the empty check | after: the contract's own wording is "not empty after trimming" | `ledger.rs:236-239` |

## Findings

**blocking — none found by reading.**

**material — none found by reading.** Every clause of the contract that has an
observable consequence is supported by the code, including the two places where
a wrong implementation usually goes wrong: the physical line number and the
code-point sort.

**non-blocking**

1. The implementation is **stricter** than the contract's explicit malformed
   list. The contract enumerates three malformations — not a JSON object, a
   missing key, a non-integer `amount_cents` — and the implementation adds
   four more: `date` that is not a string, a `date` that is not `YYYY-MM-DD`,
   a `label` that is not a string, a `label` that is empty after trimming, and
   a fourth key. Each of these is defensible against the contract's key table
   ("exactly these three keys", with the stated types), but a lane that reads
   the malformed list as exhaustive would accept these lines. The shared
   malformed case is unaffected. — `ledger.rs:227-229`, `ledger.rs:231-239`
2. The contract's malformed list says "not a JSON object, or missing a key, or
   `amount_cents` is not an integer". A **`date` that is not a string** is
   rejected as malformed, which is *not* in that list. If a cross-lane
   comparison feeds such a line, the Rust lane would exit 3 where a lane that
   accepts it would exit 0. Same for a non-ISO `date` and an empty label. —
   `ledger.rs:231-239`
3. The integer range is `i64`, and the contract says only "integer". A lane
   with arbitrary-precision integers accepts an amount of
   `9223372036854775808`; this one rejects it as malformed. An overflowing sum
   is likewise reported as a malformed record (exit 3) rather than as an
   arithmetic condition the contract does not describe. — `ledger.rs:314-315`,
   `ledger.rs:172-187`
4. "The dates are read, compared and reported" is only half met: the date is
   read and retained, never compared and never reported. The contract's own
   output shape (`balance_cents`, `by_label`) leaves no place to report a
   date, so the clause is self-inconsistent; the implementation's reading —
   a date is an opaque string, shape-checked and kept — is the one the output
   can support. — `ledger.rs:231-234`, `ledger.rs:54-68`
5. The wrong-argument-count path returns exit code **2**, the code the
   contract reserves for "the file could not be read (the message names the
   path)", and its message `usage: ledger <path>` names no path. The
   contract does not cover a wrong argument count; if the cross-language
   contract expects a distinct code there, this is the place it would show.
   — `ledger.rs:259-266`
6. `println!` panics if stdout cannot be written (a closed pipe, a full
   disk), which would end the program with a panic (exit 101) rather than 0.
   The craft file's own rule — "`println!` in library code" — is not violated
   here because this is the binary's own output, but the panic path is worth
   knowing. — `ledger.rs:269`
7. The test target's two command-line tests need the **built binary**
   (`CARGO_BIN_EXE_ledger`, or `target/debug/ledger.exe` next to the test
   binary). If neither exists the helper `assert!`s, so those tests fail
   loudly rather than pass silently — but they cannot be satisfied by
   `cargo test --test ledger_test` alone without the bin target being built.
   — `ledger_test.rs:96-114`, `ledger_test.rs:409-424`, `ledger_test.rs:426-449`

**out of scope**

- The Python, TypeScript, Go and Java implementations, and the reports of
  their lanes; this lane judged only the Rust file set, and read no other
  lane's report.
- Whether the shared oracle's numbers are themselves right; the oracle was
  taken as given and only compared against.
- Wall clock, environment and locale.

## The boundary

**Read-only lane. Nothing was executed.** This host has no Rust toolchain, so
there is no compiler, no `cargo build`, no `cargo test`, no `cargo fmt
--check` and no `cargo clippy` here. **No test was run and no test passed.**
Every verdict in this report is a verdict about the source text.

What the verdicts rest on:

- Reading `ledger.rs` (663 lines), `ledger_test.rs` (473 lines) and
  `Cargo.toml` (18 lines) in full.
- Reading `docs/contract.md` (64 lines), `tools/oracle.md` (163 lines) and
  `tools/expected.json` in full.
- Reading the fixture at the byte level (319 bytes, LF only, trailing
  newline, 6 physical lines) with a read-only PowerShell inspection.
- Tracing the fixture by hand through the code: the split, the trim, the key
  dispatch, the `i64` adds, the `BTreeMap` order, the `Display` output.

What the verdicts **cannot** rest on, and did not:

- **Compilation.** The code was never handed to a compiler. I read it for
  type and borrow correctness — `BTreeMap::from` on an array (1.56),
  `ExitCode` returned from `main` and `ExitCode::from(u8)` (both 1.61, the
  floor declared at `Cargo.toml:5`), `io::Error::new` taking a `String`,
  `Formatter`'s inherent `write_str`/`write_char`, `pub(super)` inside
  `mod json`, the `#[path = "ledger.rs"] mod ledger;` include, the
  `CARGO_BIN_EXE_ledger` lookup with its sibling-binary fallback — and found
  no defect, but a read is not a build. A compile error anywhere in the file
  would invalidate every row of the table.
- **Runtime behaviour.** The exit codes 0 / 2 / 3, the exact bytes on stdout
  and stderr, the panic paths, and the Windows newline handling were derived
  from the source, not observed.
- **The test suite.** `ledger_test.rs` was read, not run. Its assertions look
  discriminating on paper — in particular `assert_eq!(error.line, 4)` and
  `assert_eq!(summary.to_string(), FIXTURE_LINE)` are exactly the checks that
  would fail if the line number were an ordinal or the label order were
  wrong — but whether they pass is unknown.
- **The formatting and lint gates.** `cargo fmt --check` and
  `cargo clippy -- -D warnings` were not run; the code looks rustfmt-shaped
  by eye, which is not the same thing.
- **The toolchain-floor claim.** `rust-version = "1.61"` is consistent with
  every standard-library item the code uses, but that consistency was checked
  by reading, against the API history as I know it, not against a 1.61
  toolchain.

Two things a reader should hold onto. First, the read verdicts are stronger
than usual for this kind of code because the contract's hardest clauses —
physical line numbering, code-point ordering, integer-only arithmetic, the
exact output bytes — are all decidable from the source, and the oracle's
expected output line is reproduced by the `Display` impl character by
character as I traced it. Second, the two softest clauses are the strictness
of the malformed definition (findings 1 and 2) and the integer width
(finding 3); those are the places where a Rust run and a Python run on the
same input could part company, and neither of them is exercised by the shared
fixture or by the shared malformed case.

Verdict for the file set: **read-met** on every clause the contract makes
observable, with the partial clause 23 and the six non-blocking findings
above.
