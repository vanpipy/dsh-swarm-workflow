# Rust lane — `ledger` module (mixed-lab)

Lane: Rust. Parent session: `session-5135fefc-3a26-4aaa-ae85-6dc981c4c758`.
Source of truth: `docs/contract.md`. Shared fixture: `fixtures/ledger.jsonl`.
Requirement set: `.swarm/requirements/mixed-lab.md` (R1–R8).

**Verdict mode for this whole report: `read`.** This host has no Rust
toolchain — `cargo build`, `cargo test`, `cargo clippy` and `cargo fmt` were
**never executed**. Every verdict below is a verdict read off the source, not
an executed result. Section 5 states the boundary precisely.

---

## 1. What I read, and which rule shaped which decision

Craft files loaded with the skill tool before writing any code:
`swarm-craft-shared` (`skills/swarm-engineering/shared.md`),
`swarm-craft-developer` (`skills/swarm-engineering/developer.md`),
`swarm-craft-rust` (`skills/swarm-engineering/languages/rust.md`).
Also read: `docs/contract.md` (whole), `tools/oracle.md`, `tools/expected.json`,
`fixtures/ledger.jsonl` (byte by byte), `.swarm/requirements/mixed-lab.md`, the
shared board via `swarm_task list` (read-only relay), and the executed Python
lane (`ledger.py`, `tests/test_ledger.py`) as the cross-language reference.

| Craft rule | File | Decision it shaped in my code |
|---|---|---|
| §2.1 a check must be falsifiable | shared | Every test asserts an exact value, an exact string or an exact exit code — never "it did not panic". |
| §2.2 re-derive every number a second way | shared | The fixture total is derived twice: the running sum (450 → 300 → 120300 → 120300 → 120600) and the per-label sum (300 + 120000 + 300 = 120600). A test asserts `balance_cents == sum(by_label.values())`, so the two derivations are compared by the code itself, not only by me. |
| §2.3 validate where the artifact runs | shared | Nothing here is executable on this host, so the report marks every row `read` instead of pretending. |
| §3.2 parse at the boundary; make the illegal state impossible | shared | `parse_record` is the only door from text to a `Record`; a `Record` cannot exist without a trimmed, non-empty label and an `i64` amount. The CLI never touches a raw line. |
| §3.3 one diagnostic per failure on stderr, results on stdout, exit codes are a contract | shared | `run` writes exactly one line to stdout with `println!` and every diagnostic to stderr with `eprintln!`; the exit codes are named constants `EXIT_OK = 0`, `EXIT_UNREADABLE = 2`, `EXIT_MALFORMED = 3`. |
| §3.4 standard library first | shared | No serde, no clap, no tempfile. The JSON reader is hand-written; the tests roll their own temporary files. |
| §3.5 state/data shape; §3.6 time and ordering | shared | The date is validated by shape only and never turned into a date/time object (the contract forbids a timezone-aware parse). Ordering of `by_label` comes from the map type, not from a later sort. |
| §3.7 input/output: encoding explicit, LF newlines | shared | Input is read as bytes and decoded with `String::from_utf8` (a non-UTF-8 file is an *unreadable* file, exit 2). Output goes through `println!`, which writes `\n`; no `\r` is ever emitted. |
| §3.9 one behaviour per test; cover empty/one/many/negative/huge/unicode/malformed | shared | The 20 tests each cover one named boundary: empty file, one record, many records, negative amount, zero amount, i64 extremes, a label outside ASCII, a padded label, a blank line, a malformed record, a missing file. |
| §3.11 diagnostics; §3.12 naming and doc comments | shared | `MalformedRecord` and `LedgerError` carry the whole diagnostic; each public item has a `///` comment stating the contract it implements. |
| §2 name the target before the edit; smallest coherent change; do not overwrite unrelated work | developer | I wrote only the four files I own. The Python, TypeScript, Go and Java files were read for cross-language agreement and never modified. |
| §3 settle the types and the failure mode first; put the change in the owning module; one source of truth | developer | The types (`Record`, `Summary`, `MalformedRecord`, `LedgerError`) and the failure channel (`Result`, never a panic) were decided before any function body was written; each contract rule is implemented in exactly one place. |
| §4 the doc comment is a promise — keep it true | developer | The doc comments state the observable behaviour (line numbering, trimming, exit codes), so a reviewer can check the promise against the code without running it. |
| §5 prove it as you go; a check that cannot fail is not a check; never report a check you did not run | developer | The check was written next to the code it checks (a test per boundary), and the report says plainly that no check was executed. |
| §6 read the language file before changing it | developer | The Rust piece was read before `ledger.rs` was written. |
| §1 layout and `rust-version`; `cargo build/test/clippy/fmt` | rust | **Deviation, flagged to the Lead:** the craft suggests `rust-version = "1.85"`; I set `rust-version = "1.61"` in `Cargo.toml`. 1.61 is the true floor of the code I wrote (`ExitCode` was stabilised in 1.61). I cannot run a toolchain to learn the grader's version, and a floor that is too high is a hard build failure, so I promise the lowest floor that still compiles. Edition 2021 (needs 1.56), which the array-`IntoIterator` and or-pattern idioms in my code require. |
| §2 typing: `Result`/`Option`, no implicit conversions, `as` casts never fail | rust | Every fallible step returns `Result` and is propagated with `?`. The only `as` in the module is `byte as char` (a `u8` → `char`, total and non-truncating). |
| §3 data modelling: closed sets as enums, parse at the boundary, **`deny_unknown_fields` on input** | rust | The JSON value is a closed `enum Value`. `parse_record` rejects any key outside `date` / `label` / `amount_cents` ("unexpected key 'note'"), which is the hand-rolled equivalent of serde's `deny_unknown_fields` and matches the contract's "exactly these three keys" and the Python lane. |
| §4 collections: `BTreeMap` when you need sorted order (HashMap order is randomised) | rust | `Summary::by_label` is a `BTreeMap<String, i64>`, so the printed key order is the map's own order — sorted by the bytes of the key, which for UTF-8 is code-point order. No sort step, no nondeterminism. |
| §5 iteration: `collect::<Result<Vec<_>, _>>()` stops at the first error | rust | The sum stops at the first malformed record, as the contract requires; `summarize` returns that record's line number and reason. |
| §6 errors: the library returns errors, `?` propagates, `unwrap` only where the invariant is written down, a custom error implements `std::error::Error` | rust | `LedgerError` and `MalformedRecord` both implement `std::error::Error`; `LedgerError::source()` returns the underlying `io::Error`. There is no `unwrap`, no `expect` and no `panic!` anywhere in `ledger.rs`. |
| §12 testing: a temporary directory, never the repository | rust | The craft's `tempfile::tempdir()` is not available (standard library only, per the brief), so the tests write into `std::env::temp_dir()` with a per-test file name (`ledger-rust-test-<pid>-<name>.jsonl`) and delete the file in `Drop`. The repository is never written to by a test. |
| §13 command line: `args_os` does not panic on non-Unicode, `main` returns `ExitCode`, results to stdout, diagnostics to stderr | rust | `std::env::args_os().skip(1)` feeds `run`, and `fn main() -> ExitCode` returns `ExitCode::from(code)`. `std::process::exit` is not used, so destructors still run. |
| §15 style: `rustfmt` / `clippy --all-targets -- -D warnings` are the check of record; `///` doc comments | rust | The code is written to that standard (rustfmt-style formatting, doc comments on every public item) — but neither tool ran here, so this is a claim about the source, not a passing check. |
| §18 security: `#![forbid(unsafe_code)]`; integer overflow wraps in release — use `checked_*` | rust | `#![forbid(unsafe_code)]` is the first line of `ledger.rs`. Every addition (the balance and each per-label total) uses `checked_add`; an overflow is reported as a malformed record at the offending line instead of wrapping silently. |
| §19 traps: `unwrap()` on outside values, `panic!` in a library, `HashMap` iteration order, `as` casts that truncate, `std::process::exit()` skipping `Drop`, `std::env::args()` panicking on non-UTF-8, `println!` in library code | rust | None of these appear: no `unwrap`/`expect`/`panic!`, a `BTreeMap` rather than a `HashMap`, no truncating cast, `args_os` rather than `args`, and the single `println!` lives in `run`, which is the command-line entry point rather than a library function. |

---

## 2. What I built

Files written by this lane (exactly the set I was given; no other file in the
repository was created, edited or deleted):

| File | What it is |
|---|---|
| `ledger.rs` (663 lines) | The module and the command-line program. |
| `ledger_test.rs` | The integration test target (20 tests). |
| `Cargo.toml` | The package manifest. |
| `.swarm/reports/mixed-lab-rust.md` | This report. |

### Public surface of `ledger.rs`

| Item | Signature / value |
|---|---|
| `EXIT_OK` / `EXIT_UNREADABLE` / `EXIT_MALFORMED` | `pub const … : u8` = `0` / `2` / `3` |
| `Record` | `pub struct Record { pub date: String, pub label: String, pub amount_cents: i64 }` — `Debug, Clone, PartialEq, Eq` |
| `Summary` | `pub struct Summary { pub balance_cents: i64, pub by_label: BTreeMap<String, i64> }` — `Debug, Clone, PartialEq, Eq, Default` |
| `impl fmt::Display for Summary` | prints exactly `{"balance_cents": N, "by_label": {"label": N, …}}` — `", "` and `": "` separators, raw UTF-8 for non-ASCII labels |
| `MalformedRecord` | `pub struct MalformedRecord { pub line: usize, pub reason: String }` — `Display` = `malformed record at line {line}: {reason}`, implements `std::error::Error` |
| `LedgerError` | `pub enum LedgerError { Unreadable { path: PathBuf, source: io::Error }, Malformed { path: PathBuf, record: MalformedRecord } }` — `Display` = `cannot read '{path}': {source}` / `{path}: malformed record at line {line}: {reason}`; implements `std::error::Error` with `source()` |
| `summarize_file` | `pub fn summarize_file(path: &Path) -> Result<Summary, LedgerError>` — **the function that reads the file and returns the contract's result** |
| `summarize` | `pub fn summarize(text: &str) -> Result<Summary, MalformedRecord>` — the same over text already in memory |
| `parse_record` | `pub fn parse_record(line: &str) -> Result<Record, String>` — the reason strings |
| `run` | `pub fn run<I: IntoIterator<Item = OsString>>(args: I) -> u8` — the command line, minus `main` |
| `main` | `fn main() -> ExitCode` |

Behaviour that the contract names, mapped to the code:

- **Integers end to end.** `amount_cents` is `i64` in `Record`, `balance_cents`
  is `i64` in `Summary`, and the per-label totals are `i64` in the `BTreeMap`.
  No `f32`/`f64` appears anywhere, and no value ever goes through a float. The
  JSON reader keeps the raw text of a number, so `450` and `450.0` are
  distinguishable: a number whose raw text contains `.`, `e` or `E` is rejected
  as `amount_cents is not an integer`. A number too large for `i64` is rejected
  as `amount_cents does not fit in a 64-bit integer` (see §6).
- **Blank lines.** `text.split('\n')` + `line.trim()`; an empty or
  whitespace-only line is skipped and never counted as a record.
- **Line numbers.** The diagnostic names the 1-based **physical** line of the
  file, not the record's ordinal — the shared malformed sample fails on line 4.
- **Trimming once.** The label is trimmed at the boundary, in `parse_record`,
  and the trimmed value is what is stored, summed and printed. The contract's
  "trimmed once at the boundary and used trimmed everywhere" is therefore
  structural, not a convention.
- **Exactly three keys.** A record with a missing key is malformed
  (`missing key "amount_cents"`); a record with an extra key is malformed
  (`unexpected key "note"`).
- **Date.** Shape-checked only: ten characters, digits with dashes at the
  fourth and seventh position. No calendar rule, and it is never parsed into a
  date/time object.
- **Failure channels.** A file that cannot be read — missing, a directory, not
  readable, or not valid UTF-8 — exits **2** with a message naming the path. A
  file that is read but holds a malformed record exits **3**, prints nothing on
  stdout and names the line and the reason on stderr. Exactly one argument is
  required; zero or more than one exits **2** with `usage: ledger <path>` on
  stderr.

### `Cargo.toml`

```toml
[package]
name = "ledger"
version = "0.1.0"
edition = "2021"
rust-version = "1.61"
description = "Sum a JSON Lines ledger file into one JSON summary."
publish = false

[[bin]]
name = "ledger"
path = "ledger.rs"

[[test]]
name = "ledger_test"
path = "ledger_test.rs"
```

There is deliberately **no `[lib]` target**: Cargo refuses to use one file for
two targets ("file found to be present in multiple build targets"), so the
test target includes the module instead, with `#[path = "ledger.rs"] mod ledger;`.

### `ledger_test.rs`

Twenty `#[test]` functions, one boundary each: the fixture's totals; the
balance re-derived from the per-label totals; the fixture's exact output line;
that line holds no `\n` or `\r`; an empty file; a negative amount; a zero
amount; a blank line; a blank line between records; a padded label (trimmed and
merged with the bare one); a label outside ASCII (kept, and sorted by code
point); `parse_record` trimming the label; a table of eleven malformed reasons
(invalid JSON, not an object, missing key, unexpected key, date not a string,
date not ISO-shaped, label not a string, label empty after trimming, amount
not an integer ×3); a malformed record naming line 4 and its reason; an amount
that does not fit in 64 bits; a sum that overflows (reported at line 2); the
amounts staying integers (i64 extremes, printed with no `.`); an unreadable
file naming its path; the in-process exit codes 0, 3 and 2, plus "exactly one
path" → 2; and three subprocess tests (stdout is exactly the fixture line plus
`\n` and stderr is empty; the malformed file exits 3 with an empty stdout and
a stderr naming line 4; a missing file exits 2 with the file name on stderr).

---

## 3. How I checked it

Everything in this section is a **`read`** verdict: it is what careful reading
of the source shows, not what a compiler or a test run showed.

1. **Read `ledger.rs` back in full after writing it** (663 lines) and checked
   it for the failure modes that a compiler would have caught:
   - every `use` is used (`BTreeMap`, `OsString`, `fmt`, `fs`, `io`, `Path`,
     `PathBuf`, `ExitCode`);
   - `match total.checked_add(…)` on a `&mut i64` — `i64: Copy`, so the
     `&mut` is read, not moved;
   - `record.label` is moved into `by_label.entry(…)` and `record.amount_cents`
     is still read afterwards — legal, because the amount is `Copy` (a partial
     move);
   - `write!`, `f.write_str` and `f.write_char` on `fmt::Formatter` are
     inherent methods, so no `fmt::Write` import is needed;
   - `Option<&u8>::copied()`, `RangeInclusive::contains`, `u32::from(u8)` and
     `char::from_u32` are all stable well below the 1.61 floor I promise;
   - the or-patterns (`Some(b'-') | Some(b'0'..=b'9')`) and the array
     `IntoIterator` in the test file need edition 2021, which `Cargo.toml`
     declares;
   - `pub(super)` items inside the private `mod json` are used only inside the
     crate root, so no private-in-public lint;
   - the test target includes `ledger.rs` as a module, which leaves `main`
     unused — silenced by `#[allow(dead_code)]` on `main`.
2. **Walked the contract rule by rule against the source** — input decoding,
   blank-line skipping, the three-key rule, the integer rule, trimming,
   summation, ordering, output shape, the exit codes and the stdout/stderr
   split — and confirmed that each rule is implemented in exactly one place
   and that nothing in the contract is implemented twice.
3. **Derived the fixture's expected output by hand, twice** (running sum and
   per-label sum — §1, shared §2.2). The two agree.
4. **Traced the JSON reader over the fixture's six lines by hand**: the padded
   label, the negative amount, the zero amount, the blank line, and the `é` of
   line 6 (`63 61 66 c3 a9` in UTF-8, decoded by the `\u` escape branch to
   `U+00E9`; the bytes are passed through unchanged and never re-normalised).
5. **Checked the test file for the same class of mistakes**: array
   `IntoIterator` (edition 2021), `BTreeMap::from([…])`, `Option<&i64>`
   comparisons, `String::as_str` used as a function item, `Option<u8>`
   equality, `Vec<u8>` comparison for captured stdout, `Cow<str>::contains`.
6. **Cross-checked against the executed Python lane** (`ledger.py`, the only
   implementation on this host whose tests actually run): the same reason
   phrases, the same "an unknown key is malformed" rule, the same "a non-UTF-8
   file is unreadable (exit 2)" treatment, the same "exactly one path"
   behaviour, and the same output shape (raw UTF-8, `", "` / `": "` separators).

---

## 4. The result I expect on the shared fixture

`fixtures/ledger.jsonl`, read line by line (the file ends with a newline, so
there is no seventh line):

| Line | Content | Effect |
|---|---|---|
| 1 | `{"date": "2026-01-05", "label": "coffee", "amount_cents": 450}` | coffee 450, balance 450 |
| 2 | *(blank)* | ignored |
| 3 | `{"date": "2026-01-06", "label": "  coffee  ", "amount_cents": -150}` | label trimmed to `coffee`; coffee 300, balance 300 |
| 4 | `{"date": "2026-01-07", "label": "rent", "amount_cents": 120000}` | rent 120000, balance 120300 |
| 5 | `{"date": "2026-01-08", "label": "coffee", "amount_cents": 0}` | coffee stays 300, balance 120300 |
| 6 | `{"date": "2026-01-09", "label": "café", "amount_cents": 300}` | café 300, balance 120600 |

Totals: `coffee` 450 − 150 + 0 = 300, `rent` 120000, `café` 300.
Balance: 300 + 120000 + 300 = 120600 (and by the running sum:
450 → 300 → 120300 → 120300 → 120600 — the two derivations agree).
Key order: `café` < `coffee` < `rent` by UTF-8 byte order, which is code-point
order, and the `BTreeMap` prints them in exactly that order.

The exact line my implementation would print on stdout (followed by `\n`),
exit code 0:

```
{"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}
```

This is byte-for-byte the line recorded in `tools/expected.json` and in
`tools/oracle.md`, including the raw `é` (U+00E9, NFC, not escaped, not
re-normalised) and the spaces after `:` and `,`.

On the shared malformed sample (4 physical lines; the fourth has no
`amount_cents`) the expected behaviour is: nothing on stdout, exit code **3**,
and on stderr a diagnostic naming **line 4** and the reason
`missing key "amount_cents"` — e.g.
`…/malformed.jsonl: malformed record at line 4: missing key "amount_cents"`.

---

## 5. What I did not check — the boundary

- **Nothing was compiled.** There is no Rust toolchain on this host
  (`cargo build`, `cargo test`, `cargo clippy --all-targets -- -D warnings`,
  `cargo fmt --check` were all unavailable). The code has never been through a
  compiler or a test runner. A read-back audit (section 3) is a careful manual
  review, not a compiler: a typo, a borrow-checker objection or a clippy lint
  may still be present.
- **Nothing was executed.** The binary was not run on the fixture, so the
  expected line in section 4 is a hand derivation, not an observed output.
  Likewise, the exit codes 0/2/3 and the stderr wording are read off the
  source.
- **No cross-language run.** I did not execute the Python lane's tests and did
  not diff my output against a running Python process; the agreement in §3.6 is
  a comparison of source and of the shared oracle, not of two running programs.
- **The `rust-version` floor is unverified.** I could not check which toolchain
  the grader has. `1.61` is the floor my code needs; if the grader's toolchain
  is older than 1.61 the build fails, and if it is newer the build is fine.
- **The subprocess tests depend on Cargo's build order.** They use
  `option_env!("CARGO_BIN_EXE_ledger")` and fall back to
  `target/debug/ledger.exe` next to the test binary. I could not confirm that
  `cargo test` on a machine with the toolchain has built the binary by the time
  the integration test runs; if it has not, that fallback panics with a clear
  message rather than silently passing.
- **Clippy/rustfmt style is asserted, not proven.** The code was written in
  their style, but neither tool ran, so "no warnings" is not a claim I can make.
- **The board is read-only for this lane.** `swarm_task list` returned 11
  completed tasks, none of them a Rust-lane task for this work item (task-11 is
  the shared oracle, owned by `pyfix`); the relay reports that this session
  cannot change the board. My assignment therefore came from the parent agent's
  brief and the requirement set in `.swarm/requirements/mixed-lab.md`, which I
  read in full.

### Requirement verdicts (all `read`; none `executed`)

| Id | Verdict | Evidence |
|---|---|---|
| R1 | `read` — met | `docs/contract.md` exists, names the fixture, and is named here as the source I implemented (sections 1 and 2). |
| R2 | `read` — met | This lane wrote only `ledger.rs`, `ledger_test.rs`, `Cargo.toml` and this report; no other lane's file was touched. |
| R3 | `read` — met | Section 1 names the three craft files and cites the rule behind each decision. |
| R4 | `not in scope` | The Python lane's execution is the Python lane's evidence. |
| R5 | `read` — met | Every verdict in this report is marked `read`; the fixture is named in section 4. |
| R6 | `read` — met | The expected fixture line is identical to `tools/expected.json` (section 4), and the malformed sample gives the same line 4 and the same reason as the Python lane. |
| R7 | `read` — partial | Surfaces used by this lane: a delegated lane (this session), the skill tool (`swarm-craft-shared`, `-developer`, `-rust`), the file tools, and `swarm_task list` as a read-only board relay. The native teammate and the scripted fan-out were not exercised by this lane. |
| R8 | `read` — partial | The requirement set exists at `.swarm/requirements/mixed-lab.md` and this report is at `.swarm/reports/mixed-lab-rust.md`. `.swarm/decisions/` holds no decision file for this lane: my write scope excludes it, so the decisions below belong in the Coordinator's record. |

### Decisions that need the Lead's attention

1. **`rust-version = "1.61"`** rather than the craft's suggested `1.85`
   (rust §1). Rationale: 1.61 is the true floor of this code, and an
   unverifiable floor that is too high is a hard build failure. A decision
   record for this belongs in `.swarm/decisions/`, which is outside my write
   scope.
2. **Amounts outside `i64` are treated as malformed** ("amount_cents does not
   fit in a 64-bit integer"), whereas the Python lane's integers are
   unbounded. The brief pins `i64` end to end, so the Rust lane cannot match
   Python on an astronomically large amount; the contract does not say what to
   do there, and this is the reading I chose. Flagging it because it is the
   one place where the two implementations can differ on a shared input.
3. **A sum that would overflow `i64`** is reported as a malformed record at the
   line that overflowed (rust §18, `checked_add`), rather than wrapping. The
   contract is silent; Python cannot overflow at all, so again this is the one
   point where the lanes can differ.
4. **A non-UTF-8 file is "unreadable" (exit 2)**, not a malformed record
   (exit 3) — chosen to match the executed Python lane.
5. **A file with an unknown key is malformed**, matching the contract's "exactly
   these three keys", Rust craft §3's `deny_unknown_fields`, and the Python
   lane's "unexpected key" rule.
