# HT2 - the second ladder: the requirement workflow against a real repository

This section belongs at the end of FINDINGS.md. Append it with
[System.IO.File]::AppendAllText (UTF8, no BOM) when the ladder closes.

## What the ladder tested

The first ladder (R1-R13 of the earlier run) tested the swarm workflow against a
disposable package. This one runs against the reader's own repository - a git
worktree of reading-collector on branch `swarm/lab11` - and it tests the NEW
implementation: requirement matching (skill section 16) and requirement handover
(section 17), with the numbered-criterion scheme removed and the requirements
living in files under `.swarm/requirements/`.

Twelve rounds: R1 Developer, R2 Tester, R3 Reviewer (work item A - the picker's
daily number); R4 Developer, R5 Reviewer, R6 the reader's decision, R7 Developer,
R8 Tester, R9 a three-lens fan-out, R10 the final review (work item B - the
picker's feed verdict), R10b the Tester remediation, R10c the re-review of the
blocked items only.

The substrate's own baseline was `435 passed, 24 deselected`. The branch closed at
**470 passed, 24 deselected** and **12 commits** on `swarm/lab11`; the 24 slow site
tests, which no lane ran, pass against a strictly built `site/` - 494 tests in all.

## The defects this ladder found

| # | Found by | Defect | What happened |
|---|---|---|---|
| F33 | R9 lens 2 | The requirements files pointed at code that had moved | 8 bare pointers in the profile file's Decision paragraph did not resolve; the two files' headings had moved under 33 citations in the clause files |
| F34 | R9 lens 3 | Two clause files did not decide their clauses | The "names `daily_limit`" assertion was satisfied by the pytest tmp_path in the command line; the collector-health summary line was pinned by nothing |
| F35 | R9 lens 1 | The requirement rules did not reach every lane | The worker prompt said section 16 binds the Reviewer, so a Developer lane never learned it; the Coordinator prompt never mentioned sections 16 and 17 at all |
| F36 | R9 lens 1 | The plugin contradicted itself | Section 14 said "state the requirements in every brief" while section 17 said the brief must not repeat the requirement text |
| F37 | R9 lens 1 | The skill's boundary markers mis-attributed the user's prose | The markers said sections 11-13 were the plugin's; they are the user's own policy sections 6, 9 and 10, relocated verbatim |
| F38 | R9 lens 2 | The partial-failure path had no requirement and no test | A feed that yields entries while some URLs fail is shipped behaviour (a warning, the run continues, exit 0) with nothing in the requirements and no test |
| F39 | R9 lens 2 | The Decision paragraph described code that no longer exists | It still called the exit-1 paths "the feed returned no papers" and "the day's file exists" |
| F40 | R9 lens 2 | A source was attributed to the wrong place | "a bad input is an error, not a quiet day" was attributed to AGENTS.md section 4; the words live in the picker's own docstring |
| F41 | R9 lens 2 | The commit message claimed more than the commit did | "the requirements files point at the code as it is now" - the Decision paragraph was not touched |
| F42 | R9 lens 2 | The anti-skip guard saw less than it claimed | It scanned only `pytestmark`, so a runtime skip was invisible to it |
| F43 | R5 | The picker's contract did not distinguish a quiet feed from a broken one | The requirements file and the brief disagreed about the exit code; the lane found the conflict and left the disputed number out of the code |
| F44 | R4 | The picker's profile was not validated | A malformed `daily_limit` raised an unhandled ValueError out of the nightly job; `daily_limit: 0` produced an empty day file |
| F45 | R9 lens 2 | The branch was one AGENTS.md commit behind main | The worktree carries the older copy; the requirements files cite AGENTS.md by SECTION, so no pointer broke |
| F46 | R10 | The acceptance review's mutant probe found two checks that could not fail | `assert "daily_limit" in out` was satisfied by pytest's tmp_path in the captured command line; the production broken-feed summary line was pinned by no test at all, so the whole suite passed with the quiet-morning words in it |
| F47 | R10b | The repository's own shipped-day-file checks hide behind a runtime skip | tests/scripts/test_pick_daily.py:933 calls `pytest.skip("no reading log yet")` whenever data/picked/ is absent; the three day files are tracked, so it is dormant today - but the checks are not running on a fresh clone. Pre-existing, reported, not fixed |
| F48 | Coordinator's measurement | The native teammates' tool calls are not in the session store | A native teammate's turns reach the Coordinator's log as `agent/inbox/spliced` entries; only delegated subagents get a measurable log. The efficiency numbers of the delegated lanes are exact; the native teammate lanes (R1, R4, R7, R8) cannot be counted from the store |
| F49 | Coordinator's own read, after the plugin fix | The plugin's P3 fix reached the skill but not the Coordinator prompt's pointer | The skill's section 14 now says "Write the requirements down before you dispatch, and point the brief at that file", while swarm-prompt.md:263 still enumerated the rule as "stating the requirements in every brief" - the very phrasing section 17 forbids. FIXED in the bundle commit `d88ccb3` |
| F50 | R10c | The anti-skip guard's docstring claimed more than its call set implements | The guard sees the dotted names in `_RUNTIME_SKIP_CALLS`; a call reached through an aliased import, or to a skip helper the set does not name, is invisible. FIXED after the acceptance (branch commit `e49d06e`): the set now names `pytest.importorskip`, and the docstring and the test's docstring say what the guard actually sees |
| F51 | Coordinator's own re-run | A timeout is not a failure | R10c reported that two test files "never finished" on this host. They are not hanging: with a 90 s per-file cap the two slow tests were cut off. Run together they pass in **82.40 s**, and the whole non-slow suite passes. The reviewer's limit was reported honestly, and the Coordinator re-ran it instead of accepting the worry |
| F52 | R10c | Two requirements were re-review-blind | The profile clamp and the quiet-feed requirement were "not in scope" for the re-review, so their verdicts rest on round 10's acceptance rather than on a second mutant probe. Stated, not hidden |
| F53 | the ladder itself | A citation is a convenience, not an identity | 33 citations were lost to a four-line insert in the requirements files, and two rounds of re-pointing followed. The skill's section 17 now says so: the lane resolves its citation against the requirement it names before it reports, and a citation that points at a different requirement is worse than no citation |
| F54 | Coordinator's own run, after the acceptance | The strict site build failed for a reason the repository's own guide names wrongly | The guide says the strict build needs a `.git` **directory**, so it cannot run in a worktree. It can: the worktree's `.git` is a file, and git reads a worktree fine. The real cause was that `git` was not on `PATH` for that process, so the RSS plugin could not date the entries and `--strict` aborted on one warning. With `C:\Program Files\Git\cmd` on `PATH` the build succeeds in the worktree (exit 0, 78.51 s) and the 24 slow tests pass. The guide's claim stays wrong until somebody who owns it reads this |

## The rules the ladder earned

1. **A requirement file is the authority, and it is read fresh.** Every lane
   reads the file when it starts; nobody quotes line numbers from a briefing.
   Two rounds of citation drift came from briefing a file that a commit had
   moved.
2. **The conflicting requirement is a report, not a coin flip.** The brief and
   the file disagreed about an exit code. The lane reported the conflict and
   left the disputed number out of the code, and the reader decided. That is the
   handover working as designed.
3. **A clause file that re-implements the existing suite is a liability.** The
   first clause file duplicated six behaviours the existing suite already tested.
   The Reviewer said so; the second clause file did not repeat it.
4. **A check that cannot fail is not a check.** Two assertions were satisfied by
   the environment (a tmp_path) or by nothing at all (an unpinned message). The
   Reviewer's mutant probe is what found them - not the green suite.
5. **The lane's evidence is the Coordinator's to re-run.** Every accepted lane
   was re-run by the Coordinator before acceptance.
6. **The acceptance round is not the last word, and the repair is a new round.**
   The two checks that could not fail were repaired by a Tester lane (R10b) and
   re-judged by a fresh Reviewer (R10c) - never in the same round that found
   them.

## The measurement

Window: 2026-11-07 10:50 -> the end of the ladder (local time), measured over every
session log in `C:\Users\leroy\.dsh\sessions\--D-project--` with the same decoder
(`D:\project\.swarm-lab\eff\measure.mjs`).

| Lane | Agent | Tool calls | Wall |
|---|---|---|---|
| R2 | fresh subagent 3737ab6d | 33 | 777 s |
| R3 | fresh subagent c8191fa8 | 40 | 486 s |
| R5 | fresh subagent faabd771 | 69 | 1279 s |
| R9 lens 1 | workflow child ea0e29f8 | 44 | 251 s |
| R9 lens 2 | workflow child 7cd88bd0 | 157 | 3984 s |
| R9 lens 3 | workflow child fc9d0683 | 85 | 1374 s |
| R10 | fresh subagent 9c48aacf | 104 | 1731 s |
| R10b | fresh subagent 0263bf10 | 111 | 1161 s |
| R10c | fresh subagent 48a8dd20 | 73 | 735 s |
| the three served-prompt probes | fresh subagents | 2 + 11 + 2 | 29 + 199 + 49 s |
| **delegated lanes in total** | | **731 agent-side calls** | |
| the Coordinator | the main session | **431 calls** | |

The Coordinator's 431 calls break down as: 303 work calls (152 shell, 63 read, 48
edit, 23 write, 17 grep), 68 dispatch and coordination calls (9 subagent, 9
team_task_create, 8 team_task_update, 5 team_task_get, 3 team_task_list, 11
wait_agent, 4 list_agents, 4 send_message, 1 workflow, 10 todo_write, 2
present, 2 ask_user_question), 29 context-management calls (compress), and 31
harness calls (12 plugin_manager, 9 job_output, 3 job_list, and 7 one-offs).

So the ladder cost roughly 431 Coordinator calls for 12 delegated lanes and four
native teammate lanes - a Coordinator-to-worker ratio of about 27 calls per
delegated lane, and the three-lens fan-out paid for itself in one dispatch
(3 lenses, 286 calls, no Coordinator round trips in between).

**The measurement's own limit (F48).** The four native-teammate lanes (R1, R4, R7,
R8) are not in that table: a native teammate's turns reach the Coordinator's log
as `agent/inbox/spliced` entries, so only the delegated subagents can be counted
from the session store. The Coordinator's own calls for the same lanes - the
briefs, the board entries, the wake-ups - are counted.

## The acceptance

R10c's verdict: **ACCEPT - no requirement is `not demonstrated`.**

| Requirement | Verdict | Evidence |
|---|---|---|
| A malformed daily number is refused | met | M1 dies at tests/scripts/test_pick_daily_profile.py:380 (3 failed, 79 passed); the refusal at scripts/pick_daily.py:200 and :583-587 |
| The hard ceiling still wins | not in scope | accepted in round 10 and excluded by the brief; the clamp at scripts/pick_daily.py:165 was never touched |
| The existing refusals survive | met | G1a kills four guards; `git diff 4525f25 -- tests/scripts/test_pick_daily.py` is empty |
| The picker says which case it is | met | M8 dies at tests/scripts/test_pick_daily_feed_verdict.py:335 (1 failed, 81 passed); the production branch at scripts/pick_daily.py:621-632 |
| A quiet feed is not a failure | not in scope | accepted in round 10 and excluded by the brief; under M8 its own checks stayed green, as they must |
| A broken feed still fails loudly | met | C1 dies at :583 and C2 at :584; the branch is pinned by test_a_feed_the_collector_could_not_read_exits_one (:561-585) |
| A partly broken feed is a warning, not a failure | met | D1-D5 die at :624, :625, :626, :627, :674, :698 |
| The existing refusals survive | met | G1a kills :813; the existing suite file is byte-untouched since the ladder baseline |

The citations: **51 checked, 0 stale**, and 0 re-pointed at a different
requirement. The anti-skip guard: not vacuous (G1a kills four guards, G1b kills
one, G2 dies), with the two blind spots now documented (F50).

## The state the ladder left behind

- Branch `swarm/lab11` in the worktree `D:\project\.swarm-lab\head_tree2`:
  12 commits, `470 passed, 24 deselected`, the tree clean. **Local only - never
  pushed.**
- The bundle at `D:\project\dsh-plugins\swarm-workflow`: 4 commits on `main`
  (c0c02fa, 799ea90, 7c49979, d88ccb3), the integrity diffs unchanged (policy 32/96, skill
  179/6), the unit test green, re-applied live.
- The ledger at `D:\project\.swarm-lab\rounds`: its own local repository.
