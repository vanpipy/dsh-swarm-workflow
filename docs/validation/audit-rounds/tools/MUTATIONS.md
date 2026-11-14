# proof-scratch — mutation log (Reviewer round, criteria C1..C7)

Source of the copy: `D:\project\.swarm-lab\eff-repo` (byte-identical, 8/8 SHA256 under `src/` and `tests/`).
The original repository was **never modified**; every mutation below was applied here and reverted.

`_baseline/` holds the pristine copy of `src/` and `tests/` used to restore after each mutation.
`probe_criteria.py` runs the observable checks for C1..C5 (12 assertions).
`probe_coverage.py` runs the C6 coverage listing (public functions ↔ test names).
`mutate.ps1` drives every mutation; re-run it with:
`$s = Get-Content -Raw -Encoding UTF8 .\mutate.ps1; Invoke-Expression $s`
(PowerShell execution policy blocks `.\mutate.ps1` directly.)

| Mutation | Change | Result |
|---|---|---|
| baseline | pristine copy | FULL suite exit **2** (collection error `test_spec_vowel_ratio.py`); 3 collectible files **17 passed**; C1 probe **3 failures, all C1** |
| M-C1a | `longest_word` breaks ties **alphabetically** | C1 probe **12/12 pass**; 3 collectible files **still 17 passed** → the repo's own tie test does **not** discriminate the alphabetical rule |
| M-C1b | pristine (input-order tie-break) | C1 probe **fails** while the 3 collectible files **all pass** → a C1-violating implementation is undetected by the repo suite |
| M-C2 | `longest_word([])` returns `None` | `tests/test_core.py::test_longest_word_of_empty_sequence_returns_empty_string` **FAILED** |
| M-C3 | `word_lengths` returns lengths reversed | `tests/test_core.py::test_word_lengths_counts_each_word` **FAILED** (`[3,2,1] != [1,2,3]`) |
| M-C4 | `char_counts` lowercases first (case-insensitive) | `tests/test_strings.py::test_char_counts_is_case_sensitive` **FAILED** (`{'a': 2}`) |
| M-C4b | `char_counts` pre-seeds a–z with 0 | `tests/test_strings.py::test_char_counts_omits_characters_that_do_not_occur` **FAILED** |
| M-C5 | `first_last_letter` does not lowercase | `tests/test_text.py::test_first_last_letter_returns_first_and_last_alphanumeric_lowercased` **FAILED** (`('H','d')`) |
| M-C5b | `first_last_letter` uses the raw first/last char | 3 tests in `tests/test_text.py` **FAILED**; C5 probe **fails** (`('.', '!')`) |
| M-C6 | new public `unique_chars` with no test | coverage probe **exit 1**, `UNCOVERED unique_chars -> no test function names it` |
| M-C7 | supply `vowel_ratio` per the spec file | FULL suite exit **0**, **27 passed** → the suite's only failure cause is the missing function |

Final state of this scratch: restored to the pristine copy (verified: 8/8 SHA256 equal to `eff-repo`).
