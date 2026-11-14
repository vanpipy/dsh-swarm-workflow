# craft-lab — acceptance report

Round R10 of the second test phase (`10 rounds`, requested 2026-11-14).
Work item: does a lane that reads the craft guidance produce better work than a
lane that does not?

## 1. The verdict

**R1 to R6 are met.** The craft arm and the control arm both produce a runnable
`textnorm` package that passes the hidden case set and their own suites, and they
differ in four re-derivable ways.

The verdict comes with a boundary that matters more than the verdict itself:
**this comparison is between two briefs, not two environments, and it has one
sample per condition.** It is indicative, not conclusive. §4 says exactly what
the evidence supports and what it cannot.

## 2. The requirement verdicts

| Requirement | Verdict | Evidence |
|---|---|---|
| R1 — one specification, identical for both arms | **met** | `spec/textnorm-spec.md` (64 lines) exists; both reports name it as their source (`craft-lab-craft-arm.md:16`, `craft-lab-control-arm.md:5`). |
| R2 — the craft arm reads the craft guidance | **met** (the check as written) | The report names all three craft files **with their paths** (`:12-17`) and carries a rule→change table per file (`:19`, `:32`, `:41`), citing shared.md §2.2 and §2.1, developer.md §5, python.md §19. Caveat kept visible: the *ordering* ("loaded before writing code") is the lane's own assertion and is not verifiable from the artefacts. |
| R3 — the control arm is not given the craft guidance | **met** | Grep over the control report for `skill|craft|catalog|swarm-engineering` → 5 hits, all innocuous (the title, the working directory, the spec path, and a line saying it did not look at the craft arm). No craft path, no skill name, no craft citation. The brief half of the check is not a repository artefact; it rests on this session's dispatch and on `README.md`. |
| R4 — both arms produce a runnable package | **met** | craft-arm `Ran 33 tests … OK` exit 0; control-arm `Ran 55 tests … OK` exit 0; `python -m textnorm <fixture>` exits 0 in both; both import as `textnorm` with `normalize`, `stats` and a `__main__` CLI. The Lead re-ran both. |
| R5 — the hidden cases decide the comparison | **met** | The runner lives at `D:\project\swarm-craft-lab-hidden\cases.py`, outside the repository; its mtime (11:28:39) is later than both arms' last source edit and both reports. Re-run by the Lead and by the Reviewer: **craft-arm 16/16, control-arm 16/16**. |
| R6 — the difference is measured, not asserted | **met** | One instrument, both arms, the per-arm numbers in §3 and the boundary in §4 — which is what the Reviewer lane required to close it. |

No requirement is *not met*, and nothing is `not demonstrated`.

## 3. The measured difference, and what it is worth

The same instrument, one line patched (`PACKAGE = ROOT / "swarmlab"` →
`ROOT / "textnorm"`), copied into each arm's own `tools/`, run there, then
removed. Every number below reproduces exactly — the Lead's run, the Reviewer's
re-run, and the Reviewer's independently written metric script all agree.

| Measure | craft arm | control arm | what it actually shows |
|---|---|---|---|
| annotation coverage | 1.0 | 0.75 | the craft arm annotates every public signature; the control arm leaves two |
| public functions | 3 (`main`, `normalize`, `stats`) | 4 (`build_parser`, `main`, `normalize`, `stats`) | the craft arm's surface is smaller and all of it is public API |
| public functions without a test | 0 | 1 (`build_parser`) | see the instrument's limit in §5.3 — for these two arms the numbers happen to be true, and the Reviewer confirmed `build_parser` really is never called, by call site, not by name |
| docstring coverage | 1.0 | 1.0 | the craft arm's advantage is docstring *depth*, which this metric cannot see |
| module docstring coverage | 1.0 | 1.0 | no difference |
| test cases | 33 | 55 | the control arm wrote more tests; the craft arm wrote fewer and they all discriminate (the Reviewer made each of the Tester's 40 checks fail on purpose: 43 mutation runs, 43 failures) |
| package modules | 5 | 3 | the craft arm splits one reason per module (`_normalization`, `_counting`, `_cli`) |
| average function length | 21.67 | 20.75 | no real difference |
| max function length | 27 | 27 | no difference |
| max nesting depth | 1 | 2 | the craft arm's control flow is flatter; the control arm's `cli.py:37` nests a `with` inside a `try` |
| duplicate line ratio | 0.1678 | 0.044 | **not a quality ranking** — see §5.4: the craft arm's repeated lines are `"""` ×9, `Args:` ×5, `Returns:` ×5 and `from __future__ import annotations` ×4. The metric penalises the craft arm for its own documentation style. |

### 3.1 The one behavioural difference, now adjudicated

The arms disagree on which characters end a line. `stats("a\fb")` is `lines: 1`
in the craft arm and `lines: 2` in the control arm, and the same for
`stats("a\u2028b")`. The specification's phrase "split on universal newlines"
admits both readings.

The Reviewer lane found that the only check in the lab able to tell them apart
was hard-wired to the craft arm, so the control arm's reading had never been
tested by anyone. The Coordinator re-ran that same suite against the control arm
(a throwaway copy in `%TEMP%`, the repository untouched):

```
Ran 40 tests … FAILED (failures=2)
FAIL: test_stats_does_not_count_a_form_feed_as_a_line_break          AssertionError: 2 != 1
FAIL: test_stats_does_not_count_a_unicode_line_separator_as_a_line_break  AssertionError: 2 != 1
```

The divergence is now adjudicated, and the reading this work item stands on is
recorded in `.swarm/decisions/2026-11-14-line-break-reading.md`: the literal
enumeration (`\r\n`, `\r`, `\n`). The specification's silence is recorded as the
specification's gap, not as either arm's defect.

### 3.2 What the craft did **not** change

Correctness on the visible surface (16/16 both arms), docstring coverage, module
docstring coverage, max function length, and suite greenness. A craft that only
produced a differently-shaped artefact with the same behaviour would be worth
knowing about — and this is what it produced here.

## 4. The boundary: what this comparison can and cannot show

This is the part of the acceptance that matters most, and the Reviewer lane
required it before R6 could close.

**The comparison is between two briefs, not two environments.** The craft
skills are registered with the host for every agent in this session: the plugin
registers `swarm-craft-shared`, `swarm-craft-developer`, `swarm-craft-python`
and the rest for whoever asks for them, not only for the lane whose brief named
them. A brief can withhold a skill name; it cannot unregister a skill.
`.swarm/decisions/2026-11-14-sample-size.md:31-37` records that the control
lane's session carried the skill catalog and that the lane loaded the craft
skills before it read the specification, while deriving nothing in them.

(The disclosure lives in that decision file. It is **not** in the control lane's
own report — the Reviewer lane checked, and the Coordinator's earlier summary of
it was wrong on this point. The control lane is therefore not a disinterested
source on this point, and the limit is attributed to the Coordinator's own
record.)

**One sample per condition.** One lane per condition, one model family, one
specification, one host, one interpreter version. A single sample cannot
separate a craft effect from the lane's own variance, the model's variance, or
the luck of the draw.

**The supportable sentence, and no stronger:**

> In this one pair of runs, the arm whose brief named the craft produced a
> differently-shaped artefact: a smaller, fully annotated public surface, one
> reason per module, flatter control flow, and a different reading of which
> characters end a line.

"The craft produces X" and "without the craft you get Y" are **not** supported
by this design.

**What a conclusive test would need:** more than one lane per condition,
conditions identical apart from the craft guidance, and a host where the craft
skills are not registered for the control lane. This host cannot provide the
third thing; the decision `2026-11-14-sample-size.md` recorded the user's
acceptance of an indicative result instead.

## 5. The findings the lanes raised, and what the Coordinator did about them

### 5.1 The tie is blind to the difference that exists — material

The hidden case set reports 16/16 for both arms. The Reviewer lane showed that
this measurement cannot fail on the defect class that separates them: the set
passes 16/16 against a clone whose line-break set is widened to Python's
`splitlines()` **and** against a clone with the em dash (U+2014) removed — the
set's dash case exercises only U+2013 (`cases.py:46-47`). Each arm's own suite
is blind to the other arm's rule in the same way.

So the tie is not evidence that the arms behave the same. It is evidence that
they agree on the sixteen things the set looks at. §3.1 carries the difference
the set could not see.

### 5.2 The discriminating check was pointed at one arm — material

Already described in §3.1: the Tester lane's 40-check conformance suite
hard-wires `_PACKAGE_ROOT = craft-arm`. The Coordinator ran it against the
control arm; the two line-break checks fail. The gap is closed by measurement,
not by argument.

### 5.3 The quality instrument cannot fail — material

Three probes, each on a throwaway copy:

1. **An empty tree** scores a clean report and exits 0: `package_modules: 0`,
   `public_functions_without_tests_count: 0` — the best possible value — every
   coverage `0.0`. It cannot tell "no package" from "a perfect package".
2. **A public function no test calls** is counted as tested, because the
   instrument intersects *names*, and the CLI test calls `subprocess.run`, so the
   name `run` matches.
3. **A `test_*` method on a class that is not a `TestCase`** inflates
   `test_cases` to 34 while `unittest` ran 33.

The Coordinator re-ran probe 1 and got the same report. For *these two arms* the
numbers happen to be true — the Reviewer confirmed `build_parser` really is
never called, by call site rather than by name — but the instrument cannot
demonstrate that, and the acceptance does not claim it can. This is the same
class of defect the Reviewer found in the first phase's instrument (a check that
cannot fail), found again by a different lane with a different method.

### 5.4 The duplicate-line ratio measures the craft arm's documentation — material for how the number is read

The Reviewer re-derived the metric with an independently written script and
listed the repeated lines: the craft arm's are `"""` ×9, `Args:` ×5, `Returns:` ×5,
`from __future__ import annotations` ×4, and two import lines each. The control
arm's are `"""` ×4 and `import sys` ×2. The metric penalises the craft arm for
its own documentation style and rewards the control arm for having fewer,
longer modules. It is reported in §3 as scaffolding, not as duplicated logic.

### 5.5 The craft arm's report states a false byte count — non-blocking

`craft-lab-craft-arm.md:196-197` quotes the stdout as `"chars: 37\nwords:
8\nlines: 2\n"`, 27 bytes. The raw capture is **31 bytes, CRLF-terminated** (the
Coordinator re-captured it: the last bytes are `6e 65 73 3a 20 32 0d 0a`); the
LF form would be 28 bytes, not 27. The count is wrong under either reading. The
specification never pins the terminator, so no requirement is broken — but this
is a reported number that was not derived from the code, and it landed in the arm
whose brief named the craft. On this one checkable point the control arm's
report is more accurate. The craft arm's quoted string is not cited anywhere in
this acceptance.

### 5.6 The hidden case runner always exits 0 — non-blocking

`cases.py:189` returns 0 even at 0/16, so the exit status cannot be used as the
verdict. The per-case output and the JSON summary are the verdict, and both are
in the reports.

## 6. The artefacts

```
.swarm/requirements/craft-lab.md                   the requirement set, R1 to R6
.swarm/decisions/2026-11-14-sample-size.md         the user's decision on the sample size
.swarm/decisions/2026-11-14-line-break-reading.md  the reading of the `lines` clause
.swarm/reports/craft-lab-craft-arm.md              the craft arm's report
.swarm/reports/craft-lab-control-arm.md            the control arm's report
.swarm/reports/craft-lab-tester.md                 the Tester lane: 40 checks, 43 mutations
.swarm/reports/craft-lab-reviewer.md               the Reviewer lane: F1 to F7
.swarm/reports/craft-lab-acceptance.md             this report
spec/textnorm-spec.md                              the specification both arms implemented
craft-arm/                                         the arm whose brief named the craft
control-arm/                                       the arm whose brief named nothing else
tester/test_spec_conformance.py                    the independent conformance suite
```

## 7. The commit ledger

```
0c5b1a5  baseline: the craft-lab test bed with its requirement set and specification
```

The repository has no remote. It is a local test bed; nothing was pushed.

## 8. What was not verified

1. The arms' internal quality beyond the one instrument: no type checker, no
   linter, no profiler, no performance measurement.
2. The Reviewer lane read `reviewer.md` and `shared.md` in full but did not audit
   the accuracy of the craft arm's rule→change attributions to `developer.md`
   and `python.md` line by line.
3. The ordering claim — that the craft arm loaded the craft files *before*
   writing code — is the lane's assertion and is not verifiable from the
   artefacts.
4. The brief half of R3 is not a repository artefact; it rests on this session's
   dispatch and on `README.md`.
5. No lane was run twice, so no within-condition variance is known.
6. The specification's other gaps the Tester lane reported were not closed: the
   "three public functions" clause names only two, and the specification is
   silent on the command line with no argument.
7. The instrument's own weaknesses in §5.3 mean the coverage numbers in §3 are
   indicative for these two arms; the Reviewer confirmed the two that matter by
   reading the call sites, but the instrument itself was not repaired in this
   round.
8. The specification's "lines" ambiguity was adjudicated by decision, not fixed
   in the specification text.
