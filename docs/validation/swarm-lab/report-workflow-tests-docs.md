# swarm-lab — tests and documentation lane report (round R7)

Lane: `tests-docs` (scripted fan-out, round R7). Work item: `swarm-lab`, repository
`D:\project\swarm-lab-python`.

Requirement carriers read before starting:

- durable file `D:\project\swarm-lab-python\.swarm\requirements\swarm-lab.md` (read in full, 136 lines)
  — the authoritative carrier, R6 at lines 72–79, R7 at 81–89, R9 at 101–113;
- the shared board, read-only through `swarm_task` (9 tasks; `task-9` is the round-R4 review).

Python used for every check (no other interpreter exists on this host):

    C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe

Nothing under `swarmlab/`, `tests/`, `tools/`, `.swarm/requirements/`,
`.swarm/decisions/`, `.swarm/reports/` (other than this file) or `D:\project\dsh-plugins`
was modified; git was used read-only (`log`, `show`, `diff --stat`, `cat-file`); no commit,
add or checkout was run.

## What this lane checked

1. **The full suite**, its exit status and its test count.
2. **R7 — every public function is tested.** What the instrument reports, and — independently
   of the instrument — whether each public function is genuinely *called* by a test case
   (AST call-site analysis, not the instrument's textual rule).
3. **R6 — annotations and docstrings.** The instrument's numbers, re-derived independently
   from the AST of every module in `swarmlab/`.
4. **The quality of the tests themselves**: does each test name the behaviour it pins, does
   it assert that behaviour, and could it pass for the wrong reason?
5. **R9 — the behaviour must not change during remediation.** Whether the check is
   satisfiable as written, whether it currently holds, and what would make it demonstrable.
6. **The documentation set** — `README.md`, `.swarm/requirements/swarm-lab.md`,
   `.swarm/decisions/*.md`, `.swarm/reports/*.md` — judged against the question a cold reader
   must answer: *what was asked, what was decided, what was measured?*

**Final state re-check** (the tree changed under this lane: sibling lanes of the same fan-out
added `tools/quality_compare.py` and two reports while this lane was reading). Both commands
were re-run at the end and the numbers are unchanged:

    $ & "...\python.exe" -m unittest discover -s tests -t .
    Ran 54 tests in 1.510s
    OK
    SUITE_EXITCODE=0

    $ & "...\python.exe" tools/quality_report.py --json
    { "annotation_coverage": 1.0, ..., "public_functions_without_tests": [],
      "public_functions_without_tests_count": 0, "test_functions": 51 }
    INSTRUMENT_EXITCODE=0

---

## Findings

### F1 — Material — `tools/quality_report.py:149` — the instrument's "is it tested?" rule is a substring match over the test sources, so `public_functions_without_tests_count: 0` does not prove the requirement's "exercised by at least one test case"

The rule is `tested = {name for name in names if name in test_sources()}`, where
`test_sources()` (`:102-106`) concatenates the **raw text** of every file under `tests/`.
A public function counts as tested if its name appears anywhere in that text — in a comment,
a docstring, an import line or an unrelated identifier. It never checks that a test calls it.

Demonstrated in memory (no file written): the two calls of the package's `main` were removed
from `tests/test_smoke.py` in the source string only, and the instrument's rule was re-evaluated:

    $code | & "...\python.exe" -
    instrument rule (name in test_sources) -> {'main': True, 'normalize_ws': True, 'summarize': True, 'tokenize': True, 'word_frequency': True}
    simulated test_smoke.py still contains 'main': True
      occurrences of 'main' in the simulated file: ['from swarmlab.__main__ import main', 'self.assertTrue(callable(main))', 'main: ["argv"],', 'if __name__ == "__main__":', 'unittest.main()']
    instrument rule on the simulated sources -> {'main': True, 'normalize_ws': True, 'summarize': True, 'tokenize': True, 'word_frequency': True}
    real calls of swarmlab main left in the simulated test_smoke.py: [134]
    => the instrument would still report public_functions_without_tests_count = 0 while main is never exercised

Line 134 is `unittest.main()` in the module guard, not the package's `main`. So the number R7's
check relies on (`public_functions_without_tests_count: 0`) is satisfiable by a test file that
merely *mentions* the name. **This risk does not materialise in the current tree** — see the
independent call-site analysis in the R7 verdict below — but the check itself does not carry
the weight the requirement puts on it.

### F2 — Material — `.swarm/requirements/swarm-lab.md:104` — R9's premise ("the review findings of round R4") has no referent: the round-R4 review is still in progress and its report file does not exist

R9 requires that behaviour does not change "while the review findings of round R4 are
remediated". Nothing in the workspace records those findings:

    $ grep -r "round R4|round-R4|findings" D:\project\swarm-lab-python\.swarm
    swarm-lab-python\.swarm\requirements\swarm-lab.md:104: findings of round R4 are remediated. A change that alters an observable result
    swarm-lab-python\.swarm\reports\swarm-lab-developer.md:14: the round-R4 remediation of the review findings, so it is outside this round's assignment and
    swarm-lab-python\.swarm\reports\swarm-lab-tester.md:352: commit and the round-R4 remediation commit do not exist yet. The empty `git diff --stat --
    swarm-lab-python\.swarm\reports\swarm-lab-r9-primitives.md:25: task-3 [completed] rev 3 owner reviewer — Independent review …
    swarm-lab-python\.swarm\reports\swarm-lab-r10.md:28: R9 — the public behaviour defined by R1 to R5 must not change while the review findings are remediated;

Every hit is either the requirement quoting itself or a mention that the findings do not exist
yet. The report directory confirms it — the round-R4 reviewer's own write scope,
`.swarm/reports/swarm-lab-reviewer.md`, is not in it:

    $ Get-ChildItem -Force D:\project\swarm-lab-python\.swarm\reports
    Name                             Length
    ----                             ------
    .gitkeep                              5
    swarm-lab-developer.md            12876
    swarm-lab-quality-r2.json           515
    swarm-lab-quality-r2b.json          516
    swarm-lab-r10.md                  13693
    swarm-lab-r9-primitives.md         5748
    swarm-lab-tester.md               23196
    swarm-lab-workflow-api.md         18431
    swarm-lab-workflow-cli.md         17320
    swarm-lab-workflow-tests-docs.md  32147

(The last three are the round-R7 fan-out lanes: the API lane, the CLI lane and this lane. The
first seven predate them. Neither sibling report mentions the round-R4 reviewer — grep for
"reviewer|round R4" in `swarm-lab-workflow-api.md` and `swarm-lab-workflow-cli.md` returns only
their own titles.)

The board confirms the state of affairs:

    $ swarm_task {action: "list"}
    task-9 [in_progress] rev 2 owner pyreview — Review the swarmlab package against the requirement set (round R4)

    $ swarm_task {action: "get", task_id: "task-9"}
    Task task-9 [in_progress] rev 2
      subject: Review the swarmlab package against the requirement set (round R4)
      owner: pyreview
      write scopes: swarm-lab-python/.swarm/reports/swarm-lab-reviewer.md
      known evidence: … R9 is `not demonstrated` until a remediation commit exists — its check is `git diff --stat cb51065 <remediation commit> -- tests` empty, so a remediation round must not edit the tests.

The round-R4 review's own write scope, `.swarm/reports/swarm-lab-reviewer.md`, is absent from the
tree (the `.swarm/reports/` directory holds only `swarm-lab-developer.md`,
`swarm-lab-quality-r2.json`, `swarm-lab-quality-r2b.json`, `swarm-lab-r10.md`,
`swarm-lab-r9-primitives.md`, `swarm-lab-tester.md` and the two `.gitkeep` files). Consequence:
R9 cannot be demonstrated now, and a cold reader cannot reconstruct what is to be remediated.

### F3 — Non-blocking — `.swarm/requirements/swarm-lab.md:109-112` — R9's check measures "no test file changed", not "behaviour unchanged"; it is satisfiable, but only by a remediation that touches no test at all

The check has three parts. All three hold at HEAD:

    $ git -C D:\project\swarm-lab-python cat-file -t cb51065
    commit

    $ git -C D:\project\swarm-lab-python diff --stat cb51065 HEAD -- tests
    (no output)

    $ & "...\python.exe" -m unittest discover -s tests -t .
    Ran 54 tests in 1.537s
    OK
    EXITCODE=0

The code itself has not moved either, which is stronger evidence than the check asks for:

    $ git -C D:\project\swarm-lab-python diff --stat cb51065 HEAD -- swarmlab
    (no output)

Two weaknesses remain in the check's design, both material for the round that will actually use it:

* `<remediation commit>` is an unbound placeholder — the requirement never names the commit the
  diff runs against, so the check is not literally executable as written; HEAD (`0c0f566`) is
  the only candidate today, and it contains no remediation at all (`git log --stat` shows the
  two commits after `cb51065` touch only `.swarm/` and `README.md`).
* `git diff --stat cb51065 <remediation commit> -- tests` is empty only when **no** test file
  changed. A remediation that adds a test — precisely the kind of remediation F1 and R7 imply —
  fails the check even though no observable behaviour changed. Conversely a behaviour change
  shipped without touching `tests/` would leave the diff empty; only the suite's exit status
  would catch it. The diff therefore measures test-file immutability, and the suite carries
  the behavioural weight.

### F4 — Non-blocking — `.swarm/requirements/swarm-lab.md:87` — R7's check names a key the instrument emits as a list, not as `0`

The check reads: "`python tools/quality_report.py --json` reports `public_functions_without_tests`
as `0`". The instrument emits that key as a list and puts the count under a different key:

    $ & "...\python.exe" tools/quality_report.py --json
    {
      "annotation_coverage": 1.0,
      ...
      "public_functions_without_tests": [],
      "public_functions_without_tests_count": 0,
      ...
    }
    EXITCODE=0

A checker written literally against the wording finds `[]`, not `0`. The substance is satisfied
and the count key carries it; the wording should name `public_functions_without_tests_count`.

### F5 — Non-blocking — `tools/quality_report.py:92-99` — `test_functions: 51` counts unique names, not test functions, so the instrument understates the suite by three

    $ & "...\python.exe" tools/quality_report.py --json
      "test_functions": 51
    (suite runs 54 tests)

The instrument collects test names into a `set`, and `test_signature_is_the_required_one` is the
same name in four files. Independent inventory of the collected test methods:

    == test method inventory (unittest collection) ==
       tests\test_cli.py::TestSingleFileRun: 4
       tests\test_cli.py::TestMultipleFileRun: 6
       tests\test_report.py::TestSummarize: 9
       tests\test_smoke.py::TestPackageWiring: 3
       tests\test_smoke.py::TestCommandLine: 4
       tests\test_smoke.py::TestImportSideEffects: 2
       tests\test_stats.py::TestWordFrequency: 9
       tests\test_text.py::TestNormalizeWs: 7
       tests\test_text.py::TestTokenize: 10
       total test methods: 54 unique names: 51
       duplicated names: ['test_signature_is_the_required_one']

54 collected methods, 51 unique names, one duplicated name used four times. The instrument is
not wrong, but "test functions: 51" next to a 54-test suite reads like three missing tests.

### F6 — Non-blocking — `tools/quality_report.py:56-68` — the `self`/`cls` exemption in `is_annotated` is unreachable, so a future class would be reported as unannotated

`is_annotated` checks `argument.annotation is None` **before** the `if index == 0 and
argument.arg in {"self", "cls"}: continue` branch, so a method whose `self` carries no
annotation returns `False` — the `continue` never protects it. The package has no classes
today (all five public functions are module-level, confirmed by the AST check in the R6
verdict), so `annotation_coverage: 1.0` is currently correct; the moment a class is added the
instrument would report coverage below 1.0 for a reason that has nothing to do with the
requirement.

### F7 — Non-blocking — `.swarm/requirements/swarm-lab.md:132-135` — the Baseline note understates the baseline and reads like a live status line

"The repository starts empty apart from this file and the tooling" — the baseline commit also
contained the README and the fixture:

    $ git -C D:\project\swarm-lab-python show --stat --oneline 120483e
    120483e baseline: requirement set, quality instrument, empty package
     .gitignore |   4 +
     .swarm/requirements/swarm-lab.md | 118 ++++++
     README.md |  38 +++
     tests/fixtures/sample.txt |   2 +
     tools/quality_report.py | 201 ++++++
     7 files changed, 365 insertions(+)

The same paragraph's "every requirement above is `not demonstrated` until a lane reports the
evidence that proves it" is a baseline statement that now reads as the current status, although
four rounds of evidence exist. A cold reader has no per-requirement status table to consult.

### F8 — Non-blocking — `README.md:37` — "tools/ the measurement instrument" under-describes `tools/`, and two of its three files are undocumented in the README

    $ Get-Content D:\project\swarm-lab-python\README.md | Select-Object -Skip 32
    ## Layout

        swarmlab/        the package under construction
        tests/           one test file per requirement clause
        tools/           the measurement instrument
        .swarm/          the work item's documentation

`tools/` holds three files, and the README's one line describes only the first:

1. `tools/quality_report.py` — the package instrument the README does describe;
2. `tools/host_prompt_probe.mjs` — a 165-line probe that loads the *installed*
   `dsh-swarm-workflow` bundle on the real host runtime and prints what the host would inject
   into a Coordinator prompt, a worker prompt, the skill registration and the `/swarm` command.
   No document in the workspace mentions it:

       $ grep -r "host_prompt_probe" D:\project\swarm-lab-python
       swarm-lab-python\tools\host_prompt_probe.mjs:11:  *   & "D:\software\dsh\DeepSeek Harness.exe" tools\host_prompt_probe.mjs

   (The only hit is the file's own usage line.) It is committed at `6735104` and measures the
   host, not the package, so it deserves a line in the README's Layout section and, ideally, a
   report that records what it printed;
3. `tools/quality_compare.py` — created during this very round by the API lane (its report
   says so at `.swarm/reports/swarm-lab-workflow-api.md:354`); it copies the instrument into
   another tree and runs it there, so that two arms are measured by the same code. The README
   does not mention it, and it appeared after this lane's first read of the tree:

       $ git -C D:\project\swarm-lab-python status --porcelain
       ?? .swarm/reports/swarm-lab-workflow-api.md
       ?? .swarm/reports/swarm-lab-workflow-cli.md
       ?? .swarm/reports/swarm-lab-workflow-tests-docs.md
       ?? tools/quality_compare.py

   The third entry is this lane's own report; the other three belong to sibling lanes of the
   same fan-out. The point stands for the README: a directory described in one line now holds
   three programs with three different purposes.

### F9 — Non-blocking — `README.md:29-38` — the documentation set has no index, no status table and no pointer to the measurements

A cold reader must open every markdown report and both JSON files to learn which requirements
are demonstrated and what the numbers were. The README names the requirement set, the
instrument and the suite command, but never says where the per-round evidence lives, what the
current suite count is, or that the before/after measurement of the instrument is stored as
`.swarm/reports/swarm-lab-quality-r2.json` and `…-r2b.json`. The evidence directory holds nine
artefacts and grows with every lane:

    $ Get-ChildItem -Force D:\project\swarm-lab-python\.swarm\reports
    swarm-lab-developer.md  swarm-lab-quality-r2.json  swarm-lab-quality-r2b.json
    swarm-lab-r10.md  swarm-lab-r9-primitives.md  swarm-lab-tester.md
    swarm-lab-workflow-api.md  swarm-lab-workflow-cli.md  swarm-lab-workflow-tests-docs.md

What *is* reconstructible:
**what was asked** (README §"The requirement set" plus the requirement file, complete and
consistent with the board — no carrier disagreement found for R6, R7 or R9) and **what was
decided** (two decision files, each with date, status, options considered, the choice, the
reason and the consequences — both complete and self-contained). **What was measured** is
present but scattered: the instrument's output is captured as JSON for the R2 and R2b states,
the suite result is quoted inside two reports, and the current state is quoted inside the
Tester's report (and matches `…-r2b.json` exactly, field for field) but is not stored as its
own artefact.

### F10 — Non-blocking — `tests/test_report.py:53-55` — one test asserts one unit against another instead of against the behaviour

`test_top_agrees_with_the_frequency_order` asserts
`report.summarize(tokens)["top"] == stats.word_frequency(tokens)[:5]` — a consistency between
two units, both under test. It would pass if both were wrong in the same way, so it pins a
relation rather than the behaviour. The risk is bounded here because `word_frequency`'s order is
independently pinned in `tests/test_stats.py:38-50`, and `summarize`'s own order is pinned by
`tests/test_report.py:41-43`; but the test's name states a relation, and a reader who takes it
as evidence for R4's "five most frequent pairs" clause is reading more into it than it carries.

### F11 — Non-blocking — `tests/test_cli.py:114-118` — the "only the first missing file is reported" test does not check standard output

The test asserts the exit status, the exact stderr message, and that the second missing path
does not appear in stderr — but it does not assert that stdout is empty. The companion test at
`tests/test_cli.py:107-112` does check `stdout.count("total:") == 1` for the mixed
existing/missing case; the both-missing case has no stdout assertion, so an implementation that
printed a block for an unreadable file would still pass this test.

### F12 — Non-blocking — `tests/test_smoke.py:38-52` — the annotation test hard-codes the five public functions and checks only that annotations exist

The test pins the parameter *names* of the five functions it knows about and that each
annotation is not `None`; it does not pin the required annotation *types* (`text: str` versus
`text: int`) and it does not cover a public function added later, which the instrument would
count but the suite would not exercise. The exact signatures R1–R4 demand are pinned
independently in `tests/test_text.py:20-21,50-51`, `tests/test_stats.py:16-20` and
`tests/test_report.py:18-22`, so R6's requirement is covered elsewhere.

### F13 — Non-blocking — `swarmlab/__main__.py:41-42` — the no-argument path of the public `main` is observable and pinned by no test

    $ & "...\python.exe" -m swarmlab
    usage: python -m swarmlab <file> [<file> …]
    EXITCODE=2

The requirement set says nothing about the usage path, so it is outside R1–R10's scope, but it
is an observable behaviour of the public surface and no test asserts it (the developer's report
records the choice at `.swarm/reports/swarm-lab-developer.md:259-261`; the requirement file does
not carry it). A future change to that path would not be caught.

### F14 — Non-blocking — `tests/test_text.py:27-29` — the whitespace-collapse test does not cover `\v` or `\f`

The implementation collapses every whitespace run (`" ".join(text.split())`,
`swarmlab/text.py:9`), and the requirement says "every run of whitespace"; the test's table
covers space, tab, newline, CRLF and mixed runs but not the vertical tab or the form feed,
which `str.split()` also treats as whitespace. An implementation that handled only the covered
set would pass.

---

## Requirement verdicts

### R6 — every public function is annotated → **met**

    requirement: Every public function in `swarmlab` carries a parameter annotation and a
        return annotation, and every public module carries a module docstring.
    check: `python tools/quality_report.py --json` reports `annotation_coverage` of `1.0`
        and `docstring_coverage` of `1.0` over the public surface.
    source: the assignment — work item swarm-lab, quality requirement.

Requirement file: `.swarm/requirements/swarm-lab.md:74-75` (requirement), `:77-78` (check),
`:79` (source).

Instrument output (the check as written):

    $ & "...\python.exe" tools/quality_report.py --json
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
    EXITCODE=0

Independent re-derivation from the AST (not trusting the instrument):

    $code | & "...\python.exe" -
    == R6 independent check: annotations + docstrings ==
    MODULE swarmlab\__init__.py module_docstring=True
    MODULE swarmlab\__main__.py module_docstring=True
       FUNC main (swarmlab\__main__.py:33) params_unannotated=[] return_annotated=True docstring=True
    MODULE swarmlab\report.py module_docstring=True
       FUNC summarize (swarmlab\report.py:5) params_unannotated=[] return_annotated=True docstring=True
    MODULE swarmlab\stats.py module_docstring=True
       FUNC word_frequency (swarmlab\stats.py:5) params_unannotated=[] return_annotated=True docstring=True
    MODULE swarmlab\text.py module_docstring=True
       FUNC normalize_ws (swarmlab\text.py:7) params_unannotated=[] return_annotated=True docstring=True
       FUNC tokenize (swarmlab\text.py:12) params_unannotated=[] return_annotated=True docstring=True
    public functions: ['main', 'summarize', 'word_frequency', 'normalize_ws', 'tokenize']

All five public functions carry a parameter annotation on every parameter and a return
annotation; all five modules carry a module docstring. `annotation_coverage` and
`docstring_coverage` are `1.0`, and `module_docstring_coverage` (the third clause of the
requirement, which the check does not name) is `1.0` as well. **Verdict: met**, with the
instrument caveats recorded as F5 and F6.

### R7 — every public function is tested → **met**

    requirement: Every public function in `swarmlab` is exercised by at least one test case
        in the `tests` package, and the whole suite passes.
    check: `python -m unittest discover -s tests -t .` exits `0`, and
        `python tools/quality_report.py --json` reports `public_functions_without_tests`
        as `0`.
    source: the assignment — work item swarm-lab, quality requirement.

Requirement file: `.swarm/requirements/swarm-lab.md:83-84` (requirement), `:86-88` (check),
`:89` (source).

First half of the check — the suite:

    $ & "...\python.exe" -m unittest discover -s tests -t .
    ......................................................
    ----------------------------------------------------------------------
    Ran 54 tests in 1.537s

    OK

    EXITCODE=0

**54 tests, 0 failures, 0 errors, 0 skipped, exit 0.** Per file: 9 from `tests/test_smoke.py`
(3 + 4 + 2), 7 + 10 from `tests/test_text.py`, 9 from `tests/test_stats.py`, 9 from
`tests/test_report.py`, 10 from `tests/test_cli.py`.

Second half of the check — the instrument:

    $ & "...\python.exe" tools/quality_report.py --json
      "public_functions_without_tests": [],
      "public_functions_without_tests_count": 0,
    EXITCODE=0

Because that rule is textual (F1), the "exercised by at least one test case" clause was verified
independently by counting **call sites** of each public function in the test sources:

    $code | & "...\python.exe" -
    == R7 independent check: real call sites in tests ==
       CALLS main: 7 -> ['tests\\test_cli.py:122', 'tests\\test_report.py:59', 'tests\\test_smoke.py:134', 'tests\\test_smoke.py:66', 'tests\\test_smoke.py:76', 'tests\\test_stats.py:60', 'tests\\test_text.py:88']
       CALLS summarize: 8 -> ['tests\\test_report.py:25', 'tests\\test_report.py:37', 'tests\\test_report.py:42', 'tests\\test_report.py:46', 'tests\\test_report.py:51', 'tests\\test_report.py:30', 'tests\\test_report.py:33', 'tests\\test_report.py:55']
       CALLS word_frequency: 10 -> ['tests\\test_report.py:55', 'tests\\test_stats.py:23', 'tests\\test_stats.py:31', 'tests\\test_stats.py:39', 'tests\\test_stats.py:43', 'tests\\test_stats.py:47', 'tests\\test_stats.py:48', 'tests\\test_stats.py:53', 'tests\\test_stats.py:56', 'tests\\test_stats.py:28']
       CALLS normalize_ws: 7 -> ['tests\\test_text.py:24', 'tests\\test_text.py:32', 'tests\\test_text.py:33', 'tests\\test_text.py:36', 'tests\\test_text.py:39', 'tests\\test_text.py:29', 'tests\\test_text.py:44']
       CALLS tokenize: 13 -> ['tests\\test_text.py:54', ... 'tests\\test_text.py:84']

Read carefully: five of the seven `main` hits are `unittest.main()` in the module guards
(`test_cli.py:122`, `test_report.py:59`, `test_smoke.py:134`, `test_stats.py:60`,
`test_text.py:88`). The package's `main` is genuinely called at
**`tests/test_smoke.py:66`** (`status = main([str(FIXTURE)])`) and
**`tests/test_smoke.py:76`** (`status = main([MISSING])`), and it is exercised end-to-end through
`python -m swarmlab` in `tests/test_cli.py` and `tests/test_smoke.py:80-99`. Every one of the
five public functions is therefore called by at least one test case. **Verdict: met**, with the
check's two wording/shape caveats recorded as F4 and F5.

### R9 — the behaviour must not change during remediation → **not demonstrated**

    requirement: The public behaviour defined by R1 to R5 must not change while the review
        findings of round R4 are remediated. A change that alters an observable result
        is a defect, not an improvement. The multi-file command line of R10 is not a
        remediation: it is a change the human asked for, and R10 is judged by its own
        check.
    check: the round-R3 commit `cb51065` exists (it is the commit that adds the
        clause test files), `git diff --stat cb51065 <remediation commit> --
        tests` is empty, and the suite still exits `0`. Until `cb51065` exists,
        the check is `not demonstrated`.
    source: the behaviour that must not change — R1 to R5.

Requirement file: `.swarm/requirements/swarm-lab.md:103-107` (requirement), `:109-112` (check),
`:113` (source).

**Is the check satisfiable as written?** Yes, and its three parts are all satisfied at HEAD:

    $ git -C D:\project\swarm-lab-python cat-file -t cb51065
    commit

    $ git -C D:\project\swarm-lab-python show --stat --oneline cb51065
    cb51065 round R3: the Tester lane adds the requirement clause tests
     .swarm/reports/swarm-lab-tester.md | 468 +++++++++++++++++++++++++++++++++++++
     tests/test_cli.py                  | 122 ++++++++++
     tests/test_report.py               |  59 +++++
     tests/test_stats.py                |  60 +++++++
     tests/test_text.py                 |  88 ++++++++
     5 files changed, 797 insertions(+)

    $ git -C D:\project\swarm-lab-python diff --stat cb51065 HEAD -- tests
    (no output)

    $ git -C D:\project\swarm-lab-python diff --stat cb51065 HEAD -- swarmlab
    (no output)

    $ & "...\python.exe" -m unittest discover -s tests -t .
    Ran 54 tests in 1.537s
    OK
    EXITCODE=0

`cb51065` is the commit that adds the clause test files, exactly as the check describes it; the
test tree is byte-identical between it and HEAD; the suite exits 0; and — beyond what the check
asks — the package sources have not changed at all since `cb51065`, so R1–R5's behaviour is
provably unchanged.

**Why the verdict is nonetheless `not demonstrated`:** the check is satisfied only *vacuously*.
Its subject — a remediation of the round-R4 review findings — has not happened:

* the round-R4 review is still open: `swarm_task {action: "list"}` shows
  `task-9 [in_progress] rev 2 owner pyreview — Review the swarmlab package against the requirement set (round R4)`,
  and its report, `.swarm/reports/swarm-lab-reviewer.md`, does not exist in the tree (F2);
* there is no remediation commit: the two commits after `cb51065` are `622349b`
  (requirements + README) and `0c0f566` (`.swarm/` docs only) — `git log --stat` shows no
  change under `swarmlab/` or `tests/`;
* `<remediation commit>` in the check is an unbound placeholder, so the diff has nothing to
  point at yet;
* the board's own task-9 text agrees with this reading: "R9 is `not demonstrated` until a
  remediation commit exists".

An empty diff over a window in which nothing was remediated proves nothing about invariance
under remediation. The requirement's own escape clause ("Until `cb51065` exists, the check is
`not demonstrated`") has been overtaken — `cb51065` exists — but the *purpose* of the check,
to witness that a remediation did not alter observable behaviour, has not yet been exercised
(F3).

**What would make it demonstrable:**

1. the round-R4 findings recorded as an artefact — `.swarm/reports/swarm-lab-reviewer.md`,
   the file task-9 already claims as its write scope — so the requirement's subject is
   readable by anyone arriving cold;
2. a **named** remediation commit id in place of the `<remediation commit>` placeholder, and the
   check run against that id;
3. the diff widened to the behaviour-carrying sources — `git diff --stat cb51065 <remediation
   commit> -- swarmlab tests` — and, better, the observable behaviour compared directly (the
   single-file CLI output bytes and the suite result), so the check measures behaviour instead
   of test-file immutability. Today a remediation that adds a legitimate test fails the check
   while a remediation that changes `swarmlab/` without touching `tests/` is caught only by
   the suite's exit status.

---

## Not checked (and why)

* **The implementation's behaviour for R1–R5** (the correctness of `normalize_ws`,
  `tokenize`, `word_frequency`, `summarize` and the CLI contract) — those requirements are
  assigned to other lanes; this lane ran the CLI only to confirm the fixture numbers the CLI
  tests assert (`total: 16`, `unique: 11`, `the: 4`) and the uncovered no-argument path
  (F13), and did not derive verdicts for R1–R5, R8 or R10.
* **The `dsh-swarm-workflow` bundle and the plugin defect** reported in
  `.swarm/reports/swarm-lab-r9-primitives.md` (`swarm_task` breaking on an unowned board task,
  dispatched as task-7 to the `pluginfix` lane) — that is another lane's work and it lives
  under `D:\project\dsh-plugins`, which this lane did not read or modify.
* **Whether round-R4 findings exist somewhere outside this workspace** — I read the board
  (`swarm_task list`, `swarm_task get task-9`); the review is in progress and has produced no
  findings yet. If the Lead holds the findings elsewhere, F2 narrows to "not recorded in the
  workspace" rather than "do not exist".
* **The `swarm_task` write path** (claim/complete from this session) — this session is not a
  team member; the board is readable only through a read-only relay, and this lane owns one
  file (its report) and made no board writes.
* **`tools/host_prompt_probe.mjs`'s behaviour** — it loads the installed bundle on the host
  runtime; this lane did not run it (it is outside the work item's package, and its output is
  the subject of a host-level report, not of the swarmlab requirement set). Only its presence
  and its absence from the documentation set were checked (F8).
* **Windows console encoding of the usage string** — the `…` renders as `��` in this host's
  cp936 console; the underlying text is UTF-8 correct and the behaviour is already recorded in
  `.swarm/reports/swarm-lab-r10.md:333-337`. Not re-litigated here.

## Suggested remediation (concrete, minimal)

1. **Make the instrument's test detection call-based** — `tools/quality_report.py:148-149`:
   replace `name in test_sources()` with an AST scan of `tests/` that collects the names of
   functions that are actually *called* (`ast.Call` with `Name`/`Attribute` targets), and
   report `public_functions_without_tests` from that. One helper function, ~10 lines; it makes
   R7's check carry the requirement's real meaning (F1).
2. **Rename or add the count key** — either drop the `[]` key and keep only
   `public_functions_without_tests_count`, or rename it to `public_functions_without_tested_names`
   and re-word R7's check to name the count key (F4).
3. **Report test *functions*, not unique names** — `tools/quality_report.py:92-99`: count
   `test*` functions per file instead of a set of names, or emit both (`test_functions: 54`,
   `test_function_names: 51`) so the number next to a 54-test suite stops looking like three
   missing tests (F5).
4. **Fix the dead `self`/`cls` branch** — `tools/quality_report.py:60-63`: skip the
   annotation requirement for `self`/`cls` *before* the `annotation is None` check, so a future
   class does not depress `annotation_coverage` (F6).
5. **Bind R9's placeholder and widen its diff** — `.swarm/requirements/swarm-lab.md:109-112`:
   replace `<remediation commit>` with the actual commit id once the remediation lands, and
   change the command to `git diff --stat cb51065 <remediation commit> -- swarmlab tests`;
   add the round-R4 findings to the requirement's `source:` line so the check names the thing it
   compares against (F2, F3).
6. **Add a reviewer-report index and a status table to the README** — `README.md:29-38`: list
   the reports under `.swarm/reports/` with one line each, say where the instrument's
   before/after JSON lives, and state the current suite count; add the requirement-level status
   table (R1…R10 → verdict → evidence file) so a cold reader does not have to open four reports
   to learn where the work stands (F7, F9).
7. **Describe `tools/` accurately** — `README.md:37`: say that `tools/` holds the package's
   measurement instrument *and* the host-runtime probe for the installed bundle, and add a line
   in the README about what the probe is for (F8).
8. **Three small test hardening edits** (each one line): assert `result.stdout == ""` in
   `tests/test_cli.py:114-118` (F11); add `"\v"` and `"\f"` to the whitespace table in
   `tests/test_text.py:27-29` (F14); add a case for `main([])` — usage text on stderr, exit 2 —
   to `tests/test_smoke.py` (F13). A fourth, optional: replace the cross-unit assertion at
   `tests/test_report.py:53-55` with the expected literal pairs, keeping the consistency check
   as a second assertion (F10).
