# Public API lane — swarmlab (round R7)

Requirement carrier: `D:\project\swarm-lab-python\.swarm\requirements\swarm-lab.md`
(Lines cited below refer to that file.)
Lane scope: R1, R2, R3, R4, R8 — the public API surface of `swarmlab`.

Interpreter used for every command (there is no `python` on PATH):

    $py = "C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
    & $py -VV
    Python 3.12.14 (main, Sep  1, 2026, 14:17:39) [MSC v.1944 64 bit (AMD64)]

All commands were run from the repo root `D:\project\swarm-lab-python` unless the
command states another working directory.

## What this lane checked

1. **Exact public signatures** of `normalize_ws`, `tokenize`, `word_frequency` and
   `summarize`, taken from a live `inspect.signature` call — not from reading the
   source, and not only from the clause tests.
2. **Type-annotation completeness and correctness** — parameter and return
   annotations on every public function, plus an AST scan of the whole package.
3. **Package layout** — `swarmlab/__init__.py`, `text.py`, `stats.py`, `report.py`,
   `__main__.py` exist, carry module docstrings, and are the complete public
   module set.
4. **`__all__`** — whether it matches what the package actually exports, checked
   both against the package namespace and against a real `from swarmlab import *`.
5. **Import side effects (R8)** — every module imported in a fresh interpreter
   from the repo root and from `D:\project` with `PYTHONPATH` set; stdout and
   stderr measured separately; an audit hook installed before the import to catch
   file I/O, subprocess spawns and socket activity during import.

## Findings

### Non-blocking 1 — `swarmlab/__init__.py:2` eagerly imports every submodule

`swarmlab/__init__.py:2` is `from . import report, stats, text`, so
`import swarmlab` transitively loads `re` (via `text.py:2`) and `collections`
(via `stats.py:2`) even when the caller only wants `swarmlab.text`. This is not
an R8 violation — the import is silent and side-effect-free — and it is what
makes the `"report"`, `"stats"` and `"text"` entries of `__all__` valid attribute
exports, so it is consistent with the package's own contract. It is recorded as
an observation only: a caller who imports `swarmlab` for one helper pays for the
whole package.

Evidence — `python -c "import swarmlab; import sys; print(sorted(m for m in sys.modules if m.startswith('swarmlab')))"`
plus the AST scan of module-level statements:

    __init__.py module-level statements: ["__all__ = ['normalize_ws', 'report', 'stats', 'summarize', 'text', 'tokenize', 'word_frequency']"]
    __main__.py module-level statements: ["CONTROL:if __name__ == '__main__':\n    sys.exit(main())"]
    report.py module-level statements: []
    stats.py module-level statements: []
    text.py module-level statements: ["_TOKEN_PATTERN = re.compile('[^\\W_]+')"]

### Non-blocking 2 — `swarmlab/__main__.py:33` uses a PEP 604 union in a runtime-evaluated annotation, and the repo declares no minimum Python version

`swarmlab/__main__.py:33` is `def main(argv: list[str] | None = None) -> int:`.
The module has no `from __future__ import annotations`, so the annotation is
evaluated at import time; `list[str] | None` is a PEP 604 union, which the
language reference restricts to Python 3.10 and later. The other public
annotations (`list[str]`, `dict[str, object]`, `list[tuple[str, int]]`) require
Python 3.9 or later. The repository has no `pyproject.toml`, `setup.py` or
`setup.cfg`, so the supported floor is undocumented. This was verified only on
the interpreter available here (3.12.14); no 3.9 or 3.10 interpreter was
available to demonstrate the failure. It does not affect R1–R4 or R8, which are
all met on 3.12.

Evidence — the live signature and the annotation objects:

    swarmlab.__main__ imported, main signature: (argv: list[str] | None = None) -> int
    ann text.normalize_ws {'text': <class 'str'>, 'return': <class 'str'>}
    ann text.tokenize {'text': <class 'str'>, 'return': list[str]}
    ann stats.word_frequency {'tokens': list[str], 'return': list[tuple[str, int]]}
    ann report.summarize {'tokens': list[str], 'return': dict[str, object]}

Evidence — no packaging metadata in the repository:

    Get-ChildItem -Recurse -Force -File D:\project\swarm-lab-python
    D:\project\swarm-lab-python\.gitignore
    D:\project\swarm-lab-python\README.md
    ... (no pyproject.toml, setup.py or setup.cfg)

### Out of scope 1 — the repository gained an untracked file during this lane's run

`git status --porcelain` reports `?? tools/quality_compare.py` (5357 bytes,
LastWriteTime 2026-11-11 09:03:43). This lane is read-only over the code and
created no file other than this report; the file appeared while the lane was
running and belongs to a concurrent lane. It is reported because the acceptance
baseline is a moving target: a lane that diffs the tree mid-round will see a
file that no commit carries.

Evidence:

    --- git status (confirm read-only) ---
    ?? tools/quality_compare.py
    Name                Length LastWriteTime
    ----                ------ -------------
    host_prompt_probe.mjs   7547 11/10/2026 11:59:44 PM
    quality_compare.py      5357 11/11/2026  9:03:43 AM
    quality_report.py       6948 11/10/2026 11:57:45 PM

### Out of scope 2 — the console encoding of this host cannot print non-ASCII tokens (R5/R10 territory, not this lane)

The default stdout encoding of this host's console is GBK (cp936), which cannot
encode Latin-1 accented letters. `swarmlab/__main__.py:24-29` prints token
text directly, so a file whose tokens contain such characters would raise
`UnicodeEncodeError` on this host. The mechanism is demonstrated below; the
end-to-end CLI consequence is **not demonstrated**, because exercising it would
require a non-ASCII fixture file and this lane may create only this report.

Evidence — printing a token with an accented character on this console:

    UnicodeEncodeError: 'gbk' codec can't encode character '\xf6' in position 30: illegal multibyte character

Evidence — the same encoding boundary is why the CLI's own usage message renders
as replacement characters in the captured output above (`usage: python -m swarmlab
<file> [<file> ��]`), while the exit status is still correct:

    & $py -m swarmlab
    usage: python -m swarmlab <file> [<file> …]
    EXIT=2

No Blocking or Material findings were raised against R1, R2, R3, R4 or R8.

## Requirement verdicts

### R1 — `swarmlab.text.normalize_ws` — **met**

Requirement: `swarmlab.text.normalize_ws(text: str) -> str` collapses every run
of whitespace to a single space, strips the ends, preserves the order of the
remaining characters, and returns `""` for empty or whitespace-only input
(`.swarm/requirements/swarm-lab.md:18-27`).

Evidence — the clause test and the live signature:

    & $py -m unittest tests.test_text.TestNormalizeWs -v
    test_empty_input_returns_an_empty_string ... ok
    test_ends_are_stripped ... ok
    test_order_of_the_remaining_characters_is_preserved ... ok
    test_runs_of_whitespace_collapse_to_one_space ... ok
    test_signature_is_the_required_one ... ok
    test_single_spaces_are_left_alone ... ok
    test_whitespace_only_input_returns_an_empty_string ... ok
    Ran 7 tests in 0.001s
    OK
    EXIT=0

    swarmlab.text.normalize_ws(text: str) -> str
    module-level swarmlab.normalize_ws(text: str) -> str
    ann text.normalize_ws {'text': <class 'str'>, 'return': <class 'str'>}

The signature string matches the requirement character for character
(`(text: str) -> str`), the same function is reachable at the package level with
the identical signature, and both the parameter and the return annotation are
present.

### R2 — `swarmlab.text.tokenize` — **met**

Requirement: `swarmlab.text.tokenize(text: str) -> list[str]` returns the
lowercase word tokens in order, a token being a maximal run of alphanumeric
characters (`.swarm/requirements/swarm-lab.md:29-37`).

Evidence:

    & $py -m unittest tests.test_text.TestTokenize -v
    ... 10 tests, all ok ...
    Ran 10 tests in 0.001s
    OK
    EXIT=0

    swarmlab.text.tokenize(text: str) -> list[str]
    module-level swarmlab.tokenize(text: str) -> list[str]
    ann text.tokenize {'text': <class 'str'>, 'return': list[str]}

The clause test covers lowercasing, order preservation, punctuation and
underscore as separators, digits, mixed alphanumeric runs, and empty and
whitespace-only input. The "maximal run of alphanumeric characters" wording is
matched by the implementation's `[^\W_]+` pattern (Python's `\w` is
`str.isalnum()` plus underscore; the pattern removes the underscore) — probed
live on non-ASCII letters:

    tokenize unicode: ['héllo', 'wörld', '42']
    tokenize accents: ['naïve', 'café']

### R3 — `swarmlab.stats.word_frequency` — **met**

Requirement: `swarmlab.stats.word_frequency(tokens: list[str]) -> list[tuple[str, int]]`
returns one pair per distinct token, sorted by count descending then token
ascending, so the order is total and stable
(`.swarm/requirements/swarm-lab.md:39-47`).

Evidence:

    & $py -m unittest tests.test_stats.TestWordFrequency -v
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
    EXIT=0

    swarmlab.stats.word_frequency(tokens: list[str]) -> list[tuple[str, int]]
    module-level swarmlab.word_frequency(tokens: list[str]) -> list[tuple[str, int]]
    ann stats.word_frequency {'tokens': list[str], 'return': list[tuple[str, int]]}

### R4 — `swarmlab.report.summarize` — **met**

Requirement: `swarmlab.report.summarize(tokens: list[str]) -> dict[str, object]`
returns a mapping with `total`, `unique` and `top` (the five most frequent
pairs, or all of them when fewer than five distinct tokens exist)
(`.swarm/requirements/swarm-lab.md:49-58`).

Evidence:

    & $py -m unittest tests.test_report.TestSummarize -v
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
    EXIT=0

    swarmlab.report.summarize(tokens: list[str]) -> dict[str, object]
    module-level swarmlab.summarize(tokens: list[str]) -> dict[str, object]
    ann report.summarize {'tokens': list[str], 'return': dict[str, object]}

### R8 — no import-time side effects — **met**

Requirement: importing `swarmlab` or any of its submodules performs no I/O,
prints nothing and exits no process; the package is importable from a directory
other than the repository root (`.swarm/requirements/swarm-lab.md:91-99`).

Evidence — from the repo root, stdout and stderr measured separately, each in
its own fresh interpreter:

    MODULE=swarmlab stdout_len=0 stderr_len=0 exit_stdout_run=0 exit_stderr_run=0
    MODULE=swarmlab.text stdout_len=0 stderr_len=0 exit_stdout_run=0 exit_stderr_run=0
    MODULE=swarmlab.stats stdout_len=0 stderr_len=0 exit_stdout_run=0 exit_stderr_run=0
    MODULE=swarmlab.report stdout_len=0 stderr_len=0 exit_stdout_run=0 exit_stderr_run=0

Evidence — from `D:\project` (not the repository root) with
`PYTHONPATH=D:\project\swarm-lab-python`:

    FROM_D_PROJECT PYTHONPATH MODULE=swarmlab stdout_len=0 stderr_len=0 exit_stdout_run=0 exit_stderr_run=0
    FROM_D_PROJECT PYTHONPATH MODULE=swarmlab.text stdout_len=0 stderr_len=0 exit_stdout_run=0 exit_stderr_run=0
    FROM_D_PROJECT PYTHONPATH MODULE=swarmlab.stats stdout_len=0 stderr_len=0 exit_stdout_run=0 exit_stderr_run=0
    FROM_D_PROJECT PYTHONPATH MODULE=swarmlab.report stdout_len=0 stderr_len=0 exit_stdout_run=0 exit_stderr_run=0
    --- cwd check ---
    D:\project

Evidence — the imports are also warning-free:

    & $py -W error -c "import swarmlab, swarmlab.text, swarmlab.stats, swarmlab.report"
    EXIT=0

Evidence — an audit hook installed *before* the import records every `open`,
`os.open`, `subprocess.Popen`, `os.system` and socket event during the import.
The only events are the interpreter's own bytecode-cache reads; there is no
package-level data-file I/O, no process spawn and no socket:

    AUDIT_EVENTS_DURING_IMPORT: ["open ('D:\\project\\swarm-lab-python\\swarmlab\\__pycache__\\__init__.cpython-312.pyc', 'r', 32896)", "open ('D:\\project\\swarm-lab-python\\swarmlab\\__pycache__\\report.cpython-312.pyc', 'r', 32896)", "open ('D:\\project\\swarm-lab-python\\swarmlab\\__pycache__\\stats.cpython-312.pyc', 'r', 32896)", "open ('C:\\Users\\leroy\\.dsh\\...\\collections\\__pycache__\\__init__.cpython-312.pyc', 'r', 32896)", ... "open ('C:\\Users\\leroy\\.dsh\\...\\__pycache__\\copyreg.cpython-312.pyc', 'r', 32896)"]

Every `.pyc` path above is a CPython `__pycache__` artifact read by the import
machinery itself, not by package code; the static AST scan above confirms the
package's own module-level statements are only an import line, a compiled
regular expression, an `__all__` assignment and the `if __name__ == '__main__'`
guard in `__main__.py`.

## Package layout, `__all__` and annotation coverage (supporting checks)

The required layout is present and complete — five modules, each with a module
docstring:

    swarmlab/__init__.py
    swarmlab/text.py
    swarmlab/stats.py
    swarmlab/report.py
    swarmlab/__main__.py

    __init__ module docstring: 'swarmlab: a small text-analysis package used as a workflow test bed.'
    text module docstring: 'Text normalization and tokenization helpers.'
    stats module docstring: 'Frequency statistics over token lists.'
    report module docstring: 'Summary reporting over token lists.'
    __main__ module docstring: 'Command line entry point that summarises the tokens of one or more text files.'

`__all__` matches the package's public surface exactly — no missing entry, no
undeclared public name, and a real star-import yields exactly the same set:

    public names in swarmlab namespace: ['normalize_ws', 'report', 'stats', 'summarize', 'text', 'tokenize', 'word_frequency']
    __all__: ['normalize_ws', 'report', 'stats', 'summarize', 'text', 'tokenize', 'word_frequency']
    __all__ entries missing from package: []
    public names NOT in __all__: []
    star-import names: ['normalize_ws', 'report', 'stats', 'summarize', 'text', 'tokenize', 'word_frequency']
    matches __all__: True

Annotation coverage over the public surface (supporting R1–R4, not assigned to
this lane but quoted as corroboration):

    & $py tools/quality_report.py --json
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
    EXIT=0

Whole-suite status at the time of this lane (context only; R7 belongs to
another lane):

    & $py -m unittest discover -s tests -t .
    Ran 54 tests in 1.143s
    OK
    EXIT=0

## Not checked (and why)

- **R5, R6, R7, R9, R10** — not assigned to this lane; their verdicts belong to
  other lanes. The suite run and the quality report above are quoted as context
  only, not as a verdict for those requirements.
- **Minimum-Python-version compatibility below 3.12** — only the 3.12.14
  interpreter at
  `C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe`
  exists on this host, so the PEP 604 annotation concern above could not be
  demonstrated on 3.9 or 3.10. It is reported as a documentation gap, not as an
  observed failure.
- **End-to-end CLI behaviour with non-ASCII tokens** — would require creating a
  non-ASCII fixture file, which this read-only lane may not do (only this report
  may be created). The console-encoding mechanism is demonstrated; the CLI
  consequence is not.
- **Runtime behaviour of `swarmlab.__main__` under a non-default locale or
  encoding** — only this host's default (GBK/cp936) console was available.
- **`swarmlab` behaviour under a concurrent write to the tree** — another lane
  created `tools/quality_compare.py` during this run (see finding "Out of scope
  1"); the package sources themselves were not modified during the lane, so the
  results above reflect commit `0c0f566` plus that unrelated untracked file.

## Suggested remediation (concrete, minimal)

None is required for R1, R2, R3, R4 or R8 — all five are met with executing
evidence. The two non-blocking observations are optional hygiene:

1. **Document the Python floor (one line).** Add a `requires-python` floor to
   the README, or add `from __future__ import annotations` to
   `swarmlab/__main__.py:2` so the `list[str] | None` annotation in
   `swarmlab/__main__.py:33` is not evaluated at import time. The first option
   is one line and matches the requirement set (which says nothing about a
   version floor); the second changes runtime behaviour of the annotation
   objects and would need the clause tests re-run.
2. **Optional: lazy submodule loading.** If import cost matters, replace
   `swarmlab/__init__.py:2-5` with PEP 562 `__getattr__`-based lazy loading.
   This is *not* recommended here: `__all__` advertises `"report"`, `"stats"`
   and `"text"` as package exports, and `tests/test_smoke.py:54-57` asserts
   `swarmlab.text is sys.modules["swarmlab.text"]`, which the eager imports
   satisfy. Making it lazy would break that test for no requirement gain.
