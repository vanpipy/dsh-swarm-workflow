# Merged cross-check — Go and Rust against `docs/contract.md`

Date: 2026-11-14. Merge of two read-only cross-check lanes (`go`, `rust`).

**Nothing was executed.** This host has no Go toolchain (no compiler, no
`go vet`, no `gofmt`, no test runner) and no Rust toolchain (no `cargo`, no
compiler, no test runner). Every verdict in this merged table is a **read**
verdict, marked `read`. No row claims that a test passed, that a binary ran,
or that an exit code was observed; the test files of both lanes were read as
*intent*, never as evidence of behaviour.

Per R5 (`.swarm/requirements/mixed-lab.md:47-55`), both implementations were
judged by the same method: the same contract (`docs/contract.md`), the same
fixture (`fixtures/ledger.jsonl`), the same oracle (`tools/oracle.md`,
`tools/expected.json`), and every row marked `read` because no rule of
either language could be executed on this host.

## The verdict table

| Language | Clause count | Verdict | Findings by severity | Report |
| --- | --- | --- | --- | --- |
| go | 28 clauses | read / **met** on 26 · read / **not met** on 1 (a record has *exactly* these three keys) · read / **not applicable** on 1 (the dates are "reported") | material 1 · non-blocking 6 · out of scope 1 | `.swarm/reports/mixed-lab-go-crosscheck.md` |
| rust | 24 clauses | read / **met** on 23 · read / **not met (partial)** on 1 (the dates are read, compared *and reported*) | blocking 0 · material 0 · non-blocking 7 · out of scope 3 | `.swarm/reports/mixed-lab-rust-crosscheck.md` |

**The two counts are the same clause set at different granularity.** Go splits
four of Rust's rows: the label row (Rust folds "is a string", "not empty after
trimming" and "trimmed" into one clause, Go gives each its own), the three
malformed kinds (Go gives each its own row), the malformed message (Go has
"names the line number and the reason" and "goes to stderr" as two rows, Rust
one), and the date clause (Go separates "never parsed into a timezone-aware
object" from "reported"; Rust keeps them together). No contract clause is
judged by one lane and missing from the other.

## The findings, by severity

### Go — material (1)

1. **The "exactly these three keys" rule is not enforced.** `ledger.go:118-121`
   unmarshals the record into `map[string]json.RawMessage` and looks up only
   the three required keys; nothing rejects a fourth. A record carrying an
   unexpected key is accepted, so the same file gives **exit 0 and a printed
   total in Go** where the other four lanes give **exit 3 and a
   malformed-record message**. This is the only clause the Go lane marks
   *not met*, and the only clause in the Go report the code does not support.
   The Go lane notes that the contract admits both readings — the input
   section says "exactly these three keys" (`docs/contract.md:8-10`) while
   the malformed sentence enumerates only three malformations
   (`docs/contract.md:18-21`) — but the other four lanes and the shared
   fixture pick the stricter one.

### Go — non-blocking (6)

2. The malformed set is **stricter** than the contract's malformed sentence:
   a non-string `date`, a non-ISO `date`, a non-string `label` and an
   empty-after-trimming `label` are all treated as malformed. The four other
   lanes make the same stricter choice, so this is a shared reading of the
   field table, not a Go-only divergence.
3. An `amount_cents` outside `int64` is refused with the inaccurate reason
   `"amount_cents" is not an integer`, although the value *is* an integer.
4. An `int64` overflow in the running sums **wraps silently**
   (`ledger.go:92-93`); Python's arbitrary-precision integers would not.
5. Two exit codes sit outside the contract's three: 2 for a usage or flag
   error, and 1 for an internal formatting fault (unreachable in practice).
6. U+2028 and U+2029 are escaped even with HTML escaping off, so a label
   holding either is written as `\u2028` where other languages may write it
   literally.

(The Go lane's seventh non-blocking item — the contract's own "reported"
clause cannot be met by any implementation — is the same fact as its
*not applicable* row, and is counted once here, inside the clause count and
not again as a finding.)

### Go — out of scope (1)

8. The quality, coverage and passing-ness of `ledger_test.go` was not judged:
   the file was read as intent only.

### Rust — blocking (0)

None found by reading.

### Rust — material (0)

None found by reading. Every clause the contract makes observable is
supported by the code, including the two places a wrong implementation
usually goes wrong — the physical line number and the code-point sort.

### Rust — non-blocking (7)

1. The implementation is **stricter** than the contract's explicit malformed
   list: it adds a non-string `date`, a non-ISO `date`, a non-string `label`,
   an empty-after-trimming `label` and a fourth key to the three enumerated
   malformations.
2. The same strictness stated as a cross-lane risk: a `date` that is not a
   string, a non-ISO `date` and an empty label are **not** in the contract's
   malformed list, so a lane that accepts them would exit 0 where Rust exits
   3.
3. The integer width is `i64` and the contract says only "integer"; an
   overflowing sum is reported as a malformed record (exit 3) rather than as
   an arithmetic condition the contract does not describe.
4. "The dates are read, compared and reported" is only half met — the date is
   read and retained, never compared and never reported.
5. The wrong-argument-count path returns exit code **2**, the code the
   contract reserves for "the file could not be read", and its message names
   no path.
6. `println!` panics if stdout cannot be written (closed pipe, full disk),
   ending the program with exit 101 rather than 0.
7. The test target's two command-line tests need the **built binary**
   (`CARGO_BIN_EXE_ledger`); without it the helper asserts, so those tests
   fail loudly rather than pass silently.

*Counting note:* the Rust report's closing sentence says "six non-blocking
findings" while it numbers seven (items 1–7 under **non-blocking**). The
merged table counts the seven that are written.

### Rust — out of scope (3)

The Python, TypeScript, Go and Java implementations and their reports;
whether the shared oracle's numbers are themselves right (the oracle was
taken as given); wall clock, environment and locale.

## Do the two agree with the oracle, and with each other?

**On the three clauses that matter, yes — both agree with the oracle and with
each other.** The *balance*: both implementations trace `fixtures/ledger.jsonl`
to `balance_cents` 120600 (Go accumulates with `summary.BalanceCents +=
rec.amountCents` at `ledger.go:92`; Rust accumulates with `i64::checked_add`
at `ledger.rs:172-187`), which is the value in `tools/expected.json` and the
sum at `tools/oracle.md:42-60`. The *label order*: both emit
`café`, `coffee`, `rent` in code-point order — Go by `slices.Sort` over
UTF-8 bytes (`ledger.go:212-216`), Rust by a `BTreeMap<String, i64>`
(`ledger.rs:19`, `ledger.rs:51`, `ledger.rs:59`) — and both write the
identical line `{"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}`,
byte-for-byte the line at `tools/oracle.md:92`. The *malformed line number*:
both report the **physical** line **4**, not the record ordinal 3, for the
shared malformed case; both refuse it with the reason
`missing key "amount_cents"`, both write nothing to stdout, and both exit 3
(Go: `ledger.go:83`, `ledger.go:90`, `ledger.go:103`; Rust:
`ledger.rs:164-165`, `ledger.rs:171`).

**Where they do not agree is the "exactly these three keys" rule.** Go
accepts a record with a fourth key and prints a total (exit 0); Rust rejects
it with `unexpected key "<name>"` (exit 3). Same input, different observable
outcome — the one clause where the two implementations diverge on the
contract's own rules, and the one clause the Go lane marks *not met*. The
malformed *message wording* also differs while naming the same line and the
same reason: Go writes `line 4: missing key "amount_cents"`, Rust writes
`{path}: malformed record at line 4: missing key "amount_cents"` — Rust
names the path, Go does not. Both also leave the "the dates are read,
compared *and reported*" clause unsatisfied for the same structural reason:
the contract's output shape (`balance_cents`, `by_label`) has no field to
report a date in. The Go lane calls that clause *not applicable*, the Rust
lane calls it *not met (partial)* — the same fact under two labels, not a
behavioural divergence.

So the merged answer is **partial**: the two implementations agree with the
oracle and with each other on every clause the shared fixture and the shared
malformed case exercise — the balance, the totals, the label order, the
physical line number, the exit code and the clean stdout — and they diverge
on exactly one rule the fixture does not exercise, the rejection of an
unexpected key.

## The boundary of this merge

- **Nothing was executed, by either lane or by this merge.** Every verdict
  here is a read verdict. The standard-library and language behaviours the
  two lanes rest on (`slices.Sort` comparing strings byte-wise,
  `strconv.ParseInt` refusing `12.5` / `1e3` / `"450"`, `BTreeMap` ordering,
  `i64::checked_add`, `println!` newline handling) are stated from the
  documented semantics of those languages, not from an observation on this
  host.
- **Neither file set was compiled.** A compile error in either would
  invalidate its whole table.
- **Neither test suite was run.** `ledger_test.go` and `ledger_test.rs` were
  read as intent; a test that has never run proves nothing about the
  program.
- **Only Go and Rust are merged here.** The Python, TypeScript and Java
  lanes and their reports were not read for this merge, so no verdict is
  passed on them; the cross-language statements above are the ones the two
  merged lanes themselves recorded.
- **The oracle was taken as given** by both lanes; whether its numbers are
  themselves right was out of scope for both.
