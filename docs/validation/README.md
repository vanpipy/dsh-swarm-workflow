# The validation record

Two test beds were run against this bundle. This folder is their evidence: the
requirement sets, the specifications and contracts the lanes implemented, the
decisions taken along the way, every lane report, and the acceptance report
that closes each phase.

The test beds themselves are **not** in this repository. They are local working
repositories, each with its own history, and they are not published:

- `D:\project\swarm-craft-lab` — the craft test bed.
- `D:\project\swarm-mixed-lab` — the five-language test bed.

What is here is the part worth keeping: what was asked, what was decided, what
each lane actually did, and what could not be shown.

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

## How to read a verdict

Every requirement in this bundle carries its own check, and the rule from the
skill applies to these reports too:

> A verdict without evidence is `not demonstrated`, never `met`.

Each acceptance report names, per requirement, the file and the line the
evidence comes from, and ends with a section listing what was **not** verified
on this host — the toolchains that do not exist, the suites that were not
re-run, and the checks that cannot fail. Read that section before quoting a
verdict.
