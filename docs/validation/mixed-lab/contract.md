# The ledger contract

Every implementation in this repository answers to this file. It is written
before any implementation starts, and it does not change afterwards.

## The input

A file of UTF-8 **JSON Lines**: one JSON object per line. A line that is empty
or contains only whitespace is ignored. Every other line is one record with
exactly these three keys:

| key | type | rule |
| --- | --- | --- |
| `date` | string | an ISO date, `YYYY-MM-DD` |
| `label` | string | not empty after trimming; surrounding whitespace is trimmed |
| `amount_cents` | integer | may be negative; it is never a float |

A line that is not a JSON object, or that is missing a key, or whose
`amount_cents` is not an integer, is a **malformed record**. The program
reports it and stops: the message names the line number (1-based) and the
reason, and it goes to stderr.

The shared fixture is `fixtures/ledger.jsonl`. It holds a normal record, a
negative amount, a zero amount, a blank line, a label with surrounding
whitespace, and a label outside ASCII.

## The output

For a file of records, the program prints one JSON object on one line, with
the keys in this order:

```json
{"balance_cents": 0, "by_label": {}}
```

- `balance_cents` is the exact sum of every `amount_cents`. It is an integer.
  No floating point is used anywhere in the computation.
- `by_label` maps each trimmed label to the exact sum of that label's amounts.
  The keys are sorted lexicographically by code point.
- A file with no records prints `{"balance_cents": 0, "by_label": {}}`.

The output is printed on stdout and the program exits 0.

## The command line

Each implementation is a module named `ledger` in its own language, with a
command line that takes exactly one path:

```
python -m ledger fixtures/ledger.jsonl
```

The exit codes are the same everywhere: 0 when the file was read and printed,
2 when the file could not be read (the message names the path), and 3 when the
file was read but a record is malformed (the message names the line number and
the reason).

## What the implementations share

- Integer arithmetic only. A cent is a cent.
- The label is trimmed once, at the boundary, and used trimmed everywhere.
- The dates are read, compared and reported; they are never parsed into a
  timezone-aware object.
- Nothing is printed except the one JSON line on stdout.
