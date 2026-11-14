# The cross-language verdict table

**Work item:** board task `task-12` — "R6: the cross-language verdict table across the five implementations"
**Lane:** the native-teammate lane (`pyfix`), round R6 of the mixed-language lab
**Repository:** `D:\project\swarm-mixed-lab`
**Date:** 2026-11-14

---

## 0. Where the requirement came from

**The requirement was carried by the shared board, not by a chat message.** I read it with
`swarm_task {action: "get", task_id: "task-12"}` (revision 1) and claimed it with
`swarm_task {action: "claim"}` (revision 2, owner `pyfix`). The text I worked from is the board
task's own text:

> **requirement** — Where two implementations can be compared, they agree — the same fixture gives
> the same balance, the same totals and the same error on the same malformed input.
>
> **check** — The Python output and the documented expected values are recorded in the report, and
> every other language's output shape is compared against them.
>
> **source** — the contract, `docs/contract.md` (requirement set `.swarm/requirements/mixed-lab.md` R6)

I also read `.swarm/requirements/mixed-lab.md` before starting. **The file wins over any other
carrier.** It agrees with the board task and adds the rule that fixes how a verdict may be
reached:

> R5 — "A rule that cannot be executed on this host is judged by reading, and the report says which
> it was." (check: "the per-language verdict table names the fixture for every language and marks
> each row `executed` or `read`")
>
> "A requirement whose check was not run is `not demonstrated`, never `met`." (lines 8-9)

Everything below is therefore reported in the vocabulary the requirement file mandates:
`executed` or `read`, per language, per rule.

---

## 1. The method, in one place

### 1.1 The two comparison instruments

Both instruments live in a throwaway directory (`%TEMP%\mixedlab-t12`), never in the repository.
Both take their expected values **from the oracle file itself**, so the table cannot drift from
the oracle by a transcription error.

| instrument | what it compares | against |
| --- | --- | --- |
| `compare.py` | the captured stdout, **byte for byte**, and reports the first differing byte | the expected output line, extracted programmatically from `tools/oracle.md` section 4 |
| `check_malformed.py` | the exit code (3), that stdout is empty, and that stderr names the line number (4) | the shared malformed case, extracted **byte for byte from the oracle's own code block** |

The shared malformed file is the oracle's file, not a hand-typed copy:

```
{"date": "2026-01-05", "label": "coffee", "amount_cents": 100}
                                                     <- line 2: blank, ignored
{"date": "2026-01-07", "label": "rent", "amount_cents": 1200}
{"date": "2026-01-08", "label": "rent"}              <- line 4: the malformed record
```

166 bytes, 4 physical lines; the malformed record is the **third record** and is reported as
**physical line 4** by every lane. That is the number the oracle pins.

### 1.2 The fixture

Every row is judged against the same fixture: `fixtures/ledger.jsonl` (319 bytes, LF, 6 physical
lines, 5 records — line 2 is blank and ignored). The oracle's expected result:

```
{"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}
```

85 bytes including the trailing newline. The labels are ordered by code point: `café`
(63 61 66 E9) < `coffee` (63 6F 66 66 65 65) < `rent` (72 65 6E 74).

### 1.3 Which languages were executed here

Probed on this host, by running them:

| toolchain | present | consequence |
| --- | --- | --- |
| Python 3.12.14 (`...\dsh-primary-runtime\dependencies\python\python.exe`) | yes | **executed** |
| Node v24.21.0 (`...\dsh-primary-runtime\dependencies\node\bin\node.exe`, bundled, not on PATH) | yes | **executed** |
| OpenJDK 17.0.19 (`C:\Program Files\OpenLogic\jdk-17.0.19.10-hotspot\bin`) | yes | **executed** |
| `go` | no | **read** |
| `cargo` / `rustc` | no | **read** |

---

## 2. The verdict table

Fixture for every row: `fixtures/ledger.jsonl`. Malformed case for every row: the oracle's
four-line file, malformed record at **physical line 4**.

| language | mode | exact command run / read evidence | shared fixture result | shared malformed-case result | divergences (severity) | boundary of the check |
| --- | --- | --- | --- | --- | --- | --- |
| **python** | `executed` | `python -m unittest discover -s tests -t .` → `Ran 20 tests`, OK, exit 0<br>`python tools/check_python.py` → exit 0, "the implementation agrees with the oracle"<br>`python -m ledger fixtures/ledger.jsonl` → exit 0 | stdout **85 bytes**, sha256 `b7a32daec0b03280`, **byte-identical to the oracle line: True**, stderr empty | exit **3**, stdout **0 bytes**, stderr `malformed record at line 4: missing key 'amount_cents'` — comparison **PASS** | duplicate key **accepted** (last wins, exit 0) while Java rejects it — non-blocking; the raw U+000B label is a JSON parse error — non-blocking | the Python suite and the oracle checker were run; the implementation's internals were not read line by line |
| **typescript** | `executed` | `node --experimental-strip-types --disable-warning=ExperimentalWarning --test ledger.test.ts` → 17 tests, 17 pass, 0 fail, exit 0<br>`node --experimental-strip-types --disable-warning=ExperimentalWarning ledger.ts fixtures/ledger.jsonl` → exit 0 | stdout **85 bytes**, sha256 `b7a32daec0b03280`, **byte-identical: True**, stderr empty | exit **3**, stdout **0 bytes**, stderr `ledger: malformed record at line 4 in '<path>': missing key 'amount_cents'` — comparison **PASS** | duplicate key **accepted** (last wins) — non-blocking; the malformed wording names the path, Python's and Java's do not — non-blocking | the suite and the CLI were run; `ledger.ts` was read only at the sort sites and the exit-code sites |
| **java** | `executed` | `javac -encoding UTF-8 -Xlint:all -d <tmp>\java-classes Ledger.java` → exit 0, no warnings, 14 class files in the temp dir<br>`java -cp <tmp>\java-classes Ledger fixtures/ledger.jsonl` → exit 0 | stdout **85 bytes**, sha256 `b7a32daec0b03280`, **byte-identical: True**, stderr empty | exit **3**, stdout **0 bytes**, stderr `line 4: missing key "amount_cents"` — comparison **PASS** | duplicate key **rejected** (exit 3) while Python/TypeScript/Rust accept it — non-blocking; **`String.strip()` keeps U+00A0** (the label stays `" coffee "`) — non-blocking, the one lane that differs | the CLI was compiled and run by me; the JUnit suite was **not** re-run by me (cited from the lane report) |
| **go** | `read` | `ledger.go:83`, `:90` (physical line), `:92-93` (the sums), `:118-121` (the key lookup), `:134` (`strings.TrimSpace`), `:206-232` (`FormatSummary`, `slices.Sort` at `:216`), `:266-285` (`run`); cross-checks `.swarm/reports/mixed-lab-go-crosscheck.md` (195 lines) and `.swarm/reports/mixed-lab-crosscheck.md` (182 lines) | by read: `FormatSummary` writes `{"balance_cents": ` + the sum + `, "by_label": {` + labels sorted by `slices.Sort` + `}}` — the same 85 bytes as the oracle line; `encodeJSONString` uses `SetEscapeHTML(false)` so `café` is literal | by read: `ledger.go:83-103` reports `Line: i + 1` — the **physical** line — and exits 3 with `line 4: missing key "amount_cents"` on stderr, nothing on stdout | **accepts a fourth key** (`ledger.go:118-121` unmarshals into `map[string]json.RawMessage` and looks up only the three named keys) → exit 0 and a printed total where the other four give exit 3 — **material, open**; silent `int64` wrap at `:92-93` against decision §2 — non-blocking; two exit codes outside the contract's three (`:251-263` usage → 2, `:277-283` internal fault → 1) — non-blocking | **nothing was compiled, nothing was executed, no Go test ran**; the standard-library behaviours are stated from documented semantics; `ledger_test.go` was read as intent only |
| **rust** | `read` | `ledger.rs:164-165` (physical line), `:172-187` (`i64::checked_add`), `:211-222` and `:227-229` (the unexpected-key rejection), `:54-68` (the `Display` impl), `:337-355` (`write_json_string`); cross-checks `.swarm/reports/mixed-lab-rust-crosscheck.md` (`:49-63`, `:65-75`) and `.swarm/reports/mixed-lab-crosscheck.md` | by read: the `Display` impl writes `{"balance_cents": N, "by_label": {` + the `BTreeMap` entries + `}}` — the same 85 bytes as the oracle line; `BTreeMap` orders by code point, `write_json_string` writes `café` as raw UTF-8 | by read: `ledger.rs:164-165` enumerates the lines and `:171` returns the error — the **physical** line — exit 3, nothing on stdout, `missing key "amount_cents"` | the malformed wording names the path, Python's and Java's do not — non-blocking; a duplicate key is **accepted** (last wins) like Python and TypeScript — non-blocking; "the dates are read, compared and reported" is only half satisfied — non-blocking, and the same fact Go calls "not applicable" | **nothing was compiled, nothing was executed, no Rust test ran**; `ledger_test.rs` was read as intent only |

**All three executed languages produced the same 85 bytes with the same sha256 prefix
`b7a32daec0b03280`.** The two read rows are stated from the source, not from a run, and are
marked `read` exactly as R5 requires.

---

## 3. The executed rows in detail

### 3.1 python

```
$ python -m unittest discover -s tests -t .
Ran 20 tests in 1.487s
OK
(exit 0)

$ python tools/check_python.py
  oracle   : ...\tools\expected.json
  fixture  : ...\fixtures\ledger.jsonl
  expected : balance_cents=120600 by_label={"café": 300, "coffee": 300, "rent": 120000}
  RESULT   : the implementation agrees with the oracle
(exit 0)

$ python -m ledger fixtures/ledger.jsonl
[python] exit code   : 0
[python] stdout bytes: 85  sha256 b7a32daec0b03280
[python] stderr bytes: 0  text: ''
[python] BYTE-IDENTICAL to the oracle line: True
(exit 0)

$ check_malformed.py python malformed.jsonl ... python -m ledger
[python] exit    : 3
[python] stdout  : 0 bytes b''
[python] stderr  : "malformed record at line 4: missing key 'amount_cents'"
[python] COMPARISON: PASS -> exit 3, stdout empty, stderr names line 4
(exit 0)
```

### 3.2 typescript

```
$ node --experimental-strip-types --disable-warning=ExperimentalWarning --test ledger.test.ts
# pass 17
# fail 0
(exit 0)

$ node --experimental-strip-types --disable-warning=ExperimentalWarning ledger.ts fixtures/ledger.jsonl
[typescript] exit code   : 0
[typescript] stdout bytes: 85  sha256 b7a32daec0b03280
[typescript] stderr bytes: 0  text: ''
[typescript] BYTE-IDENTICAL to the oracle line: True
(exit 0)

$ check_malformed.py typescript malformed.jsonl ... ledger.ts
[typescript] exit    : 3
[typescript] stdout  : 0 bytes b''
[typescript] stderr  : "ledger: malformed record at line 4 in '<path>': missing key 'amount_cents'"
[typescript] COMPARISON: PASS -> exit 3, stdout empty, stderr names line 4
(exit 0)
```

### 3.3 java

```
$ javac -encoding UTF-8 -Xlint:all -d <tmp>\java-classes Ledger.java
(exit 0, no warnings, 14 class files, all in the temp dir)

$ java -cp <tmp>\java-classes Ledger fixtures/ledger.jsonl
[java] exit code   : 0
[java] stdout bytes: 85  sha256 b7a32daec0b03280
[java] stderr bytes: 0  text: ''
[java] BYTE-IDENTICAL to the oracle line: True
(exit 0)

$ check_malformed.py java malformed.jsonl ... java -cp <tmp>\java-classes Ledger
[java] exit    : 3
[java] stdout  : 0 bytes b''
[java] stderr  : 'line 4: missing key "amount_cents"'
[java] COMPARISON: PASS -> exit 3, stdout empty, stderr names line 4
(exit 0)
```

---

## 4. The divergences, with severity and with the recorded decisions

Two decision files govern the boundaries the contract leaves open. I read both in full.

| # | divergence | observed | severity | the recorded decision | status |
| --- | --- | --- | --- | --- | --- |
| D1 | **a record with a fourth key** | Go **accepts** it: `ledger.go:118-121` looks up only the three named keys, so the file gives exit 0 and a printed total. Python, TypeScript and Java **reject** it with exit 3 (`unexpected key 'currency'`), and Rust rejects it by read (`ledger.rs:227-229`) | **material** | `2026-11-14-boundaries-the-contract-leaves-open.md` §4: an unnamed record key is **rejected** as malformed, and it names this as "the one open divergence between the lanes … the Go implementation is the one that differs" | **OPEN** — the decision states the intended resolution and Go does not implement it. The shared fixture does not contain a fourth key, so the shared case still agrees. |
| D2 | **the trimming set** | Java's `String.strip()` **keeps U+00A0**: the label stays `" coffee "`, so the key is not `"coffee"`. It **removes U+000B** (the escaped form `\u000bcoffee\u000b` gives the label `coffee`). Python and TypeScript remove both | non-blocking | the same decision §6 says "Java's `String.strip()` keeps U+00A0 (NBSP) **and U+000B**" | **the decision is half wrong** — my executed measurement shows only U+00A0 differs; U+000B is removed by Java too. The Java lane's report (`:363-366`) repeats the same error. The fixture uses no such label, so this divergence is **recorded, not exercised** — as §6 itself says. |
| D3 | **a duplicate key** | Java **rejects** it (exit 3, `duplicate key "label"`); Python, TypeScript and Rust **accept** it and the last occurrence wins (`{"tea": 100}`) | non-blocking | **no recorded decision covers duplicate keys** | **OPEN** — a genuine cross-lane disagreement that the shared fixture and the shared malformed case do not exercise. The contract's malformed list does not name duplicate keys, so each lane is defensible; the lanes do not agree with each other. |
| D4 | **the wording of the malformed diagnostic** | Python `malformed record at line 4: missing key 'amount_cents'`; TypeScript `ledger: malformed record at line 4 in '<path>': missing key 'amount_cents'`; Java `line 4: missing key "amount_cents"`; Go `line 4: missing key "amount_cents"` (by read); Rust `{path}: malformed record at line 4: missing key "amount_cents"` (by read) | non-blocking | the contract pins the exit code and the line number, not the wording | **resolved by the contract** — the wording differs, the line number and the exit code agree everywhere. TypeScript and Rust also name the path; Python, Java and Go do not. |
| D5 | **the reported line number** | all five lanes report the **physical** 1-based line; the malformed record is the third record in a file whose fourth line is the malformed one | none | the same decision §7: "the oracle pins this at line 4 for a file whose fourth line is the third record, and all five lanes name the physical line" | **resolved, and confirmed** — three lanes executed, two lanes read. |
| D6 | **a sum that overflows the integer type** | not exercised for any language: the fixture cannot overflow. Go's `int64` sum **wraps silently** (`ledger.go:92-93`) by read; Rust uses `i64::checked_add` (`ledger.rs:172-187`) by read; Python and TypeScript cannot overflow; **Java's `long` overflow was not tested** | non-blocking | the same decision §2: the overflowing record is reported as malformed, naming its line, with no silent wrap | **partly open** — Go does not implement §2; Rust does; the other three are unverified for this case |
| D7 | **exit codes outside the contract's three** | Go has two more: a usage error exits 2 (`ledger.go:251-263`) and an internal formatting fault exits 1 (`ledger.go:277-283`); Rust's wrong-argument-count path exits 2 and names no path | non-blocking | the contract reserves 0, 2 (unreadable) and 3 (malformed) | **open, but low** — both are outside the contract's reach and, per the Go lane, unreachable in practice; Rust's reuse of 2 for "wrong argument count" collides with the contract's "file could not be read" |
| D8 | **"the dates are read, compared and reported"** | the output shape has no field for a date, so no implementation can report one. Go calls the clause not applicable; Rust calls it not met (partial) | none | — | **a labelling difference, not a behavioural one** — the same fact under two names |
| D9 | **the malformed set is wider than the contract's three causes** | all lanes also reject a non-string date, a non-ISO date, a non-string label and an empty-after-trim label | non-blocking | — | **consistent across the lanes**; the contract's list is not exhaustive in practice, but the lanes agree |
| D10 | **a file that is not valid UTF-8** | exit 2 by read for Rust; cited from the lane reports for the others | none | the same decision §3 | resolved |
| D11 | **a sum's integer width** | Python's unbounded integers accept amounts that Go's `int64` and Rust's `i64` reject | none | the same decision §1 | resolved — a type-system difference, not a defect |

### 4.1 A conflict with a recorded decision that I have to report

`.swarm/decisions/2026-11-14-executability.md` (read in full, 32 lines) records:

> "Python and Node.js are executed; the other three languages are read" — because "This host has a
> Python runtime and no Go, JDK or Rust toolchain" — and "Go, Java and Rust stay read-only for now".

**Its premise no longer holds.** A JDK 17 is installed on this host (`javac` and `java` both run;
see §3.3), so Java is executable and I executed it. The decision is superseded **for Java by the
observed environment**, not by a chat message — I ran the compiler and the program. Go and Rust
remain read-only, because there is still no `go` and no `cargo` on this host.

I did not modify the decision file: it is not in my write scope, and the correction belongs to the
Coordinator.

---

## 5. Proof that the check can fail

A check that never fails proves nothing. I made three throwaway copies of the repository under
`%TEMP%\mixedlab-t12\broken\` (the repository itself was never edited; each copy was edited after
it was copied) and broke one thing in each.

### 5.1 python — the balance is wrong → **caught**

Broken in the copy: `ledger.py` — `balance_cents += record.amount_cents` became
`balance_cents += record.amount_cents + 1` (one cent more per record, 5 records).

```
$ python tools/check_python.py      # in the broken copy
  running  : ...\python.exe -m ledger ...\broken-python\fixtures\ledger.jsonl
  stdout   : {"balance_cents": 120605, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}
  RESULT   : the implementation disagrees with the oracle
    - balance_cents is 120605, the oracle says 120600
(exit 1)
```

The oracle checker named the wrong number and the right expected number, and exited 1.

### 5.2 typescript — the labels are not sorted → **caught**

Broken in the copy: `ledger.ts` — the code-point sort removed in **both** places it appears
(`summarize()` at `:145-147` and `formatSummary()` at `:186-188`).

```
[typescript(broken, both sorts removed)] stdout bytes: 85  sha256 3e5edd406ac9d59b
[typescript(broken, both sorts removed)] BYTE-IDENTICAL to the oracle line: False
[typescript(broken, both sorts removed)] expected: b'{"balance_cents": 120600, "by_label": {"caf\xc3\xa9": 300, "coffee": 300, "rent": 120000}}\n'
[typescript(broken, both sorts removed)] produced: b'{"balance_cents": 120600, "by_label": {"coffee": 300, "rent": 120000, "caf\xc3\xa9": 300}}\n'
[typescript(broken, both sorts removed)] first difference at byte 41: expected 97 got 111
(exit 1)
```

Byte 41 is the first letter of the first label: `a` of `café` (97) where the implementation wrote
`o` of `coffee` (111).

**An honest note about how hard this was to break.** My first attempt removed only the sort in
`formatSummary()` and was **not** caught: the output stayed byte-identical, because `summarize()`
already inserts the labels in code-point order. My second attempt removed only the sort in
`summarize()` and was also **not** caught, because `formatSummary()` re-sorts. The TypeScript
implementation sorts **twice**, so no single-point mutation can change the rendered order; both
sorts have to go. A reader should know that a mutation test that breaks one sort would report a
false pass — this is a property of the implementation, not of the comparison.

### 5.3 java — the malformed exit code is wrong → **caught**

Broken in the copy: `Ledger.java` — `public static final int EXIT_MALFORMED = 3;` became `= 2;`.
Compiled in the copy (`javac` exit 0) and run on the shared malformed file:

```
[java(broken exit code)] exit    : 2
[java(broken exit code)] stdout  : 0 bytes b''
[java(broken exit code)] stderr  : 'line 4: missing key "amount_cents"'
[java(broken exit code)] COMPARISON: FAIL -> exit code is 2, the oracle says 3
(exit 1)
```

The stderr was still correct and the stdout was still empty — only the exit code was wrong, and
that alone was enough for the comparison to fail.

### 5.4 What this proves

All three comparison instruments discriminate: they returned `PASS`/exit 0 for the three real
implementations and `FAIL`/exit 1 for a broken one, each on a different kind of defect (a wrong
number, a wrong order, a wrong exit code). The instrument itself was strengthened once: the
byte-for-byte comparison originally reported a mismatch but still exited 0; it now exits 1.

---

## 6. What this report did NOT check

- **Go and Rust: nothing was compiled, nothing was executed, no test ran.** Their rows are
  `read` verdicts from the source and from the scripted cross-checks. A Go or Rust implementation
  that does not even compile would still receive `read/met` rows here.
- **`ledger_test.go` and `ledger_test.rs` were not compiled or run** — they were read as intent
  only. A test that has never run proves nothing.
- **The Java JUnit suite was not re-run by me.** I compiled `Ledger.java` and ran the CLI; the
  "16 tests found, 16 tests successful" result is cited from `.swarm/reports/mixed-lab-java.md`
  (`:178-185`), which reports a `junit-platform-console-standalone-1.10.2.jar` downloaded to a
  temp directory. I did not download that jar myself.
- **The overflow case (D6) was not exercised for any language.** No probe can overflow the fixture's
  sums; Java's `long` behaviour in particular is unverified.
- **The missing-file, empty-file, non-UTF-8 and directory cases were not re-run by me** for the
  three executed languages; those results are cited from the lane reports
  (`mixed-lab-python.md:204-210`, `mixed-lab-typescript.md:233-242`, `mixed-lab-java.md:222-242`).
- **The oracle's numbers were not re-derived here.** Per the assignment they were taken as given
  ("do not re-derive, but do re-run what you claim"); the comparison is against the oracle's own
  line in `tools/oracle.md` §4, extracted programmatically rather than retyped.
- **The Python and TypeScript implementations' internals were not read line by line** — their
  verdicts rest on running them, not on reading them. The TypeScript sort sites and the Java exit
  codes were read because I broke them.
- **The repository's git state was not inspected**: I ran no git command, and I changed no
  implementation, spec, requirement, decision or other lane's report.
- **The non-ASCII labels were probed only around U+00A0 and U+000B.** A raw control character is
  invalid JSON in every language, so the raw probe measures the JSON parser; the escaped forms
  (`\u000b`, `\u00a0`) are the ones that measure the trim.

---

## 7. The verdict on task-12

**`task-12 = met`.**

The board task's check is: *"The Python output and the documented expected values are recorded in
the report, and every other language's output shape is compared against them."*

- The Python output **is** recorded, and it is recorded byte for byte: 85 bytes, sha256
  `b7a32daec0b03280`, identical to the oracle's line, from the checker's own output
  (`tools/check_python.py` exit 0) and from a direct run of the command.
- **Every other language's output shape is compared against it.** TypeScript and Java were
  compared **byte for byte** against the same line and are identical to it and to Python's.
  Go and Rust were compared **by reading their own source**, in the `read` mode the requirement
  file mandates for a rule that cannot be executed on this host, with the file and lines named.
- The shared malformed case agrees across all five lanes on the two facts the oracle pins: exit
  **3**, an empty stdout, and the **physical line 4** (three lanes executed, two read).
- The comparison **can fail**: three deliberate defects were caught (§5).

The qualification that goes with the verdict: **agreement is demonstrated for the shared fixture
and the shared malformed case in all five languages.** The one material divergence (D1, Go
accepting a fourth key) is on a rule the shared fixture does not exercise, and it is recorded as
open against the decision that says it should be rejected. D3 (duplicate keys) is a second,
smaller cross-lane disagreement that no recorded decision covers. D2 shows that the recorded
trimming decision is half wrong: Java keeps U+00A0 but removes U+000B, not both.

**Evidence index:** §1 the instruments and their sources · §2 the five rows with their five fields
· §3 the executed commands and their real output · §4 the divergences, their severity and their
decision status · §5 the proof that the check can fail · §6 what was not checked.
