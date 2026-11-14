# Re-test evidence — ten-round swarm-workflow verdict (independent re-verification)

**Role:** Tester (`verifier`) · **Task:** `task-2` on the team board
**Repo under test (read-only):** `D:\project\.swarm-lab\lab-repo` (package `textstats`, HEAD `fdb2716`, base `3e9bc26`)
**Sources of the claims:** `D:\project\.swarm-lab\rounds\FINAL-VERDICT.md`, `D:\project\.swarm-lab\rounds\FINDINGS.md`
**Date of this re-verification:** 2026-11-06 (Asia/Shanghai)

**Scope of this report:** I re-ran the suite, re-counted the tests by reading the files, and re-ran the
earlier Reviewer's mutation harness that still exists on disk. Nothing in the lab repo was modified.

---

## 0. Headline result

| Claim | Tag | Verdict | One-line evidence |
|---|---|---|---|
| **(a)** after the F8 de-duplication the whole suite is **39 passed** | **Verified** | ✅ **VERIFIED** | `39 passed in 0.25s`, exit code `0` (re-run by me) |
| **(b)** `tests\test_vowel_ratio.py` is the canonical file holding the **16** requirement conditions | **Verified** | ✅ **VERIFIED** | AST scan → `16 test_* functions`; file alone → `16 passed in 0.10s` |
| **(c)** `tests\test_core.py` no longer contains any `vowel_ratio` tests | **Verified** | ✅ **VERIFIED** | `git grep -i vowel -- tests/test_core.py` → **no match** (exit 1); file has 11 tests, none of them `vowel_ratio` |
| **(d)** the canonical file killed **12/12 non-equivalent mutants** in the earlier Reviewer's matrix | **Verified** | ✅ **VERIFIED** | Harness re-run: all 12 non-equivalent mutants killed by the canonical file; the only survivor is `m12`, independently proven **equivalent** |

**Nothing was Not run.** The mutation harness existed at `D:\project\.swarm-lab\probe\reviewer_r1\` and was
re-run read-only against the repo (it builds its mutants *outside* the repo and writes only under `probe\`).

---

## 1. Environment actually used

* Interpreter: `C:\Python312\python.exe` (as required — **never** `D:\project\.venv-win\Scripts\python.exe`, never `uv run`).
* `PYTHONPATH="D:\project\.swarm-lab\lab-repo\src;D:\project\.venv-win\Lib\site-packages"`.
* Git: `C:\Program Files\Git\cmd\git.exe` (not on PATH).
* No network was used.

---

## 2. Exact commands and their exact outputs

### 2.1 The whole suite — claim (a)

```powershell
cd D:\project\.swarm-lab\lab-repo
$env:PYTHONPATH="D:\project\.swarm-lab\lab-repo\src;D:\project\.venv-win\Lib\site-packages"
& 'C:\Python312\python.exe' -m pytest -q
```

Output (verbatim):

```
.......................................                                  [100%]
39 passed in 0.25s
EXITCODE=0
```

> The elapsed time differs from the ledger's `39 passed in 0.29s` (`FINDINGS.md:59`) and from
> `FINAL-VERDICT.md:54` — wall-clock varies with load; **the test count is identical: 39**.

### 2.2 Collection — proof of which 39 tests are collected

```powershell
& 'C:\Python312\python.exe' -m pytest --collect-only -q
```

Output (verbatim):

```
tests/test_core.py::test_word_count_counts_whitespace_separated_words
tests/test_core.py::test_average_word_length
tests/test_core.py::test_top_words_orders_by_frequency_then_alphabetically
tests/test_core.py::test_longest_word_returns_the_longest_word
tests/test_core.py::test_longest_word_returns_the_first_word_on_a_length_tie
tests/test_core.py::test_longest_word_returns_none_for_an_empty_sequence
tests/test_core.py::test_longest_word_accepts_any_sequence_of_words
tests/test_core.py::test_word_length_histogram_counts_words_by_length
tests/test_core.py::test_word_length_histogram_counts_zero_length_words_under_key_zero
tests/test_core.py::test_word_length_histogram_returns_an_empty_mapping_for_an_empty_sequence
tests/test_core.py::test_word_length_histogram_accepts_any_sequence_of_words
tests/test_longest_word.py::test_returns_the_longest_word
tests/test_longest_word.py::test_returns_the_longest_word_when_it_is_neither_first_nor_last
tests/test_longest_word.py::test_returns_the_first_word_when_the_maximum_length_is_tied
tests/test_longest_word.py::test_returns_none_for_an_empty_sequence
tests/test_longest_word.py::test_returns_the_only_word_for_a_single_element_sequence
tests/test_longest_word.py::test_ignores_an_empty_string_when_a_longer_word_exists
tests/test_longest_word.py::test_returns_the_empty_string_when_every_word_is_empty
tests/test_longest_word.py::test_accepts_a_tuple_of_words
tests/test_scratch_probe.py::test_shout_uppercases_lowercase_text
tests/test_scratch_probe.py::test_shout_keeps_already_uppercase_text_and_adds_the_marker
tests/test_scratch_probe.py::test_shout_returns_only_the_marker_for_empty_text
tests/test_scratch_probe.py::test_shout_uppercases_letters_around_non_letter_characters
tests/test_vowel_ratio.py::test_returns_one_for_a_word_made_only_of_vowels
tests/test_vowel_ratio.py::test_returns_zero_for_a_word_without_any_vowel
tests/test_vowel_ratio.py::test_counts_y_as_a_letter_but_not_as_a_vowel
tests/test_vowel_ratio.py::test_divides_vowels_by_all_alphabetic_characters
tests/test_vowel_ratio.py::test_counts_uppercase_vowels_as_vowels
tests/test_vowel_ratio.py::test_counts_uppercase_consonants_as_alphabetic_characters
tests/test_vowel_ratio.py::test_ignores_digits_in_numerator_and_denominator
tests/test_vowel_ratio.py::test_ignores_punctuation_in_numerator_and_denominator
tests/test_vowel_ratio.py::test_ignores_spaces_in_numerator_and_denominator
tests/test_vowel_ratio.py::test_ignores_non_ascii_letters_completely
tests/test_vowel_ratio.py::test_returns_zero_when_there_are_no_alphabetic_characters
tests/test_vowel_ratio.py::test_returns_zero_for_an_empty_sequence
tests/test_vowel_ratio.py::test_returns_zero_for_a_sequence_of_empty_strings
tests/test_vowel_ratio.py::test_counts_characters_across_every_word_in_the_sequence
tests/test_vowel_ratio.py::test_accepts_a_tuple_of_words
tests/test_vowel_ratio.py::test_returns_a_float_between_zero_and_one

39 tests collected in 0.08s
```

Per-file tally: `test_core.py` 11 + `test_longest_word.py` 8 + `test_scratch_probe.py` 4 + `test_vowel_ratio.py` 16 = **39**.

### 2.3 The canonical file alone — claim (b)

```powershell
& 'C:\Python312\python.exe' -m pytest tests/test_vowel_ratio.py -q
```

```
................                                                         [100%]
16 passed in 0.10s
```

### 2.4 `tests/test_core.py` alone — claim (c)

```powershell
& 'C:\Python312\python.exe' -m pytest tests/test_core.py -q
```

```
...........                                                              [100%]
11 passed in 0.11s
```

### 2.5 `test_core.py` contains no vowel test at all — claim (c)

```powershell
& 'C:\Program Files\Git\cmd\git.exe' -C 'D:\project\.swarm-lab\lab-repo' grep -n -i "vowel" -- tests/test_core.py
```

```
(no output)
grep-exit=1
```

`git grep` exit code **1** = no match. Cross-checks over the whole `tests\` directory:

```
test_core.py             vowel_ratio-mentions=0
test_vowel_ratio.py      vowel_ratio-mentions=35
test_longest_word.py     vowel_ratio-mentions=0
test_scratch_probe.py    vowel_ratio-mentions=0
```

and the file's import block (lines 1–8) is now:

```python
from textstats.core import (
    average_word_length,
    longest_word,
    top_words,
    word_count,
    word_length_histogram,
)
```

— `vowel_ratio` is gone from the import block (that was the F8 remediation).

### 2.6 Test-function count by AST scan (independent of pytest)

```powershell
& 'C:\Python312\python.exe' -c "import ast,sys; [print(p, sum(1 for n in ast.walk(ast.parse(open(p,encoding='utf-8').read())) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name.startswith('test_')), 'test_* functions') for p in sys.argv[1:]]" `
  'D:\project\.swarm-lab\lab-repo\tests\test_vowel_ratio.py' `
  'D:\project\.swarm-lab\lab-repo\tests\test_core.py' `
  'D:\project\.swarm-lab\lab-repo\tests\test_longest_word.py' `
  'D:\project\.swarm-lab\lab-repo\tests\test_scratch_probe.py'
```

```
D:\project\.swarm-lab\lab-repo\tests\test_vowel_ratio.py 16 test_* functions
D:\project\.swarm-lab\lab-repo\tests\test_core.py 11 test_* functions
D:\project\.swarm-lab\lab-repo\tests\test_longest_word.py 8 test_* functions
D:\project\.swarm-lab\lab-repo\tests\test_scratch_probe.py 4 test_* functions
```

**Counted in the canonical file by reading it: 16.** (Matches pytest collection: `16 passed`.)

### 2.7 The earlier Reviewer's mutation harness — claim (d) — **re-run**

The harness still exists: `D:\project\.swarm-lab\probe\reviewer_r1\mutants.py` (plus `check_clauses.py`,
`check_equivalence.py`, `check_export_and_missing_symbol.py`). It builds every mutant **outside** the repo
under `probe\reviewer_r1\mNN_*`, puts the mutant package first on `PYTHONPATH`, and asserts the shadowing
per run (`shadowing-ok` column). It reads the repo; it never writes to it.

```powershell
cd D:\project\.swarm-lab\probe\reviewer_r1
$env:PYTHONDONTWRITEBYTECODE="1"
& 'C:\Python312\python.exe' 'D:\project\.swarm-lab\probe\reviewer_r1\mutants.py'
```

Output (verbatim):

```
==============================================================================================================
MUTATION ANALYSIS - textstats.core.vowel_ratio
tester file = tests/test_vowel_ratio.py (16 tests) | dev file = tests/test_core.py (18 tests, 7 are vowel_ratio)
==============================================================================================================
mutant                     tester_fail tester_pass  core_fail  core_pass  shadowing-ok
m00_control                          0          16          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m00_control\textstats\core.py)
m01_unicode_isalpha                  1          15          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m01_unicode_isalpha\textstats\core.py)
m02_y_is_vowel                       1          15          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m02_y_is_vowel\textstats\core.py)
m03_denominator_all_chars            4          12          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m03_denominator_all_chars\textstats\core.py)
m04_int_zero                         1          15          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m04_int_zero\textstats\core.py)
m05_inverted_ratio                  11           5          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m05_inverted_ratio\textstats\core.py)
m06_no_empty_guard                   4          12          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m06_no_empty_guard\textstats\core.py)
m07_case_sensitive_vowels            1          15          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m07_case_sensitive_vowels\textstats\core.py)
m08_lowercase_alpha_only             2          14          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m08_lowercase_alpha_only\textstats\core.py)
m09_first_word_only                  2          14          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m09_first_word_only\textstats\core.py)
m10_isalnum_denominator              2          14          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m10_isalnum_denominator\textstats\core.py)
m11_returns_vowel_count             12           4          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m11_returns_vowel_count\textstats\core.py)
m12_vowel_before_alpha_check           0          16          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m12_vowel_before_alpha_check\textstats\core.py)
m13_word_level_ratio                12           4          0         11  True  (D:\project\.swarm-lab\probe\reviewer_r1\m13_word_level_ratio\textstats\core.py)

DETAIL: which tests each mutant breaks (tester file first, then dev file)

--- m01_unicode_isalpha: alphabetic test uses Unicode str.isalpha() -> accented/CJK letters enter the denominator
    tester: 1 failed -> ['::test_ignores_non_ascii_letters_completely']
    core: 0 failed -> []

--- m02_y_is_vowel: 'y' (and 'Y') treated as a vowel
    tester: 1 failed -> ['::test_counts_y_as_a_letter_but_not_as_a_vowel']
    core: 0 failed -> []

--- m03_denominator_all_chars: every character counted in the denominator, not only alphabetic ones
    tester: 4 failed -> ['::test_ignores_digits_in_numerator_and_denominator', '::test_ignores_punctuation_in_numerator_and_denominator', '::test_ignores_spaces_in_numerator_and_denominator', '::test_ignores_non_ascii_letters_completely']
    core: 0 failed -> []

--- m04_int_zero: no-letters case returns int 0 instead of float 0.0
    tester: 1 failed -> ['::test_returns_a_float_between_zero_and_one']
    core: 0 failed -> []

--- m05_inverted_ratio: ratio inverted (letters / vowels)
    tester: 11 failed -> ['::test_returns_zero_for_a_word_without_any_vowel', '::test_counts_y_as_a_letter_but_not_as_a_vowel', '::test_divides_vowels_by_all_alphabetic_characters', '::test_counts_uppercase_consonants_as_alphabetic_characters', '::test_ignores_digits_in_numerator_and_denominator', '::test_ignores_punctuation_in_numerator_and_denominator', '::test_ignores_spaces_in_numerator_and_denominator', '::test_ignores_non_ascii_letters_completely', '::test_counts_characters_across_every_word_in_the_sequence', '::test_accepts_a_tuple_of_words', '::test_returns_a_float_between_zero_and_one']
    core: 0 failed -> []

--- m06_no_empty_guard: empty guard removed -> ZeroDivisionError when there are no letters
    tester: 4 failed -> ['::test_returns_zero_when_there_are_no_alphabetic_characters', '::test_returns_zero_for_an_empty_sequence', '::test_returns_zero_for_a_sequence_of_empty_strings', '::test_returns_a_float_between_zero_and_one']
    core: 0 failed -> []

--- m07_case_sensitive_vowels: vowel match case-sensitive -> uppercase vowels missed
    tester: 1 failed -> ['::test_counts_uppercase_vowels_as_vowels']
    core: 0 failed -> []

--- m08_lowercase_alpha_only: uppercase letters are not counted as alphabetic -> wrong denominator
    tester: 2 failed -> ['::test_counts_uppercase_vowels_as_vowels', '::test_counts_uppercase_consonants_as_alphabetic_characters']
    core: 0 failed -> []

--- m09_first_word_only: only the first word is scanned
    tester: 2 failed -> ['::test_counts_characters_across_every_word_in_the_sequence', '::test_accepts_a_tuple_of_words']
    core: 0 failed -> []

--- m10_isalnum_denominator: denominator uses isalnum() -> digits enter the denominator
    tester: 2 failed -> ['::test_ignores_digits_in_numerator_and_denominator', '::test_ignores_non_ascii_letters_completely']
    core: 0 failed -> []

--- m11_returns_vowel_count: returns the vowel count instead of the ratio
    tester: 12 failed -> ['::test_returns_one_for_a_word_made_only_of_vowels', '::test_counts_y_as_a_letter_but_not_as_a_vowel', '::test_divides_vowels_by_all_alphabetic_characters', '::test_counts_uppercase_vowels_as_vowels', '::test_counts_uppercase_consonants_as_alphabetic_characters', '::test_ignores_digits_in_numerator_and_denominator', '::test_ignores_punctuation_in_numerator_and_denominator', '::test_ignores_spaces_in_numerator_and_denominator', '::test_ignores_non_ascii_letters_completely', '::test_counts_characters_across_every_word_in_the_sequence', '::test_accepts_a_tuple_of_words', '::test_returns_a_float_between_zero_and_one']
    core: 0 failed -> []

--- m12_vowel_before_alpha_check: vowel test applied to every character (letters gate removed from the numerator)
    tester: 0 failed -> []
    core: 0 failed -> []

--- m13_word_level_ratio: word-level ratio (words with a vowel / words) instead of character-level
    tester: 12 failed -> ['::test_returns_zero_for_a_word_without_any_vowel', '::test_counts_y_as_a_letter_but_not_as_a_vowel', '::test_divides_vowels_by_all_alphabetic_characters', '::test_counts_uppercase_consonants_as_alphabetic_characters', '::test_ignores_digits_in_numerator_and_denominator', '::test_ignores_punctuation_in_numerator_and_denominator', '::test_ignores_spaces_in_numerator_and_denominator', '::test_ignores_non_ascii_letters_completely', '::test_returns_zero_when_there_are_no_alphabetic_characters', '::test_returns_zero_for_a_sequence_of_empty_strings', '::test_counts_characters_across_every_word_in_the_sequence', '::test_accepts_a_tuple_of_words']
    core: 0 failed -> []
EXITCODE=0
```

**Reading of the matrix:**

* `m00_control` is the control (byte-identical copy) — it must fail 0, and it does: the harness shadows the repo
  correctly, so the matrix is trustworthy.
* 13 **real** mutants were built (`m01`–`m13`).
* `m12` is **equivalent** (proved independently below), so the denominator of *non-equivalent* mutants is
  **13 − 1 = 12**: `m01`–`m11` and `m13`.
* The canonical file `tests/test_vowel_ratio.py` killed **all 12** of them (`tester_fail ≥ 1` for every one).
  The only survivor is `m12` — which must survive, because it is behaviourally identical to the original.

⇒ **claim (d) = 12/12 VERIFIED.**

### 2.8 Independent proof that `m12` is an equivalent mutant (why 12, not 13)

```powershell
& 'C:\Python312\python.exe' 'D:\project\.swarm-lab\probe\reviewer_r1\check_equivalence.py'
```

```
corpus=20000 mismatches=0
VERDICT: m12 is EQUIVALENT (no coverage gap)
chars whose .lower() is a vowel but that are not lowercase ASCII letters: 5
sample: ['A', 'E', 'I', 'O', 'U']
EXITCODE=0
```

(Only `A E I O U` lower into a vowel, and all of them are ASCII letters — so removing the alphabetic gate from
the numerator cannot change the result.)

### 2.9 Clause-by-clause probe against the requirement

```powershell
& 'C:\Python312\python.exe' 'D:\project\.swarm-lab\probe\reviewer_r1\check_clauses.py'
```

```
exit=0
total_lines=56
PASS_lines=53
FAIL_lines=0
--- the RESULT line ---

RESULT: all clause checks PASS
--- C1 signature line ---
[INFO] C1 signature: (words: collections.abc.Sequence[str]) -> float
```

(The probe also cross-checks the implementation against an independent reference implementation over 4 007
random sequences — `X: reference cross-check over 4007 random sequences, mismatches=0`.)

### 2.10 The canonical file's own docstring claim: a missing symbol degrades gracefully

```powershell
& 'C:\Python312\python.exe' 'D:\project\.swarm-lab\probe\reviewer_r1\check_export_and_missing_symbol.py'
```

```
=== 1. package-level export ===
textstats.vowel_ratio        : False
textstats.longest_word       : False
textstats.word_length_histo  : False
textstats.word_count         : True
from textstats import vowel_ratio: ImportError -> cannot import name 'vowel_ratio' from 'textstats' (D:\project\.swarm-lab\lab-repo\src\textstats\__init__.py)
from textstats import core -> 1.0


=== 2. tester docstring claim: missing symbol -> per-test failures ===
FAILED ::test_counts_uppercase_consonants_as_alphabetic_characters - Assertio...
FAILED ::test_ignores_digits_in_numerator_and_denominator - AssertionError: t...
FAILED ::test_ignores_punctuation_in_numerator_and_denominator - AssertionErr...
FAILED ::test_ignores_spaces_in_numerator_and_denominator - AssertionError: t...
FAILED ::test_ignores_non_ascii_letters_completely - AssertionError: textstat...
FAILED ::test_returns_zero_when_there_are_no_alphabetic_characters - Assertio...
FAILED ::test_returns_zero_for_an_empty_sequence - AssertionError: textstats....
FAILED ::test_returns_zero_for_a_sequence_of_empty_strings - AssertionError ...
FAILED ::test_counts_characters_across_every_word_in_the_sequence - Assert...
FAILED ::test_accepts_a_tuple_of_words - AssertionError: textstats.core.vowel...
FAILED ::test_returns_a_float_between_zero_and_one - AssertionError: textstat...
16 failed in 0.57s
exit: 1

=== 3. same scenario for the developer file (test_core.py) ===
...........                                                              [100%]
11 passed in 0.09s
exit: 0
```

The canonical file's guard (`tests/test_vowel_ratio.py:22-28`) turns a missing feature into **16 individual,
readable failures** rather than one opaque collection error. The `core` file no longer aborts collection at all
(F8 removed the fragile top-level `vowel_ratio` import), so Reviewer finding N-1 is resolved.

---

## 3. The 16 conditions and the test that covers each one

The requirement under test was recovered verbatim from the round-10 dispatch brief (the Coordinator's
`R10 Developer vowel_ratio` brief, recovered from the session log at
`D:\project\.swarm-lab\fork2_log.txt`). Its behaviour clauses:

* **RQ1** — Consider every character of every string in `words`.
* **RQ2** — A character counts as ALPHABETIC if it is an ASCII letter a-z or A-Z; every other character
  (digits, punctuation, spaces, accented letters) is ignored completely — it counts neither in the numerator
  nor in the denominator.
* **RQ3** — A character counts as a VOWEL if it is one of a, e, i, o, u, case-insensitively.
* **RQ4** — Return the number of vowel characters divided by the number of alphabetic characters.
* **RQ5** — If there are no alphabetic characters at all (including an empty `words`, or words made only of
  digits/punctuation), return 0.0.
* **RQ6** — The result is a float in the range 0.0..1.0.
* Signature: `vowel_ratio(words: Sequence[str]) -> float`.

Each of the **16** test functions in `D:\project\.swarm-lab\lab-repo\tests\test_vowel_ratio.py`, with the
requirement clause(s) it pins and the mutant it kills (from the re-run matrix):

| # | Condition (observable) | Test function (line in `test_vowel_ratio.py`) | Requirement clause | Mutant(s) it kills (re-run) |
|---|---|---|---|---|
| 1 | A word made only of vowels → `1.0` | `test_returns_one_for_a_word_made_only_of_vowels` (L31) | RQ3, RQ4 | `m11` |
| 2 | A word with no vowel → `0.0` | `test_returns_zero_for_a_word_without_any_vowel` (L36) | RQ4 | `m05`, `m13` |
| 3 | `y` is an ASCII letter but **not** a vowel (`["y"]→0.0`, `["ay"]→0.5`) | `test_counts_y_as_a_letter_but_not_as_a_vowel` (L41) | RQ2, RQ3 | `m02`, `m05`, `m11`, `m13` |
| 4 | Vowels ÷ **all** alphabetic characters (`"hello"→0.4`) | `test_divides_vowels_by_all_alphabetic_characters` (L47) | RQ4 | `m05`, `m11` |
| 5 | Uppercase vowels count as vowels (case-insensitive) | `test_counts_uppercase_vowels_as_vowels` (L52) | RQ3 | `m07`, `m08`, `m11` |
| 6 | Uppercase consonants **are** alphabetic (so they are in the denominator) | `test_counts_uppercase_consonants_as_alphabetic_characters` (L59) | RQ2 | `m05`, `m08`, `m11`, `m13` |
| 7 | Digits are ignored on both sides | `test_ignores_digits_in_numerator_and_denominator` (L65) | RQ2 | `m03`, `m05`, `m10`, `m11`, `m13` |
| 8 | Punctuation is ignored on both sides | `test_ignores_punctuation_in_numerator_and_denominator` (L72) | RQ2 | `m03`, `m05`, `m11`, `m13` |
| 9 | Spaces are ignored on both sides (`"a b"` ≡ `"ab"`) | `test_ignores_spaces_in_numerator_and_denominator` (L78) | RQ2 | `m03`, `m05`, `m11`, `m13` |
| 10 | Non-ASCII letters (`é`, `ï`) are ignored **completely** (`"café"→1/3`) | `test_ignores_non_ascii_letters_completely` (L90) | RQ2 | `m01`, `m03`, `m05`, `m10`, `m11`, `m13` |
| 11 | Digits/punctuation/spaces only → no alphabetic characters → `0.0` | `test_returns_zero_when_there_are_no_alphabetic_characters` (L96) | RQ5 | `m06`, `m13` |
| 12 | Empty sequence → `0.0` | `test_returns_zero_for_an_empty_sequence` (L101) | RQ5 | `m06`, `m13` |
| 13 | A sequence of empty strings → `0.0`; `["a",""]` → `1.0` | `test_returns_zero_for_a_sequence_of_empty_strings` (L106) | RQ5 | `m06`, `m13` |
| 14 | Characters of **every** word in the sequence are counted | `test_counts_characters_across_every_word_in_the_sequence` (L112) | RQ1 | `m05`, `m09`, `m11`, `m13` |
| 15 | Any sequence of words is accepted (a tuple too) | `test_accepts_a_tuple_of_words` (L118) | RQ1 | `m05`, `m09`, `m11`, `m13` |
| 16 | The result is a `float` in `0.0..1.0` | `test_returns_a_float_between_zero_and_one` (L123) | RQ6 | `m04`, `m05`, `m06`, `m11` |

**Clause coverage:** RQ1 → #14, #15 · RQ2 → #3, #6, #7, #8, #9, #10 · RQ3 → #1, #3, #5 · RQ4 → #1, #2, #3, #4 ·
RQ5 → #11, #12, #13 · RQ6 → #16. Every requirement clause is pinned by at least one test; no clause is orphaned.

---

## 4. Verdict per claim, with the evidence line

### (a) "After the F8 de-duplication the whole suite is 39 passed" — **VERIFIED**

* **Tag: Verified.**
* Evidence: `39 passed in 0.25s`, `EXITCODE=0` (§2.1), corroborated by the 39 collected node IDs (§2.2) and
  by the per-file tally 11 + 8 + 4 + 16 = 39 (§2.6).

### (b) "`tests\test_vowel_ratio.py` is the canonical file holding the 16 requirement conditions" — **VERIFIED**

* **Tag: Verified.**
* Evidence: AST scan → `test_vowel_ratio.py 16 test_* functions` (§2.6); the file alone → `16 passed in 0.10s`
  (§2.3); the file is the **only** test file mentioning `vowel_ratio` (35 mentions, versus 0 in every other test
  file, §2.5); it is the file the mutation matrix uses as the canonical column and which kills 12/12 (§2.7);
  and it is the file the Reviewer's M-1 recommendation named to keep (`FINDINGS.md:27`, `FINDINGS.md:53`).

### (c) "`tests\test_core.py` no longer contains any vowel_ratio tests" — **VERIFIED**

* **Tag: Verified.**
* Evidence: `git grep -n -i "vowel" -- tests/test_core.py` → **no output, exit 1** (§2.5); `vowel_ratio` is
  absent from the import block (§2.5); the file holds 11 tests, none of them vowel tests (§2.6); running it
  alone → `11 passed` (§2.4); and with `vowel_ratio` removed from the package it still collects cleanly
  (`11 passed`, exit 0) — the Reviewer's N-1 is gone (§2.10).

### (d) "The canonical file killed 12/12 non-equivalent mutants in the earlier Reviewer's matrix" — **VERIFIED**

* **Tag: Verified.**
* Evidence: the harness was found on disk and re-run (§2.7). Control `m00` fails 0 (the shadowing is real);
  `m12` is independently proven equivalent over a 20 000-case differential corpus with 0 mismatches (§2.8);
  the remaining **12** non-equivalent mutants (`m01`–`m11`, `m13`) are each killed by
  `tests/test_vowel_ratio.py` (`tester_fail` = 1,1,4,1,11,4,1,2,2,2,12,12).

---

## 5. Additional observations (not part of claims (a)–(d))

1. **The companion claim "the Developer's weaker file 11/12" is no longer reproducible, and should not be.**
   `FINAL-VERDICT.md:42` states the canonical file kills 12/12 while "the Developer's weaker file 11/12".
   That comparison was true *before* F8. F8 deleted the Developer's 7 `vowel_ratio` tests from
   `tests/test_core.py`, so in the re-run the `core` column is **0 failures for every mutant** (§2.7) — the
   harness's own banner line (`dev file = tests/test_core.py (18 tests, 7 are vowel_ratio)`) is now **stale**.
   The 12/12 claim itself is unaffected; only the side-by-side 11/12 figure is a historical artefact.
   *Classification: non-blocking, documentation accuracy only.*
2. **"13-mutant matrix" wording.** The harness builds **14** entries: `m00_control` + `m01`–`m13`
   (13 real mutants + 1 control). 13 real − 1 equivalent (`m12`) = **12 non-equivalent**, which is consistent
   with the "12/12" figure and with the "13-mutant matrix" wording. No discrepancy.
3. **Ledger wording: "15 conditions" vs 16 tests.** `FINDINGS.md:51` says the Tester derived "15 conditions"
   but wrote "16 tests". The file contains **16 test functions** (verified twice: AST scan and pytest
   collection). This is a wording slip in the ledger, not a defect in the canonical file.
4. **Wall-clock differs.** Ledger `39 passed in 0.29s`; my run `39 passed in 0.25s`. Count identical.
5. **Signature clause is covered by the Reviewer's probe, not by the canonical file.** The canonical file
   pins *behaviour*; the annotation `Sequence[str] -> float` is asserted by `check_clauses.py` C1
   (`[INFO] C1 signature: (words: collections.abc.Sequence[str]) -> float`, §2.9). This is a coverage note,
   not a gap in the requirement: the requirement's acceptance criteria are behavioural.
6. **Deliberate coverage gaps** (carried over from the R10 Tester, still true and still deliberate): bare-`str`
   input, non-string elements, and performance are not asserted.

---

## 6. Boundary compliance — nothing outside this report was modified

* `git status --porcelain` in the lab repo, captured **before** my runs and again **after** every run:

  ```
   M src/textstats/core.py
   M tests/test_core.py
  ?? src/textstats/scratch_probe.py
  ?? tests/test_longest_word.py
  ?? tests/test_scratch_probe.py
  ?? tests/test_vowel_ratio.py
  ```

  — **byte-identical before and after**. `git diff --stat` is likewise unchanged
  (`src/textstats/core.py | 37 +…`, `tests/test_core.py | 42 +…`, `2 files changed, 76 insertions(+), 3 deletions(-)`).

* File sizes/line counts after my runs match the ledger exactly:
  `tests/test_core.py` = **1508 B / 53 lines** (`FINDINGS.md:55` says 1508 B / 53 lines),
  `tests/test_vowel_ratio.py` = **5013 B / 128 lines** (`FINDINGS.md:55` says 5013 B / 16 test_* functions).
  All source-file mtimes still predate this session (2026-11-05/06), so no tracked or untracked source file
  was rewritten.
* The only artefacts touched inside the repo are `.pytest_cache\` and `__pycache__\`, both of which are
  gitignored (`.gitignore:1-3`) and both of which already existed before my run.
* The mutation harness rebuilt its own mutant packages under `D:\project\.swarm-lab\probe\reviewer_r1\mNN_*`
  (outside the lab repo) — that is the probe area the assignment explicitly allows to be re-run.
* **Not touched:** `D:\project\dsh-plugins`, the DSH profile and any plugin row, and every repo under
  `D:\project\reading-collector`. No network access.
* **Only file written by me:** `D:\project\.swarm-lab\rounds\RETEST-evidence.md` (this document).

---

## 7. Verification exit criteria

* Required test conditions covered: the 16 canonical conditions were counted by reading the file, the whole
  suite was executed by me, and the earlier mutation matrix was re-executed against the current tree.
* Results assessed against the acceptance criteria: all four claims carry a **Verified** tag with a quoted
  evidence line.
* Failures reproduced / limitations documented: no test failed. The one material nuance (the now-stale 11/12
  comparison and the harness banner) is documented in §5.
* Coverage gaps reported: §5.5 and §5.6.
* **Exit criteria satisfied.**
