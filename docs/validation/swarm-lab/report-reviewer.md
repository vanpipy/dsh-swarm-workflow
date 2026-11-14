# swarm-lab — Reviewer lane report (round R4)

Lane: Reviewer (`pyreview`). Work item: `swarm-lab`, round R4, repository
`D:\project\swarm-lab-python`.

Requirement carriers read before starting:

- shared-board task `task-9` (revision 1 read → claimed → revision 2), read with
  `team_task_get`;
- the durable requirement file `D:\project\swarm-lab-python\.swarm\requirements\swarm-lab.md`
  (136 lines, read in full).

**Carrier comparison.** `task-9` carries the review assignment itself and names the requirement
file as the carrier of R1–R10; it does not restate the requirement text. I found no disagreement
between the task and the file. Where the Developer and Tester reports describe a requirement
differently from the file, the file wins — the one place where that matters is R9, which the file
carries and `task-4` did not.

---

## 0. Scope, environment and method

**Scope of the review.** The `swarmlab` package (5 modules), its test suite (5 files), the quality
instrument `tools/quality_report.py`, the fixture, the README, and the `.swarm` requirement and
decision records. I read the swarmlab source, the tests, the instrument, the decisions and the
prior lane reports in full.

**Environment.** `python` is not on PATH. Every command below was run with

```
C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe
```

(Python 3.12.14), from the repository root, unless the working directory is named. No dependency was
installed. No git write was performed; the only git commands used were `log`, `show`, `diff`,
`status`, `cat-file`.

**Method.** I did not take the Developer or Tester lanes' word for anything. I re-ran the suite,
the quality instrument, the four clause suites, and every CLI scenario named in the requirement
checks, and I captured exit codes with `cmd /v:on /c "... & echo EXIT=!ERRORLEVEL!"` (a plain
`%ERRORLEVEL%` expands at parse time inside a `cmd /c` string and silently reports the wrong
value). Where a requirement's own check is an instrument, I also probed the instrument on a
throwaway copy at `%TEMP%\swarmlab-instrument-probe` to find out whether the check can actually
discriminate — a check that passes for the wrong reason is not evidence. The repository was not
modified by any probe.

**Files changed by this lane.** Exactly one: this report. `git diff --stat` is empty — no tracked
file in the repository was modified by anyone or anything during this review.

`git status --porcelain` at the end of the review shows this report as untracked alongside other
untracked files that are **not mine** and that I did not touch —
`.swarm/reports/swarm-lab-quality-comparison.json`, `.swarm/reports/swarm-lab-quality-comparison.md`,
`.swarm/reports/swarm-lab-workflow-api.md`, `.swarm/reports/swarm-lab-workflow-cli.md`,
`.swarm/reports/swarm-lab-workflow-tests-docs.md` and `tools/quality_compare.py`. They appeared
during my round (my earlier `git status --porcelain` was empty, and the list grew between two of
my checks) and belong to a concurrent lane; I list them only so that "untracked" is not misread
as "changed by this lane". The instrument probes were run on a throwaway copy of the repository at
`%TEMP%\swarmlab-instrument-probe`, outside the repository.

---

## 1. Requirement verdicts

```
R1=met  R2=met  R3=met  R4=met  R5=met  R6=met  R7=met  R8=met  R9=not demonstrated  R10=met
```

| Requirement | Verdict | Requirement (`task-9`, detail in `.swarm/requirements/swarm-lab.md`) |
| --- | --- | --- |
| R1 | **met** | `swarmlab.text.normalize_ws(text: str) -> str` collapses whitespace runs, strips ends, preserves order, `""` for blank input |
| R2 | **met** | `swarmlab.text.tokenize(text: str) -> list[str]` lowercase alphanumeric tokens in order |
| R3 | **met** | `swarmlab.stats.word_frequency(tokens: list[str]) -> list[tuple[str, int]]` count desc, then token asc |
| R4 | **met** | `swarmlab.report.summarize(tokens: list[str]) -> dict[str, object]` with `total`, `unique`, `top` |
| R5 | **met** | `python -m swarmlab <file>` prints the summary, exits 0; missing file → stderr message, exit 2 |
| R6 | **met** | every public function annotated, every public module documented |
| R7 | **met** | every public function exercised by ≥1 test case, whole suite passes |
| R8 | **met** | no import-time side effects, importable from another directory |
| R9 | **not demonstrated** | R1–R5 behaviour unchanged during R4 remediation — the remediation does not exist yet |
| R10 | **met** | multi-file command line: one summary block per file, first missing file stops the run |

### R1 — `swarmlab.text.normalize_ws` — **met**

*Check discriminates?* Yes: the clause suite and the signature assertion both fail if the
behaviour or the shape changes.

```
=== python -m unittest tests.test_text.TestNormalizeWs ===
.......      Ran 7 tests in 0.001s      OK      exit=0
```

Signature, printed by me:

```
normalize_ws    (text: str) -> str
```

Implementation: `swarmlab/text.py:9` — `return " ".join(text.split())`. `str.split()` with no
argument splits on runs of any whitespace and discards the ends, which is the required behaviour
with no regular expression to keep in sync. Behaviour confirmed by the suite
(`tests/test_text.py:24,29,32,33,36,39,44` — single spaces, tabs/newlines, stripped ends, empty
string, whitespace-only string) and by the exact-signature assertion at `tests/test_text.py:21`.

### R2 — `swarmlab.text.tokenize` — **met**

```
=== python -m unittest tests.test_text.TestTokenize ===
..........    Ran 10 tests in 0.001s    OK      exit=0
```

Signature: `tokenize (text: str) -> list[str]`; asserted at `tests/test_text.py:51`.

Implementation: `swarmlab/text.py:12` — `[match.group(0).lower() for match in _TOKEN_PATTERN.finditer(text)]`
with `_TOKEN_PATTERN = re.compile(r"[^\W_]+")` at `swarmlab/text.py:4`. `\W` is "not a word
character" and word characters are letters, digits and underscore, so `[^\W_]` is exactly a run of
*alphanumeric* characters — the underscore is a separator, as the requirement says. The suite
covers the separator cases directly (`tests/test_text.py:68,69,70` — `a_b`, `snake_case_name`,
`_leading`), the digit case (`:73`, `:76`), the empty case (`:79`, `:84`) and the lowercase rule
(`:55`).

### R3 — `swarmlab.stats.word_frequency` — **met**

```
=== python -m unittest tests.test_stats.TestWordFrequency ===
.........     Ran 9 tests in 0.001s    OK      exit=0
```

Signature: `word_frequency (tokens: list[str]) -> list[tuple[str, int]]`; asserted at
`tests/test_stats.py:16`.

Implementation: `swarmlab/stats.py:6` — `sorted(Counter(tokens).items(), key=lambda pair: (-pair[1], pair[0]))`.
Count descending, then token ascending, is a total order, so the result is stable and the suite can
assert the tie-break (`tests/test_stats.py:43`, `:47`, `:48`).

### R4 — `swarmlab.report.summarize` — **met**

```
=== python -m unittest tests.test_report.TestSummarize ===
.........     Ran 9 tests in 0.001s    OK      exit=0
```

Signature: `summarize (tokens: list[str]) -> dict[str, object]`; asserted at
`tests/test_report.py:18`.

Implementation: `swarmlab/report.py:6` — `{"total": len(tokens), "unique": len(pairs), "top": pairs[:5]}`.
The "fewer than five distinct tokens" case is exercised at `tests/test_report.py:42` and `:51`
(`summarize([])` → `{"total": 0, "unique": 0, "top": []}`), and the agreement with
`word_frequency` at `:55`.

### R5 — the package runs as a module — **met**

*Check discriminates?* Yes: it fixes both the exit status and the stream each message goes to.

```
> python -m swarmlab tests/fixtures/sample.txt
file: tests/fixtures/sample.txt
total: 16
unique: 11
top tokens:
  the: 4
  dog: 2
  fox: 2
  and: 1
  barks: 1
EXIT=0
```

```
> python -m swarmlab does-not-exist.txt
stdout: 0 bytes
stderr (44 bytes): "swarmlab: no such file: does-not-exist.txt\n"
EXIT=2
```

Byte-level stream separation was measured with `cmd.exe` redirection to separate files, because
PowerShell's `2>&1` merges the two streams. Implementation: `swarmlab/__main__.py:11-14` (`_fail`)
and `:17-30` (`_print_summary`); the message is built at `swarmlab/__main__.py:45`.

### R6 — every public function is annotated — **met**

*Check discriminates?* Yes, in the safe direction: it can report a false failure but never a
false pass (see Finding 2 for the false-failure mode).

```
> python tools/quality_report.py --json
  "annotation_coverage": 1.0,
  "docstring_coverage": 1.0,
  "module_docstring_coverage": 1.0,
  "package_modules": 5,
  "public_functions": 5,
```

The instrument's own logic is `tools/quality_report.py:56-68` (`is_annotated`) and `:139`/`:144`
(module docstring and function docstring counting). The five public functions it names are
`main`, `normalize_ws`, `summarize`, `tokenize`, `word_frequency`.

### R7 — every public function is tested — **met**

*Check discriminates?* **The instrument half does not** — see Finding 1. The requirement is
nevertheless met, and I did not rely on the instrument for it.

The suite, run by me:

```
> python -m unittest discover -s tests -t .
Ran 54 tests in 1.533s
OK
unittest exit code = 0
```

Every public function has a real call site in the test package — this is the evidence the
requirement asks for, and it is independent of the instrument:

| Public function | Call sites in `tests/` |
| --- | --- |
| `normalize_ws` | `tests/test_text.py:24,29,32,33,36,39,44` |
| `tokenize` | `tests/test_text.py:54,55,58,61,64,65,68,69,70,73,76,79,84` |
| `word_frequency` | `tests/test_stats.py:23,28,31,39,43,47,48,53,56` |
| `summarize` | `tests/test_report.py:25,30,33,37,42,46,51,55` |
| `main` | `tests/test_smoke.py:66,76` (direct calls) and `tests/test_cli.py` (via the `python -m swarmlab` subprocess helper `run_module`, `tests/test_cli.py:25-32`) |

### R8 — no import-time side effects — **met**

*Check discriminates?* Partly — it catches printing and process exit, but not a silent side
effect such as a file write. See "What I did not check".

```
swarmlab      -> exit=0, stdout and stderr empty
swarmlab.text -> exit=0, stdout and stderr empty
swarmlab.stats-> exit=0, stdout and stderr empty
swarmlab.report-> exit=0, stdout and stderr empty
```

From another directory (`%TEMP%`, with `PYTHONPATH=D:\project\swarm-lab-python` because the
package is not installed and nothing may be installed on this host): exit 0, no output. The only
module-level statements are the module docstring and the imports at `swarmlab/__init__.py:1-5`;
the CLI is guarded by `if __name__ == "__main__":` at `swarmlab/__main__.py:49-50`.

### R9 — the behaviour must not change during remediation — **not demonstrated**

The check has three parts; two of them hold and one cannot be run at all.

1. `cb51065` exists — **satisfied**: `git cat-file -t cb51065` → `commit`.
2. `git diff --stat cb51065 <remediation commit> -- tests` is empty — **not runnable**: there is
   no remediation commit. `git log --all --oneline` lists only the six known commits
   (`120483e`, `6735104`, `d08eac1`, `cb51065`, `622349b`, `0c0f566`), so no such commit exists on
   any ref.
3. The suite still exits 0 — **satisfied**: exit 0, 54 tests, OK (above).

There is therefore no evidence either way about behaviour preservation across a remediation, so the
verdict is `not demonstrated` and it **blocks acceptance** until a remediation commit exists and
the diff is shown to be empty.

Useful baseline for the next round, measured by me:

```
> git diff --stat cb51065 HEAD -- swarmlab     (empty)
> git diff --stat cb51065 HEAD -- tests        (empty)
```

`swarmlab/` and `tests/` are both byte-identical to the round-R3 commit `cb51065`. The
remediation commit will be the first commit to touch either tree, so the R9 check becomes
runnable the moment it exists.

### R10 — the command line summarises several files — **met**

```
> python -m swarmlab tests/fixtures/sample.txt tests/fixtures/sample.txt
file: tests/fixtures/sample.txt
total: 16
...
file: tests/fixtures/sample.txt
total: 16
...
EXIT=0
```

Two blocks, in the order the files were given.

```
> python -m swarmlab tests/fixtures/sample.txt does-not-exist.txt
stdout: the full summary block of the first file (retained)
stderr: "swarmlab: no such file: does-not-exist.txt\n"
EXIT=2
```

```
> python -m swarmlab does-not-exist.txt also-missing.txt
stderr: "swarmlab: no such file: does-not-exist.txt\n"   (only the first missing file is named)
EXIT=2
```

The "stop at the first missing file" behaviour is `swarmlab/__main__.py:43-45`: the `for` loop
returns `_fail(...)` on the first failure, so the later file is never attempted. This matches the
human decision of 2026-11-11
(`.swarm/decisions/2026-11-11-cli-multiple-files.md`).

---

## 2. Findings

Severity scale: **Blocking** (prevents correctness, required behaviour or acceptance) ·
**Material** (significant defect or risk that should be addressed before acceptance) ·
**Non-blocking** (improvement opportunity that does not prevent the requested outcome) ·
**Out of scope**.

```
blocking=0  material=2  nonblocking=5  outofscope=2
```

---

### F1 — Material — the R7 acceptance instrument cannot tell an untested function from a tested one

**Location** `tools/quality_report.py:149` (with `:102-106`).

**Evidence.** Line 149 is
`tested = {name for name in names if name in test_sources()}` — a plain substring test of the
function name against the *concatenated text* of every file under `tests/`. I probed it on a
throwaway copy of the repository at `%TEMP%\swarmlab-instrument-probe`:

- added `def zebra_helper(value: int) -> int` to `swarmlab/text.py` — a public function **never
  called by any test**;
- added one line to `tests/test_smoke.py`:
  `# zebra_helper is never called by any test; this comment mentions it only.`

The instrument still reported:

```
  "public_function_names": [ "main", "normalize_ws", "summarize", "tokenize", "word_frequency", "zebra_helper" ],
  "public_functions": 6,
  "public_functions_without_tests": [],
  "public_functions_without_tests_count": 0,
```

**Problem.** The check that R7 names as its proof is satisfied by a *comment*. It does not
discriminate: an untested public function and a tested one produce the same output.

**Impact.** R7's own check is unsound as written. Today the answer (0) happens to be correct —
I verified every one of the five public functions is genuinely exercised by the call-site evidence
in §1 — but the instrument would keep reporting `0` if the next round added an untested public
function, and R7 would still read `met`. It also means the instrument cannot be used to prove R7
*after* a remediation, which is exactly what the next round needs.

**Reproduction.**

```
copy the repo to %TEMP%\swarmlab-instrument-probe
append a public function to swarmlab/text.py
append a comment naming it to any file under tests/
python tools/quality_report.py --json
# -> "public_functions_without_tests_count": 0
```

**Recommendation.** Make the check look for a *call* rather than an occurrence: parse each test
file and collect the `ast.Call` targets, then compare that set against the public function names.
As a cheaper interim step, at minimum match `f"{name}("` instead of `name`.

---

### F2 — Material — the `self`/`cls` exemption in the annotation check is unreachable dead code

**Location** `tools/quality_report.py:60-63`.

**Evidence.** The loop is

```python
for index, argument in enumerate(parameters):
    if argument.annotation is None:          # line 60  <- fires first
        return False
    if index == 0 and argument.arg in {"self", "cls"}:   # line 62-63  <- never reached for self/cls
        continue
```

A conventional method leaves `self` unannotated, so line 60 returns `False` before line 62 can
exempt it. Probe: adding `swarmlab/probe_cls.py` containing

```python
class Probe:
    def run(self, value: int) -> int:
        """Return the value unchanged."""
        return value
```

— a **fully annotated** method — moved the instrument to

```
  "annotation_coverage": 0.8571,     (was 1.0)
  "public_function_names": [ "main", "normalize_ws", "run", "summarize", "tokenize", "word_frequency", "zebra_helper" ],
```

**Problem.** The exemption exists in the code but can never execute. The instrument therefore
reports an annotated method as unannotated.

**Impact.** Latent — `swarmlab` contains no class today, so R6's verdict is unaffected. The risk
is a false regression signal: if the remediation round (or any later round) adds a class to the
package, R6's check will report `annotation_coverage` below 1.0 for a fully annotated method, and
a correct change will look like a quality regression. Note the direction of the error: the
instrument can produce a false *failure* for R6, never a false *pass*.

**Reproduction.** The probe above; the same file in the repository reproduces it deterministically.

**Recommendation.** Move the `self`/`cls` exemption above the `annotation is None` check:

```python
for index, argument in enumerate(parameters):
    if index == 0 and argument.arg in {"self", "cls"}:
        continue
    if argument.annotation is None:
        return False
```

---

### F3 — Non-blocking — `test_functions` counts unique names, not test cases

**Location** `tools/quality_report.py:92-99` and `:165`.

**Evidence.** `test_names()` returns a **set** of names, so four test classes that share the name
`test_signature_is_the_required_one` collapse into one entry:

- `tests/test_text.py:20` — `TestNormalizeWs.test_signature_is_the_required_one`
- `tests/test_text.py:50` — `TestTokenize.test_signature_is_the_required_one`
- `tests/test_stats.py:16` — `TestWordFrequency.test_signature_is_the_required_one`
- `tests/test_report.py:18` — `TestSummarize.test_signature_is_the_required_one`

Census: `tests/test_cli.py` 10 cases, `tests/test_smoke.py` 9, `tests/test_text.py` 17 (7+10),
`tests/test_stats.py` 9, `tests/test_report.py` 9 → **54 executed**, 16+8+8+9+10 = **51 unique
names**. The instrument reports `"test_functions": 51`.

**Problem.** The field name suggests a count of test functions; the value is a count of distinct
*names*.

**Impact.** No effect on any R1–R10 verdict — the suite's real count is 54, which is what
`unittest` reports. The risk is a reader comparing `test_functions: 51` against "Ran 54 tests"
and concluding that three tests are missing or skipped. This confirms and extends the risk flagged
in the round brief: the discrepancy is real, it is a naming artefact, and no test is being skipped.

**Reproduction.** Compare `python tools/quality_report.py --json` (`"test_functions": 51`) with
`python -m unittest discover -s tests -t .` (`Ran 54 tests`).

**Recommendation.** Report both numbers — keep `test_functions` for compatibility and add
`test_cases` (counting `ast.FunctionDef` occurrences, not the set) — and say which is which in
the README.

---

### F4 — Non-blocking — every read error is reported as "no such file"

**Location** `swarmlab/__main__.py:19-22` (the `except OSError: return False`) and
`swarmlab/__main__.py:45` (the message).

**Evidence.** A path that exists but is a directory:

```
> python -m swarmlab tests/fixtures
stdout: 0 bytes
stderr: "swarmlab: no such file: tests/fixtures\n"
EXIT=2
```

`tests/fixtures` exists — the message is wrong about why the run failed. The same path would be
taken for a permission error. This is a deliberate, documented decision by the Developer lane
(`.swarm/reports/swarm-lab-developer.md:247-250`, decision 4: "Every `OSError` while reading the
file (missing file, directory, unreadable path) produces `swarmlab: no such file: <path>`").

**Problem.** The message does not distinguish the failure modes.

**Impact.** Cosmetic for the requirements: R5 and R10 pin the message only for a file that does
not exist, and the missing-file case is exact and correct. **This must not be changed during the
R5 remediation round** — R9 forbids any change to the observable behaviour of R1–R5, and the
message text is asserted by the test suite.

**Reproduction.** `python -m swarmlab tests/fixtures` (any directory).

**Recommendation.** Leave it for this round. If a better message is wanted, it needs a requirement
change first (and the R5 wording would then need updating in the same change).

---

### F5 — Non-blocking — the error message can appear before the summaries when the streams are merged

**Location** `swarmlab/__main__.py:44-45` (write to stdout, then write to stderr).

**Evidence.** With the two streams merged into one pipe (`2>&1`), the stderr line appears *before*
the stdout summaries:

```
swarmlab: no such file: does-not-exist.txt
file: tests/fixtures/sample.txt
total: 16
...
```

**Problem.** Standard output is block-buffered when it is a pipe, while standard error is
unbuffered, so the error overtakes the summaries.

**Impact.** Cosmetic only. The streams are separately correct and correctly separated — R10's
requirement ("the summaries printed before it stay on standard output") is satisfied, and the
byte-level measurement in §1 confirms stdout carries the earlier summary and stderr carries the
message. A reader of a merged log sees the error first.

**Reproduction.** `python -m swarmlab tests/fixtures/sample.txt does-not-exist.txt 2>&1 | cat`

**Recommendation.** Optional: flush stdout before writing the error
(`sys.stdout.flush()` in `_fail`), or leave it.

---

### F6 — Non-blocking — the package's Python floor is undocumented and higher than the annotations suggest

**Location** `swarmlab/__main__.py:33`; `README.md` (no version statement anywhere).

**Evidence.** `swarmlab/__main__.py:33` is `def main(argv: list[str] | None = None) -> int:`. The
`|` union is PEP 604 and is **evaluated at runtime** here, because no module in the package uses
`from __future__ import annotations` (a `Select-String` for it across `swarmlab/*.py` found
none). Confirmed at runtime:

```
swarmlab.__main__.main.__annotations__['argv']  ==  list[str] | None
type(...)                                       ==  types.UnionType
```

`list[str]` / `dict[str, object]` alone need Python 3.9; the `X | None` annotation needs 3.10.
The README declares no minimum version, and the repository has no packaging metadata
(`pyproject.toml` / `setup.py` are absent), so nothing records the floor.

**Impact.** On Python 3.9 the package raises `TypeError` at import time of `swarmlab.__main__`;
the failure is at import, not at first use, and the message would not name the version requirement.
This does not affect any verdict on this host (3.12.14).

**Reproduction.** On a 3.9 interpreter: `python -c "import swarmlab.__main__"`.

**Recommendation.** One line in `README.md`: "Requires Python 3.10 or newer." Optionally add
`from __future__ import annotations` to the modules, which would lower the floor to 3.9 for the
annotation syntax — but note the Developer's decision 1 deliberately avoided that import so that
`inspect.signature` reports real annotation objects rather than strings; changing it would need
the R1–R4 signature assertions to be re-checked.

---

### F7 — Non-blocking — the instrument's public surface and the package's exported surface disagree

**Location** `swarmlab/__init__.py:7-15`; `tools/quality_report.py:48-53`.

**Evidence.**

```
hasattr(swarmlab, 'main')            -> False
swarmlab.__all__                     -> ['normalize_ws', 'report', 'stats', 'summarize', 'text', 'tokenize', 'word_frequency']
from swarmlab import *  exports      -> the same 7 names
instrument public_function_names      -> ['main', 'normalize_ws', 'summarize', 'tokenize', 'word_frequency']
```

**Problem.** The instrument counts any non-underscore `def` in the package as "public"
(`tools/quality_report.py:51`), which includes `main` in `swarmlab/__main__.py` — a CLI entry
point that the package deliberately does not export.

**Impact.** None on the R1–R10 verdicts: `main` *is* exercised (by `tests/test_smoke.py:66,76`
and by `tests/test_cli.py`), so R7 holds either way. The inconsistency matters only if a later
round changes what "public" means — the instrument would keep counting `main` while `__all__`
does not. Not exporting `main` from `swarmlab/__init__.py` is the right design (importing
`swarmlab.__main__` from `__init__` would be a circular import).

**Reproduction.** `python -c "import swarmlab; print(hasattr(swarmlab,'main'), swarmlab.__all__)"`

**Recommendation.** Either document in the README that the quality instrument's "public surface"
includes the CLI entry point, or have the instrument read `__all__` where one exists.

---

### F8 — Out of scope — unreferenced tooling in the repository

**Location** `tools/host_prompt_probe.mjs` (165 lines; added in round R2 by another lane).

**Evidence.** A repository-wide grep for `host_prompt_probe` returns exactly one hit — the
script's own header comment at `tools/host_prompt_probe.mjs:11`. The README, the test suite and
every other script in the repository do not mention it.

**Impact.** Dead weight in the repository; no effect on any requirement or on the package.

**Reproduction.** `grep -r host_prompt_probe D:\project\swarm-lab-python`

**Recommendation.** Out of scope for this round. The next round should either reference it from
the README or remove it.

---

### F9 — Out of scope — R9 is a gate on the remediation round, not on the code under review

**Location** `.swarm/requirements/swarm-lab.md:101-113`.

**Evidence.** The requirement is about what happens *while the round-R4 findings are remediated*:
the check names `<remediation commit>`, and `git log --all --oneline` shows only the six known
commits.

**Impact.** R9 cannot be judged against the current tree; the verdict is `not demonstrated`, not
`not met`. The review's job here is to hand the next round a verifiable baseline, which §1
provides (`git diff --stat cb51065 HEAD -- swarmlab` and `-- tests` are both empty today).

**Recommendation.** The remediation round must re-run §1's R9 check and record the commit id in
its own report.

---

## 3. Measured code-quality comparison

All three columns are `python tools/quality_report.py --json` output. The baseline columns are the
stored reports `.swarm/reports/swarm-lab-quality-r2.json` (after R2) and
`.swarm/reports/swarm-lab-quality-r2b.json` (after R2b); the last column is my own run against
the current tree (`HEAD` = `0c0f566`).

| Metric | after R2 | after R2b | now (measured) | direction |
| --- | --- | --- | --- | --- |
| `annotation_coverage` | 1.0 | 1.0 | 1.0 | held |
| `docstring_coverage` | 1.0 | 1.0 | 1.0 | held |
| `module_docstring_coverage` | 1.0 | 1.0 | 1.0 | held |
| `duplicate_line_ratio` | 0.0 | 0.0 | 0.0 | held |
| `package_modules` | 5 | 5 | 5 | held |
| `public_functions` | 5 | 5 | 5 | held |
| `public_functions_without_tests_count` | 0 | 0 | 0 | held (but see F1) |
| `avg_function_length` | 6.4 | 5.6 | 5.6 | improved |
| `max_function_length` | 18 | 14 | 14 | improved |
| `max_nesting_depth` | 1 | 2 | 2 | regressed |
| `test_functions` | 9 | 51 | 51 | grew (see F3) |

**Attribution, from git rather than inference.** `git diff --stat 6735104 d08eac1 -- swarmlab`
shows a single changed file — `swarmlab/__main__.py | 30 +++++++++++++++++++++---------` (21
insertions, 9 deletions) — so both the `avg_function_length` improvement (6.4 → 5.6) and the
`max_function_length` improvement (18 → 14) come from the round-R2b rewrite of the CLI, which
split the old 18-line `main` into `_print_summary` (`swarmlab/__main__.py:17-30`, 14 lines) and
`main` (`swarmlab/__main__.py:33-46`, 14 lines). The `test_functions` growth from 9 to 51 is the
Tester's round-R3 clause files, not a change to the package.

**The one regression is `max_nesting_depth` 1 → 2**, and it comes from the same rewrite: `main`
now nests a `for` loop (`swarmlab/__main__.py:43`) around an `if` (`:44`). It is the direct
consequence of the human-requested R10 multi-file behaviour
(`.swarm/decisions/2026-11-11-cli-multiple-files.md`), and it is inherent to the
"loop over the files, stop at the first failure" structure that R10 requires.

**Answer to the round's question — did agentic coding measurably improve the code?** On this
package, measured by this instrument: **yes, modestly and verifiably.** Between round R2 and
today, `avg_function_length` fell from 6.4 to 5.6 (−12.5 %), `max_function_length` fell from 18 to
14 (−22 %), and all three coverage metrics stayed at 1.0 with `duplicate_line_ratio` at 0.0. The
single regression (`max_nesting_depth` 1 → 2) is attributable to a human-requested feature, not to
an agentic change. Two caveats on the strength of that conclusion: (a) this is one small package
of 5 modules and 5 public functions, so the effect is real but narrow; and (b) the instrument's
own reliability is limited by F1 and F2 — a future change that added an untested public function
would not have been caught, and a future change that added a class would have been wrongly
flagged. Fixing F1 and F2 makes the next round's measurement trustworthy.

---

## 4. What I did NOT check, and why

1. **The remediation itself.** R9's check needs a remediation commit; none exists on any ref
   (`git log --all --oneline` shows only the six known commits). Behaviour preservation across a
   remediation is therefore unobserved, and R9 is `not demonstrated`. This is the one thing the
   next round must produce.
2. **Packaging and installation.** The repository has no `pyproject.toml` and no `setup.py`. I did
   not run `pip install`, `python -m build`, `pip wheel`, or an installed-import scenario. The
   R8 "importable from another directory" evidence therefore depends on `PYTHONPATH` pointing at
   the repository root; an installed package was never exercised. *Uncertainty: if the acceptance
   run expects a plain `python -c "import swarmlab"` from another directory with no path
   configuration, that is not satisfiable on this host without an install step.*
3. **A Python version matrix.** Every command ran on 3.12.14 only. I did not execute 3.9, 3.10,
   3.11 or 3.13. The ≥3.10 floor in F6 is derived from the runtime `types.UnionType` observation
   and the PEP 604 specification, not from an executed run on an older interpreter.
4. **Scale and encoding robustness.** I exercised one non-UTF-8 file (a Latin-1 `café` byte
   sequence), which the `errors="replace"` path handled without a traceback — the `é` was
   replaced and the token came out as `caf`. I did not test multi-megabyte files, files with NUL
   bytes, CRLF line endings, or files that are FIFOs or unreadable by permission.
5. **The Windows console code page.** All CLI output I captured was ASCII; I did not test the CLI
   under a non-UTF-8 console code page (e.g. cp936), where the `…` in the usage string could
   raise `UnicodeEncodeError` on stderr.
6. **The historical round outputs.** I re-measured the current tree and compared it against the
   stored baseline files, but I did not re-run the round-R2 and round-R2b builds to confirm that
   `swarm-lab-quality-r2.json` / `-r2b.json` were produced from the trees they claim. I verified
   the *shape* of the R2 source (`git show 6735104:swarmlab/__main__.py` — an 18-line `main`,
   consistent with `max_function_length: 18`), which corroborates the attribution in §3.
7. **`tools/host_prompt_probe.mjs`.** Out of scope (F8): I neither ran it nor reviewed its logic.
8. **The DSH plugin bundle** at `D:\project\dsh-plugins\dsh-swarm-workflow` — explicitly outside
   this lane's scope; I did not read or modify it.
9. **The prior lane reports' internal claims.** I checked their *conclusions* against my own runs
   and found no numeric disagreement, but I did not re-derive the Tester's per-test commentary or
   the Developer's decision rationale beyond what I quote at F4 and in §3.
10. **Security review.** I did not run a security audit. I observed that the CLI only reads the
    given paths and never evaluates or executes them, but I did not test path traversal, symlink
    handling, or TOCTOU races.

---

## 5. What a remediation round must fix

**Must fix (2 items — both in the quality instrument, both cheap, neither changes package
behaviour):**

1. **F1** — make `public_functions_without_tests` a real call-site check. Without this, R7's
   named check remains unsound and cannot be used to re-verify R7 after remediation. Note that
   `tools/quality_report.py` is not covered by R9's diff constraint, which is scoped to `tests/`.
2. **F2** — move the `self`/`cls` exemption above the `annotation is None` check so a fully
   annotated method is not reported as unannotated.

**Must not change (constraint on the remediation round):**

- **The CLI output wording.** `total:`, `unique:`, `top tokens:`, `total: 16`, `unique: 11`,
  `the: 4` and `dog: 2` are asserted in **19 places across 8 test methods in 2 files**:
  `tests/test_cli.py:41,42,43` (method at `:38`), `:48,49,50,51` (method at `:45`), `:70,71,72`
  (method at `:67`), `:93` (method at `:85`), `:104` (method at `:96`), `:111,112` (method at
  `:107`), and `tests/test_smoke.py:69,70,71` (method at `:63`), `:88,89` (method at `:80`).
  Rewording the CLI breaks 8 methods in **two** files — `tests/test_cli.py` **and**
  `tests/test_smoke.py` — not two methods. Both files are under R9's "must not change" umbrella,
  so the wording is effectively frozen for this round. *(This corrects the round brief, which
  said "two methods".)*
- **`tests/` in general.** R9 requires `git diff --stat cb51065 <remediation commit> -- tests` to
  be empty, so no test file may be edited to accommodate a change.

**Optional (fix at the round's discretion; none are worth a behaviour risk):**

- **F3** — add a `test_cases` field alongside `test_functions` and say which is which.
- **F6** — one line in `README.md` stating the Python 3.10 floor.
- **F7** — document the instrument's public surface, or make it read `__all__`.
- **F5** — flush stdout before writing the error to stderr.
- **F4** — leave alone this round; a better message needs a requirement change first.
- **F8** — reference `tools/host_prompt_probe.mjs` from the README or remove it.
- **F9** — the remediation round must record the remediation commit id and the empty
  `git diff --stat cb51065 <commit> -- tests` output in its own report, which is what turns R9
  from `not demonstrated` into `met`.

---

## 6. Summary

```
FINDINGS blocking=0 material=2 nonblocking=5 outofscope=2
R1=met R2=met R3=met R4=met R5=met R6=met R7=met R8=met R9=not demonstrated R10=met
```

Nine of the ten requirements are met, each on evidence I executed myself. R9 is `not demonstrated`
and blocks acceptance until a remediation commit exists and the R9 diff is shown to be empty.
There are no blocking findings. The two material findings are both in the quality instrument, not
in the package: the R7 "untested function" check is satisfied by a comment, and the `self`/`cls`
exemption in the annotation check is unreachable dead code. The package itself is correct against
R1–R8 and R10, and its measured quality improved between round R2 and today
(`avg_function_length` 6.4 → 5.6, `max_function_length` 18 → 14) with the single regression
(`max_nesting_depth` 1 → 2) attributable to the human-requested R10 multi-file command line.

*Reviewer lane, round R4. Exactly one file written by this lane:
`.swarm/reports/swarm-lab-reviewer.md`.*
