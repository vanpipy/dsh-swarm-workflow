# mixed-lab — acceptance report

Round R10 of the second test phase (`10 rounds`, requested 2026-11-14).
Work item: how does the swarm workflow behave when the work is split across five languages?

## 1. The verdict

**R1 to R8 are met**, with one material divergence recorded and left open on purpose
(§4.1: the Go implementation accepts a record with a fourth key; it cannot be compiled
or tested on this host, so the fix would be unverified).

The three implementations that this host can execute — Python, TypeScript and Java —
produce the **same 85 bytes** on the shared fixture, byte for byte, and they agree on the
malformed case down to the physical line number. Go and Rust are judged by reading, and
every verdict for them says so.

## 2. The requirement verdicts

| Requirement | Verdict | Evidence |
|---|---|---|
| R1 — the contract is written before any lane starts | **met** | `docs/contract.md` was written in R1, before the five language lanes were dispatched. Every lane report names it as the source it implemented (`mixed-lab-go.md:11-18`, `mixed-lab-java.md`, `mixed-lab-typescript.md`, `mixed-lab-rust.md`, `mixed-lab-python.md`). |
| R2 — one lane per language, one file set per lane | **met** | Five lanes, five disjoint file sets. The diff after the round shows each file touched by one lane only. One disclosed exception: the Python lane also created `tests/__init__.py`, outside its enumerated scope, because `unittest discover` cannot start without it (exit 1, reproduced). It reported the extra file rather than hiding it. |
| R3 — every lane loads its language piece | **met** | Each report names the craft files it loaded and cites the rules that shaped the code. The Go report carries a rule-by-rule table (`swarm-craft-shared` §3.2/§3.3/§3.7/§3.9/§3.12, `swarm-craft-developer` §2/§4/§5, `swarm-craft-go` §1/§5/§6/§8/§12/§13/§15/§16/§19 — `mixed-lab-go.md:18-36`); the oracle report does the same for the tester craft (`mixed-lab-oracle.md:61-75`). |
| R4 — the Python implementation is proven by execution | **met** | The Lead's own run, independent of the lane: `python -m unittest discover -s tests -t .` → "Ran 20 tests, OK", exit 0; `python -m ledger fixtures/ledger.jsonl` → exit 0 and 85 bytes, sha256 `b7a32dae…`. |
| R5 — the contract is judged the same way for every language | **met** | `mixed-lab-verdict-table.md` marks every row `executed` or `read` and names the fixture for each. |
| R6 — the cross-language contract holds | **met**, one open divergence recorded | The three executed languages produce byte-identical output (the Lead's own run: python/ts/java all 85 bytes, sha256 `B7A32DAEC0B032807E1D6FAFD099730CE97A341B1EB53FAAEBE56E41E50A4E2E`) and all exit 3 with empty stdout on the shared malformed case, each naming the physical line 4. Go and Rust name the same line by reading. The one divergence is outside the compared set (§4.1). |
| R7 — the workflow's own surfaces are exercised | **met** | See §5. |
| R8 — the work is written down in the workspace | **met** | `.swarm/requirements/mixed-lab.md`, two decision files, and one report per lane — ten reports in `.swarm/reports/`: the five lane reports, the oracle report, the three fan-out cross-check reports and the verdict table. |

A requirement whose check was not run is `not demonstrated`, never `met`. Nothing in this
table is `not demonstrated`.

## 3. The evidence the Lead re-derived

The lanes reported their own results; the Lead re-ran the parts that could be re-run, and
the numbers agree.

**The three executed implementations, byte for byte:**

```
python  85 bytes  sha256 B7A32DAE…  exit 0  stderr 0 bytes
node    85 bytes  sha256 B7A32DAE…  exit 0  stderr 0 bytes
java    85 bytes  sha256 B7A32DAE…  exit 0  stderr 0 bytes
        all three: {"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}\n
```

**The shared malformed case** (four physical lines, the fourth missing `amount_cents`):

```
python  exit 3  stdout 0 bytes  stderr: malformed record at line 4: missing key 'amount_cents'
node    exit 3  stdout 0 bytes  stderr: ledger: malformed record at line 4 in '<path>': missing key 'amount_cents'
java    exit 3  stdout 0 bytes  stderr: line 4: missing key "amount_cents"
```

Same exit code, same physical line, different wording — the contract fixes the line
number and does not fix the wording, so the wording is not asserted anywhere.

**The commands** (the interpreter is `C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe`,
CPython 3.12.14; Node v24.21.0 at `…\dependencies\node\bin\node.exe`; OpenJDK 17.0.19 at
`C:\Program Files\OpenLogic\jdk-17.0.19.10-hotspot\bin`):

```
python -m unittest discover -s tests -t .                       -> Ran 20 tests, OK, exit 0
python tools/check_python.py                                     -> exit 0 (the implementation agrees with the oracle)
python -m ledger fixtures/ledger.jsonl                           -> exit 0, 85 bytes
node --experimental-strip-types --disable-warning=ExperimentalWarning --test ledger.test.ts
                                                                      -> 17 tests, 17 pass, exit 0
node --experimental-strip-types --disable-warning=ExperimentalWarning ledger.ts fixtures/ledger.jsonl
                                                                      -> exit 0, 85 bytes
javac -encoding UTF-8 -Xlint:all -d <tmp> Ledger.java             -> exit 0, no warnings
java -cp <tmp> Ledger fixtures/ledger.jsonl                       -> exit 0, 85 bytes
```

## 4. The findings

### 4.1 D1 — material, open: Go accepts a record with a fourth key

`ledger.go:118-121` unmarshals into `map[string]json.RawMessage` and looks up only the
three named keys, so a record carrying a fourth key is accepted and printed (exit 0).
Python, TypeScript, Java and Rust reject the same input with exit 3.

The shared fixture holds no fourth key, so the shared case still agrees — the divergence
appears only on an input the fixture does not contain. The recorded decision (§4 of
`2026-11-14-boundaries-the-contract-leaves-open.md`) stands on the stricter reading, so Go
is the implementation that differs.

It is left open deliberately: this host has no Go toolchain, so a fix could not be
compiled, run or tested here, and unverified code is worse than a recorded divergence.
The change is small — reject a record whose key set is not exactly
`{date, label, amount_cents}` — and it should be applied and verified where a Go
toolchain exists.

### 4.2 Two recorded decisions were wrong, and the measurements corrected them

- The trimming decision said Java's `String.strip()` keeps U+00A0 **and** U+000B. Measured
  by execution: it keeps U+00A0 and removes U+000B. The divergence set is `{U+00A0}` only.
- The executability decision said this host has no JDK, and that Java would stay
  read-only. The Java lane found OpenJDK 17 installed and executed its lane; the R6 lane
  found it independently and compiled and ran the code. The premise was the Coordinator's
  mistake — the toolchain is not on PATH and lives under `OpenLogic`, not under a
  JDK-named directory.

Both decision files were amended by the Coordinator after the measurement. The lanes could
not amend them: their write scope excluded `.swarm/decisions/`.

### 4.3 A duplicate key — a divergence no decision covered

Java rejects a record that names a key twice (exit 3); Python, TypeScript and Rust accept
it and the last value wins. The contract does not mention duplicate keys at all, so the
work item now stands on the stricter reading and the decision file records it.

### 4.4 Two smaller ones

- An overflowing sum is never exercised by any lane; Go would wrap an `int64` silently
  (`ledger.go:92-93`) where the recorded decision says the overflowing record is malformed.
- Go returns exit 2 for a usage error and exit 1 for an internal fault, and Rust could
  return 101; the contract names only 0, 2 and 3. Those cases are the implementer's own
  choice and are recorded, not reconciled.

### 4.5 A check that was weaker than it looked

The R6 lane broke the TypeScript implementation twice and the first two breaks were **not**
caught: the implementation sorts twice (`summarize()` at `ledger.ts:145-147` and
`formatSummary()` at `:186-188`), so breaking one sort leaves the output unchanged. Only
breaking both exposes it. The lane said so in the report. A mutation test that breaks one
sort would have reported a false pass — which is exactly the kind of check the craft's
"make every check falsifiable" rule is about, and exactly the kind of thing a lane that
reports honestly surfaces.

## 5. The surfaces this phase exercised

| Surface | Lane | Result |
|---|---|---|
| `subagent` (delegated lane, own context) | the five language lanes, the Python craft arm, the control arm, the craft-lab Tester, the craft-lab Reviewer | 9 lanes; each owned one file set and reported its own evidence |
| `workflow` (scripted fan-out) | "mixed-lab-crosscheck": a Go lane, a Rust lane and a merge lane | 3 agents; the merge re-adjudicated the requirement and found D1 |
| `spawn_teammate` (native teammate) | `pyfix` | the oracle (task-11) and the cross-language verdict table (task-12) |
| the shared board as the requirement carrier | every task-11/task-12 lane | the requirement travelled in the task description; the lanes read it with `swarm_task get` and cited the task id. The oracle lane resolved a disagreement in favour of the requirement FILE over the task text, and said so |
| `swarm_task` | the oracle lane, the R6 lane | `list`, `get`, `claim` (rev 1 → 2), `complete` (rev 2 → 3) |
| `swarm_child` | the Coordinator | `list` — 36 lanes, the audit trail of the phase |
| `skill` | the language lanes | every lane loaded its craft files by name through the skill tool |
| the live host runtime | the Lead's probe | 10 skill registrations, no marker, no unresolved token, `/swarm` naming all nine craft files |

## 6. The artefacts in this repository

```
.swarm/requirements/mixed-lab.md          the requirement set, R1 to R8
.swarm/decisions/2026-11-14-executability.md          what the user decided, and its correction
.swarm/decisions/2026-11-14-boundaries-the-contract-leaves-open.md   the eight open edges
.swarm/reports/mixed-lab-python.md        the Python lane
.swarm/reports/mixed-lab-typescript.md    the TypeScript lane
.swarm/reports/mixed-lab-go.md            the Go lane (read-only verdicts)
.swarm/reports/mixed-lab-java.md          the Java lane (executed)
.swarm/reports/mixed-lab-rust.md          the Rust lane (read-only verdicts)
.swarm/reports/mixed-lab-oracle.md        the oracle and the checker, with its fault matrix
.swarm/reports/mixed-lab-go-crosscheck.md the fan-out lane for Go
.swarm/reports/mixed-lab-rust-crosscheck.md the fan-out lane for Rust
.swarm/reports/mixed-lab-crosscheck.md    the fan-out merge
.swarm/reports/mixed-lab-verdict-table.md the cross-language verdict table (task-12)
.swarm/reports/mixed-lab-acceptance.md    this report
tools/expected.json, tools/oracle.md, tools/check_python.py   the oracle
```

## 7. The commit ledger

```
28ff747  baseline: the swarm-mixed-lab test bed with its requirement set and specification
ae90b25  round R5: the five language implementations of the ledger contract
5a2c807  round R6: the cross-language verdict table and the corrected decisions
```

The repository has no remote. It is a local test bed; nothing was pushed.

## 8. What was not verified

1. Go and Rust were never compiled, executed or tested. A Go implementation that does not
   compile would still receive `read` rows in the table.
2. The Go and Rust test files were read as intent only.
3. The Java JUnit suite was not re-run by the R6 lane (it is cited from the Java lane's
   report, which recorded 16 found / 16 successful / 0 failed with a downloaded
   junit-platform-console-standalone jar).
4. The overflow case was not exercised for any language.
5. The missing-file, empty-file and non-UTF-8 cases were cited from the lane reports, not
   re-run by the R6 lane.
6. The oracle's numbers were taken as given by the R6 lane, as instructed; the Coordinator
   re-ran the three executed implementations and confirmed the 85-byte line independently.
7. `pom.xml` was never run under Maven — there is no Maven or Gradle on this host. It was
   parsed as XML and every pinned version checked against Maven Central.
8. The Python and TypeScript internals were not read line by line by the R6 lane.
9. The Java implementation's five extra strictness rules are interpretations of a contract
   that does not fix them; the R6 lane did not adjudicate them.
10. The date clause of the contract ("dates are read, compared and reported") cannot be
    met by any implementation, because the output shape has no date field. It is recorded
    as unmeetable rather than quietly dropped.
