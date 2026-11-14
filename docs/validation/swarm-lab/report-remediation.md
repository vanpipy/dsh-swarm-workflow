# Round R4b remediation — the quality instrument

Lane: Remediation (`pyfix`), round R4b.
Board task: `task-10` — *Remediate the round-R4 findings in the quality instrument (round R4b)*.
Source of the work: `.swarm/reports/swarm-lab-reviewer.md` sections 2 and 5 (F1, F2, F3, F6, F7, F8).

`task-10` requires: the round-R4 must-fix findings are remediated and the remediation commit
that R9 needs is produced; F1 becomes a real call-site check; F2 stops reporting a fully
annotated method as unannotated; the suite still exits 0 with the same 54 tests; the CLI wording
and every file under `tests/` are untouched; the remediation commit id is recorded together with
the empty output of `git diff --stat cb51065 <remediation commit> -- tests`; and the quality
comparison is re-measured with the fixed instrument for **both** arms.

Everything below was produced in `D:\project\swarm-lab-python` with Python 3.12.14
(`C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe`) and git
from `C:\Program Files\Git\cmd\git.exe`. All command output quoted in this report is verbatim.

---

## 1. The fixes

### F1 (MATERIAL) — `public_functions_without_tests` is now a call-site check

`tools/quality_report.py:149` (pre-fix) read

```python
tested = {name for name in names if name in test_sources()}
```

— a substring test of the function name against the concatenated **text** of every file under
`tests/`. A public function that no test calls still counted as tested as soon as a comment
mentioned its name.

The fix, in `tools/quality_report.py`:

- `tools/quality_report.py:92-107` — `test_names()` became `test_inventory() -> tuple[set[str], int]`
  (the F3 change rides along here): it still collects the distinct test-function names and now
  also counts the test `FunctionDef` occurrences.
- `tools/quality_report.py:110-129` — the old `test_sources()` (pre-fix `:102-106`) is gone; the
  new `called_names() -> set[str]` parses every file under `tests/` with `ast` and collects the
  names that are actually **called**: `func.id` for an `ast.Name` callee and `func.attr` for an
  `ast.Attribute` callee. Both call forms count, so `normalize_ws(...)` and
  `swarmlab.text.normalize_ws(...)` are equivalent.
- `tools/quality_report.py:172` — `tested = names & called_names()`.

### F2 (MATERIAL) — the `self`/`cls` exemption is reachable

`tools/quality_report.py:60-63` (pre-fix) had the exemption *below* the annotation check, so it
could never execute:

```python
if argument.annotation is None:
    return False
if index == 0 and argument.arg in {"self", "cls"}:
    continue
```

`tools/quality_report.py:59-64` (post-fix) has the exemption first:

```python
for index, argument in enumerate(parameters):
    if index == 0 and argument.arg in {"self", "cls"}:
        continue
    if argument.annotation is None:
        return False
```

### F3 (optional) — `test_cases`

- `tools/quality_report.py:173` — `tests, test_cases = test_inventory()`.
- `tools/quality_report.py:189` — the report field `"test_cases": test_cases`.
- `tools/quality_report.py:208` — the rendered line `  test cases                 : {report['test_cases']}`.
- `test_functions` is unchanged: it still counts distinct test-function names (51).

### F6 — Python floor

- `README.md:44-48` — a new `## Requirements` section: the package requires Python 3.10 or
  newer, because `list[str] | None` in `swarmlab/__main__.py:33` is PEP 604 and is evaluated at
  runtime (no module uses `from __future__ import annotations`).

### F7 — the instrument's public surface

- `README.md:33-36` — the instrument's "public surface" is every non-underscore function in the
  package, which includes the CLI entry point `main`; the package deliberately does not export
  `main` in `swarmlab.__all__` because importing `swarmlab.__main__` from `swarmlab/__init__.py`
  would be a circular import.

### F8 — the host prompt probe

- `README.md:38-42` — a new `## The host prompt probe` section referencing
  `tools/host_prompt_probe.mjs`: it loads the installed `dsh-swarm-workflow` bundle and applies
  it to the real DSH host runtime to print the composed Coordinator and Worker prompts. The
  file was **not** deleted.

### F3, in the README

- `README.md:29-31` — `test_functions` counts the distinct test-function names and `test_cases`
  counts the test methods themselves, the number `unittest` runs; the two differ because several
  test classes reuse the same method name.

F4 (the "no such file" message for a directory) and F5 (the merged-stream ordering) were left
alone exactly as the Reviewer required.

---

## 2. Before / after instrument numbers

The package was not touched, so the fixed instrument measures the same package as before —
except for the added `test_cases` field and the now-correct call-site logic.

| metric | before (pre-fix instrument) | after (fixed instrument) |
| --- | --- | --- |
| annotation_coverage | 1.0 | 1.0 |
| docstring_coverage | 1.0 | 1.0 |
| module_docstring_coverage | 1.0 | 1.0 |
| public_functions_without_tests_count | 0 | 0 |
| avg_function_length | 5.6 | 5.6 |
| max_function_length | 14 | 14 |
| max_nesting_depth | 2 | 2 |
| duplicate_line_ratio | 0.0 | 0.0 |
| test_functions | 51 | 51 |
| **test_cases** | *(field absent)* | **54** |

The numbers above are the fixed instrument's own JSON on this repository (verbatim below); the
"before" column is the pre-fix instrument (`git show 8721ae1:tools/quality_report.py`) run
against the same package during the F1/F2 probes — its output on the unmodified package is
identical except that it has no `test_cases` field.

### The suite still passes — 54 tests, exit 0

```
> python -m unittest discover -s tests -t .
......................................................
----------------------------------------------------------------------
Ran 54 tests in 1.533s

OK
EXIT=0
```

### The fixed instrument on this repository

```
> python tools/quality_report.py --json
{
  "annotation_coverage": 1.0,
  "avg_function_length": 5.6,
  "docstring_coverage": 1.0,
  "duplicate_line_ratio": 0.0,
  "max_function_length": 14,
  "max_nesting_depth": 2,
  "module_docstring_coverage": 1.0,
  "package_modules": 5,
  "public_function_names": [
    "main",
    "normalize_ws",
    "summarize",
    "tokenize",
    "word_frequency"
  ],
  "public_functions": 5,
  "public_functions_without_tests": [],
  "public_functions_without_tests_count": 0,
  "test_cases": 54,
  "test_functions": 51
}
EXIT=0
```

`test_cases` = 54 is the number `unittest` runs; `test_functions` = 51 stays the count of
distinct test-function names (three method names are reused across test classes).

---

## 3. F1 discrimination proof

The proof runs on a **throwaway copy** of the repository at
`%TEMP%\swarmlab-f1-probe` (`C:\Users\leroy\AppData\Local\Temp\swarmlab-f1-probe`), created with
`git clone` of this repository at HEAD `4ce9aa8`. The pre-fix instrument was extracted
byte-exact from the parent of the fix commit into the probe as
`tools/quality_report_before.py` (`git show 8721ae1:tools/quality_report.py`). The repository
itself was never modified. The probe has been deleted again.

Probe edits in the copy:

- `swarmlab/text.py` gained a public function that no test calls:

  ```python
  def zebra_helper(value: int) -> int:
      """A public helper no test calls.

      The throwaway probe adds it so the instrument can be shown to detect it.
      """
      return value
  ```

- `tests/test_smoke.py` gained a comment that names it but calls nothing:

  ```python
  # zebra_helper is never called by any test; this comment mentions it only.
  ```

**Old instrument (pre-fix) — the comment alone satisfied the check:**

```
> python tools/quality_report_before.py --json
{
  "annotation_coverage": 1.0,
  "avg_function_length": 5.67,
  "docstring_coverage": 1.0,
  "duplicate_line_ratio": 0.013,
  "max_function_length": 14,
  "max_nesting_depth": 2,
  "module_docstring_coverage": 1.0,
  "package_modules": 5,
  "public_function_names": [
    "main",
    "normalize_ws",
    "summarize",
    "tokenize",
    "word_frequency",
    "zebra_helper"
  ],
  "public_functions": 6,
  "public_functions_without_tests": [],
  "public_functions_without_tests_count": 0,
  "test_functions": 51
}
EXIT=0
```

**New instrument (fixed) — the uncalled function is reported:**

```
> python tools/quality_report.py --json
{
  "annotation_coverage": 1.0,
  "avg_function_length": 5.67,
  "docstring_coverage": 1.0,
  "duplicate_line_ratio": 0.013,
  "max_function_length": 14,
  "max_nesting_depth": 2,
  "module_docstring_coverage": 1.0,
  "package_modules": 5,
  "public_function_names": [
    "main",
    "normalize_ws",
    "summarize",
    "tokenize",
    "word_frequency",
    "zebra_helper"
  ],
  "public_functions": 6,
  "public_functions_without_tests": [
    "zebra_helper"
  ],
  "public_functions_without_tests_count": 1,
  "test_cases": 54,
  "test_functions": 51
}
EXIT=0
```

The check now discriminates: `public_functions_without_tests` = `["zebra_helper"]`,
count = 1 — where the old instrument reported `[]`, count 0. The comment names the function and
the fixed instrument still does not count it, because no `ast.Call` names it.

---

## 4. F2 discrimination proof

Same throwaway copy, one more probe file, `swarmlab/probe_cls.py`:

```python
class Probe:
    """A class whose method is fully annotated except for the conventional self."""

    def run(self, value: int) -> int:
        """Run the probe.

        Args:
            value: The value to return.

        Returns:
            The same value.
        """
        return value
```

**Old instrument (pre-fix) — the unannotated `self` sank the coverage to the Reviewer's value:**

```
> python tools/quality_report_before.py --json
{
  "annotation_coverage": 0.8571,
  "avg_function_length": 6.29,
  "docstring_coverage": 1.0,
  "duplicate_line_ratio": 0.0345,
  "max_function_length": 14,
  "max_nesting_depth": 2,
  "module_docstring_coverage": 0.8333,
  "package_modules": 6,
  "public_function_names": [
    "main",
    "normalize_ws",
    "run",
    "summarize",
    "tokenize",
    "word_frequency",
    "zebra_helper"
  ],
  "public_functions": 7,
  "public_functions_without_tests": [],
  "public_functions_without_tests_count": 0,
  "test_functions": 51
}
EXIT=0
```

**New instrument (fixed) — `annotation_coverage` stays 1.0:**

```
> python tools/quality_report.py --json
{
  "annotation_coverage": 1.0,
  "avg_function_length": 6.29,
  "docstring_coverage": 1.0,
  "duplicate_line_ratio": 0.0345,
  "max_function_length": 14,
  "max_nesting_depth": 2,
  "module_docstring_coverage": 0.8333,
  "package_modules": 6,
  "public_function_names": [
    "main",
    "normalize_ws",
    "run",
    "summarize",
    "tokenize",
    "word_frequency",
    "zebra_helper"
  ],
  "public_functions": 7,
  "public_functions_without_tests": [
    "zebra_helper"
  ],
  "public_functions_without_tests_count": 1,
  "test_cases": 54,
  "test_functions": 51
}
EXIT=0
```

`annotation_coverage` = 0.8571 before the fix, 1.0 after it. The `module_docstring_coverage`
of 0.8333 in this probe is an artefact of the probe file itself (it has no module docstring),
not a defect in the instrument.

---

## 5. The refreshed comparison — both arms, one fixed instrument

```
> python tools/quality_compare.py "D:\project\swarm-lab-control"
EXIT=0
```

`tools/quality_compare.py` copies this repository's `tools/quality_report.py` into the control
arm, measures both arms with that copy, and removes the copy again. The control arm was not
modified.

| metric | control | workflow | verdict |
| --- | --- | --- | --- |
| package_modules | 5 | 5 | same |
| public_functions | 5 | 5 | same |
| annotation_coverage | 1.0 | 1.0 | same |
| docstring_coverage | 1.0 | 1.0 | same |
| module_docstring_coverage | 1.0 | 1.0 | same |
| public_functions_without_tests_count | 0 | 0 | same |
| avg_function_length | 15.8 | 5.6 | better |
| max_function_length | 25 | 14 | better |
| max_nesting_depth | 3 | 2 | better |
| duplicate_line_ratio | 0.1048 | 0.0 | better |
| test_functions | 42 | 51 | better |

The table is byte-identical to the previous one: the fixed instrument does not change the
measurement of either arm, because neither arm has an uncalled public function and neither has
an unannotated `self`/`cls`. The refreshed
`.swarm/reports/swarm-lab-quality-comparison.json` additionally carries the new field per arm:
`control.test_cases` = 43, `workflow.test_cases` = 54. The comparison **table** does not show
`test_cases`, because the `METRICS` tuple in `tools/quality_compare.py` does not list it and
that file is outside this lane's write scope.

---

## 6. The R9 check

The remediation commit is:

```
4ce9aa86eb0e53078ded152e7c141f283dad5634   round R4b: the quality instrument checks call sites and exempts self/cls
```

(the second commit of this round is the evidence commit — this report and the two refreshed
comparison files — subject
`round R4b: the remediation report and the refreshed quality comparison`; its id is reported
in the lane message to the Lead, because a commit cannot contain its own id.)

Against the remediation commit `4ce9aa8`:

```
> git diff --stat cb51065 4ce9aa8 -- tests
(no output)

> git diff --stat cb51065 4ce9aa8 -- swarmlab
(no output)
```

Both commands print **nothing** — the empty output is the evidence. For context, the whole-tree
diff from `cb51065` to `4ce9aa8` touches only files that the other lanes' commits
(`0c0f566`, `8721ae1`) touched, plus this lane's two files:

```
> git diff --stat cb51065 4ce9aa8
 .swarm/decisions/2026-11-11-cli-multiple-files.md |  42 ++++++
 .swarm/decisions/2026-11-11-worktree-boundary.md  |  55 ++++++++
 .swarm/reports/swarm-lab-quality-comparison.json  | 115 +++++++++++++++
 .swarm/reports/swarm-lab-quality-comparison.md    |  30 ++++
 .swarm/reports/swarm-lab-quality-r2b.json         |  21 +++
 .swarm/reports/swarm-lab-r9-primitives.md         | 121 ++++++++++++++++
 .swarm/requirements/swarm-lab.md                  |  28 +++-
 README.md                                         |  23 ++-
 tools/quality_compare.py                          | 164 ++++++++++++++++++++++
 tools/quality_report.py                           |  45 ++++--
 10 files changed, 628 insertions(+), 16 deletions(-)
```

`tests/` and `swarmlab/` do not appear in that list.

---

## 7. R9 verdict

**R9 = met** — the evidence that justifies it:

1. `git diff --stat cb51065 4ce9aa8 -- tests` prints nothing — no file under `tests/` changed
   in the remediation commit.
2. `git diff --stat cb51065 4ce9aa8 -- swarmlab` prints nothing — no byte of the package
   changed, so the observable behaviour of R1–R5 and the CLI wording asserted in 19 places
   across 8 methods in 2 test files is untouched.
3. `python -m unittest discover -s tests -t .` → `Ran 54 tests` … `OK`, exit 0 — the same 54
   cases as before the round.
4. The remediation commit id is recorded in section 6 of this report, as `task-10` requires.

---

## 8. What I did not check

- **The comparison table does not show `test_cases`.** The `METRICS` tuple in
  `tools/quality_compare.py` lists the metrics that reach the table; `test_cases` is not in it
  and that file is outside this lane's write scope. The values are in the refreshed JSON
  (control 43, workflow 54) but a reader of the table alone will not see them.
- **The control arm's file set** was restored after the comparison run: `tools/quality_compare.py`
  creates an empty `tools/` directory in the control arm and removes the copied instrument but
  leaves the directory behind. I removed that empty directory, so the control arm's file set is
  byte-for-byte its prior state. The control arm is not a git repository, so this was verified
  by directory listing rather than by a diff.
- **I did not review the other lanes' work** in `.swarm/` (the Reviewer's report, the R9
  primitives report, the workflow reports), beyond reading the Reviewer's findings F1–F8 to
  know what to fix. The untracked `.swarm/reports/swarm-lab-reviewer.md`,
  `swarm-lab-workflow.md`, `swarm-lab-workflow-api.md`, `swarm-lab-workflow-cli.md` and
  `swarm-lab-workflow-tests-docs.md` are other lanes' files and were deliberately not staged.
- **The BOM in commit 1's subject.** The commit subject was written through PowerShell 5.1's
  `Set-Content -Encoding UTF8`, which prefixed a UTF-8 BOM (EF BB BF) to the message. The
  subject therefore reads `﻿round R4b: the quality instrument checks call sites and exempts
  self/cls` with an invisible leading byte. Amending the commit was forbidden by the round, so
  the commit was left as it is and the defect is disclosed here instead. It affects only the
  subject line — the commit's content, author and tree are unaffected.
- **I did not test the instrument against a package that uses `from __future__ import
  annotations`,** a `classmethod` (`cls`) in a test-covered class, a test that calls a public
  function through a deeper attribute path (`module.submodule.fn(...)` — the instrument takes
  `func.attr`, so the final attribute counts), or a public function called only indirectly
  (through `functools.partial`, `getattr`, or a loop variable). The instrument's contract is
  "names that appear as a call target", not "names that are executed".
- **I did not re-run the Reviewer's lane** and did not ask for a second independent review; the
  R9 verdict above rests on the diffs, the suite and the two discrimination proofs.

---

## 9. Files this lane changed

| file | change |
| --- | --- |
| `tools/quality_report.py` | F1 call-site check, F2 exemption order, F3 `test_cases` |
| `README.md` | F3 note, F6 Python floor, F7 public surface, F8 host prompt probe |
| `.swarm/reports/swarm-lab-quality-comparison.json` | refreshed by `tools/quality_compare.py` |
| `.swarm/reports/swarm-lab-quality-comparison.md` | refreshed by `tools/quality_compare.py` (byte-identical to the previous table) |
| `.swarm/reports/swarm-lab-remediation.md` | this report |

Nothing under `swarmlab/` or `tests/` was changed, and `.swarm/requirements/swarm-lab.md` was
not touched.
