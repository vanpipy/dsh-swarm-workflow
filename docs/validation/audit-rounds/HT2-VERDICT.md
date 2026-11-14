# HT2 - the second ladder (append to FINAL-VERDICT.md)

## 9. The second ladder: requirement matching against a real repository

The first ladder tested the swarm workflow against a disposable package. This one
runs against the reader's own repository - a git worktree of `reading-collector`
on branch `swarm/lab11` - and it tests the NEW implementation of the workflow:
requirement matching (skill section 16) and requirement handover (section 17),
with the numbered-criterion scheme removed and the requirements living in files
under `.swarm/requirements/`.

**What the ladder did.** Twelve rounds over two work items in the picker's daily
ritual:

| Round | Role | What it established |
|---|---|---|
| R1 | Developer | A malformed `daily_limit` is refused with exit 2 and a message that names the key, before any fetch and before any write |
| R2 | Tester | The requirement-clause file for work item A: 12 tests, each citing the requirement it covers |
| R3 | Reviewer | All three requirements of work item A met, with nine mutants killed in a scratch copy |
| R4 | Developer | Work item B: the lane found that the brief and the requirements file disagreed about an exit code, reported the conflict and left the disputed number out of the code |
| R5 | Reviewer | The disputed requirement came back `not met`; the acceptance was blocked |
| R6 | the reader | The quiet-feed exit code is a product decision: the reader chose 0, and the reason was recorded in the requirements file |
| R7 | Developer | The quiet feed now exits 0 - a successful run - and the module docstring's exit-code list was corrected |
| R8 | Tester | The requirement-clause test file for work item B: 16 tests, one per condition |
| R9 | one `workflow` call, three lenses | Two requirements `not demonstrated`; the branch's citations drifted; the plugin's requirement rules did not reach every lane |
| R10 | Reviewer | The full verdict table, and two checks that could not fail |
| R10b | Tester | The five defects the reviews found, repaired in the checks - never in the production code |
| R10c | Reviewer | The re-review of the blocked items only: **ACCEPT**, no requirement `not demonstrated` |

**The three rules the ladder proved.**

1. *A conflict between the brief and the requirements file is a report, not a
   coin flip.* In R4 the lane was given a brief that contradicted the authority
   file about an exit code. It reported the conflict, implemented everything
   else, and put no number in the code. In R5 the Reviewer judged the
   requirement as the file states it and the acceptance was blocked. In R6 the
   reader decided, and the decision - with its reason, its rejected options and
   its cost - was recorded in the requirements file before any code changed.
   That is the handover rule working end to end, and it is the part that only a
   real repository could exercise.
2. *A check that cannot fail is not a check.* The round-9 fan-out and the
   round-10 mutant probe found two clause assertions that decided nothing: one
   was satisfied by the pytest `tmp_path` in the captured command line, the
   other pinned no message at all. The green suite said nothing; the mutant
   probe said everything.
3. *The repair is a new round.* The two weak checks were repaired by a Tester
   lane (R10b) and re-judged by a fresh Reviewer (R10c) that was told to
   decide only the blocked items. Nothing was accepted in the round that found
   it, and nothing was taken on trust afterwards: the Coordinator re-ran both
   mutants itself.

**The defects the ladder found and the plugin's answer.** Twenty-two findings
(F33-F54 in HT2-FINDINGS.md): nine in the branch's requirements files and clause
tests, five in the plugin, and the rest in the process. Five were the plugin's
own: the requirement rules did not reach the Developer lane, the Coordinator
prompt never mentioned them, sections 14 and 17 contradicted each other, the
skill's boundary markers credited the user's own relocated prose to the plugin,
and the Coordinator prompt's pointer repeated the phrasing section 17 forbids.
All five were fixed, the bundle was re-applied, and a fresh read-only probe
confirmed the new sentences in the SERVED prompt.

**What it cost.** 731 agent-side calls across the delegated lanes; 431
Coordinator calls. The measurement and its own limit (the native teammates' calls
are not in the session store) are in HT2-FINDINGS.md.

**The limits.**

- The nightly job chain lives in another session, so the new exit codes
  (0 = a quiet morning) are not yet understood by the code that reads them.
- The slow site tests were **not run by any lane**; the Coordinator built the site afterwards and ran them - **24 passed** - so the whole suite (470 + 24) is green on the branch head.
- The branch `swarm/lab11` is local. Merging it, or dropping it, is the
  reader's call - and it is complementary to `swarm/lab10`, which carries the
  empty-day-file guard that `main` and `lab11` still lack.
- Two requirements were re-review-blind by design (the profile clamp and the
  quiet feed): their verdicts rest on round 10.
