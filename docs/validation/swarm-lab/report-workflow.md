# swarm-lab — merged fan-out report (round R7)

Merge stage of a scripted three-lane fan-out over the Python package at
`D:\project\swarm-lab-python`. This document merges the three lane reports into
one acceptance view: the fan-out structure, a per-requirement verdict table
(R1–R10), the merged findings list ordered by severity with counts, the
agreement/disagreement between lanes, and what the fan-out did not check.

Requirement carrier (read in full by the merge stage, 136 lines):
`D:\project\swarm-lab-python\.swarm\requirements\swarm-lab.md`.
Lane reports merged (all three present, none missing):

| Lane | Report | Bytes |
|---|---|---|
| `api` | `.swarm/reports/swarm-lab-workflow-api.md` | 18431 |
| `cli` | `.swarm/reports/swarm-lab-workflow-cli.md` | 17320 |
| `tests-docs` | `.swarm/reports/swarm-lab-workflow-tests-docs.md` | 35448 |

No lane report was missing, so no requirement had to be marked `not
demonstrated` for lack of a report. The `tests-docs` lane closed R9 `not
demonstrated` because the round-R4 findings and their remediation commit did
not exist at its read time; the merge stage re-adjudicated R9 against the
remediation commit `4ce9aa8` that landed during the merge and records it as
`met` (§2.2.1). All ten requirements therefore carry a `met` verdict at merge
time, and no requirement is `not met`.

Interpreter used by every lane (there is no `python` on PATH):

    C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe
    Python 3.12.14 (main, Sep  1, 2026, 14:17:39) [MSC v.1944 64 bit (AMD64)]

---

## 1. Fan-out structure

Three independent lanes, each owning a disjoint slice of R1–R10, each read-only
over `swarmlab/`, `tests/`, `tools/` and the requirement file, each owning
exactly one write scope (its own report).

| Lane | Assigned requirements | What it covered | Method | Report section |
|---|---|---|---|---|
| `api` | R1, R2, R3, R4, R8 | Public API surface of `swarmlab`: the exact signatures of `normalize_ws` / `tokenize` / `word_frequency` / `summarize`, annotation completeness and correctness, the five-module package layout, `__all__` vs actual exports, and import-time side effects | live `inspect.signature`; AST scan of module-level statements and of the whole package; per-clause `unittest` runs; stdout/stderr captured apart in fresh interpreters; an audit hook installed *before* the import; star-import comparison | `swarm-lab-workflow-api.md:16-31`, `:125-334` |
| `cli` | R5, R10 | `python -m swarmlab <file> [<file> …]`: exit statuses, stdout/stderr separation, block order, missing-file semantics, the usage path | 11 scenarios, stdout and stderr captured into two *separate* pipes; raw bytes read from `StandardOutput.BaseStream` / `StandardError.BaseStream` and decoded as cp936; the repository's own CLI clause tests | `swarm-lab-workflow-cli.md:7-48`, `:137-324` |
| `tests-docs` | R6, R7, R9 | Run the suite; prove every public function is really exercised (not merely named); judge test quality; judge whether the documentation set lets a cold reader reconstruct what was asked, decided and measured; state whether R9's check is satisfiable as written | full suite + instrument; **independent AST re-derivation** of annotations/docstrings; **AST call-site analysis** of every public function in the test sources; `git log` / `show` / `diff --stat` / `cat-file` (read-only) | `swarm-lab-workflow-tests-docs.md:21-35`, `:347-534` |

Division of labour was honoured: each lane lists the requirements it did **not**
adjudicate and quotes other lanes' numbers only as context, never as a verdict
(`swarm-lab-workflow-api.md:338-340`, `swarm-lab-workflow-cli.md:365-372`,
`swarm-lab-workflow-tests-docs.md:538-562`).

---

## 2. Requirement verdicts R1–R10

| Req | Requirement (short form) | Verdict | Lane | Evidence (file:line and real output) |
|---|---|---|---|---|
| R1 | `swarmlab.text.normalize_ws(text: str) -> str` collapses whitespace runs, strips ends, preserves order, `""` for blank input | **met** | `api` | `swarm-lab-workflow-api.md:127-155`; live signature `swarmlab.text.normalize_ws(text: str) -> str`; `python -m unittest tests.test_text.TestNormalizeWs -v` → `Ran 7 tests in 0.001s / OK / EXIT=0` |
| R2 | `swarmlab.text.tokenize(text: str) -> list[str]` lowercase alphanumeric tokens in order | **met** | `api` | `swarm-lab-workflow-api.md:157-183`; live signature `swarmlab.text.tokenize(text: str) -> list[str]`; `Ran 10 tests / OK / EXIT=0`; live probe `tokenize unicode: ['héllo', 'wörld', '42']` |
| R3 | `swarmlab.stats.word_frequency(tokens: list[str]) -> list[tuple[str, int]]` count desc, then token asc | **met** | `api` | `swarm-lab-workflow-api.md:185-210`; live signature `swarmlab.stats.word_frequency(tokens: list[str]) -> list[tuple[str, int]]`; `Ran 9 tests / OK / EXIT=0` |
| R4 | `swarmlab.report.summarize(tokens: list[str]) -> dict[str, object]` with `total`, `unique`, `top` | **met** | `api` | `swarm-lab-workflow-api.md:212-236`; live signature `swarmlab.report.summarize(tokens: list[str]) -> dict[str, object]`; `Ran 9 tests / OK / EXIT=0` |
| R5 | `python -m swarmlab <file>` prints the summary and exits 0; a missing file prints `swarmlab: no such file: <path>` on stderr and exits 2 | **met** | `cli` | `swarm-lab-workflow-cli.md:139-199`; `EXITCODE=0` + `total: 16 / unique: 11 / the: 4 / dog: 2`; missing file → `EXITCODE=2`, `STDERR_BEGIN<<swarmlab: no such file: does-not-exist.txt>>STDERR_END`, stdout empty |
| R6 | every public function annotated, every public module carries a module docstring | **met** | `tests-docs` | `swarm-lab-workflow-tests-docs.md:349-400`; instrument `annotation_coverage: 1.0`, `docstring_coverage: 1.0`, `module_docstring_coverage: 1.0`; independent AST re-derivation `params_unannotated=[] return_annotated=True docstring=True` for all five functions |
| R7 | every public function exercised by ≥1 test case; the whole suite passes | **met** | `tests-docs` | `swarm-lab-workflow-tests-docs.md:402-454`; `Ran 54 tests / OK / EXITCODE=0`; `public_functions_without_tests_count: 0`; independent call-site analysis `CALLS main: 7 -> [... 'tests\\test_smoke.py:66', 'tests\\test_smoke.py:76' ...]`, `CALLS tokenize: 13 -> [...]` |
| R8 | no import-time side effects; importable from another directory | **met** | `api` | `swarm-lab-workflow-api.md:238-278`; `MODULE=swarmlab stdout_len=0 stderr_len=0 exit_stdout_run=0 exit_stderr_run=0` (same for `.text`, `.stats`, `.report`, and from `D:\project` with `PYTHONPATH` set); audit hook shows only `__pycache__` reads |
| R9 | the behaviour of R1–R5 must not change while the round-R4 review findings are remediated | **met** (merge-stage re-adjudication; the lane recorded `not demonstrated` at its read time) | `tests-docs` → merge stage | Lane: `swarm-lab-workflow-tests-docs.md:456-534` — `not demonstrated` because no remediation commit existed. Merge stage re-ran the check once the remediation landed (§2.2): `git diff --stat cb51065 4ce9aa8 -- tests` → empty; `git diff --stat cb51065 4ce9aa8 -- swarmlab` → empty; suite `Ran 54 tests in 1.544s / OK / SUITE_EXIT=0`; the same window against the final `HEAD` `7612b0b` is also empty. The remediation round's own report agrees: `swarm-lab-remediation.md:442` "**R9 = met**" |
| R10 | one summary block per file, in argument order, exit 0 when all exist; the first missing file stops the run with the message on stderr, exit 2, earlier summaries kept on stdout | **met** | `cli` | `swarm-lab-workflow-cli.md:201-324`; two blocks `EXITCODE=0`; raw bytes `RAW_STDOUT_HAS_ERRORWORD=False`, `RAW_STDERR_HAS_SUMMARYWORD=False`; missing-first-file case → `STDOUT_BEGIN<<>>STDOUT_END` |

### 2.1 Merge-stage re-verification (read-only)

The merge stage did not take the lanes' numbers on trust. It re-ran the two
whole-tree checks and the git state, from
`D:\project\swarm-lab-python`:

```
& $py -m unittest discover -s tests -t .
----------------------------------------------------------------------
Ran 54 tests in 1.538s
OK
SUITE_EXIT=0

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
INSTRUMENT_EXIT=0
```

Both agree with the figures quoted independently by the `api` lane
(`swarm-lab-workflow-api.md:310-334`), the `cli` lane
(`swarm-lab-workflow-cli.md:317-324`) and the `tests-docs` lane
(`swarm-lab-workflow-tests-docs.md:41-49`, `:416-434`).

The merge stage re-ran both checks a third time at the final `HEAD`
(`7612b0b`, after the remediation and its report landed):

```
& $py -m unittest discover -s tests -t .
----------------------------------------------------------------------
Ran 54 tests in 1.431s
OK
SUITE_EXIT=0

& $py tools/quality_report.py --json   (selected keys)
  "annotation_coverage": 1.0,
  "public_functions_without_tests_count": 0,
  "test_cases": 54,
INSTRUMENT_EXIT=0
```

The merge stage also re-read `swarmlab/__main__.py` (50 lines) and confirmed
the line citations used by the CLI lane: `USAGE` at `:8`, the `try/except
OSError` at `:19-22`, `main(argv: list[str] | None = None) -> int` at `:33`,
`if not args: return _fail(USAGE)` at `:41-42`, the argument loop at `:43-46`
with `_fail(f"swarmlab: no such file: {path}")` at `:45`, and the
`__main__` guard at `:49-50`. It also confirmed the `api` lane's claim that
the eager submodule imports are load-bearing for a test:
`tests/test_smoke.py:55-57` asserts
`self.assertIs(swarmlab.text, sys.modules["swarmlab.text"])`.

### 2.2 R9 — `not demonstrated` at lane time, `met` at merge time

**The lane's verdict was correct when it was taken; the merge stage
re-adjudicated it once the state it depended on changed.** The `tests-docs`
lane closed R9 as `not demonstrated` because no remediation of the round-R4
findings existed. Both halves of that premise — the findings and the
remediation commit — have since materialised in the repository, and the merge
stage re-ran the check against them (§2.2.1, §2.3).

`cb51065` exists and the literal check passes at HEAD:

```
git -C D:\project\swarm-lab-python cat-file -t cb51065
commit

git -C D:\project\swarm-lab-python diff --stat cb51065 HEAD -- tests
(no output)

git -C D:\project\swarm-lab-python diff --stat cb51065 HEAD -- swarmlab
(no output)
```

But the check's **subject** — a remediation of the round-R4 review findings —
has not happened, so the empty diff witnesses nothing about invariance under
remediation. The merge stage re-checked the git state:

```
git -C D:\project\swarm-lab-python log --oneline -6
8721ae1 measure: the workflow arm against a single-shot control, same instrument
0c0f566 docs: the two human decisions and the round R2b/R9 evidence
622349b requirements: R9 names its baseline commit; the README lists R1-R10
cb51065 round R3: the Tester lane adds the requirement clause tests
d08eac1 round R2b: the CLI summarises several files (R10)
6735104 round R2: the swarmlab package implements R1-R8

git -C D:\project\swarm-lab-python show --stat --oneline 8721ae1
8721ae1 measure: the workflow arm against a single-shot control, same instrument
 .swarm/reports/swarm-lab-quality-comparison.json | 115 ++++++++++++++++
 .swarm/reports/swarm-lab-quality-comparison.md   |  30 +++++
 tools/quality_compare.py                         | 164 +++++++++++++++++++++++
 3 files changed, 309 insertions(+)
```

The only commit after `cb51065` that touches tracked files is `8721ae1`, which
adds measurement artefacts and a comparison script — it changes neither
`swarmlab/` nor `tests/`, and it is **not** a remediation of the round-R4
findings. At that moment there was therefore no `<remediation commit>` to diff
against, and the requirement's check was unsatisfiable in its intended form.

#### 2.2.1 The state change that re-opened R9 — and closed it again

**State change since the lane ran (important for the reader).** The
`tests-docs` lane recorded the *reason* for its verdict as "the round-R4
findings do not exist yet" (`swarm-lab-workflow-tests-docs.md:79-130`). That was
true at its read time. The round-R4 reviewer's own report has since appeared:

```
Get-ChildItem -Force D:\project\swarm-lab-python\.swarm\reports
Name                             Length  LastWriteTime
----                             ------  -------------
.gitkeep                              5  11/10/2026 11:57:57 PM
swarm-lab-developer.md            12876  11/11/2026 12:03:44 AM
swarm-lab-quality-comparison.json  2716  11/11/2026  9:07:25 AM
swarm-lab-quality-comparison.md   1403  11/11/2026  9:07:25 AM
swarm-lab-quality-r2.json           515  11/10/2026  8:24:57 PM
swarm-lab-quality-r2b.json          516  11/10/2026  8:58:22 AM
swarm-lab-r10.md                  13693  11/11/2026  8:57:27 AM
swarm-lab-r9-primitives.md         5748  11/11/2026  8:57:06 AM
swarm-lab-reviewer.md             35623  11/11/2026  9:07:38 AM
swarm-lab-tester.md               23196  11/11/2026  8:58:50 AM
swarm-lab-workflow-api.md         18431  11/11/2026  9:05:13 AM
swarm-lab-workflow-cli.md         17320  11/11/2026  9:05:44 AM
swarm-lab-workflow-tests-docs.md  35448  11/11/2026  9:07:29 AM
```

The round-R4 reviewer adjudicates the same requirement set identically
(`swarm-lab-reviewer.md:70-79`): R1–R8 and R10 **met**, R9 **not demonstrated**
("the remediation does not exist yet"). Both the reviewer and the `tests-docs`
lane therefore agreed on R9 at their read times.

Then, still during this merge, the **remediation round committed its work** as
`4ce9aa8` (§2.3). With that commit in hand, the merge stage re-ran R9's check
with the placeholder bound to the only candidate remediation commit:

```
git -C D:\project\swarm-lab-python log --oneline -3
7612b0b round R4b: the remediation report and the refreshed quality comparison
4ce9aa8 round R4b: the quality instrument checks call sites and exempts self/cls
8721ae1 measure: the workflow arm against a single-shot control, same instrument

git -C D:\project\swarm-lab-python diff --stat cb51065 4ce9aa8 -- tests
(no output)

git -C D:\project\swarm-lab-python diff --stat cb51065 4ce9aa8 -- swarmlab
(no output)

git -C D:\project\swarm-lab-python diff --stat cb51065 7612b0b -- tests
(no output)

git -C D:\project\swarm-lab-python diff --stat cb51065 7612b0b -- swarmlab
(no output)

& $py -m unittest discover -s tests -t .
----------------------------------------------------------------------
Ran 54 tests in 1.544s
OK
SUITE_EXIT=0
```

All three limbs of R9's literal check now hold against a **named** commit:

| Limb of R9's check (`.swarm/requirements/swarm-lab.md:109-112`) | Result at merge time |
|---|---|
| `cb51065` exists | yes — `git cat-file -t cb51065` → `commit` |
| `git diff --stat cb51065 <remediation commit> -- tests` is empty | yes — empty with `<remediation commit>` = `4ce9aa8` |
| the suite still exits `0` | yes — `Ran 54 tests in 1.544s / OK / SUITE_EXIT=0` |

The requirement's *subject* — "the public behaviour defined by R1 to R5 must not
change while the review findings of round R4 are remediated" — is now
demonstrated and not merely asserted: `swarmlab/` and `tests/` are
**byte-identical** between `cb51065` and `4ce9aa8` (`git diff --stat cb51065
4ce9aa8 -- swarmlab` → empty, `-- tests` → empty), so the remediation changed no
public behaviour at all; it changed the instrument and the README only
(§2.3), and the instrument's stricter call-site rule still reports
`public_functions_without_tests_count: 0`.

**R9 is therefore `met` at merge time.** The merged finding M2 (§3.2) is
narrowed and M1 (§3.2) is closed by that same commit.

**Two residuals on R9, stated so the reader is not misled:**

* The requirement file still carries the **unbound placeholder**
  `.swarm/requirements/swarm-lab.md:110` = "`git diff --stat cb51065
  <remediation commit> -- tests`" (grep hits only `:101`, `:106`, `:109`,
  `:110`, `:111`). The merge stage bound it to `4ce9aa8`; the text itself was
  not edited (the merge stage modifies nothing but this report).
* The round-R4 reviewer also asked the remediation round to record the commit
  id and the empty diff output **in its own report**
  (`swarm-lab-reviewer.md:725-727`). That report — `.swarm/reports/
  swarm-lab-remediation.md`, 18238 bytes, written 09:16:02 and committed as
  `7612b0b` — now exists, and it reaches the same conclusion independently:
  `swarm-lab-remediation.md:394-448` ("## 6. The R9 check" → "## 7. R9 verdict"
  → "**R9 = met**"), quoting `git diff --stat cb51065 4ce9aa8 -- tests` and
  `-- swarmlab` as empty (`:410-413`) and the full commit id
  `4ce9aa86eb0e53078ded152e7c141f283dad5634` (`:399`). R9's literal check does
  not depend on that report, so the verdict does not depend on it either; it
  only removes the last residual.

### 2.3 A remediation round landed **during** this merge, as commit `4ce9aa8`

Between the start and the end of this merge the repository changed under the
merge stage. Its first `git status --porcelain` showed only untracked report
files; then two **modified tracked files** appeared, and by the end of the merge
those changes had been **committed** as `4ce9aa8`:

```
git -C D:\project\swarm-lab-python status --porcelain
 M README.md
 M tools/quality_report.py
?? .swarm/reports/swarm-lab-reviewer.md
?? .swarm/reports/swarm-lab-workflow-api.md
?? .swarm/reports/swarm-lab-workflow-cli.md
?? .swarm/reports/swarm-lab-workflow-tests-docs.md
?? .swarm/reports/swarm-lab-workflow.md

git -C D:\project\swarm-lab-python diff --stat              (mid-merge)
 README.md               | 21 +++++++++++++++++++++
 tools/quality_report.py | 45 +++++++++++++++++++++++++++++++++++----------
 2 files changed, 56 insertions(+), 10 deletions(-)

git -C D:\project\swarm-lab-python show --stat --oneline 4ce9aa8   (end of merge)
4ce9aa8 round R4b: the quality instrument checks call sites and exempts self/cls
 README.md               | 21 +++++++++++++++++++++
 tools/quality_report.py | 45 +++++++++++++++++++++++++++++++++++----------
 2 files changed, 56 insertions(+), 10 deletions(-)

git -C D:\project\swarm-lab-python show --stat --oneline 7612b0b   (a moment later)
7612b0b round R4b: the remediation report and the refreshed quality comparison
 .swarm/reports/swarm-lab-quality-comparison.json |   2 +
 .swarm/reports/swarm-lab-remediation.md          | 499 +++++++++++++++++++++++
 2 files changed, 501 insertions(+)
```

These changes are **not the merge stage's** — the merge stage wrote only this
report. They are a concurrent remediation round addressing the round-R4
findings, and its content is directly relevant to the merged findings:

* `tools/quality_report.py` — the substring rule is replaced by a call-site
  rule: `test_names()`/`test_sources()` become `test_inventory()`/`called_names()`,
  and the test-detection line becomes `tested = names & called_names()`. This is
  **exactly the fix M1 recommended**.
* `tools/quality_report.py:57-62` — the `self`/`cls` exemption is moved **above**
  the `annotation is None` check, which is **exactly the fix NB8 recommended**.
* `tools/quality_report.py:92-118` — a `test_cases` counter is added beside
  `test_functions`, which is **exactly the fix NB7 recommended**.
* `README.md` — a Python floor is stated (`The package requires Python 3.10 or
  newer: list[str] | None in swarmlab/__main__.py:33 is PEP 604 …`), the host
  probe is documented, and the instrument's public surface is explained: these
  are **exactly the fixes NB2 and NB10 recommended**.

The merge stage re-ran both whole-tree checks against the committed
remediation:

```
& $py -m unittest discover -s tests -t .
----------------------------------------------------------------------
Ran 54 tests in 1.544s
OK
SUITE_EXIT=0

& $py tools/quality_report.py --json
{
  "annotation_coverage": 1.0,
  "docstring_coverage": 1.0,
  "module_docstring_coverage": 1.0,
  "public_functions": 5,
  "public_functions_without_tests": [],
  "public_functions_without_tests_count": 0,
  "test_cases": 54,
  "test_functions": 51
}
INSTRUMENT_EXIT=0
```

**Consequences for this merge, stated precisely:**

1. The remediation touches neither `swarmlab/` nor `tests/` —
   `git diff --stat cb51065 4ce9aa8 -- swarmlab tests` is empty — so R1–R5's
   behaviour is preserved, exactly as R9 requires.
2. The instrument's numbers are unchanged except for the **added** `test_cases:
   54` key; `public_functions_without_tests_count` stays `0` under the stricter,
   now call-based rule.
3. **R9 is `met` at merge time.** The remediation is now a named commit
   (`4ce9aa8`), the check's diff window is no longer empty by accident, and the
   suite still exits `0` (§2.2.1). The reviewer's second demand — that the
   remediation round record the commit id and the empty diff output in its own
   report (`swarm-lab-reviewer.md:725-727`) — was met a few minutes later by
   `.swarm/reports/swarm-lab-remediation.md` (committed as `7612b0b`), which
   independently records "**R9 = met**" (`swarm-lab-remediation.md:442`).
4. M1, NB2, NB7, NB8 and NB10 are **fixed by `4ce9aa8`** and verified fixed by
   the re-run above; they are recorded below as findings **closed by the
   remediation**, with the fan-out's original counts left unchanged so the
   round's output stays comparable with the lanes'.

---

## 3. Merged findings, ordered by severity

Counts: **Blocking 0 · Material 2 · Non-blocking 16 · Out of scope 2 · total 20**.

### 3.1 Blocking — 0

No lane raised a blocking finding. No requirement is `not met`.

### 3.2 Material — 2

#### M1 — `tools/quality_report.py:149` — the instrument decides "is this function tested?" by a substring match over the raw test sources

*Lane:* `tests-docs` (`swarm-lab-workflow-tests-docs.md:55-77`).

The rule is `tested = {name for name in names if name in test_sources()}`, and
`test_sources()` (`:102-106`) concatenates the **raw text** of every file under
`tests/`. A public function counts as tested if its name appears anywhere in
that text — a comment, a docstring, an import line or an unrelated identifier.
The rule never checks that a test *calls* it, so the number R7's check relies on
(`public_functions_without_tests_count: 0`) is satisfiable by a test file that
merely mentions the name.

Evidence — the rule re-evaluated in memory against a simulated `test_smoke.py`
with the two calls of the package's `main` removed:

```
instrument rule (name in test_sources) -> {'main': True, 'normalize_ws': True, 'summarize': True, 'tokenize': True, 'word_frequency': True}
simulated test_smoke.py still contains 'main': True
  occurrences of 'main' in the simulated file: ['from swarmlab.__main__ import main', 'self.assertTrue(callable(main))', 'main: ["argv"],', 'if __name__ == "__main__":', 'unittest.main()']
real calls of swarmlab main left in the simulated test_smoke.py: [134]
=> the instrument would still report public_functions_without_tests_count = 0 while main is never exercised
```

Line 134 is `unittest.main()` in the module guard, not the package's `main`.

**Bounded by the same lane's independent evidence:** the risk does *not*
materialise in the current tree. The lane proved by AST call-site analysis that
every public function is genuinely called
(`swarm-lab-workflow-tests-docs.md:440-445`):

```
CALLS main: 7 -> ['tests\\test_cli.py:122', 'tests\\test_report.py:59', 'tests\\test_smoke.py:134', 'tests\\test_smoke.py:66', 'tests\\test_smoke.py:76', 'tests\\test_stats.py:60', 'tests\\test_text.py:88']
CALLS summarize: 8 -> ['tests\\test_report.py:25', ...]
CALLS word_frequency: 10 -> ['tests\\test_report.py:55', ...]
CALLS normalize_ws: 7 -> ['tests\\test_text.py:24', ...]
CALLS tokenize: 13 -> ['tests\\test_text.py:54', ... 'tests\\test_text.py:84']
```

with the package's `main` genuinely called at `tests/test_smoke.py:66` and
`:76`. R7 is therefore `met` on evidence that does not rely on the instrument.
Severity is `Material` because the *named check* is unsound and cannot be used
to re-verify R7 after a remediation.

**Status at merge time:** the concurrent remediation round **closed this
finding** — it replaced the substring rule with the recommended call-site rule
and was committed as `4ce9aa8` (§2.3). The instrument still reports
`public_functions_without_tests_count: 0` under the stricter rule, and the
suite still reports `Ran 54 tests … OK / SUITE_EXIT=0`. The finding was real
at the lane's read time and is retained in the count for comparability.

#### M2 — `.swarm/requirements/swarm-lab.md:104` — R9's premise has no referent in the workspace (now narrowed)

*Lane:* `tests-docs` (`swarm-lab-workflow-tests-docs.md:79-130`).

R9 requires behaviour not to change "while the review findings of round R4 are
remediated". At the lane's read time nothing in the workspace recorded those
findings:

```
$ grep -r "round R4|round-R4|findings" D:\project\swarm-lab-python\.swarm
swarm-lab-python\.swarm\requirements\swarm-lab.md:104: findings of round R4 are remediated. A change that alters an observable result
swarm-lab-python\.swarm\reports\swarm-lab-developer.md:14: the round-R4 remediation of the review findings, so it is outside this round's assignment and
swarm-lab-python\.swarm\reports\swarm-lab-tester.md:352: commit and the round-R4 remediation commit do not exist yet. The empty `git diff --stat --
swarm-lab-python\.swarm\reports\swarm-lab-r9-primitives.md:25: task-3 [completed] rev 3 owner reviewer — Independent review …
swarm-lab-python\.swarm\reports\swarm-lab-r10.md:28: R9 — the public behaviour defined by R1 to R5 must not change while the review findings are remediated;
```

and the board showed the round-R4 review still open:

```
swarm_task {action: "list"}
task-9 [in_progress] rev 2 owner pyreview — Review the swarmlab package against the requirement set (round R4)

swarm_task {action: "get", task_id: "task-9"}
  write scopes: swarm-lab-python/.swarm/reports/swarm-lab-reviewer.md
  known evidence: … R9 is `not demonstrated` until a remediation commit exists — its check is `git diff --stat cb51065 <remediation commit> -- tests` empty, so a remediation round must not edit the tests.
```

**Narrowed by the merge stage (§2.2), and now closed by it (§2.3):** at the
lane's read time the round-R4 reviewer's report
`.swarm/reports/swarm-lab-reviewer.md` did not exist, so the premise of R9 was
unreadable; and no remediation commit existed, so the diff had nothing to
compare. Both gaps have since been filled: the reviewer's report appeared
(35623 bytes, written 09:07:38, `.swarm/reports/swarm-lab-reviewer.md:70-79`
verdicts R1–R8 and R10 met and R9 not demonstrated), and the remediation round
committed its work as `4ce9aa8`, which the merge stage verified with
`git diff --stat cb51065 4ce9aa8 -- tests` → empty and `-- swarmlab` → empty
(§2.2.1, §2.3). The finding is therefore **closed at merge time**: R9 is
`met`. What remains open is the narrower, purely textual residual recorded as
NB5 — the requirement file still carries the unbound placeholder
`.swarm/requirements/swarm-lab.md:110`. The commit id is recorded in the
remediation round's own report (`.swarm/reports/swarm-lab-remediation.md:399`,
committed as `7612b0b`), so the reviewer asks are answered; only the
requirement file's placeholder text is left unbound. Neither residual touches
the package's behaviour.

### 3.3 Non-blocking — 16

| ID | Location | Issue | Lane | Evidence |
|---|---|---|---|---|
| NB1 | `swarmlab/__init__.py:2` | The package eagerly imports all three submodules, so `import swarmlab` loads `re` and `collections` even when one helper is wanted; the whole package costs unconditional. Not an R8 violation (the imports are silent), and it is what makes the `"report"`, `"stats"`, `"text"` entries of `__all__` valid exports. | `api` | `swarm-lab-workflow-api.md:35-53`; AST scan: `__init__.py module-level statements: ["__all__ = ['normalize_ws', 'report', 'stats', 'summarize', 'text', 'tokenize', 'word_frequency']"]`, `text.py module-level statements: ["_TOKEN_PATTERN = re.compile('[^\\W_]+')"]` |
| NB2 | `swarmlab/__main__.py:33` | `main(argv: list[str] \| None = None)` uses a PEP 604 union in a runtime-evaluated annotation (no `from __future__ import annotations`), requiring Python 3.10+, while the other public annotations need 3.9+; the repository declares no minimum Python version (no `pyproject.toml`, `setup.py` or `setup.cfg`). | `api` | `swarm-lab-workflow-api.md:55-81`; `main signature: (argv: list[str] \| None = None) -> int`; `ann stats.word_frequency {'tokens': list[str], 'return': list[tuple[str, int]]}` |
| NB3 | `swarmlab/__main__.py:19-22` (with `:44-45`) | The failure message says `no such file` for **any** unreadable path, so an existing directory (or an unreadable existing file) is misreported as missing. Exit status and stream are still correct. | `cli` | `swarm-lab-workflow-cli.md:52-94`; `python -m swarmlab tests/fixtures` → `EXITCODE=2`, `STDERR_BEGIN<<swarmlab: no such file: tests/fixtures>>STDERR_END` although the path exists; underlying exception `EXC_TYPE=PermissionError`, `EXC_STR=[Errno 13] Permission denied: 'tests\\fixtures'`, `IS_OSERROR=True` |
| NB4 | `swarmlab/__main__.py:8` | The usage string embeds U+2026 HORIZONTAL ELLIPSIS, so its rendering depends on the console codepage. Byte-exact here; an ASCII `...` would be more portable. | `cli` | `swarm-lab-workflow-cli.md:96-125`; `codepoints=... 60 102 105 108 101 62 20 91 60 102 105 108 101 62 32 8230 93`; `RAW_STDERR_HEX=... 5b 3c 66 69 6c 65 3e 20 a1 ad 5d 0d 0a`, `RAW_STDERR_GBK=usage: python -m swarmlab <file> [<file> …]` |
| NB5 | `.swarm/requirements/swarm-lab.md:109-112` | R9's check diffs only the `tests` tree, so it measures "no test file changed" rather than "behaviour unchanged"; `<remediation commit>` is an unbound placeholder. A remediation that adds a legitimate test fails the check; a behaviour change without a test edit is caught only by the suite. | `tests-docs` | `swarm-lab-workflow-tests-docs.md:132-163`; `git diff --stat cb51065 HEAD -- tests` → (no output); `git diff --stat cb51065 HEAD -- swarmlab` → (no output); `git log --oneline --all` lists no remediation commit |
| NB6 | `.swarm/requirements/swarm-lab.md:87` | R7's check asks for `public_functions_without_tests` to be `0`, but the instrument emits that key as a list and puts the number under `public_functions_without_tests_count`. A literal checker finds `[]`. The substance holds via the `_count` key. | `tests-docs` | `swarm-lab-workflow-tests-docs.md:165-181`; `"public_functions_without_tests": [], "public_functions_without_tests_count": 0,` (EXIT=0) |
| NB7 | `tools/quality_report.py:92-99` | `test_names()` collects test names into a `set`, so the instrument reports `test_functions: 51` for a 54-test suite because one test name is reused in four files. | `tests-docs` | `swarm-lab-workflow-tests-docs.md:183-206`; instrument `"test_functions": 51`; inventory `total test methods: 54 unique names: 51`, `duplicated names: ['test_signature_is_the_required_one']` (test_cli.py, test_report.py, test_smoke.py, test_text.py) |
| NB8 | `tools/quality_report.py:56-68` | `is_annotated` returns `False` on an unannotated parameter **before** the `self`/`cls` exemption can apply, so the exemption is dead code and a future class would be counted as unannotated. No classes exist today, so `annotation_coverage: 1.0` is currently correct. | `tests-docs` | `swarm-lab-workflow-tests-docs.md:208-216`; the exemption `continue` at `:60-63` is unreachable for an unannotated `self`/`cls` |
| NB9 | `.swarm/requirements/swarm-lab.md:132-135` | The Baseline note says the repository starts empty apart from the requirement file and the tooling, but the baseline commit also added `README.md` and the fixture; the note's second sentence ("every requirement above is `not demonstrated` until a lane reports the evidence") now reads as a live status line although four rounds of evidence exist. | `tests-docs` | `swarm-lab-workflow-tests-docs.md:218-234`; `git show --stat --oneline 120483e` → `.gitignore`, `.swarm/requirements/swarm-lab.md`, `README.md`, `tests/fixtures/sample.txt`, `tools/quality_report.py`, `7 files changed, 365 insertions(+)` |
| NB10 | `README.md:37` | `tools/` is described in one line as "the measurement instrument" although it holds three programs with three different purposes; neither the host probe nor the comparison script is mentioned. | `tests-docs` | `swarm-lab-workflow-tests-docs.md:236-273`; `grep -r "host_prompt_probe"` hits only `tools/host_prompt_probe.mjs:11` (its own usage line) — the 165-line probe is documented nowhere |
| NB11 | `README.md:29-38` | The documentation set has no report index, no per-requirement status table and no pointer to the measurement artefacts, so a cold reader cannot learn from the README where the evidence lives or what was measured. | `tests-docs` | `swarm-lab-workflow-tests-docs.md:275-297`; nine artefacts in `.swarm/reports/` (at the lane's read time), none listed in the README; what *is* reconstructible: what was asked, and what was decided |
| NB12 | `tests/test_report.py:53-55` | `test_top_agrees_with_the_frequency_order` asserts one unit against another instead of against the expected result, so it would pass if both were wrong in the same way. | `tests-docs` | `swarm-lab-workflow-tests-docs.md:299-307`; the behaviour is separately pinned at `tests/test_report.py:38` and `:43` |
| NB13 | `tests/test_cli.py:114-118` | The both-files-missing test asserts the exit status and stderr but never asserts that stdout is empty, unlike the companion test at `:107-112`. | `tests-docs` | `swarm-lab-workflow-tests-docs.md:309-315`; companion asserts `result.stdout.count("total:") == 1` |
| NB14 | `tests/test_smoke.py:38-52` | The annotation test hard-codes the five known public functions and asserts only that annotations are not `None`, so it pins neither the required annotation types nor any public function added later. | `tests-docs` | `swarm-lab-workflow-tests-docs.md:317-324`; the exact signatures are pinned elsewhere at `tests/test_text.py:20-21,50-51`, `tests/test_stats.py:16-20`, `tests/test_report.py:18-22` |
| NB15 | `swarmlab/__main__.py:41-42` | The no-argument usage path of the public `main` is observable and pinned by no test in the suite. | `tests-docs` | `swarm-lab-workflow-tests-docs.md:326-335`; `python -m swarmlab` → `usage: python -m swarmlab <file> [<file> …]`, `EXITCODE=2`; `grep -r "usage\|argv=\[\]\|main\(\[\]\)"` over `tests/` → `No matches found` |
| NB16 | `tests/test_text.py:27-29` | The whitespace-collapse table covers space, tab, newline, CRLF and mixed runs but not the vertical tab or form feed, which the implementation's `str.split()` also collapses. | `tests-docs` | `swarm-lab-workflow-tests-docs.md:337-343`; implementation `swarmlab/text.py:9` = `" ".join(text.split())` |

**Closed by the concurrent remediation commit `4ce9aa8` (§2.3) — five of these
were fixed by it, verified by the merge stage's re-run of the suite and the
instrument:** NB2 (the README now states the Python 3.10 floor that
`swarmlab/__main__.py:33` implies), NB7 (a `test_cases` counter was added
beside `test_functions`, so the instrument now reports both `test_cases: 54`
and `test_functions: 51`), NB8 (the `self`/`cls` exemption was moved above the
`annotation is None` check, so the exemption is no longer dead code), NB10 (the
README now documents `tools/host_prompt_probe.mjs`, the comparison script and
the instrument's public surface) and — as a Material finding — M1 (§3.2).
NB5 is **partially** closed: the `<remediation commit>` placeholder is now
resolvable by binding it to `4ce9aa8`, but the requirement file text itself
still carries the placeholder. The remaining findings (NB1, NB3, NB4, NB6, NB9,
NB11, NB12, NB13, NB14, NB15, NB16) are open at merge time; all of them are
non-blocking and none of them touches R1–R10 behaviour.

### 3.4 Out of scope — 2

#### OOS1 — `tools/quality_compare.py:1` — the repository gained an untracked file during the fan-out, so the tree was not stable between lanes

*Lane:* `api` (`swarm-lab-workflow-api.md:83-100`).

```
--- git status (confirm read-only) ---
?? tools/quality_compare.py
Name                Length LastWriteTime
----                ------ -------------
host_prompt_probe.mjs   7547 11/10/2026 11:59:44 PM
quality_compare.py      5357 11/11/2026  9:03:43 AM
quality_report.py       6948 11/10/2026 11:57:45 PM
```

The `api` lane created only its report and modified no tracked file
(`git diff --stat` empty); the file belongs to a concurrent lane. Reported
because the acceptance baseline was a moving target during the round.

**Stale by merge time:** the file is now tracked, added by `8721ae1`
(`.swarm/reports/swarm-lab-quality-comparison.{json,md}` and
`tools/quality_compare.py`, `3 files changed, 309 insertions(+)`), and the
package sources it might have influenced were unchanged.

#### OOS2 — `swarmlab/__main__.py:24-29` — this host's console encoding cannot print non-ASCII tokens (R5/R10 territory, not the API lane)

*Lane:* `api` (`swarm-lab-workflow-api.md:102-121`).

The default stdout encoding of this host's console is GBK (cp936), which cannot
encode Latin-1 accented letters; `swarmlab/__main__.py:24-29` prints token text
directly.

```
UnicodeEncodeError: 'gbk' codec can't encode character '\xf6' in position 30: illegal multibyte character
```

The mechanism is demonstrated; the **end-to-end CLI consequence is not** —
exercising it would require a non-ASCII fixture file, which this read-only
lane may not create. The lane states this limitation explicitly
(`swarm-lab-workflow-api.md:347-350`), so no CLI failure is claimed here.

---

## 4. Counts per severity

| Severity | Count | IDs |
|---|---|---|
| Blocking | **0** | — |
| Material | **2** | M1 (tests-docs F1), M2 (tests-docs F2, narrowed) — **both closed at merge time by `4ce9aa8`** |
| Non-blocking | **16** | NB1–NB2 (`api`); NB3–NB4 (`cli`); NB5–NB16 (`tests-docs`) — **4 of them (NB2, NB7, NB8, NB10) closed by `4ce9aa8`** |
| Out of scope | **2** | OOS1–OOS2 (`api`) — OOS1 is stale: the file is now tracked |
| **Total** | **20** | |

Per lane: `api` 4 findings (0 blocking, 0 material, 2 non-blocking, 2 out of scope);
`cli` 2 findings (0/0/2/0); `tests-docs` 14 findings (0/2/12/0).

The counts above are the **fan-out's** counts — what the three lanes reported
against the tree they saw — and they are left unchanged so this round stays
comparable with the lanes' own output. A separate tally of what the concurrent
remediation `4ce9aa8` closed: **5 findings (M1, NB2, NB7, NB8, NB10)**; NB5 is
partially closed; M2's premise and subject are closed. The **open** set is
NB1, NB3, NB4, NB5 (textual residual), NB6, NB9, NB11, NB12, NB13, NB14, NB15,
NB16 — **12** non-blocking items, none of which touches R1–R10 behaviour.

Requirement verdicts at merge time: **10 met** (R1–R10) · **0 not met** · **0
not demonstrated** · **0 not in scope**. The `tests-docs` lane's own verdict for
R9 was `not demonstrated` at its read time; the merge stage re-adjudicated it
to `met` once `4ce9aa8` landed (§2.2.1).

---

## 5. Agreement and disagreement between the lanes

### 5.1 Agreement (overlapping subject matter)

1. **Whole-suite status.** All three lanes quote the same result independently:
   `api` (`swarm-lab-workflow-api.md:331-334` → `Ran 54 tests in 1.143s / OK /
   EXIT=0`), `cli` (`swarm-lab-workflow-cli.md:317-324` → `Ran 54 tests in
   1.474s / OK`), `tests-docs` (`swarm-lab-workflow-tests-docs.md:41-44` →
   `Ran 54 tests in 1.510s / OK / SUITE_EXITCODE=0`). The merge re-ran it
   (`Ran 54 tests in 1.538s / OK / SUITE_EXIT=0`), and again after the
   remediation landed (`Ran 54 tests in 1.544s / OK / SUITE_EXIT=0`). No
   disagreement.
2. **Instrument output.** `api` quotes the full JSON
   (`swarm-lab-workflow-api.md:310-326`), `tests-docs` quotes it again
   (`:362-378`), and the merge re-ran it. All three agree on
   `annotation_coverage: 1.0`, `docstring_coverage: 1.0`,
   `public_functions_without_tests_count: 0`, `test_functions: 51`. No
   disagreement.
3. **The fixture's numbers.** `cli` hand-counts the fixture
   (`swarm-lab-workflow-cli.md:146-169`: `total: 16`, `unique: 11`, `the: 4`,
   `dog: 2`, `fox: 2`) and `tests-docs` independently confirms the same figures
   (`swarm-lab-workflow-tests-docs.md:541-544`). Two lanes, one number set.
4. **The CLI's stdout/stderr separation.** `cli` proves it at raw byte level
   (`swarm-lab-workflow-cli.md:269-277`: `RAW_STDOUT_HAS_ERRORWORD=False`,
   `RAW_STDERR_HAS_SUMMARYWORD=False`); `api` observes the same rendering
   boundary from the encoding side (`swarm-lab-workflow-api.md:115-121`). Same
   fact, different angle, no conflict.
5. **Import purity.** `api` (assigned) proves R8 with an audit hook
   (`swarm-lab-workflow-api.md:244-278`); `tests-docs` runs the CLI and the
   suite without observing any import-time output and defers the verdict
   (`:541-544`). Compatible.
6. **The "no such file" wording.** `cli` finds it (NB3); the `api` lane, from a
   different angle, reaches the same print path (`swarmlab/__main__.py:24-29`).
   No conflict.
7. **Where the lanes overlap and each defers.** The `api` lane explicitly
   refuses to treat the instrument output as a verdict for R6/R7
   (`swarm-lab-workflow-api.md:307-309`: "supporting R1–R4, not assigned to this
   lane but quoted as corroboration"), and the `tests-docs` lane explicitly
   refuses to derive verdicts for R1–R5, R8 and R10
   (`swarm-lab-workflow-tests-docs.md:541-544`). The division of ownership was
   respected, so no requirement has two competing verdicts.

### 5.2 Divergences

| # | Subject | Divergence | Resolution |
|---|---|---|---|
| D1 | **R9's reason for `not demonstrated`** | `tests-docs` recorded the reason as "the round-R4 findings do not exist" (`swarm-lab-workflow-tests-docs.md:79-130`); the merge stage found `.swarm/reports/swarm-lab-reviewer.md` now present (35623 bytes, 09:07:38), and — later still — the remediation commit `4ce9aa8` on `HEAD`. | **Resolved by re-adjudication.** The lane's verdict was correct at its read time; once `4ce9aa8` landed, the merge stage re-ran R9's check with the placeholder bound to that commit: `git diff --stat cb51065 4ce9aa8 -- tests` → empty, `-- swarmlab` → empty, suite `Ran 54 tests in 1.544s / OK / SUITE_EXIT=0` (§2.2.1, §2.3). R9 is **`met`** at merge time; M2 is closed; the residual textual gap is NB5. |
| D2 | **Severity of the ellipsis / console encoding** | `api` treats the encoding issue as *Out of scope* (OOS2, "R5/R10 territory, not this lane"); `cli` treats the same character as *Non-blocking* portability (NB4); `tests-docs` declines to re-litigate it (`:560-562`). | Severity divergence only, not a factual one. The bytes are correct on this host under cp936 (`RAW_STDERR_GBK=…`); the finding is carried once, as NB4, with OOS2 kept as the API lane's scoped-out observation. |
| D3 | **Set of untracked files seen mid-round** | `api` saw only `?? tools/quality_compare.py`; `tests-docs` saw four untracked entries (three reports plus the same file); `cli` saw only the untracked report files (`swarm-lab-workflow-cli.md:384-385`). | Not a contradiction: each lane snapshotted the tree at a different moment while siblings were writing. Merge-stage `git status --porcelain` shows the final set: `?? .swarm/reports/swarm-lab-reviewer.md`, `?? swarm-lab-workflow-api.md`, `?? swarm-lab-workflow-cli.md`, `?? swarm-lab-workflow-tests-docs.md`. |
| D4 | **Weight of the instrument output** | `api` quotes `annotation_coverage` etc. as corroboration only; `tests-docs` treats the instrument as *the* named check but does not trust it, and re-derives R6 from the AST and R7 from call-site analysis (`:380-394`, `:436-453`). | No conflict; the stricter evidence wins for R6/R7. The lane's own F1/M1 records the instrument's unsoundness. |
| D5 | **Severity of the instrument's test-detection rule** | `tests-docs` rates it Material while stating the risk does not materialise in the current tree (`swarm-lab-workflow-tests-docs.md:76-77`). | Within the fan-out this is a single-lane judgement, uncorroborated by a second lane (no other lane audited the instrument). It is corroborated outside the fan-out by the round-R4 reviewer (`swarm-lab-reviewer.md:312`, same defect). Carried as M1. |

### 5.3 Corroboration from outside the fan-out (not counted in §4)

The round-R4 reviewer's report `.swarm/reports/swarm-lab-reviewer.md` (748
lines) post-dates the three lanes and independently adjudicates the same
requirement set: `R1=met R2=met R3=met R4=met R5=met R6=met R7=met R8=met
R9=not demonstrated R10=met` (`swarm-lab-reviewer.md:735`). Its findings line
up with this fan-out's: reviewer F1 ≈ M1, reviewer F2 ≈ NB8, reviewer F3 ≈ NB7,
reviewer F4 ≈ NB3, reviewer F6 ≈ NB2. It raises **two** Material findings, both
in the instrument, and **zero** blocking findings — the same shape as this
merge. It is not one of the three fan-out lanes, so its findings are **not**
included in the counts in §4 and are not merged into §3.

Its R9 verdict (`not demonstrated`) is also correct **for its read time**: the
reviewer wrote `swarm-lab-reviewer.md` at 09:07:38 and the remediation commit
`4ce9aa8` landed afterwards, so at that moment no remediation commit existed.
The merge stage's re-adjudication to `met` (§2.2.1) is the later, better-evidenced
state of the same requirement — the two verdicts differ in *time*, not in
evidence.

A second artefact outside the fan-out corroborates the merge stage's
re-adjudication: the remediation round's own report
`.swarm/reports/swarm-lab-remediation.md` (committed as `7612b0b`, 499 lines)
concludes "**R9 = met**" (`swarm-lab-remediation.md:442`) on the same two
empty diffs the merge stage ran (`swarm-lab-remediation.md:410-413`) and the
same commit id (`:399`). It is a *remediation* report, not a review report, so
its findings are not merged into §3 and not counted in §4.

---

## 6. What the fan-out did not check

Assembled from the three lanes' own "Not checked (and why)" sections.

**The `api` lane** (`swarm-lab-workflow-api.md:336-356`):

* R5, R6, R7, R9, R10 — not assigned; the whole-suite run and the quality report
  it quotes are context only, not verdicts.
* Minimum-Python-version compatibility below 3.12 — only the 3.12.14 interpreter
  exists on this host, so the PEP 604 concern (NB2) could not be demonstrated on
  3.9 or 3.10.
* End-to-end CLI behaviour with non-ASCII tokens — would require creating a
  non-ASCII fixture file, which this read-only lane may not do.
* `swarmlab.__main__` under a non-default locale or encoding — only GBK/cp936
  was available.
* `swarmlab` behaviour under a concurrent write to the tree — the package
  sources were unmodified, so its results reflect commit `0c0f566` plus one
  unrelated untracked file.

**The `cli` lane** (`swarm-lab-workflow-cli.md:363-385`):

* R9 — not assigned, and its check is git-based; the lane is read-only over the
  code and forbidden from git commit/add/checkout. **No git evidence gathered.**
* R1–R4, R6–R8 — not assigned; the CLI's output numbers were hand-checked
  against `tests/fixtures/sample.txt` only to confirm the CLI prints the
  required fields, not the correctness of the underlying primitives.
* The permission-denied variant of NB3 on a *regular* (non-directory) file —
  would need a file with revoked read permission; the directory case already
  raises the same `PermissionError` on this platform, so the code path is
  demonstrated and only the regular-file instance is inferred.
* Behaviour on a console with a non-GBK codepage — not tested.
* POSIX behaviour of the directory case — not tested (there it would be
  `IsADirectoryError`; both are `OSError` subclasses and both would still be
  reported as `no such file`).
* No modification of `swarmlab/`, `tests/`, `tools/` or the requirement file.

**The `tests-docs` lane** (`swarm-lab-workflow-tests-docs.md:538-562`):

* The correctness of the R1–R5 behaviour itself (the tokenizer, the frequency
  stats, the summary, the CLI contract) — assigned to other lanes; it ran the
  CLI only to confirm the fixture numbers and to expose the untested
  no-argument path (NB15).
* The `dsh-swarm-workflow` bundle and the `swarm_task` defect reported in
  `.swarm/reports/swarm-lab-r9-primitives.md` — another lane's work, under
  `D:\project\dsh-plugins`, which this lane did not read or modify.
* Whether round-R4 findings exist outside this workspace — the board was read
  (`swarm_task list`, `swarm_task get task-9`); if the Lead holds the findings
  elsewhere, F2/M2 narrows to "not recorded in the workspace" rather than "do
  not exist". (The merge stage has since found them in the workspace: §2.2.)
* The `swarm_task` write path (claim/complete from that session) — the session
  was not a team member; the board was readable only through a read-only relay.
* `tools/host_prompt_probe.mjs`'s behaviour — it loads the installed bundle on
  the host runtime; it was not run, only its presence and its absence from the
  documentation set were checked (NB10).
* Windows console encoding of the usage string — not re-litigated.

**Nobody in the fan-out checked:**

* Whether a *remediation* round of the round-R4 findings preserves R1–R5
  behaviour — no remediation existed while the lanes ran, which is what the
  `tests-docs` lane's R9 verdict recorded. The merge stage did check it once
  `4ce9aa8` landed: `swarmlab/` and `tests/` are byte-identical between
  `cb51065` and `4ce9aa8`, and the suite still exits `0` (§2.2.1, §2.3).
* The behaviour of `tools/quality_compare.py` — only its presence and its
  eventual commit were observed; no lane ran it.
* The round-R4 reviewer's report itself — it appeared after the lanes finished
  (09:07:38, after the last lane report at 09:07:29), so no lane read it.
* Any behaviour under Python < 3.12, on a non-GBK console, on POSIX, or under a
  concurrent write to the tree.
* The remediation round's own report — it did not exist while the lanes ran;
  it appeared at 09:16:02 (`.swarm/reports/swarm-lab-remediation.md`, committed
  as `7612b0b`) and independently records "R9 = met"
  (`swarm-lab-remediation.md:442`).

---

## 7. Merge-stage integrity notes

* The merge stage **wrote exactly one file**: this report,
  `.swarm/reports/swarm-lab-workflow.md`. It modified nothing else and ran no
  git write command (`git status`, `git log`, `git show`, `git diff --stat`,
  `git cat-file` only).
* Merge-stage commands were read-only except for running the test suite and
  the instrument (which write `__pycache__` artifacts, as the lanes' runs did).
* **The working tree changed under the merge stage, but not by the merge
  stage.** Mid-merge, `git status --porcelain` showed ` M README.md` and
  ` M tools/quality_report.py` — a concurrent remediation round (§2.3) — which
  the merge stage observed and re-measured but did not author, stage or commit.
  By the end of the merge that work had been committed by the other round as
  `4ce9aa8`, and the merge stage's final `git status --porcelain` shows **no
  modified tracked file at all**, only untracked reports:

  ```
  ?? .swarm/reports/swarm-lab-reviewer.md
  ?? .swarm/reports/swarm-lab-workflow-api.md
  ?? .swarm/reports/swarm-lab-workflow-cli.md
  ?? .swarm/reports/swarm-lab-workflow-tests-docs.md
  ?? .swarm/reports/swarm-lab-workflow.md
  ```

  The merge stage's own footprint in `git status` is the single untracked
  `?? .swarm/reports/swarm-lab-workflow.md`.
* The tree was **not stable during the fan-out either**: the API lane saw
  `tools/quality_compare.py` appear at 09:03:43, the lane reports were written
  at 09:05:13 / 09:05:44 / 09:07:29, the quality-comparison artefacts were
  committed at 09:07:25 (`8721ae1`), the round-R4 reviewer's report was
  written at 09:07:38 — after the last lane had finished — and the remediation
  round committed twice more during the merge (`4ce9aa8`, then `7612b0b`).
  Every lane's findings are therefore stamped against a slightly different
  tree; the package sources themselves (`swarmlab/`, `tests/`) were **not**
  modified during the round, as `git diff --stat cb51065 7612b0b -- swarmlab`
  and `-- tests` are both empty (the final `HEAD` is `7612b0b`).
* **Claims checked against the reports.** Every claim in the three structured
  lane results was located in the corresponding report file; none had to be
  marked unverified. The only claims the merge stage could not independently
  confirm are the lanes' code-level assertions about sources it did not re-read
  (`tools/quality_report.py:56-68`, `:92-99`, `:102-106`, `:149`, the test files'
  internal line numbers, and the `README.md` wording). Those are carried as
  *lane findings* with the lane's own evidence quoted, not as merge-stage
  findings; the merge stage did re-read `swarmlab/__main__.py` in full and
  confirmed the citations quoted in NB3, NB4, NB15 and M2's neighbourhood.

---

## 8. Merge verdict

The package satisfies **all ten** requirements on executed evidence:
R1, R2, R3, R4 (live signatures plus clause suites), R5 and R10 (byte-level CLI
runs with separated streams), R6 (instrument plus an independent AST
re-derivation), R7 (54/54 tests plus an independent call-site analysis that
does not rely on the instrument), and R8 (silent, side-effect-free imports from
two working directories, audited).

**R9 is `met` at merge time**, by re-adjudication rather than by the lane's
own verdict: the `tests-docs` lane closed it `not demonstrated` because the
round-R4 findings and the remediation commit did not exist yet. Both now exist
(`.swarm/reports/swarm-lab-reviewer.md`, and the remediation commit `4ce9aa8`),
and the merge stage re-ran the check against them — `git diff --stat cb51065
4ce9aa8 -- tests` empty, `-- swarmlab` empty, suite `Ran 54 tests in 1.544s /
OK / SUITE_EXIT=0` (§2.2.1). The behaviour invariance R9 asks for is therefore
demonstrated, not asserted: `swarmlab/` and `tests/` are byte-identical between
`cb51065` and `4ce9aa8`.

**Zero blocking findings.** The two Material findings are both in the
measurement instrument, not in the package: M1 (the "is it tested?" rule is a
substring match) and M2 (R9's unsatisfiable premise). Neither touches R1–R8 or
R10 behaviour, and **both were closed by `4ce9aa8`** (§2.3): the instrument now
detects call sites instead of substrings, and R9's premise and subject both
exist.

**The residual, stated plainly.** One thing is *not* done and is recorded as
such, not hidden:

* The requirement file still carries the unbound placeholder
  `.swarm/requirements/swarm-lab.md:110` (`<remediation commit>`); the merge
  stage bound it to `4ce9aa8` in this report instead of editing the
  requirement carrier (NB5). The remediation round's own report
  `.swarm/reports/swarm-lab-remediation.md:399` records the same binding
  (full id `4ce9aa86eb0e53078ded152e7c141f283dad5634`), so the check is
  reproducible from two independent records.

Everything else the round-R4 reviewer asked for has been done: the remediation
commit exists and is named, the diff window is empty and quoted, and the
remediation round wrote its own report.

Twelve non-blocking findings remain open (§4); none of them changes an
observable result of R1–R10. The merge stage wrote only this report and ran no
git write command.

---

*Merge stage. Exactly one file written: `.swarm/reports/swarm-lab-workflow.md`.*
