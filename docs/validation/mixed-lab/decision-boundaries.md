# Boundaries the ledger contract leaves open

Date: 2026-11-14
Decided by: the Coordinator (the lanes that hit these boundaries could not write this file — their write scope excluded `.swarm/decisions/`).
Amended: 2026-11-14, after the R6 verdict table measured two of these edges by execution.

The contract in `docs/contract.md` fixes the record shape, the output line, the sort order and three kinds of malformed record. It leaves several edges open, and the five language lanes resolved them differently. These are the resolutions this work item stands on, so a later reader does not read a divergence as an accident.

## 1. An amount outside the language's integer type

Options:
- Treat it as malformed (the lane's choice).
- Clamp or wrap it.

Chosen: malformed. The contract asks for integer arithmetic and the amounts are cents; an amount that cannot be held exactly is a bad record, not a value to bend.

Consequence: Python (unbounded ints) accepts a value that Go (`int64`) and Rust (`i64`) reject. This is a difference in the type system, not a defect in either lane.

## 2. A running sum that overflows

Options:
- Report the record that overflowed as malformed.
- Wrap silently.
- Fail the whole file with a distinct exit code.

Chosen: the overflowing record is reported as malformed, naming its line. A silent wrap produces a total that is wrong and looks right; a new exit code is a contract change.

Still open: no lane exercised an overflow. The Go implementation wraps an `int64` sum silently (`ledger.go:92-93`), so it would violate this decision if the case were ever run — and nobody can run it on this host.

## 3. A file that is not valid UTF-8

Options:
- Treat it as unreadable (exit 2).
- Treat it as malformed (exit 3).

Chosen: unreadable, exit 2. The contract already reserves exit 2 for a file that cannot be read, and a decoding failure is that.

## 4. A record key the contract does not name

Options:
- Reject the record as malformed.
- Ignore the extra key.

Chosen: rejected as malformed.

Consequence, measured: Python, TypeScript, Java and Rust reject an unexpected fourth key with exit 3. **The Go implementation accepts it and prints a total** (`ledger.go:118-121` unmarshals into `map[string]json.RawMessage` and looks up only the three named keys), so the same input gives exit 0 in Go and exit 3 in the other four lanes. This is the one open material divergence in the work item. The shared fixture holds no fourth key, so the shared case still agrees — the divergence appears only on an input the fixture does not contain.

It is left open on purpose: this host has no Go toolchain, so a fix could not be compiled, run or tested here. Unverified code is worse than a recorded divergence. The change needed is small and is stated in the R6 verdict table (reject a record whose key set is not exactly {date, label, amount_cents}), and it should be applied and verified where a Go toolchain exists.

### A duplicate key in one record

Not covered by the contract at all. Java rejects a duplicate key (exit 3); Python, TypeScript and Rust accept it and the last value wins. No decision was recorded at the time, so this is recorded now: the work item stands on the stricter reading (a record that names a key twice is malformed), and the three lanes that accept it differ from it.

## 5. A date that is not `YYYY-MM-DD`

Options:
- Check the shape only.
- Check the calendar as well.
- Ignore the date.

Chosen: the shape only (`2026-02-31` passes). The contract's per-key table calls the date an ISO date; the calendar question is not one the contract asks, and a stricter reading would make the lanes disagree on a record the contract admits.

## 6. Trimming the label

Options:
- Trim the ASCII and Unicode spaces every language agrees on.
- Trim whatever the language's own `strip` removes.

Chosen: trim the set the contract can state, and let each language's own `strip` be documented as the difference it is.

Measured by execution in the R6 verdict table: Java's `String.strip()` keeps U+00A0 (NBSP) but REMOVES U+000B; Python's `str.strip()` removes both. So the divergence set is {U+00A0} only — a label padded with NBSP is trimmed in Python and not in Java. (An earlier draft of this file claimed Java keeps U+000B as well; the executed measurement corrected that, and the Java lane's own report carried the same wrong claim.) The fixture uses no such label, so the divergence is recorded rather than exercised.

## 7. The reported line number

Options:
- The physical 1-based line.
- The record ordinal.

Chosen: the physical 1-based line. The oracle pins this at line 4 for a file whose fourth line is the third record, and all five lanes name the physical line. The wording of the message differs per lane; the contract does not fix it, so it is not asserted.

## 8. Exit codes outside the contract's three

The contract names exit 0, 2 and 3. Go also returns 2 for a usage or flag error and 1 for an internal fault; Rust returns 2 for a wrong argument count and could return 101 if stdout cannot be written. Chosen: those are the implementer's own choices for cases the contract does not cover, and they are recorded rather than reconciled — no lane can be compared on them here.

## Why this file exists

The Rust lane flagged that its write scope excluded `.swarm/decisions/`, so the decisions it made had nowhere to go. A decision that changes what the work item is belongs to the Coordinator's record, and a reader comparing two implementations needs one place that says which reading this work item stands on.
