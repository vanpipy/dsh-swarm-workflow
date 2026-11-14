# Reviewer report — `craft-lab`, round R4 (test phase)

**Lane:** Reviewer · **Read-only review** · **Craft applied:** `skills/swarm-engineering/reviewer.md`, `skills/swarm-engineering/shared.md`
**Date:** 2026-11-14 · **Interpreter:** `C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe` — CPython 3.12.14 (MSC v.1944 64 bit, AMD64), Windows host, `PYTHONDONTWRITEBYTECODE=1` on every run.
**Artifacts judged:** `spec/textnorm-spec.md`, `craft-arm/`, `control-arm/`, both lane reports, `D:\project\swarm-craft-lab-hidden\cases.py`, `D:\project\swarm-lab-python\tools\quality_report.py`.
**Files written by this lane:** this report, and nothing else.

---

## 0. Method, and the limits I set on my own conclusions

### 0.1 The methodological limit, stated first

**The craft skills are registered with the host for every agent in this session.** The plugin registers `swarm-craft-shared`, `swarm-craft-developer`, `swarm-craft-python` (and the rest) for whoever asks for them, not only for the lane that was told to use them. Therefore **"the control arm worked without the craft" is a fact about the BRIEF the control lane received, not about its environment.** The lab compares **two briefs**, not two environments. `.swarm/decisions/2026-11-14-sample-size.md:35-37` says this in the Coordinator's own words: "*two briefs*, not between two environments: the plugin registers the craft for every agent, so a brief alone cannot isolate it. A clean control would need a session where the craft skills are not registered at all." A clean control is not available in this host, and no brief can substitute for it.

### 0.2 What I did (each check re-run in my own process)

| # | Action | Result |
|---|---|---|
| 1 | Baseline snapshot (SHA256 + length) of every file under both arms, before any run | `%TEMP%\reviewer_baseline.txt`, 27 files |
| 2 | `python D:\project\swarm-craft-lab-hidden\cases.py D:\project\swarm-craft-lab\craft-arm` | `16/16 cases passed`, exit 0 |
| 3 | same, for `control-arm` | `16/16 cases passed`, exit 0 |
| 4 | `python -m unittest discover -s tests -t .` in each arm | craft `Ran 33 tests … OK` exit 0; control `Ran 55 tests … OK` exit 0 |
| 5 | `python -m unittest discover -s tester -t .` at the repo root (unmodified) | `Ran 40 tests … OK`, exit 0 (points at `craft-arm`) |
| 6 | `python -m textnorm sample.txt` / `demo.txt`, raw bytes captured | craft exit 0, stdout 31 bytes CRLF; control exit 0, stdout 33 bytes CRLF |
| 7 | **My own case set** (`%TEMP%\reviewer_cases.py`, 288 lines), derived by hand from the spec | craft `3/3 check groups passed`; control `2/3` — 8 findings |
| 8 | **My own metric script** (`%TEMP%\reviewer_independent_metrics.py`), re-implemented from the instrument's definitions without importing it | matches the instrument on every number, both arms |
| 9 | Instrument copied into each arm's own `tools/`, one line patched, run, copies deleted | matches the Coordinator's claim exactly (Section 3) |
| 10 | Mutation probes in `%TEMP%` copies only | 3 single-mutation clones + 2 instrument-validity clones (Section 2, F1/F3) |
| 11 | Final tree check against the baseline | 27 baseline files, 27 current files, **0 differences**; `tools/` copies removed |

**The instrument patch, stated exactly:** `D:\project\swarm-lab-python\tools\quality_report.py` was copied to `craft-arm\tools\quality_report.py` and `control-arm\tools\quality_report.py`; in each copy **exactly one line** was changed —
`PACKAGE = ROOT / "swarmlab"` → `PACKAGE = ROOT / "textnorm"` — and nothing else. Each copy was run as `python tools\quality_report.py --json` from its own arm root; both copies and both `tools/` directories were then deleted.

### 0.3 Failures in my own harness (method evidence, and a caution)

Two of my own checks produced **false** failures before I trusted them; both were caught because I re-derived the expectation instead of believing the failure:

1. **CLI cases all reported "no such file"** — I wrote the fixture into a temp directory but ran the CLI with `cwd` = the arm root. Fixed by running with `cwd` = temp dir and `PYTHONPATH` = arm root.
2. **`stats("a\n\nb")["words"] == 3` was my expectation and was wrong** — clause 4 of the spec collapses the two-newline run to one space, so the correct spec-derived value is 2. The check caught my expectation, not the code.

Neither arm was judged until both harness faults were fixed. **A failing check is not evidence until the check itself has been re-derived** — this is `reviewer.md` §3, and it is the reason the mutation results in Section 2 are worth reading.

### 0.4 Where I take the ambiguous rule

`shared.md` says a piece that cannot be checked is *advice*, not *guidance*. I took this reading: **a check I can run and make fail is binding; a claim I can only take on report is reported as unverified, not as verified.** Concretely — the craft arm's report *asserts* it loaded the craft files before writing code; that is not verifiable from the artefacts, so R2 is judged on what the requirement's check actually says (the report names the files and cites rules), and the ordering is reported as unverified.

---

## 1. R1–R6 verdict table

Contract: `.swarm/requirements/craft-lab.md`. Verdict vocabulary is exactly {met, not met, not demonstrated, not in scope}. "A requirement whose check was not run is `not demonstrated`, never `met`."

| Req | Requirement (abridged) | **Verdict** | Evidence for the verdict |
|---|---|---|---|
| **R1** (check at `craft-lab.md:16`) | One specification file describes the module both arms implement; both reports name it | **met** | `spec/textnorm-spec.md` exists (64 lines, read in full). `.swarm/reports/craft-lab-craft-arm.md:16` names it ("the whole specification (`spec/textnorm-spec.md`, 64 lines)"); `.swarm/reports/craft-lab-control-arm.md:5` names it ("Specification: `D:\project\swarm-craft-lab\spec\textnorm-spec.md` (read in full before any code was written)"). Both arms' behaviour tracks that one file. |
| **R2** (check at `:25`) | Craft arm loads shared craft, developer's craft and the Python pieces; report says which piece applied to which decision | **met** (the check as written) | `.swarm/reports/craft-lab-craft-arm.md:12-17` names all three skills **and** their file paths (`…\skills\swarm-engineering\shared.md`, `…\developer.md`, `…\languages\python.md`); per-file rule→change tables at `:19` (shared.md), `:32` (developer.md), `:41` (languages/python.md); at least one rule cited from each file: shared.md §2.2 at `:201` and §2.1 at `:232`, developer.md §5 at `:232`, python.md §19 at `:143`. **Caveat, reported not hidden:** the *ordering* ("before writing code", `:12`) is the lane's assertion and is not verifiable from the artefacts; and I read only `reviewer.md` and `shared.md` in full, so I did **not** audit whether the rule→change table's attributions to `developer.md`/`python.md` are accurate (Section 6). |
| **R3** (check at `:34`) | Control arm's brief carries the spec and nothing else (no craft path, skill name, or mention that craft exists); its report shows no craft citation | **met** (report half directly evidenced; brief half secondary) | Report half, directly checked by grep over the whole file for `skill|craft|catalog|swarm-engineering`: **5 hits, all innocuous** — `:1` title, `:4` work directory, `:5` the spec path, `:82` working directory, `:262` "I did not look at the craft arm's package, its report, or its numbers". **No craft file path, no skill name, no craft citation.** Brief half: the brief is chat-borne and is **not an artefact in the lab**, so I could not check it directly; the in-repo evidence is `README.md` ("The control arm's brief names the specification and nothing else") and the Coordinator's dispatch. **Adverse fact, carried to F5/F6:** `.swarm/decisions/2026-11-14-sample-size.md:31-33` records that the control lane's *session* carried the skill catalog and that the lane loaded the craft skills before reading the spec. R3 constrains the **brief**, not the environment — so the verdict stands, but the environment was not controlled. |
| **R4** (check at `:43`) | Both arms produce an importable `textnorm` package with normalize, stats, a `__main__` CLI, and tests that run on this host | **met** | `python -m unittest discover -s tests -t .` → craft-arm `Ran 33 tests … OK` (exit 0); control-arm `Ran 55 tests … OK` (exit 0). `python -m textnorm sample.txt` in `craft-arm` → exit 0, stdout `chars: 37 / words: 8 / lines: 2`; `python -m textnorm demo.txt` in `control-arm` → exit 0, stdout `chars: 84 / words: 17 / lines: 2`. Both packages import as `textnorm` (my case runner imported each arm fresh with the arm root at `sys.path[0]`, purged `textnorm` from `sys.modules` first). Both have `__main__.py`, `normalize` and `stats`. |
| **R5** (check at `:52`) | A case set the arms never saw is run against both packages after both are finished; cases live outside the repo | **met** (the run; the report clause is the Coordinator's to close) | The runner is at `D:\project\swarm-craft-lab-hidden\cases.py` — **outside** the repo. Its mtime is **2026-11-14 11:28:39**, later than the newest arm source file (craft-arm 11:25:03, control-arm 11:24:15) *and* later than both lane reports (11:26:45 / 11:25:24) → authored after both arms were finished. Both reports state they never saw it. My re-run printed per-case results for both arms and a JSON summary: **`16/16 cases passed`** for craft-arm, **`16/16 cases passed`** for control-arm. **Clause to close:** the acceptance report must state both per-arm counts. |
| **R6** (check at `:60`) | The same instrument measures both arms, and the report states what the numbers can and cannot show | **not demonstrated** | Half (i) — one instrument, per-arm numbers — is **demonstrated and re-derived by me** (Section 3: every number matches). Half (ii) — a **boundary section** saying two arms from one model family are *indicative rather than conclusive* — **cannot be demonstrated today**: no acceptance report exists in the lab. The only document carrying a boundary statement is `.swarm/decisions/2026-11-14-sample-size.md`, which is the Coordinator's decision record, not "the report"; it says what the acceptance report *must* contain (`:25`). It becomes **met** when the acceptance report carries the per-arm numbers and that boundary statement. Section 4.3 below supplies the material it must carry. |

**Verdict summary:** R1 met · R2 met · R3 met · R4 met · R5 met · R6 not demonstrated (pending the acceptance report).
**No requirement is *not met*.** Nothing in either arm contradicts the specification on the evidence I hold.

---

## 2. Findings

Severity vocabulary is exactly {blocking, material, non-blocking, out of scope}. **No finding is blocking**: nothing in either arm violates the specification on the evidence I hold, and the acceptance decision can still be written — but only with the boundaries in Section 4.3 attached.

---

### F1 — The lab's headline oracle cannot fail on the defect class that separates the arms
**Severity: material** · **Craft rule: `shared.md` §2.1 (make the check falsifiable — make it fail on purpose and show that it fails) and §2.2 (re-derive every number a second way); `reviewer.md` §5 (hunt the check that cannot fail)**

**Claim.** The Coordinator's hidden case set reports a tie (16/16 vs 16/16). That tie is not evidence that the arms behave the same: the case set is blind to the *only* behavioural difference between the arms, and blind to a second defect class.

**Evidence.** I made each check fail on purpose, in `%TEMP%` clones only (the repo arms were never edited):

| Clone (single mutation) | Mutation | Coordinator's `cases.py` | Craft arm's own 33-test suite | Control arm's own 55-test suite | Tester's 40-test suite | **My case set** |
|---|---|---|---|---|---|---|
| `p1_wide` | craft `_LINE_BREAK` widened from `\r\n\|\r\|\n` to Python's 11-character `splitlines()` set | **16/16 passed — BLIND** | **Ran 33 tests … OK — BLIND** | (not applicable) | **FAILED (failures=2)** | **FAIL, 8 findings** |
| `p2_emdash` | craft translation table loses `0x2014: "-"` (em dash) | **16/16 passed — BLIND** | **FAILED (failures=1)**, `AssertionError: 'a??b' != 'a-b'` | (not applicable) | not run | **FAIL, 3 findings** |
| `p3_control_fixed` | control `len(text.splitlines())` → only `\r\n\|\r\|\n` | **16/16 passed — BLIND** | (not applicable) | **Ran 55 tests … OK — BLIND** | not run | **3/3 groups pass** |

Root causes, read in the source:
- `D:\project\swarm-craft-lab-hidden\cases.py:46-47` — the one dashes case is `mod.normalize("\u201csmart\u201d \u2013 dash") == '"smart" - dash'`. It contains **U+2013 (en dash) only**; the em dash U+2014 is never exercised, so removing the em-dash rule is invisible.
- No case in the set uses a line break outside `\r\n|\r|\n`, so the `splitlines()`-versus-universal-newlines divergence is invisible.
- The craft arm's own suite pins only `\n`, `\r`, `\r\n` (`craft-arm/tests/test_counting.py`), so widening its rule is invisible to it.
- The control arm's own suite pins only `\n`, `\r`, `\r\n` (`control-arm/tests/test_stats.py`), so *narrowing* its rule is invisible to it.

**Consequence.** "16/16 vs 16/16" measures the two arms only where they already agree. The single observable behavioural difference between the arms, and the single largest specification-reading risk, sit entirely outside the lab's headline evidence. The acceptance report must not present the tie as evidence of equivalent behaviour.

---

### F2 — The only check in the lab that discriminates the line-break rule was pointed at one arm only
**Severity: material** · **Craft rule: `shared.md` §2.3 (validate where the artefact runs) and §2.2 (re-derive every number a second way); tester craft, *choose the oracle* and *cover the boundary***

**Claim.** The Tester lane's independent conformance suite is the only artefact in the lab that detects the line-break divergence — and it is hard-wired to `craft-arm`, so the divergence was never put to the arm that actually has it.

**Evidence.**
- `D:\project\swarm-craft-lab\tester\test_spec_conformance.py` — `_PACKAGE_ROOT = _LAB_ROOT / "craft-arm"`; 40 tests. Run unmodified at the repo root: `Ran 40 tests in 0.959s / OK`, exit 0.
- Pointed at the `p1_wide` clone (the craft arm with the *wide* rule): `Ran 40 tests … FAILED (failures=2)` —
  `test_spec_conformance.py:237` `self.assertEqual(stats("a\fb")["lines"], 1)` → `AssertionError: 2 != 1`;
  `test_spec_conformance.py:243` `self.assertEqual(stats("a\u2028b")["lines"], 1)` → `AssertionError: 2 != 1`.
- Pointed at a `%TEMP%` copy of the **control** arm: **the same two failures**, same two assertions.

**Consequence.** The one check that could have adjudicated the divergence ran against the arm that passes it. The control arm's reading of the specification was therefore never tested by anyone; it survived only because nobody pointed the discriminator at it.

---

### F3 — The quality instrument cannot fail, and its two strongest counts are naming artefacts
**Severity: material** · **Craft rule: `shared.md` §2.1 (falsifiable checks) and §2.2 (re-derive every number a second way); `reviewer.md` §4 (*a measurement that cannot discriminate*)**

**Claim.** `quality_report.py` is the tool the whole comparison rests on. It reports a clean bill of health for an empty tree, it cannot tell a function that no test calls from one that is called, and its "test case" count counts definitions, not executed tests.

**Evidence.** Three probes, each on a `%TEMP%` copy with only the one patched line:

1. **Empty tree** (a `tests/test_smoke.py`, no package): the instrument **exits 0** and prints a clean-looking report — `package_modules: 0`, `public_functions: 0`, `public_functions_without_tests: []` (count **0** — the best possible value), every coverage `0.0`, `max_function_length: 0`, `duplicate_line_ratio: 0.0`, `test_cases: 1`. It cannot distinguish "no package" from "a perfect package".
2. **A public function no test calls** (clone `m6`: `def run(argv):` appended to `textnorm/__init__.py`, never called): instrument reports `public_functions: 4`, `public_functions_without_tests: []`, count **0**. The reason is in the source: `called_names()` collects *names* called anywhere in the tests, and the craft arm's CLI test calls `subprocess.run(...)` — the name `run` therefore matches. The metric intersects **names, not call sites**.
3. **A fake test** (clone `m7`: `class NotATestCase:` containing `def test_not_a_test_case(self):` appended to `tests/test_cli.py`): instrument reports `test_cases: 34` while `unittest` reports `Ran 33 tests … OK`.

**Consequence, stated precisely.** For *these two arms* the numbers happen to be true: `build_parser` really is never called by the control arm's tests (I confirmed it by call-site search, not by name match), and 33/55 really are the executed counts. But the instrument cannot be relied on to *demonstrate* those facts — it happens to be right here. "0 public functions without a test" and "33 test cases" are weaker claims than they read, and the acceptance report should say so rather than present them as quality evidence.

---

### F4 — The duplicate-line ratio measures the craft arm's documentation scaffolding, not duplicated logic
**Severity: material** (for how the number is read) · **Craft rule: `shared.md` §2.2 (re-derive every number a second way — the disagreement is the finding); `reviewer.md` §3**

**Claim.** `duplicate_line_ratio` reads as "0.1678 vs 0.044 — the craft arm duplicates more". That reading is wrong, and my independent re-derivation shows exactly what it measures.

**Evidence.** My `%TEMP%\reviewer_independent_metrics.py` reproduces the instrument exactly (0.1678 / 0.044), and then lists the repeated stripped lines that produce them:

- **Craft arm (0.1678 over 149 counted lines):** `"""` ×9, `Args:` ×5, `Returns:` ×5, `from __future__ import annotations` ×4, `from ._cli import main` ×2, `from ._counting import stats` ×2.
- **Control arm (0.044 over 91 counted lines):** `"""` ×4, `import sys` ×2.

Every repeated line in the craft arm is a docstring delimiter, a docstring section heading, or an import line. **The instrument penalises the craft arm for its own documentation style**, and rewards the control arm for having fewer, longer modules. Neither number is a measure of duplicated logic.

**Consequence.** The acceptance report must present 0.1678 vs 0.044 as *docstring scaffolding and module count*, or omit it. Presenting it as a quality ranking would invert the truth: the craft arm's extra 0.12 is the visible trace of the Args/Returns/Raises docstrings that the instrument's `docstring_coverage: 1.0` cannot distinguish from the control arm's one-liners.

---

### F5 — The skill-catalog disclosure is attributed to the control lane's report, but it is not in that report
**Severity: material** (it is the only evidence for the methodological limit) · **Craft rule: `reviewer.md` §2 (read the requirement, not a summary) and §3 (the disagreement between the brief and the artefact is the finding)**

**Claim.** The Coordinator's brief tells me: "The control lane's own report discloses that its session carried the skill catalog and that it loaded the craft skills before reading the specification, while deriving nothing from them. That disclosure is the evidence." The artefact does not contain it.

**Evidence.**
- grep over `.swarm\reports\craft-lab-control-arm.md` for `skill|craft|catalog|swarm-engineering` → **5 hits, none of them a disclosure**: `:1` (title), `:4` (work directory), `:5` (the spec path), `:82` (working directory), `:262` ("I did not look at the craft arm's package, its report, or its numbers").
- The disclosure actually lives in `.swarm\decisions\2026-11-14-sample-size.md:31-33`: "The control arm's own report disclosed that its session carried the skill catalog the plugin registers for every agent, and that the lane loaded the craft skills before it read the specification, while deriving nothing in them." The same file at `:35-37` draws the correct conclusion.

**Consequence.** The methodological limit rests entirely on the Coordinator's own record, not on the control lane's own words. The control lane is therefore **not** a disinterested source on this point, and the acceptance report cannot cite "the control lane's report" for it. It may cite the decision file — and it must attribute the limit correctly. Where the requirement file and the reports disagree, `craft-lab.md` wins; here the disagreement is between the Coordinator's *summary of an artefact* and the artefact, and the artefact wins.

---

### F6 — The comparison is between two briefs, not two environments; one arm per condition cannot support a general claim
**Severity: material** (it bounds the whole result) · **Craft rule: `shared.md` §2.3 (validate where the artefact runs — name the environment; differences go in the boundary section); `reviewer.md` §6 (name what you did not check)**

**Claim.** The experiment as designed cannot attribute any measured difference to the craft guidance, for two independent reasons.

**Evidence.**
1. **Environment not isolated.** `.swarm\decisions\2026-11-14-sample-size.md:31-37` records that the control lane's session carried the skill catalog the plugin registers for every agent, and that it loaded the craft skills before reading the specification. A brief can withhold a skill name; it cannot unregister a skill. The only thing the design isolates is *what the brief said*.
2. **n = 1 per condition.** One lane per condition, one model family, one specification, one host, one interpreter version. A single sample per arm cannot separate a craft effect from the lane's own variance, the model's variance, or the luck of the draw.

**Consequence.** The honest claim is: *"in this one pair of runs, the arm whose brief named the craft produced a differently-shaped artefact."* Any stronger phrasing ("the craft produces X", "without the craft you get Y") is not supported by this design. A conclusive test would need more than one lane per condition, conditions identical apart from the craft guidance, **and** a host where the craft skills are not registered for the control lane — a control that this host cannot provide.

---

### F7 — The craft arm's report states a stdout byte string and a byte count that are false; the control arm's report got this right
**Severity: non-blocking** (the specification does not pin the terminator, so no requirement is broken) · **Craft rule: `shared.md` §2.2 (a number reported once is an assertion — re-derive it); `reviewer.md` §4 (*a test pinning wording*)**

**Claim.** `.swarm/reports/craft-lab-craft-arm.md:196-197` says: "stdout is exactly the three documented lines (`"chars: 37\nwords: 8\nlines: 2\n"`, 27 bytes), stderr is empty (0 bytes)." The literal output is CRLF-terminated and 31 bytes; the LF form would be 28 bytes, not 27. The count is wrong under either reading.

**Evidence.**
- Raw capture of `python -m textnorm sample.txt` in `craft-arm` → exit 0, stdout bytes `b'chars: 37\r\nwords: 8\r\nlines: 2\r\n'` (31 bytes), stderr `b''`.
- Control arm, same capture: `b'chars: 84\r\nwords: 17\r\nlines: 2\r\n'`; and `.swarm/reports/craft-lab-control-arm.md` row 11 explicitly records that the terminator is CRLF on this host.
- The byte counts are not pinned by anything: both arms' suites capture stdout in **text mode** (universal newlines), so a lone `"\r"` or `"\r\r\n"` would pass every test in both arms, and `cases.py:120` normalises CRLF explicitly before comparing.

**Consequence.** No behavioural defect: the specification never names the terminator. But this is precisely the "a reported number that is not derived from the code" pattern, and it lands in the arm whose brief named the craft. On this one checkable point, the **control arm's report is more accurate than the craft arm's**. The acceptance report should not cite the craft arm's quoted stdout string.

---

### F8 — The case runner's process exit code is always 0, even when every case fails
**Severity: non-blocking** (the acceptance decision read the printed summary, which is correct) · **Craft rule: `shared.md` §2.1 (a check that cannot fail is not a check); `reviewer.md` §4**

**Claim.** `cases.py` cannot signal failure through its exit status.

**Evidence.** `D:\project\swarm-craft-lab-hidden\cases.py:189` — `main()` ends `return 0` unconditionally; `:193` raises `SystemExit(main(sys.argv))`. Run against an arm root with no package: the output is `0/16 cases passed` with every case labelled a failure — and the **process exit code is 0**.

**Consequence.** Any gate keyed on the exit status of the runner would read "success" on a total failure. The Coordinator used the printed per-case summary (which does discriminate, and which I reproduced), so the acceptance conclusion is not affected — but the acceptance report should say that the runner's status code is not a signal, and that the counts were read from its output.

---

### F9 — One sentence in the control lane's report misstates the specification
**Severity: non-blocking** · **Craft rule: `shared.md` §3.12 (keep the docstring/report true); `reviewer.md` §2 (the disagreement is the finding)**

**Claim.** `.swarm/reports/craft-lab-control-arm.md:67` ends: "…the specification does mention either way." The specification mentions **none** of `\v`, `\f`, `U+001C`–`U+001E`, `U+0085`, `U+2028`, `U+2029`; it enumerates only `\r\n`, `\r`, `\n`.

**Evidence.** `spec/textnorm-spec.md` — the `lines` clause reads "split on universal newlines (`\r\n`, `\r`, `\n` all count)". Nothing else. Grep for the phrase returns that single line.

**Consequence.** Almost certainly a dropped "not" (the same row otherwise argues at length that the spec is silent on these characters), and the lane's *chosen* behaviour is unaffected. But as written the report asserts the opposite of the specification on the exact point that decides the divergence — and the requirement file wins over any report, so the report must be corrected before the acceptance report relies on it. The control lane's row 3 choice itself remains a legitimate reading of a specification that is silent on those characters.

---

## 3. Numbers: the Coordinator's claim versus my measurement

Procedure for both arms: copy `D:\project\swarm-lab-python\tools\quality_report.py` into the arm's own `tools/`, patch exactly one line (`PACKAGE = ROOT / "swarmlab"` → `PACKAGE = ROOT / "textnorm"`), run `python tools\quality_report.py --json` from the arm root, delete the copy and the `tools/` directory. Same procedure, same patch, both arms.

| Metric | Craft arm — claimed | Craft arm — **measured** | Control arm — claimed | Control arm — **measured** | Match |
|---|---|---|---|---|---|
| annotation coverage | 1.0 | **1.0** | 0.75 | **0.75** | ✔ |
| docstring coverage | 1.0 | **1.0** | 1.0 | **1.0** | ✔ |
| module docstring coverage | 1.0 | **1.0** | 1.0 | **1.0** | ✔ |
| public functions | 3 (main, normalize, stats) | **3 (main, normalize, stats)** | 4 (build_parser, main, normalize, stats) | **4 (build_parser, main, normalize, stats)** | ✔ |
| public functions without a test | 0 | **0** | 1 | **1 (`build_parser`)** | ✔ |
| test cases | 33 | **33** | 55 | **55** | ✔ |
| package modules | 5 | **5** | 3 | **3** | ✔ |
| avg function length | 21.67 | **21.67** | 20.75 | **20.75** | ✔ |
| max function length | 27 | **27** | 27 | **27** | ✔ |
| max nesting depth | 1 | **1** | 2 | **2** | ✔ |
| duplicate line ratio | 0.1678 | **0.1678** | 0.044 | **0.044** | ✔ |

**Every claimed number reproduces exactly, for both arms.** Independent second derivation (`%TEMP%\reviewer_independent_metrics.py`, written from the instrument's definitions without importing it) agrees on every value; for nesting depth I additionally implemented an **ancestry-based** rule (count only enclosing control nodes) and got the same 1 and 2, so the instrument's `ast.walk` over-counting is not distorting this comparison. Executed-test counts confirmed independently by unittest itself (`Ran 33 tests`, `Ran 55 tests`).

**What the numbers actually rest on** (this is where the numbers must be read, not where they disagree):
- **annotation coverage 1.0 vs 0.75** — the control arm's `main(argv=None) -> int` leaves `argv` unannotated and `build_parser()` has no annotations at all (`control-arm/textnorm/cli.py:12`, `:26`). The craft arm annotates every parameter and every return (`craft-arm/textnorm/_cli.py:36` `main(argv: Sequence[str] | None = None) -> int`). Faithful.
- **max nesting depth 1 vs 2** — `control-arm/textnorm/cli.py:37` (`try:`) contains `:40` (`with open(...)`), so the read is nested inside the error handler. The craft arm extracts the read into `_read_text` (`craft-arm/textnorm/_cli.py:65`) and leaves only `try:` in `main` (`:53`), with the `with` at `:81` inside the helper. Faithful — but it rewards extraction, so it measures structure, not discipline.
- **duplicate line ratio** — see **F4**: it measures docstring scaffolding and module count, not duplicated logic.
- **docstring coverage 1.0 vs 1.0** — the metric counts *any* docstring. It cannot see the craft arm's Args/Returns/Raises sections, so it cannot show the craft arm's documentation advantage; it can only hide it.

---

## 4. Did the craft change anything measurable?

### 4.1 What it demonstrably changed (in this pair of runs)

1. **One behaviour.** The line-break rule. Craft: exactly `\r\n|\r|\n`. Control: Python's eleven-character `splitlines()` set. My independent case set finds **8 divergences** — `U+000B`, `U+000C`, `U+001C`, `U+001D`, `U+001E`, `U+0085`, `U+2028`, `U+2029` — each giving `lines == 2` where the craft arm gives `1`. This is the only behavioural difference I found between the two arms, and it is exactly the point where the craft arm's report shows it deliberately chose the specification's literal enumeration over the broader Python convention (`craft-lab-craft-arm.md`, decision 4).
2. **The public API surface.** Three public names and a fully annotated API (1.0) versus four public functions with two unannotated signatures (0.75). The craft arm's report records that it considered and rejected a fourth visible name (`from __future__ import annotations` binding a visible `annotations`).
3. **Module structure.** Five modules with one reason to change each versus three, and a flatter `main` (nesting 1 vs 2).
4. **Documentation depth (visible in the code, invisible to the instrument).** The craft arm's docstrings carry Args/Returns/Raises sections; the control arm's are one-liners. The instrument scores both 1.0 and *penalises* the craft arm for it (F4).

### 4.2 What it did not change

- **Correctness on the visible surface:** 16/16 on the hidden case set for **both** arms; my independent set's `normalize` and `cli` groups pass on **both** arms; both suites are green.
- **Docstring coverage as measured** (1.0 both), **max function length** (27 both), **module docstring coverage** (1.0 both).
- **Report accuracy, on the one byte-level claim I could check:** the craft arm's report quotes a stdout string and byte count that are wrong; the control arm's report records the CRLF terminator correctly (**F7**).

### 4.3 What this comparison CANNOT show

1. **That the craft caused any of it.** The control lane's environment carried the craft skills (the plugin registers them for every agent), and the Coordinator's own decision file records that the lane loaded them before reading the specification. This is a comparison of **two briefs**, not two environments (**F6**).
2. **That one arm per condition generalises.** n = 1 per condition, one model family, one specification, one host, one interpreter. A single sample cannot separate a craft effect from lane-to-lane or run-to-run variance.
3. **That the arms are equivalent.** The tie is blind to the one behavioural difference that exists (**F1**).
4. **That the instrument measures quality.** It scores an empty tree as clean, cannot tell an untested function from a tested one, and counts definitions rather than executed tests (**F3**); its duplicate ratio measures documentation scaffolding (**F4**).
5. **That the hidden case set is a fair oracle.** 16 cases, blind to the em dash and to every non-universal line break; its exit status is always 0 (**F8**).
6. **Anything about behaviour nothing touched:** permission errors versus missing files (the craft arm records that it knowingly overrode `python.md` §19 to follow the specification — a defensible choice, but the report does not claim the other behaviour is wrong), BOM handling, non-Windows hosts, other Python versions, very large files, malformed CLI arguments, and concurrent/streaming input.
7. **Anything about the effect of the craft on the *lane's behaviour* rather than on the artefact** — for example whether the craft changed how the lane chose a side when the specification was silent. Both lanes documented their silent-point decisions; the craft lane's table maps more of them to explicit rules, but with one sample this is an anecdote, not a measurement.

---

## 5. Does the evidence support the sample-size decision?

`.swarm/decisions/2026-11-14-sample-size.md:20` records: "Option 1. The user answered 'Accept the indicative result'"; `:25` requires the acceptance report to say the difference is **indicative, not conclusive**, and to name what a conclusive test would need.

**My answer: yes, conditionally — and the decision file needs two corrections before it is cited.**

- **Supported.** The decision is to accept an *indicative* result, and the evidence does support an indicative result about the two artefacts: I re-derived every instrument number (all match), reproduced the hidden-set tie, found and characterised the one behavioural difference, and confirmed both arms against their own suites and against the tester suite.
- **Correction 1 (F5).** The decision file at `:31-33` says the disclosure "…disclosed" comes from the control lane's report. It does not — that report contains no such disclosure (grep: 5 innocuous hits). The disclosure exists only in the decision file itself. The limit is still real, but it must be attributed to the Coordinator's own record, not to the control lane's report.
- **Correction 2 (F6).** The decision file's own reasoning ("two briefs, not two environments") is correct and must be carried into the acceptance report verbatim in substance, and paired with the n = 1 limit. The acceptance report must not use the framing "the control arm worked without the craft".

---

## 6. What I did not check

- **I did not read `developer.md` or `languages/python.md` in full.** I applied only the reviewer and shared craft, as briefed. I therefore did **not** audit whether the craft arm's rule→change table (`.swarm/reports/craft-lab-craft-arm.md:32`, `:41`) attributes each rule accurately — R2 is judged on the requirement's check (the report names the files and cites a rule from each), not on the accuracy of the attributions.
- **I did not judge the arms against the craft's *style* preferences** (naming, module granularity, comment style) except where a number in the comparison depends on them (F4).
- **I did not run the Tester lane's suite in place against a mutant** — I ran copies in `%TEMP%` with `_PACKAGE_ROOT` redirected. The original file is untouched.
- **I did not test** permission-denied files, BOM-prefixed files, non-UTF-8 files beyond the CLI's decode-error path, files with mixed line endings, empty files through the CLI, very large files, extra CLI arguments, `--help`, or non-Windows/other-Python behaviour. Both arms' own reports list the same gaps.
- **I did not judge the arms' code for defects outside the specification's surface** (e.g. exception chaining, resource handling beyond the `with` blocks, locale/encoding of stdout).
- **I did not compare the two arms' reports for completeness or honesty beyond the specific claims I re-derived** (stdout bytes, test counts, mutation outcomes).
- **I did not re-derive the arms' *published* counts** (37/8/2 and 84/17/2) with a third-party script; I confirmed them by running the CLI and by the instrument's independent count, which is enough for the claims I made but is not the same as the craft arm's own hand-re-derivation.
- **I did not run any git command**, did not modify either arm, did not modify `D:\project\swarm-craft-lab-hidden`, and did not touch the plugin tree.

---

## 7. Housekeeping

- **Both arm trees are byte-for-byte unchanged.** Baseline (SHA256 + length + relative path, 27 files) taken before any run; final check after every run and after the instrument copies were removed: **27 baseline files, 27 current files, 0 differences** — nothing changed, added or removed, including the pre-existing `__pycache__` directories (byte-identical, because `PYTHONDONTWRITEBYTECODE=1` was set on every run).
- **The hidden case set is unchanged.** `D:\project\swarm-craft-lab-hidden` contains only `cases.py` (6001 bytes) — the runner writes and deletes its own fixture, and no fixture was left behind by my runs.
- **Throwaways:** every scratch artefact (my case set, my metric script, the baseline snapshot, the mutation clones, the instrument copies) lived in `%TEMP%` and was deleted afterwards. The two temporary `tools/` directories inside the arms were removed.
- **No git command was run.** The Coordinator commits.
- **This report is the only file this lane wrote.**
