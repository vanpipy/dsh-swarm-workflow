# swarm-lab — Tester lane report (round R3)

Lane: Tester (`pytester`). Work item: `swarm-lab`, round R3 (the Tester round of
the swarm-lab test phase), repository `D:\project\swarm-lab-python`.

Requirement carriers read before starting:

- shared-board task `task-5` (revision 1 read → 2 claimed), read with `team_task_get`;
- durable file `D:\project\swarm-lab-python\.swarm\requirements\swarm-lab.md` (read in full, 133 lines).

Python used for every check below:
`C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe` (3.12.14).
No dependency was installed; nothing outside the repository was written; git was run read-only.

---

## 1. Carrier comparison — no disagreement on the assigned blocks

The R1, R2, R3, R4, R5, R7, R8 and R10 blocks in `task-5` and in the requirement file
carry the same requirement text, the same `check:` and the same `source:`. The requirement
file is richer in two places, and the file wins:

1. **R5** — the task says "prints a human-readable summary of the file's tokens"; the file
   (lines 62–65) spells out what the summary carries: "the total, the unique count and the
   five most frequent tokens". The tests use the file's wording.
2. **R6 and R9 exist in the file only.** `task-5` assigns no block for them. Acceptance
   criterion 4 of the task ("every `check:` in the task *and in the requirement file* is
   executed") puts both in scope for execution, so both checks were run and are reported
   below, marked as outside the assigned blocks.

## 2. Files created by this lane

| File | Purpose |
| --- | --- |
| `tests/test_text.py` | Clause tests for R1 (`TestNormalizeWs`) and R2 (`TestTokenize`). |
| `tests/test_stats.py` | Clause tests for R3 (`TestWordFrequency`). |
| `tests/test_report.py` | Clause tests for R4 (`TestSummarize`). |
| `tests/test_cli.py` | Clause tests for R5 (`TestSingleFileRun`) and R10 (`TestMultipleFileRun`). |
| `.swarm/reports/swarm-lab-tester.md` | This report. |

`tests/test_smoke.py` was **not** modified — its assertions were neither weakened nor
extended, because no check needed them. `swarmlab/` was not edited; the requirement file and
the decision files were not edited. The four files above are the only files this lane wrote.

## 3. Requirement verdicts

### R1 — `swarmlab.text.normalize_ws` → **met**

    requirement: `swarmlab.text.normalize_ws(text: str) -> str` returns the text with
        every run of whitespace collapsed to a single space and the ends stripped, and
        `""` for empty or whitespace-only input.
    check: `python -m unittest tests.test_text.TestNormalizeWs` passes, and the package
        exposes `swarmlab.text.normalize_ws` with that exact signature.
    source: the assignment — work item swarm-lab, round R2.

**Verdict: met.** Requirement file: `.swarm/requirements/swarm-lab.md:20-23` (requirement),
`:25-26` (check), `:27` (source).

Command and result (run from `D:\project\swarm-lab-python`):

    > & "C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" -m unittest tests.test_text.TestNormalizeWs -v
    test_empty_input_returns_an_empty_string ... ok
    test_ends_are_stripped ... ok
    test_order_of_the_remaining_characters_is_preserved ... ok
    test_runs_of_whitespace_collapse_to_one_space ... ok
    test_signature_is_the_required_one ... ok
    test_single_spaces_are_left_alone ... ok
    test_whitespace_only_input_returns_an_empty_string ... ok
    Ran 7 tests in 0.001s
    OK
    exit=0

The signature half of the check is asserted inside the suite by
`test_signature_is_the_required_one`, which compares `str(inspect.signature(...))` with the
literal string `"(text: str) -> str"`; the probe that fixed that literal:

    > & "...python.exe" -c "import inspect, swarmlab.text, swarmlab.stats, swarmlab.report; print(repr(str(inspect.signature(swarmlab.text.normalize_ws)))); ..."
    '(text: str) -> str'
    exit=0

Edge cases named by the requirement — empty input, whitespace-only input, runs of spaces,
tabs and newlines, stripped ends, preserved order — are each a separate assertion.

### R2 — `swarmlab.text.tokenize` → **met**

    requirement: `swarmlab.text.tokenize(text: str) -> list[str]` returns the lowercase
        word tokens of the text, in order, where a token is a maximal run of alphanumeric
        characters.
    check: `python -m unittest tests.test_text.TestTokenize` passes, and the package
        exposes `swarmlab.text.tokenize` with that exact signature.
    source: the assignment — work item swarm-lab, round R2.

**Verdict: met.** Requirement file: `:31-33` (requirement), `:35-36` (check), `:37` (source).

    > & "...python.exe" -m unittest tests.test_text.TestTokenize -v
    test_a_mixed_alphanumeric_run_is_one_token ... ok
    test_digits_are_tokens ... ok
    test_empty_input_returns_no_tokens ... ok
    test_punctuation_is_a_separator ... ok
    test_signature_is_the_required_one ... ok
    test_tokens_are_lowercase ... ok
    test_tokens_are_not_sorted ... ok
    test_tokens_keep_the_order_of_the_text ... ok
    test_underscore_is_a_separator ... ok
    test_whitespace_only_input_returns_no_tokens ... ok
    Ran 10 tests in 0.001s
    OK
    exit=0

The signature is asserted as `"(text: str) -> list[str]"` (same probe as R1, printed
`'(text: str) -> list[str]'`). The underscore separator is asserted explicitly
(`tokenize("a_b") == ["a", "b"]`, `tokenize("snake_case_name") == ["snake", "case", "name"]`),
as are empty and whitespace-only input.

### R3 — `swarmlab.stats.word_frequency` → **met**

    requirement: `swarmlab.stats.word_frequency(tokens: list[str]) -> list[tuple[str, int]]`
        returns one `(token, count)` pair per distinct token, sorted by count descending
        and then by token ascending, so the order is total and stable.
    check: `python -m unittest tests.test_stats.TestWordFrequency` passes, and the package
        exposes `swarmlab.stats.word_frequency` with that exact signature.
    source: the assignment — work item swarm-lab, round R2.

**Verdict: met.** Requirement file: `:41-43` (requirement), `:45-46` (check), `:47` (source).

    > & "...python.exe" -m unittest tests.test_stats.TestWordFrequency -v
    test_a_single_token_returns_one_pair ... ok
    test_counts_are_the_number_of_occurrences ... ok
    test_each_pair_is_a_token_count_tuple ... ok
    test_empty_input_returns_no_pairs ... ok
    test_equal_counts_are_ordered_by_token_ascending ... ok
    test_one_pair_per_distinct_token ... ok
    test_signature_is_the_required_one ... ok
    test_sorted_by_count_descending ... ok
    test_the_order_is_total_and_does_not_depend_on_the_input_order ... ok
    Ran 9 tests in 0.001s
    OK
    exit=0

The signature is asserted as `"(tokens: list[str]) -> list[tuple[str, int]]"` (probe printed
`'(tokens: list[str]) -> list[tuple[str, int]]'`). The count-descending order and the
token-ascending tie-break are asserted separately, and the order is asserted to be
independent of the order of the input list.

### R4 — `swarmlab.report.summarize` → **met**

    requirement: `swarmlab.report.summarize(tokens: list[str]) -> dict[str, object]` returns
        a mapping with the keys `total` (the number of tokens), `unique` (the number of
        distinct tokens) and `top` (the five most frequent `(token, count)` pairs, or all
        of them when fewer than five distinct tokens exist).
    check: `python -m unittest tests.test_report.TestSummarize` passes, and the package
        exposes `swarmlab.report.summarize` with that exact signature.
    source: the assignment — work item swarm-lab, round R2.

**Verdict: met.** Requirement file: `:51-54` (requirement), `:56-57` (check), `:58` (source).

    > & "...python.exe" -m unittest tests.test_report.TestSummarize -v
    test_signature_is_the_required_one ... ok
    test_the_result_is_a_mapping_with_exactly_the_required_keys ... ok
    test_top_agrees_with_the_frequency_order ... ok
    test_top_holds_all_the_pairs_when_fewer_than_five_distinct_tokens_exist ... ok
    test_top_holds_the_five_most_frequent_pairs ... ok
    test_top_is_empty_when_there_are_no_tokens ... ok
    test_top_is_ordered_by_count_descending_then_token_ascending ... ok
    test_total_is_the_number_of_tokens ... ok
    test_unique_is_the_number_of_distinct_tokens ... ok
    Ran 9 tests in 0.001s
    OK
    exit=0

The signature is asserted as `"(tokens: list[str]) -> dict[str, object]"` (probe printed
`'(tokens: list[str]) -> dict[str, object]'`). The "fewer than five distinct tokens" case is
asserted as a case of its own (`summarize(["a", "b", "a"])["top"] == [("a", 2), ("b", 1)]`),
and the five-pair cap with a six-distinct-token input.

### R5 — `python -m swarmlab <file>` → **met**

    requirement: `python -m swarmlab <file>` prints a human-readable summary of the file's
        tokens — the total, the unique count and the five most frequent tokens — and exits
        with status `0`. A missing file prints the message
        `swarmlab: no such file: <path>` on standard error and exits with status `2`.
    check: `python -m swarmlab tests/fixtures/sample.txt` exits `0` and prints the
        summary; `python -m swarmlab does-not-exist.txt` exits `2` and prints the
        message on stderr.
    source: the assignment — work item swarm-lab, round R2.

**Verdict: met.** Requirement file: `:62-65` (requirement), `:67-68` (check), `:70` (source).

    > & "...python.exe" -m swarmlab tests/fixtures/sample.txt
    file: tests/fixtures/sample.txt
    total: 16
    unique: 11
    top tokens:
      the: 4
      dog: 2
      fox: 2
      and: 1
      barks: 1
    exit=0

    > & "...python.exe" -m swarmlab does-not-exist.txt
    swarmlab: no such file: does-not-exist.txt
    exit=2

The exit status, the three summary fields and the five most frequent tokens are all in the
output; the missing-file message is on stderr (the command above shows it because PowerShell
merges the streams; the separation is asserted in the suite —
`test_a_missing_file_exits_two_with_the_message_on_stderr` compares `result.stderr.strip()`
with the exact message, and `test_a_missing_file_prints_nothing_on_stdout` asserts
`result.stdout == ""`).

### R6 — every public function is annotated (outside the assigned blocks; check executed) → **met**

    requirement: Every public function in `swarmlab` carries a parameter annotation and a
        return annotation, and every public module carries a module docstring.
    check: `python tools/quality_report.py --json` reports `annotation_coverage` of `1.0`
        and `docstring_coverage` of `1.0` over the public surface.
    source: the assignment — work item swarm-lab, quality requirement.

**Verdict: met** — the check was executed because it shares the command with R7 and
acceptance criterion 4 of `task-5` asks for every check in the requirement file to run.
Requirement file: `:74-75` (requirement), `:77-78` (check), `:79` (source).

    > & "...python.exe" tools/quality_report.py --json
    {
      "annotation_coverage": 1.0,
      "avg_function_length": 5.6,
      "docstring_coverage": 1.0,
      "duplicate_line_ratio": 0.0,
      "max_function_length": 14,
      "max_nesting_depth": 2,
      "module_docstring_coverage": 1.0,
      "package_modules": 5,
      "public_function_names": ["main", "normalize_ws", "summarize", "tokenize", "word_frequency"],
      "public_functions": 5,
      "public_functions_without_tests": [],
      "public_functions_without_tests_count": 0,
      "test_functions": 51
    }
    exit=0

`annotation_coverage` is `1.0` and `docstring_coverage` is `1.0` over the five public
functions of the five package modules. The Developer's report already covers R6; this lane
re-ran the check and confirms the numbers.

### R7 — every public function is tested → **met**

    requirement: Every public function in `swarmlab` is exercised by at least one test case
        in the `tests` package, and the whole suite passes.
    check: `python -m unittest discover -s tests -t .` exits `0`, and
        `python tools/quality_report.py --json` reports `public_functions_without_tests`
        as `0`.
    source: the assignment — work item swarm-lab, quality requirement.

**Verdict: met.** Requirement file: `:83-84` (requirement), `:86-88` (check), `:89` (source).

    > & "...python.exe" -m unittest discover -s tests -t . -v
    ... 54 test lines, every one "ok" ...
    Ran 54 tests in 1.467s
    OK
    exit=0

    > & "...python.exe" tools/quality_report.py --json
    "public_functions_without_tests": [],
    "public_functions_without_tests_count": 0
    exit=0

Both halves of the check hold: the whole suite exits `0` with 54 tests, and the instrument
reports no public function without a test. The five public functions (`main`,
`normalize_ws`, `summarize`, `tokenize`, `word_frequency`) are each called by a test case in
this lane's files, not merely named: `normalize_ws`/`tokenize` in `tests/test_text.py`,
`word_frequency` in `tests/test_stats.py`, `summarize` in `tests/test_report.py`, `main`
through `python -m swarmlab` in `tests/test_cli.py` (and directly in `tests/test_smoke.py`).

Note on the instrument: `test_functions` reports **51** while the suite runs **54** tests.
The instrument counts *unique test names* across the `tests` package, and
`test_signature_is_the_required_one` is the same name in four files — so the count is a
property of the instrument, not a missing test. The suite output is the authority for the
number of executed tests.

### R8 — no import-time side effects → **met**

    requirement: Importing `swarmlab` or any of its submodules performs no I/O, prints
        nothing and exits no process. The package is importable from a directory other than
        the repository root.
    check: `python -c "import swarmlab"` exits `0` and prints nothing, and the same holds
        for `swarmlab.text`, `swarmlab.stats` and `swarmlab.report`.
    source: the assignment — work item swarm-lab, quality requirement.

**Verdict: met.** Requirement file: `:93-95` (requirement), `:97-98` (check), `:99` (source).

From the repository root:

    > & "...python.exe" -c "import swarmlab"
    swarmlab        -> exit=0 output=[]
    swarmlab.text   -> exit=0 output=[]
    swarmlab.stats  -> exit=0 output=[]
    swarmlab.report -> exit=0 output=[]

From another directory (`D:\project`, with `PYTHONPATH=D:\project\swarm-lab-python`, because
the package is not installed on this host and nothing may be installed):

    swarmlab        -> exit=0 output=[]
    swarmlab.text   -> exit=0 output=[]
    swarmlab.stats  -> exit=0 output=[]
    swarmlab.report -> exit=0 output=[]

Additionally, importing the entry-point module runs nothing either:

    > & "...python.exe" -c "import swarmlab.__main__"
    swarmlab.__main__ -> exit=0 output=[]

The same four imports are asserted as subprocess checks inside the suite
(`tests/test_smoke.py::TestImportSideEffects`), which also asserts that stdout **and**
stderr are empty.

### R9 — the behaviour must not change during remediation (outside the assigned blocks) → **not demonstrated**

    requirement: The public behaviour defined by R1 to R5 must not change while the review
        findings of round R4 are remediated. A change that alters an observable result is a
        defect, not an improvement.
    check: the test files from round R3 are unchanged in their assertions
        (`git diff --stat -- tests` is empty between the round-R3 commit and the
        remediation commit), and the suite still exits `0`.
    source: the behaviour that must not change — R1 to R5.

**Verdict: not demonstrated.** Requirement file: `:103-105` (requirement), `:107-109`
(check), `:110` (source).

The check was executed and it cannot be satisfied at this point of the round — neither
commit it compares exists yet:

    > & "C:\Program Files\Git\cmd\git.exe" diff --stat -- tests
    exit=0            (no output)

    > & "C:\Program Files\Git\cmd\git.exe" log --oneline
    6735104 round R2: the swarmlab package implements R1-R8
    120483e baseline: requirement set, quality instrument, empty package

    > & "C:\Program Files\Git\cmd\git.exe" status --short
     M .swarm/requirements/swarm-lab.md
     M swarmlab/__main__.py
    ?? .swarm/decisions/2026-11-11-cli-multiple-files.md
    ?? .swarm/decisions/2026-11-11-worktree-boundary.md
    ?? .swarm/reports/swarm-lab-r9-primitives.md
    ?? tests/test_cli.py
    ?? tests/test_report.py
    ?? tests/test_stats.py
    ?? tests/test_text.py

HEAD is still the round-R2 commit `6735104`; the Lead commits each round, so the round-R3
commit and the round-R4 remediation commit do not exist yet. The empty `git diff --stat --
tests` is therefore **not** evidence for R9: the four test files are untracked, so the diff
is trivially empty for them. The second half of the check (the suite still exits `0`) does
hold — see R7. R9 becomes checkable after the Lead commits round R3 and the remediation
lands; this lane must not weaken the round-R3 assertions to make that comparison pass.

### R10 — the command line summarises several files → **met**

    requirement: `python -m swarmlab <file> [<file> …]` prints one summary block per file,
        in the order the files were given, and exits with status `0` when every file exists.
        The first file that does not exist stops the run: the message
        `swarmlab: no such file: <path>` goes to standard error, the run exits with status
        `2`, and the summaries printed before it stay on standard output.
    check: `python -m swarmlab tests/fixtures/sample.txt tests/fixtures/sample.txt`
        exits `0` and prints two summary blocks in the order given;
        `python -m swarmlab tests/fixtures/sample.txt does-not-exist.txt` exits `2`,
        prints the summary of the first file on stdout and the message on stderr.
    source: the human decision of 2026-11-11 — "one summary per file"
        (`.swarm/decisions/2026-11-11-cli-multiple-files.md`).

**Verdict: met.** Requirement file: `:114-118` (requirement), `:120-123` (check), `:125`
(source).

    > & "...python.exe" -m swarmlab tests/fixtures/sample.txt tests/fixtures/sample.txt
    file: tests/fixtures/sample.txt
    total: 16
    unique: 11
    top tokens:
      the: 4
      dog: 2
      fox: 2
      and: 1
      barks: 1
    file: tests/fixtures/sample.txt
    total: 16
    unique: 11
    top tokens:
      the: 4
      dog: 2
      fox: 2
      and: 1
      barks: 1
    exit=0

    > & "...python.exe" -m swarmlab tests/fixtures/sample.txt does-not-exist.txt
    exit=2
    [stdout] file: tests/fixtures/sample.txt / total: 16 / unique: 11 / top tokens: ...
    [stderr] swarmlab: no such file: does-not-exist.txt

The stdout/stderr separation of the second command, captured explicitly:

    > & "...python.exe" -c "import subprocess,sys; r=subprocess.run([sys.executable,'-m','swarmlab','tests/fixtures/sample.txt','does-not-exist.txt'],capture_output=True,text=True); print('returncode=',r.returncode); print('stdout=',repr(r.stdout)); print('stderr=',repr(r.stderr))"
    returncode= 2
    stdout= 'file: tests/fixtures/sample.txt\ntotal: 16\nunique: 11\ntop tokens:\n  the: 4\n  dog: 2\n  fox: 2\n  and: 1\n  barks: 1\n'
    stderr= 'swarmlab: no such file: does-not-exist.txt\n'

The suite carries the same behaviour in `tests/test_cli.py::TestMultipleFileRun` — two
summary blocks for two files, the blocks in the order the files were given (checked with
two temporary files of different content, and again with the arguments reversed), the first
missing file stopping the run with the earlier summary still on stdout, and only the first
missing file being reported.

**Timeline note.** The first probe of this lane, before the test files were written, ran
against the single-file implementation and failed:

    > & "...python.exe" -m swarmlab tests/fixtures/sample.txt tests/fixtures/sample.txt
    [stderr] usage: python -m swarmlab <file>
    exit=2

The Developer landed the multi-file implementation (`swarmlab/__main__.py`, owned by
`pydev`, board task-6) while this lane was writing the test files. Every command quoted
above for R10 was run **after** that landing, against the implementation now in the tree
(`swarmlab/__main__.py:33-46` — `main` loops over the given paths, `_print_summary` prints
one block per file, the first unreadable path returns `2`).

## 4. Suite status

    > & "...python.exe" -m unittest discover -s tests -t . -v
    Ran 54 tests in 1.467s
    OK
    exit=0

54 tests, 0 failures, 0 errors, 0 skipped — 9 from `tests/test_smoke.py` (Developer-owned,
untouched), 7 + 10 from `tests/test_text.py`, 9 from `tests/test_stats.py`, 9 from
`tests/test_report.py`, 10 from `tests/test_cli.py`.

## 5. Limitations, assumptions and risks

1. **The CLI output format is assumed, not required.** `tests/test_cli.py` asserts
   `total: 16`, `unique: 11` and `the: 4` for the fixture, and that each file's path
   appears in its block. The requirement file fixes the *content* of the summary (R5,
   lines 62–65) but not its wording, and R10 does not say the path must be printed. These
   assertions hold against the implementation in the tree and against the single-file
   contract the decision document keeps unchanged; if a later round changes the wording,
   those two test methods fail and the wording has to be reconciled with the requirement
   before the change is accepted. The requirement-level claims (exit status, one block per
   file, order, stream separation) are asserted independently of the wording.
2. **R9 cannot be checked in this round** — the round-R3 commit does not exist yet (the
   Lead commits each round). This lane's test files must not be changed in the remediation
   round, or the comparison the requirement asks for is destroyed.
3. **"Importable from another directory" needs the repository root on `sys.path`.** The
   package is not installed on this host and nothing may be installed, so the check runs
   from `D:\project` with `PYTHONPATH=D:\project\swarm-lab-python`. The literal form of the
   check (`python -c "import swarmlab"` from the repository root) is also run and passes.
4. **The quality instrument's `test_functions` count (51) is lower than the number of
   executed tests (54)** because it counts unique test names and
   `test_signature_is_the_required_one` is repeated in four files. The instrument is not
   wrong, but a reader should not read 51 as "51 tests ran".
5. **`tests/test_smoke.py` was left untouched.** The R5 and R8 coverage in this lane's
   `tests/test_cli.py` is deliberately independent of the smoke file (it runs the module as
   a subprocess rather than calling `main` in-process), so a failure in one does not mask
   the other.
6. **The two temporary-file tests write to the system temp directory** (`tempfile.
   TemporaryDirectory()`), not into the repository, so no file outside this lane's write
   scopes was created.
7. **Nothing was committed.** git was used read-only (`log`, `status`, `diff --stat`);
   the Lead owns the commits.
