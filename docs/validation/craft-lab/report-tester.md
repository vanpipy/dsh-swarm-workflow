# Tester lane — conformance check of the craft arm's `textnorm`

**Lane:** Tester (independent conformance check, no implementation changes)
**Package under test:** `D:\project\swarm-craft-lab\craft-arm\textnorm\`
**Specification (only source of truth):** `D:\project\swarm-craft-lab\spec\textnorm-spec.md`
**Environment:** CPython 3.12.14 (64-bit, MSC v.1944) on Windows 11, run with the bundled
DSH runtime interpreter `C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe`
(`python` is not on PATH). Standard library only, no network, no wall clock, no sleeps.

## Verdict in one line

**40 checks, 40 pass against the craft arm. No defect found.** Every check was made to
fail on purpose in a throwaway copy (43 mutation runs, 43 failures). Two spec gaps and two
reading-dependent checks are reported below; neither is a defect in the craft arm.

| Artefact | Path |
| --- | --- |
| Conformance module | `D:\project\swarm-craft-lab\tester\test_spec_conformance.py` (40 checks, LF only) |
| Package marker (extra artefact, see [4.4](#44-the-tester__init__py-artefact)) | `D:\project\swarm-craft-lab\tester\__init__.py` |
| This report | `D:\project\swarm-craft-lab\.swarm\reports\craft-lab-tester.md` |
| Fail-on-purpose harness (not part of the repository, lives in `%TEMP%`) | `C:\Users\leroy\AppData\Local\Temp\textnorm-mutation-harness\harness.py` |

The implementation under test, the specification, the requirement set, the control arm and
the arms' own `tests/` directories were **read only**. No file outside the three above was
created or changed in the repository; no git command was run.

---

## 1. What I read, and which rule shaped which check

### 1.1 The craft files

| File | Read as |
| --- | --- |
| `D:\project\dsh-plugins\dsh-swarm-workflow\skills\swarm-engineering\tester.md` | the skill `swarm-craft-tester` |
| `D:\project\dsh-plugins\dsh-swarm-workflow\skills\swarm-engineering\languages\python.md` | the skill `swarm-craft-python` |
| `D:\project\dsh-plugins\dsh-swarm-workflow\skills\swarm-engineering\shared.md` | the shared craft every lane works by |

### 1.2 The rule → the check it produced

| Rule (craft file) | What it says, in short | What it changed in my work |
| --- | --- | --- |
| tester §2 — *choose the oracle* | the oracle is the observable behaviour the requirement names; derive the expected value from the requirement **before** reading the implementation; say in the test where the expected value comes from; black box, public surface only | Every expected value is derived from `spec/textnorm-spec.md` and every check carries a comment naming the clause it comes from. The module docstring names the specification as the only source. The module imports only `normalize` and `stats` and drives the command line as a subprocess (`python -m textnorm`), never a private function. |
| tester §3 — *make the check discriminate* | one behaviour per check; name the behaviour, not the function; a check that cannot fail is not a check | Each check names one behaviour in its own words (`test_a_run_of_mixed_whitespace_becomes_exactly_one_space`, not `test_normalize_2`). The discrimination of all 40 checks is demonstrated in [3](#3-how-i-checked-them). |
| tester §4 — *cover the boundary, not the middle* | empty, one, many, malformed, missing file, error path; write into a temporary directory, never the working tree; no sleeps, no network, no wall clock | The boundary inventory is [2.4](#24-the-boundary-inventory). Every file the checks read or write lives in `tempfile.TemporaryDirectory()`; nothing is written into the repository. |
| tester §5 — *prove the check can fail* | invert the expectation, break the input, or revert the fix in a throwaway copy; quote the failing output; leave the tree as it was; break only the behaviour under test | The harness in [3.2](#32-the-fail-on-purpose-harness) copies the package to `%TEMP%`, applies **one** mutation per run, and leaves the working tree untouched. Every failing observation is quoted. |
| tester §6 — *report honestly* | keep passed / failed / blocked / not-tested apart; a verdict without evidence is not a verdict; a check that could not be run is *not demonstrated*, never *met*; name the environment | Section 4 keeps the verdicts per check and flags the two checks that rest on a reading of the specification. The environment is named above and in each command. |
| python §8 — *files and paths* | use `Path`; `read_text(encoding="utf-8")`; `newline=""` when the bytes matter | The CRLF fixture is written with `Path.write_text(text, encoding="utf-8", newline="")`, so the `\r\n` reaches the file untranslated and the file is written as UTF-8. |
| python §12 — *testing* | standard library `unittest`; one test module per source module; `TemporaryDirectory` for the filesystem; table-driven cases with `subTest`; assert on behaviour; **pin the wording when the wording is the contract** | The module is one `unittest` module. Tables are run with `subTest` (17 Unicode whitespace characters, 5 whitespace-only texts, 4 trailing-newline endings). The stderr line and the stdout shape are pinned exactly, because in the specification those strings *are* the contract. |
| python §13 — *command line* | exit codes are a contract; the message goes to stderr | `test_cli_exits_zero_on_success`, `test_cli_exits_two_when_the_file_cannot_be_read`, `test_cli_prints_nothing_on_stdout_when_the_file_cannot_be_read` and `test_cli_writes_the_exact_stderr_line_when_the_file_cannot_be_read` assert the exit code and the stream separately. |
| python §9 — *shell* | `subprocess.run([...], capture_output=True, text=True)` | The command line is driven with `subprocess.run([sys.executable, "-m", "textnorm", *args], capture_output=True, encoding="utf-8")`; the interpreter is the same one that runs the checks. |
| shared §2.1–2.3 | falsifiable checks; re-derive every number a second way; validate where the artifact runs | The counts are re-derived from the input in the check itself (the 200-word case builds its expectation from the word list), and the checks run against the artifact where it really runs — the CLI checks spawn `python -m textnorm`. |
| shared §3.3, §3.7 | errors, exit codes and streams are part of the behaviour; encoding is explicit | The CLI is run with `PYTHONIOENCODING=utf-8` and its output is decoded as UTF-8; the error path is checked on stdout and stderr separately. |

---

## 2. The checks

40 checks in one module, `D:\project\swarm-craft-lab\tester\test_spec_conformance.py`.
The module puts `D:\project\swarm-craft-lab\craft-arm` on `sys.path` itself, so it runs
both under `unittest discover` and on its own.

### 2.1 `normalize` — the clause "Every Unicode whitespace character becomes a plain
space… The typographic quotes become the ASCII ones… The en dash and the em dash become a
single `-`… A run of whitespace becomes exactly one space… The result has no leading or
trailing space."

| # | Check | What it asserts | Spec clause |
| --- | --- | --- | --- |
| 1 | `test_empty_text_normalises_to_the_empty_string` | `normalize("") == ""` | clauses 1–5 on the empty input |
| 2 | `test_whitespace_only_text_normalises_to_the_empty_string` | `normalize(x) == ""` for `"   "`, `" "`, `"\t"`, `"\u00a0"`, `" \t\n "` | clause 4 + clause 5 (the run becomes one space, clause 5 trims it) |
| 3 | `test_one_character_text_is_unchanged` | `normalize("a") == "a"` | boundary: the smallest non-empty text |
| 4 | `test_every_unicode_whitespace_character_becomes_one_plain_space` | `normalize("a" + c + "b") == "a b"` for 17 Unicode White_Space characters (U+0020, U+0009, U+000A, U+000B, U+000C, U+000D, U+0085, U+00A0, U+1680, U+2000, U+200A, U+2028, U+2029, U+202F, U+205F, U+3000) | clause 1 — "That includes the non-breaking space, tabs, and the line breaks" |
| 5 | `test_typographic_single_quotes_become_the_ascii_apostrophe` | U+2018 and U+2019 → `'` | clause 2 |
| 6 | `test_typographic_double_quotes_become_the_ascii_quote` | U+201C and U+201D → `"` | clause 2 |
| 7 | `test_the_en_dash_becomes_a_single_hyphen` | U+2013 → `-` | clause 3 |
| 8 | `test_the_em_dash_becomes_a_single_hyphen` | U+2014 → `-` (one hyphen, not two) | clause 3 ("a single `-`") |
| 9 | `test_a_run_of_mixed_whitespace_becomes_exactly_one_space` | `normalize("a \t\n\r\f\v b") == "a b"` | clause 4 |
| 10 | `test_leading_and_trailing_whitespace_is_removed` | `"  a  "` and `"\t\n a \n\t"` → `"a"` | clause 5 |
| 11 | `test_text_without_any_of_the_listed_characters_is_unchanged` | `"a,b;c!?d-e_f(g)@h#i$j%k"` → itself | clauses 1–3 list the characters that may change; nothing else may |
| 12 | `test_a_long_run_of_spaces_becomes_one_space` | `"a" + 500 spaces + "b"` → `"a b"` | clause 4, "many" boundary |
| 13 | `test_a_long_text_of_many_words_holds_one_space_between_the_words` | 200 words joined by line feeds → the words joined by one space each | clause 4, "many" boundary |
| 14 | `test_a_sentence_of_typographic_punctuation_normalises_to_ascii` | `“Hi” ‘there’ – —` → `"Hi" 'there' - -` | clauses 2 and 3 together |

### 2.2 `stats` — "Returns a dict with exactly three keys: `chars` … `words` … `lines` …

| # | Check | What it asserts | Spec clause |
| --- | --- | --- | --- |
| 15 | `test_stats_returns_a_dict_with_exactly_the_three_documented_keys` | the result is a `dict` whose key set is exactly `{chars, words, lines}` | "exactly three keys" |
| 16 | `test_stats_counts_the_characters_of_the_normalised_text` | `stats("a  b")["chars"] == 3` (four characters before, three after) | "`chars` — the number of characters in `normalize(text)`" |
| 17 | `test_stats_counts_the_words_of_the_normalised_text` | `stats("a b  c")["words"] == 3` | "`words` — the number of whitespace-separated words in `normalize(text)`" |
| 18 | `test_stats_counts_zero_words_for_an_empty_result` | `stats("")["words"] == 0` | "an empty result is zero words" |
| 19 | `test_stats_of_a_text_of_only_spaces_has_one_line_and_no_characters` | `stats("   ")` → 1 line, 0 chars, 0 words | "A text that is only spaces has one line and no characters." |
| 20 | `test_stats_of_an_empty_text_has_zero_lines` | `stats("")["lines"] == 0` | "an empty text has zero lines" |
| 21 | `test_stats_counts_a_line_feed_as_one_line_break` | `stats("a\nb")["lines"] == 2` | "`\n` … counts" |
| 22 | `test_stats_counts_a_crlf_pair_as_one_line_break` | `stats("a\r\nb")["lines"] == 2` | "`\r\n` … counts" (one break, not two) |
| 23 | `test_stats_counts_a_lone_carriage_return_as_one_line_break` | `stats("a\rb")["lines"] == 2` | "`\r` … counts" |
| 24 | `test_stats_counts_the_lines_of_the_original_text_not_the_normalised_one` | `stats("a\r\nb\tc")["lines"] == 2` (the normalised text has one line) | "`lines` is counted on the original text, never on the normalised one." |
| 25 | `test_stats_trailing_newline_does_not_add_an_empty_line` | `"a\n"`, `"a\r\n"`, `"a\r"` → 1 line; `"a\nb\n"` → 2 lines | "A trailing newline does not add an empty line" |
| 26 | `test_stats_counts_an_empty_line_between_two_lines` | `stats("a\n\nb")["lines"] == 3` | "the number of lines in the original text" — the empty line is a line |
| 27 | `test_stats_does_not_count_a_form_feed_as_a_line_break` | `stats("a\fb")["lines"] == 1` | reading-dependent, see [4.3](#43-two-reading-dependent-checks) |
| 28 | `test_stats_does_not_count_a_unicode_line_separator_as_a_line_break` | `stats("a\u2028b")["lines"] == 1` | reading-dependent, see [4.3](#43-two-reading-dependent-checks) |
| 29 | `test_stats_counts_a_non_breaking_space_as_a_word_separator` | `stats("a\u00a0b")["words"] == 2` | clause 1 (the non-breaking space becomes a plain space) + the `words` clause |

### 2.3 The command line — "`python -m textnorm <file>` reads the file as UTF-8 and prints
three lines: `chars: <n>` / `words: <n>` / `lines: <n>`. It exits 0 on success. If the
file cannot be read, it exits 2, prints nothing on stdout, and writes exactly this line to
stderr: `textnorm: no such file: <path>`. `<path>` is the path as it was given on the
command line."

| # | Check | What it asserts | Spec clause |
| --- | --- | --- | --- |
| 30 | `test_cli_prints_the_three_documented_lines` | stdout is exactly `"chars: 11\nwords: 2\nlines: 1\n"` for `Hello  world\n` | the three printed lines, wording pinned |
| 31 | `test_cli_exits_zero_on_success` | exit code 0 | "It exits 0 on success." |
| 32 | `test_cli_reads_the_file_as_utf8` | `café — naïve\n` → `"chars: 12\nwords: 3\nlines: 1\n"` | "reads the file as UTF-8" |
| 33 | `test_cli_prints_zeros_for_an_empty_file` | an empty file → `"chars: 0\nwords: 0\nlines: 0\n"` | the empty file, end to end |
| 34 | `test_cli_counts_the_lines_of_a_file_with_crlf_endings` | `a\r\nb\r\nc\r\n` → `"chars: 5\nwords: 3\nlines: 3\n"` | the `lines` clause reaches the command |
| 35 | `test_cli_prints_nothing_on_stdout_when_the_file_cannot_be_read` | stdout is `""` | "prints nothing on stdout" |
| 36 | `test_cli_exits_two_when_the_file_cannot_be_read` | exit code 2 for a missing file | "it exits 2" |
| 37 | `test_cli_writes_the_exact_stderr_line_when_the_file_cannot_be_read` | stderr is exactly `"textnorm: no such file: missing.txt\n"` | "writes exactly this line to stderr" |
| 38 | `test_cli_echoes_the_path_exactly_as_it_was_given` | stderr is `"textnorm: no such file: ./missing.txt\n"` for the argument `./missing.txt` | "`<path>` is the path as it was given on the command line." |
| 39 | `test_cli_exits_two_when_the_file_is_not_valid_utf8` | a file holding `b"\xff\xfe not utf-8 \x80"` → exit 2, stdout `""`, stderr `"textnorm: no such file: broken.txt\n"` | "reads the file as UTF-8" + "If the file cannot be read, it exits 2" |
| 40 | `test_cli_exits_two_when_the_path_is_a_directory` | the argument `folder` (a directory) → exit 2, stdout `""`, stderr `"textnorm: no such file: folder\n"` | "If the file cannot be read, it exits 2" |

### 2.4 The boundary inventory

| Boundary asked for | Covered by |
| --- | --- |
| empty | 1 (empty text), 18 (zero words), 20 (zero lines), 33 (empty file) |
| whitespace-only | 2 (five kinds, including the non-breaking space), 19 (only spaces) |
| one character | 3, plus 5–8 (a single typographic character) |
| many | 12 (500 spaces), 13 (200 words), 14 (a whole sentence) |
| Unicode punctuation | 5, 6, 7, 8, 14 (U+2018, U+2019, U+201C, U+201D, U+2013, U+2014) |
| non-breaking space | 4 (as whitespace), 29 (as a word separator), 39-adjacent |
| CRLF | 22 (in `stats`), 25 (trailing CRLF), 34 (through the command line) |
| trailing newline | 25 (four endings), 34 (the CLI) |
| missing file | 35, 36, 37, 38, and the two extra error paths 39, 40 |
| exact stderr text | 37, 38, 39, 40 |
| exact stdout shape | 30, 32, 33, 34 |

---

## 3. How I checked them

### 3.1 The suite against the package under test

Command (from `D:\project\swarm-craft-lab`, the interpreter used throughout):

```powershell
& "C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" -m unittest discover -s tester -t .
```

Output (tail):

```
----------------------------------------------------------------------
Ran 40 tests in 0.921s

OK
```

Exit code **0**. The same command with `-v` lists all 40 checks as `ok`.

The same module on its own also runs, because it puts the package on `sys.path` itself:

```powershell
& "C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" -m unittest tester.test_spec_conformance
```

Output: `Ran 40 tests in 0.764s` / `OK`, exit code **0**. The module is named
`tester.test_spec_conformance` because `tester` is a package (see
[4.4](#44-the-tester__init__py-artefact)); the bare name `test_spec_conformance` is not
importable from the repository root and ends in
`ModuleNotFoundError: No module named 'test_spec_conformance'`.

### 3.2 The fail-on-purpose harness

A check that cannot fail is not a check (tester §3, §5). Every one of the 40 checks was
therefore run against a **deliberately broken copy** of the package and had to fail.

The harness (`%TEMP%\textnorm-mutation-harness\harness.py`, outside the repository):

1. copies `craft-arm\textnorm` to `%TEMP%\...\work\<id>\craft-arm\textnorm`, ignoring
   `__pycache__` (a stale `.pyc` would shadow the mutation);
2. copies the conformance module to `%TEMP%\...\work\<id>\pkgroot\test_spec_conformance.py`
   — the module computes the package root from its own location, so it picks up the broken
   copy, and its CLI subprocess inherits the same `PYTHONPATH`;
3. applies **one** mutation to the copy — the smallest change that breaks exactly the
   behaviour the check names;
4. runs the one named check: `python -m unittest -v test_spec_conformance.<Class>.<check>`;
5. records the exit code and the failing output.

The working tree is never written to. The control run (the same copy, unmutated, whole
module) exits **0** with `OK`, so a failure in the table below is caused by the mutation
and not by the copy.

Command:

```powershell
& "C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" `
  "C:\Users\leroy\AppData\Local\Temp\textnorm-mutation-harness\harness.py" `
  "C:\Users\leroy\AppData\Local\Temp\textnorm-mutation-harness"
```

Output (tail):

```
CONTROL (unmutated copy, whole module): exit=0
OK
...
mutations run: 43
all failed as expected: True
```

**43 mutation runs, 43 failures, exit code 1 each** (unittest exits 1 when a test fails).
The 43 runs cover the 40 checks; three checks have two independent mutations each
(the stdout shape, the path echoed, the trailing newline).

One mutation was rejected during the process and replaced: `sub(" ", text, count=1)`
("only the first run is collapsed") did **not** break `test_a_long_run_of_spaces_becomes_one_space`,
because `count` limits the number of *matches*, not the length of a match — the whole run of
500 spaces was still one match. The harness reported `N12 ... exit 0` and the mutation was
replaced with `\s{1,10}` ("a long run is replaced ten characters at a time"), which does
break the check. The harness is not a rubber stamp: it reported the mutation that did not
discriminate.

### 3.3 The failing observation for every check

Every line below is the `AssertionError` line of the failing run, verbatim. The mutation is
the change applied to the throwaway copy.

| Check | Mutation applied to the copy | Failing observation |
| --- | --- | --- |
| `test_every_unicode_whitespace_character_becomes_one_plain_space` | `_WHITESPACE_RUN = re.compile(r"\s+")` → `re.compile(r"[ \t\n\r]+")` | `AssertionError: 'a\x0bb' != 'a b'` (subtest `character='vertical tab U+000B'`) |
| `test_a_run_of_mixed_whitespace_becomes_exactly_one_space` | `re.compile(r"\s+")` → `re.compile(r"\s")` | `AssertionError: 'a       b' != 'a b'` |
| `test_a_long_text_of_many_words_holds_one_space_between_the_words` | `re.compile(r"\s+")` → `re.compile(r"[^\S\n]+")` | `AssertionError: 'w0\nw1\nw2\n...\nw199' != 'w0 w1 w2 w3 ... w199'` |
| `test_leading_and_trailing_whitespace_is_removed` | `.strip()` → `.lstrip()` | `AssertionError: 'a ' != 'a'` (subtest `whitespace='spaces'`) |
| `test_whitespace_only_text_normalises_to_the_empty_string` | `.strip()` removed | `AssertionError: ' ' != ''` (subtest `whitespace='spaces'`) |
| `test_empty_text_normalises_to_the_empty_string` | a space is appended to the result | `AssertionError: ' ' != ''` |
| `test_one_character_text_is_unchanged` | a space is appended to the result | `AssertionError: 'a ' != 'a'` |
| `test_typographic_single_quotes_become_the_ascii_apostrophe` | the U+2018 / U+2019 map entries removed | `AssertionError: '‘' != "'"` (subtest `character='U+2018'`) |
| `test_typographic_double_quotes_become_the_ascii_quote` | the U+201C / U+201D map entries removed | `AssertionError: '“' != '"'` (subtest `character='U+201C'`) |
| `test_the_en_dash_becomes_a_single_hyphen` | the U+2013 map entry removed | `AssertionError: '–' != '-'` |
| `test_the_em_dash_becomes_a_single_hyphen` | `0x2014: "-"` → `0x2014: "--"` | `AssertionError: '--' != '-'` |
| `test_text_without_any_of_the_listed_characters_is_unchanged` | `0x2D: "–"` added to the map | `AssertionError: 'a,b;c!?d–e_f(g)@h#i$j%k' != 'a,b;c!?d-e_f(g)@h#i$j%k'` |
| `test_a_long_run_of_spaces_becomes_one_space` | `re.compile(r"\s+")` → `re.compile(r"\s{1,10}")` | `AssertionError: 'a                    ...                    b' != 'a b'` |
| `test_a_sentence_of_typographic_punctuation_normalises_to_ascii` | the U+2014 map entry removed | `AssertionError: '"Hi" \'there\' - —' != '"Hi" \'there\' - -'` |
| `test_stats_counts_the_characters_of_the_normalised_text` | `"chars": len(normalised)` → `len(text)` | `AssertionError: 4 != 3` |
| `test_stats_of_a_text_of_only_spaces_has_one_line_and_no_characters` | `"chars": len(normalised)` → `len(text)` | `AssertionError: 3 != 0` |
| `test_stats_counts_the_words_of_the_normalised_text` | `"words": len(normalised.split())` → `len(normalised.split()) - 1` | `AssertionError: 2 != 3` |
| `test_stats_counts_zero_words_for_an_empty_result` | `len(normalised.split())` → `len(normalised.split(" "))` | `AssertionError: 1 != 0` |
| `test_stats_counts_a_non_breaking_space_as_a_word_separator` | `len(normalised.split())` → `len(text.split(" "))` | `AssertionError: 1 != 2` |
| `test_stats_counts_the_lines_of_the_original_text_not_the_normalised_one` | `"lines": _count_lines(text)` → `_count_lines(normalised)` | `AssertionError: 1 != 2` |
| `test_stats_counts_a_crlf_pair_as_one_line_break` | `re.compile(r"\r\n\|\r\|\n")` → `re.compile(r"\r\|\n")` | `AssertionError: 3 != 2` |
| `test_stats_counts_a_lone_carriage_return_as_one_line_break` | `re.compile(r"\r\n\|\r\|\n")` → `re.compile(r"\r\n\|\n")` | `AssertionError: 1 != 2` |
| `test_stats_counts_a_line_feed_as_one_line_break` | `re.compile(r"\r\n\|\r\|\n")` → `re.compile(r"\r\n\|\r")` | `AssertionError: 1 != 2` |
| `test_stats_does_not_count_a_form_feed_as_a_line_break` | `re.compile(r"\r\n\|\r\|\n")` → `re.compile(r"\r\n\|\r\|\n\|\f")` | `AssertionError: 2 != 1` |
| `test_stats_does_not_count_a_unicode_line_separator_as_a_line_break` | `re.compile(r"\r\n\|\r\|\n")` → `re.compile(r"\r\n\|\r\|\n\|\u2028")` | `AssertionError: 2 != 1` |
| `test_stats_counts_an_empty_line_between_two_lines` | `segments = _LINE_BREAK.split(text)` → the empty segments are dropped | `AssertionError: 2 != 3` |
| `test_stats_trailing_newline_does_not_add_an_empty_line` | the "a trailing break ends the last line" branch removed | `AssertionError: 2 != 1` (subtest `ending='line feed'`) |
| `test_cli_counts_the_lines_of_a_file_with_crlf_endings` | the same branch removed | `AssertionError: 'chars: 5\nwords: 3\nlines: 4\n' != 'chars: 5\nwords: 3\nlines: 3\n'` |
| `test_stats_of_an_empty_text_has_zero_lines` | `if not text: return 0` → `return 1` | `AssertionError: 1 != 0` |
| `test_cli_prints_zeros_for_an_empty_file` | `if not text: return 0` → `return 1` | `AssertionError: 'chars: 0\nwords: 0\nlines: 1\n' != 'chars: 0\nwords: 0\nlines: 0\n'` |
| `test_stats_returns_a_dict_with_exactly_the_three_documented_keys` | a fourth key `bytes` added to the dict | `AssertionError: Items in the first set but not the second:` (the extra key) |
| `test_cli_prints_the_three_documented_lines` | `print(f"chars: …")` → `print(f"characters: …")` | `AssertionError: 'characters: 11\nwords: 2\nlines: 1\n' != 'chars: 11\nwords: 2\nlines: 1\n'` |
| `test_cli_prints_the_three_documented_lines` (second mutation) | the `words:` line is printed twice | `AssertionError: 'chars: 11\nwords: 2\nwords: 2\nlines: 1\n' != 'chars: 11\nwords: 2\nlines: 1\n'` |
| `test_cli_reads_the_file_as_utf8` | `encoding="utf-8"` → `encoding="latin-1"` | `AssertionError: 'chars: 16\nwords: 3\nlines: 1\n' != 'chars: 12\nwords: 3\nlines: 1\n'` |
| `test_cli_exits_zero_on_success` | `return EXIT_SUCCESS` → `return 1` | `AssertionError: 1 != 0` |
| `test_cli_prints_nothing_on_stdout_when_the_file_cannot_be_read` | the error line printed without `file=sys.stderr` | `AssertionError: 'textnorm: no such file: missing.txt\n' != ''` |
| `test_cli_writes_the_exact_stderr_line_when_the_file_cannot_be_read` (first mutation) | the error line printed without `file=sys.stderr` | `AssertionError: '' != 'textnorm: no such file: missing.txt\n'` |
| `test_cli_writes_the_exact_stderr_line_when_the_file_cannot_be_read` (second mutation) | `"no such file"` → `"cannot read"` | `AssertionError: 'textnorm: cannot read: missing.txt\n' != 'textnorm: no such file: missing.txt\n'` |
| `test_cli_exits_two_when_the_file_cannot_be_read` | `return EXIT_CANNOT_READ_FILE` → `return 1` | `AssertionError: 1 != 2` |
| `test_cli_echoes_the_path_exactly_as_it_was_given` (first mutation) | `"no such file"` → `"cannot read"` | `AssertionError: 'textnorm: cannot read: ./missing.txt\n' != 'textnorm: no such file: ./missing.txt\n'` |
| `test_cli_echoes_the_path_exactly_as_it_was_given` (second mutation) | `{args.file}` → `{Path(args.file).resolve()}` | `AssertionError: 'textnorm: no such file: C:\\Users\\…\\missing.txt\n' != 'textnorm: no such file: ./missing.txt\n'` |
| `test_cli_exits_two_when_the_file_is_not_valid_utf8` | `except (OSError, UnicodeDecodeError)` → `except OSError` | `AssertionError: 1 != 2` (the `UnicodeDecodeError` escapes, the process ends 1) |
| `test_cli_exits_two_when_the_path_is_a_directory` | `except (OSError, UnicodeDecodeError)` → `except FileNotFoundError` | `AssertionError: 1 != 2` (the `PermissionError` escapes, the process ends 1) |

---

## 4. What they found

### 4.1 Verdict per check

All 40 checks **pass** against `craft-arm\textnorm` (section 3.1, exit code 0), and all 40
were shown to fail against a broken copy (section 3.3). Verdict per group:

| Group | Checks | Verdict |
| --- | --- | --- |
| `normalize` clauses 1–5 | 1–14 | **met** — every clause behaves as the specification words it |
| `stats` keys, `chars`, `words`, `lines` | 15–26, 29 | **met** |
| `stats` `lines`, reading-dependent (form feed, U+2028) | 27–28 | **met** under the reading stated in [4.3](#43-two-reading-dependent-checks) |
| The command line | 30–40 | **met** — the three printed lines, both exit codes, the two streams and the exact wording |

### 4.2 Defects

**None found.** Nothing in the craft arm contradicts a clause of
`spec/textnorm-spec.md` that my checks cover. In particular the two places where a naive
implementation is usually wrong are correct here:

- the `lines` count is taken from the **original** text, not the normalised one (the CLI
  reads with `newline=""`, so a CRLF file is counted as it was written);
- a trailing newline does not add an empty line, and an empty text has zero lines.

### 4.3 Two reading-dependent checks

Checks 27 and 28 depend on how "the number of lines … split on universal newlines
(`\r\n`, `\r` and `\n` all count)" is read against clause 1 ("Every Unicode whitespace
character becomes a plain space"). The specification enumerates three line breaks and
makes every other Unicode whitespace character a plain space; a plain space does not start
a line, so a form feed and U+2028 are not line breaks. **The craft arm satisfies this
reading.** A reader who treats "universal newlines" as Python's `str.splitlines()` set
would instead expect 2 lines for both; the specification does not say which reading is
right, so the hidden comparison set may disagree. Flagged for the Coordinator: this is a
gap in the specification, not a defect in either arm.

### 4.4 The `tester/__init__.py` artefact

I own two files, but the briefed command cannot run without a third: `python -m unittest
discover -s tester -t .` requires the start directory to be an importable package on
Python 3.12. Without `tester/__init__.py` the command fails before any test runs:

```
ImportError: Start directory is not importable:
'C:\\Users\\leroy\\AppData\\Local\\Temp\\textnorm-mutation-harness\\discover-check\\tester'
```

(reproduced in a throwaway copy; exit code 1). The file I added is a docstring only and
holds no checks:

```python
"""The tester lane's checks for the craft-lab work item.

This package exists because ``python -m unittest discover -s tester -t .``
requires the start directory to be an importable package on Python 3.12;
without it the run fails with "Start directory is not importable".  It holds no
checks of its own.
"""
```

It also matches the convention already in the repository: both arms' own `tests/`
directories carry an `__init__.py`.

### 4.5 Gaps in the specification (not defects in the arm)

1. **The third public function is never named.** The specification says "A package
   `textnorm` with three public functions and a command line", but only `normalize` and
   `stats` are described. The craft arm exports `main` as the third. Because the
   specification does not name it or describe it, **no check asserts it** — I will not
   invent a requirement.
2. **`python -m textnorm` with no argument is not specified.** The command line clause
   only describes the file being read. The craft arm's argparse exits 2 with a usage
   message; the specification says nothing about it, so **no check asserts it**.
3. **"prints three lines"** — I read this as exactly the three lines shown, nothing
   before and nothing after. The stdout check pins the whole stdout string, so a fourth
   line fails it (demonstrated by the `L2-an-extra-line` mutation).

---

## 5. What I did not check — the boundary

| Not checked | Why |
| --- | --- |
| The arms' own `tests/` directories (the spec's "The tests" section, requirement R4) | R4 assigns that check to the Coordinator. Reading or running the craft arm's own tests would also have made my expectations no longer independent of the implementation. |
| The control arm | This lane's assignment is the craft arm only. |
| The hidden case set | It lives outside the repository (`D:\project\swarm-craft-lab-hidden\`) and belongs to the Coordinator; I did not read that directory. |
| The third public function | The specification does not name it — see [4.5](#45-gaps-in-the-specification-not-defects-in-the-arm). |
| `python -m textnorm` with no argument, with several arguments, or with `--help` | The specification is silent about them; argparse's behaviour is the implementer's choice, which the specification explicitly allows ("where it is silent, the implementer chooses and says so in the report"). |
| The **type** of the counts | The checks assert values (`stats("")["chars"] == 0`), not the type; a `bool` would satisfy them. The specification says "the number of characters", which implies an `int`. |
| Errors other than "cannot be read" | e.g. a file that cannot be decoded is covered (check 39); other `OSError` kinds (a locked file, a broken symlink, a permission denied) are not, and the specification does not distinguish them. |
| `stats` and `normalize` with a non-`str` argument | The signature says `text: str`; no check passes anything else. |
| Behaviour on other platforms | Everything was run on Windows 11 / CPython 3.12.14. The line-counting checks are platform-independent in principle (the CLI opens the file with `newline=""`), but only Windows was observed. |
| Performance, very large files, concurrent access, stdin | Out of the scope of a specification that says nothing about them; no timing or wall-clock is used anywhere in the checks. |
| `craft-arm\sample.txt` | The fixture is not mentioned by the specification; the checks build their own inputs instead. |
| The repository's own `__pycache__` directories | Left as they were, except the `tester\__pycache__` my own runs created, which I removed. No git command was run; the Lead commits. |

---

## 6. Reproducing this report

```powershell
# the suite, from D:\project\swarm-craft-lab
& "C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" -m unittest discover -s tester -t .
# -> Ran 40 tests ... OK      (exit code 0)

# the fail-on-purpose harness, from anywhere
& "C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" `
  "C:\Users\leroy\AppData\Local\Temp\textnorm-mutation-harness\harness.py" `
  "C:\Users\leroy\AppData\Local\Temp\textnorm-mutation-harness"
# -> CONTROL exit 0 / OK, mutations run: 43, all failed as expected: True
```

The harness writes its full record to
`C:\Users\leroy\AppData\Local\Temp\textnorm-mutation-harness\results.json`
(mutation, file, old text, new text, check, exit code, failing output per run).
