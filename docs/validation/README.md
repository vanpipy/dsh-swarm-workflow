# The validation record

Three test beds were run against this bundle. This folder is their evidence: the
requirement sets, the specifications and contracts the lanes implemented, the
decisions taken along the way, every lane report, and the acceptance report
that closes each phase.

The test beds themselves are **not** in this repository. They were local working
repositories, each with its own history, and they have been removed:

- `D:\project\swarm-craft-lab` — the craft test bed.
- `D:\project\swarm-mixed-lab` — the five-language test bed.
- `D:\project\swarm-lab-python` — the first phase's test bed, with its control arm.

What is here is the part worth keeping: what was asked, what was decided, what
each lane actually did, and what could not be shown.

---

## swarm-lab — the first phase: the workflow, the DSH surfaces and code quality

Ten rounds over a small Python package, with a single-shot control arm to
measure the agentic path against, and a live probe that applies the installed
bundle to the real host runtime.

| File | What it holds |
|---|---|
| `requirements.md` | R1 to R10, each with its own check |
| `decision-cli-multiple-files.md` | the user's decision: one summary per file |
| `decision-worktree-boundary.md` | the user's decision: `swarm_worktree` stays disabled, recorded as a verified boundary |
| `acceptance.md` | **the verdict**, the DSH feature matrix, the quality comparison and what was not verified |
| `report-developer.md`, `report-tester.md`, `report-reviewer.md`, `report-remediation.md` | the four lanes of the first phase |
| `report-r10.md`, `report-r9-primitives.md` | the feature round and the primitives round |
| `report-workflow*.md` | the `workflow` fan-out: three lanes and the merge |
| `quality-comparison.md` / `.json`, `quality-r2.json`, `quality-r2b.json` | the instrument's measurements, both arms, both rounds |
| `tools/quality_report.py` | the quality instrument: coverage, function length, nesting, duplicate ratio, untested public functions |
| `tools/quality_compare.py` | the comparison driver: it runs the same instrument in two trees |
| `tools/host_prompt_probe.mjs` | the live probe: it loads the **installed** bundle onto the real host cordis runtime and prints the composed prompts, the skill registrations and the `/swarm` output |

Two findings from that phase are worth keeping in view: the live probe is what
caught the double registration caused by a stamp computed before the files were
read, and the reviewer's two material findings were both checks that could not
fail.

---

## craft-lab — does the craft guidance make a lane's work better?

One specification, two arms. The craft arm's brief named the three craft files;
the control arm's brief named the specification and nothing else. One
instrument measured both, and a hidden case set (kept outside the test bed
entirely, so neither arm could read it by accident) ran against both after they
were finished.

| File | What it holds |
|---|---|
| `requirements.md` | R1 to R6, each with its own check |
| `spec-textnorm.md` | the specification both arms implemented |
| `decision-sample-size.md` | the user's decision to accept an indicative result |
| `decision-line-break-reading.md` | the adjudication of the one clause the arms read differently |
| `report-craft-arm.md` | the craft arm's report, with its rule→change attributions |
| `report-control-arm.md` | the control arm's report |
| `report-tester.md` | the independent conformance suite: 40 checks, 43 deliberate mutations |
| `report-reviewer.md` | the independent review: findings F1 to F7 |
| `hidden-cases.py` | the hidden case set — 16 cases, kept outside the test bed so neither arm could read it |
| `acceptance.md` | **the verdict**, the measured difference, and the boundary of what the comparison supports |

The result in one line: both arms are correct on the visible surface, the craft
arm's artefact differs in four re-derivable ways, and the comparison is between
two briefs rather than two environments, with one sample per condition — so it
is indicative, not conclusive. `acceptance.md` §4 says exactly what the evidence
supports and what it cannot.

## mixed-lab — does the workflow hold when the work spans five languages?

One contract, five independent lanes (Python, TypeScript, Go, Java, Rust) that
were never shown the expected numbers, so the comparison between them is
independent.

| File | What it holds |
|---|---|
| `requirements.md` | R1 to R8, each with its own check |
| `contract.md` | the ledger contract every lane implemented |
| `oracle.md`, `expected.json` | the expected output, derived by hand from the fixture |
| `check_python.py` | the checker that compares an implementation against the oracle |
| `decision-executability.md` | which languages this host can actually execute |
| `decision-boundaries.md` | the eight edges the contract leaves open, and how they were settled |
| `report-python.md` … `report-rust.md` | the five lane reports |
| `report-oracle.md` | the oracle lane |
| `report-crosscheck.md`, `report-go-crosscheck.md`, `report-rust-crosscheck.md` | the workflow fan-out that checked Go and Rust clause by clause against the contract |
| `report-verdict-table.md` | **the cross-language verdict table** — every row marked `executed` or `read` |
| `acceptance.md` | **the verdict**, the re-derived evidence, and the open divergence |

The result in one line: the three languages this host can execute (Python,
TypeScript, Java) produce byte-identical output, and one material divergence
stays open on purpose — Go accepts an unknown record key where the other four
reject it, and no Go toolchain exists here to fix it and prove the fix.

---

## audit-rounds and provenance — the earlier audit of this bundle's own text

Before the two test phases, this bundle's shipped text was audited against the
host it runs on: the wording of the policy, the claims about the runtime, the
citations inside the skill, and the code pointers in the runtime note. Those
rounds left their documents behind, and they are kept here because they are the
reason several phrases in the shipped files read the way they do.

| File | What it holds |
|---|---|
| `audit-rounds/*.md` | the round documents: the audits (`AUDIT.md`, `AUDIT-CODE.md`, `AUDIT-TEXT.md`, `AUDIT-REVIEW.md`), the design set (`DESIGN-*`), the test-round set (`HT-*`, `HT2-*`), the verdicts (`FINAL-VERDICT.md`, `FINAL-REVIEW-2026-11-10.md`, `HT2-VERDICT.md`, `REVIEW-verdict.md`), the findings and fixes, the rename and install notes, and the team protocol |
| `audit-rounds/briefs/*.md` | the briefs the audit lanes were given |
| `audit-rounds/tools/` | the checkers those rounds used: citation and pointer checks, the mutation scripts, the probes, and the round's own test copies |
| `provenance/user-skill-paste.md` | the user's original paste of the role-methods text — the source of `skills/swarm-engineering/swarm-engineering.md`, which is shipped byte for byte |

---

## How to read a verdict

Every requirement in this bundle carries its own check, and the rule from the
skill applies to these reports too:

> A verdict without evidence is `not demonstrated`, never `met`.

Each acceptance report names, per requirement, the file and the line the
evidence comes from, and ends with a section listing what was **not** verified
on this host — the toolchains that do not exist, the suites that were not
re-run, and the checks that cannot fail. Read that section before quoting a
verdict.
