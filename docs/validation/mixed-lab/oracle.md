# The oracle — the expected result of `fixtures/ledger.jsonl`

Derived by hand from `docs/contract.md` and the bytes of `fixtures/ledger.jsonl`.
The machine-readable copy is `tools/expected.json`; this file is the derivation
that a reader can check with a pencil and a calculator, without running
anything.

Every implementation in this repository — in any of the five languages — is
judged against these numbers.

## 1. The fixture, as bytes

| property | value |
| --- | --- |
| size | 319 bytes |
| line endings | LF only (`\n`); there is no `\r` anywhere in the file |
| last byte | `\n` — the file ends with a newline |
| physical lines | 6 (the trailing newline terminates line 6; it does not open a 7th line) |
| records | 5 (line 2 is blank and the contract ignores it) |
| encoding | UTF-8; every byte of the file is ASCII except the `é` in line 6 |

The contract's rules that matter for the arithmetic:

- "A line that is empty or contains only whitespace is ignored" — line 2 is
  ignored, and so is the empty string after the final newline.
- "The label is trimmed once, at the boundary, and used trimmed everywhere" —
  the label of line 3 is `"  coffee  "`, which is trimmed to `"coffee"` and is
  then the same label as line 1.
- "`balance_cents` is the exact sum of every `amount_cents`. It is an integer.
  No floating point is used anywhere in the computation." — every number below
  is an integer number of cents.
- "`by_label` maps each trimmed label to the exact sum of that label's
  amounts. The keys are sorted lexicographically by code point."

## 2. The record-by-record sum

"File line" is the physical line of the file, 1-based. "Record" counts only the
lines that hold a record, so the two numbers differ from line 3 onwards.

| file line | record | date | label as written | label after trimming | amount_cents | running balance |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 2026-01-05 | `coffee` | `coffee` | 450 | 450 |
| 2 | — | — | *(blank — ignored)* | — | — | 450 |
| 3 | 2 | 2026-01-06 | `␠␠coffee␠␠` | `coffee` | −150 | 300 |
| 4 | 3 | 2026-01-07 | `rent` | `rent` | 120000 | 120300 |
| 5 | 4 | 2026-01-08 | `coffee` | `coffee` | 0 | 120300 |
| 6 | 5 | 2026-01-09 | `café` | `café` | 300 | 120600 |

The running balance, step by step:

```
0
+ 450          = 450
− 150          = 300
+ 120000       = 120300
+ 0            = 120300
+ 300          = 120600
```

**`balance_cents` = 120600.**

## 3. The per-label totals

| label | records | sum |
| --- | --- | --- |
| `coffee` | 1 (450), 2 (−150), 4 (0) | 450 − 150 + 0 = **300** |
| `rent` | 3 (120000) | **120000** |
| `café` | 5 (300) | **300** |

The zero amount on file line 5 still counts as a record; it changes no total.
The negative amount on file line 3 cancels part of line 1, and because both
carry the trimmed label `coffee`, they cancel *inside* the `coffee` total, not
only in the balance.

### The arithmetic, checked a second way

The balance has to equal the sum of the label totals, because every record
belongs to exactly one label:

```
300 (coffee) + 120000 (rent) + 300 (café) = 120600  ✓  same as the running sum
```

The two routes agree, so 120600 is evidence and not an assertion.

## 4. The expected output

The contract prints one JSON object on one line, with the keys in the order
`balance_cents`, then `by_label`, and the label map sorted by code point:

```json
{"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}
```

`tools/expected.json` holds the same values as a JSON document.

### Why the labels come in that order

| label | code points |
| --- | --- |
| `café` | `63 61 66 E9` |
| `coffee` | `63 6F 66 66 65 65` |
| `rent` | `72 65 6E 74` |

`café` and `coffee` share the first code point (`63`, `c`); the second one is
`61` (`a`) for `café` and `6F` (`o`) for `coffee`, and `61` < `6F`, so `café`
comes first. `rent` starts with `72` (`r`), which is greater than `63` (`c`), so
`rent` comes last.

The `é` is a single code point, `U+00E9` — the file is in NFC, not NFD. **Do
not normalise the label.** The contract trims it and nothing else, so a
normalising implementation is not more correct, only different.

Every code point here is in the Basic Multilingual Plane, so the three common
comparison orders agree: code-point order (Python), UTF-16 code-unit order
(Java, JavaScript) and UTF-8 byte order (Go, Rust) all give
`café`, `coffee`, `rent`. A label outside the BMP would separate them; this
fixture does not, and the contract's "by code point" is satisfied by all of
them here.

## 5. The shared malformed case

`docs/contract.md` also fixes the failure behaviour: "the message names the
line number (1-based) and the reason, and it goes to stderr", and the exit
code is 3 "when the file was read but a record is malformed". Every
implementation must fail the same way on the same input, so this is the shared
malformed case. It is written byte for byte here; `tools/check_python.py`
writes exactly these bytes into a temporary directory.

```
{"date": "2026-01-05", "label": "coffee", "amount_cents": 100}

{"date": "2026-01-07", "label": "rent", "amount_cents": 1200}
{"date": "2026-01-08", "label": "rent"}
```

The last line is malformed: it is a JSON object, but it is missing the
`amount_cents` key.

| property | expected |
| --- | --- |
| exit code | 3 |
| stdout | empty — "Nothing is printed except the one JSON line on stdout" |
| stderr | a message naming the line number and the reason |
| the line number | **4** — the physical line of the file, 1-based |
| the reason | that the record is missing `amount_cents` (the wording is not fixed by the contract) |

Note the line number: the malformed record is on the **4th line of the file**
but it is only the **3rd record** (line 2 is blank). The contract says "the
message names the line number", so the expected number is 4. An implementation
that counts records instead of lines is wrong here, and this case is what
tells the two apart.

## 6. What this oracle does not cover

- Only `fixtures/ledger.jsonl`. The empty file, a one-record file and the
  other boundaries of the contract are the implementations' own tests.
- Only the successful path and the one malformed case above. The "file could
  not be read" path (exit code 2, the message names the path) has no shared
  case here.
- Nothing about the wall clock, the environment or the language: an
  implementation that gets these numbers and this one error right has answered
  the contract's arithmetic, not the whole contract.
