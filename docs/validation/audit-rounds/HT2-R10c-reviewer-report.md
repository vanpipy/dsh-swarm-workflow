# HT2 - R10c: the re-review of the blocked items only

Role: Reviewer (re-review). Agent: a fresh `subagent`
`48a8dd20-90d6-4088-8f69-10d09905380c`, run read-only on the worktree
`D:\project\.swarm-lab\head_tree2` (branch `swarm/lab11`, HEAD `0a19c0e`). All
mutations ran in a scratch copy OUTSIDE the worktree
(`D:\project\.swarm-lab\proof-scratch\ht2-r10c`, copied WITHOUT the `.git`
entry) through the reviewer's own driver `mutate.py` (edit -> pytest -> restore).
Scratch baseline: the two clause files plus the existing suite - **82 passed in
2.02 s**, exit 0. Every mutation ran exactly that command.

## Requirement verdicts

| Requirement | File:line | Verdict | Evidence |
|---|---|---|---|
| A malformed daily number is refused | pick-daily-profile.md:24 | met | M1 dies at tests/scripts/test_pick_daily_profile.py:380 (3 failed, 79 passed); the refusal at scripts/pick_daily.py:200 and :583-587 |
| The hard ceiling still wins | pick-daily-profile.md:43 | not in scope | accepted in round 10 and excluded by the brief; its citation resolves and the clamp at scripts/pick_daily.py:165 was never touched |
| The existing refusals survive | pick-daily-profile.md:57 | met | G1a kills four guards (:632, :645, :665 of the profile file, :813 of the feed file); `git diff 4525f25 -- tests/scripts/test_pick_daily.py` is empty |
| The picker says which case it is | pick-daily-feed-verdict.md:8 | met | M8 dies at tests/scripts/test_pick_daily_feed_verdict.py:335 (1 failed, 81 passed); the production branch at scripts/pick_daily.py:621-632 |
| A quiet feed is not a failure | pick-daily-feed-verdict.md:25 | not in scope | accepted in round 10 and excluded by the brief; under M8 its own checks stayed green, as they must |
| A broken feed still fails loudly | pick-daily-feed-verdict.md:55 | met | C1 dies at :583 and C2 at :584; the production branch is pinned by test_a_feed_the_collector_could_not_read_exits_one (:561-585) |
| A partly broken feed is a warning, not a failure | pick-daily-feed-verdict.md:68 | met | D1..D5 die at :624, :625, :626, :627, :674, :698 |
| The existing refusals survive | pick-daily-feed-verdict.md:83 | met | G1a kills :813; the existing suite file is byte-untouched since the ladder baseline |

**Acceptance verdict: ACCEPT - no requirement is `not demonstrated`.**

## The five items

**1 - the profile's "names `daily_limit`" clause.** MET. M1 changes
`raise ProfileError(f"daily_limit must be a positive integer, got {value!r}")` to
`f"the daily number must be a positive integer, got {value!r}"`. Result: exit 1,
"3 failed, 79 passed", failing at test_pick_daily_profile.py:380 ("the refusal
must name the key"). The reviewer's own vacuity probe: with M1 the captured
stdout is `[pick_daily] taste profile <tmp>/test_a_malformed_daily_limit_is_refused_zero0/taste.yaml: the daily number must be a positive integer, got 0` - so the OLD assertion (`"daily_limit" in out`) is true only because pytest names tmp_path after the test id, while the NEW assertion (the path stripped by `_refusal_message`, test_pick_daily_profile.py:138-163) is false. Intent: the refusal is printed and exits 2 at scripts/pick_daily.py:581-587, before any fetch; no day file.

**2 - the collector-health summary line.** MET. M8 replaces the broken-source
summary at scripts/pick_daily.py:626-629 with the quiet-feed wording (the
per-failure lines and `return 1` kept). Result: exit 1, "1 failed, 81 passed",
failing at test_pick_daily_feed_verdict.py:335 ("could not be fetched"). Exactly
one test catches it - the R10b test at :307-339; in round 10 no test reached that
branch. Intent: the collector absorbs `httpx.HTTPError` and reports it through
the health report (src/arxiv_collector/collector.py:148-152), `fetch_papers`
attaches `collector.feed_health()` (scripts/pick_daily.py:331-349), so a real
unreadable feed lands in scripts/pick_daily.py:621-632, not in the raising branch
:604-613. The new test drives exactly that path. EXTRA for feed :55: the
production branch had no pin before R10b - C1 (the health branch returns 0
instead of 1) fails at :583 ("assert 0 == 1") and C2 (the per-failure lines
dropped, the reason no longer named) fails at :584.

**3 - the new requirement "A partly broken feed is a warning, not a failure".**
MET. The stub is one entry plus one failed URL of two
(`FeedHealth(urls=2, items=1, failures=("<url>: request failed: connection refused",))`,
test_pick_daily_feed_verdict.py:120-129). Five mutants, all dead: D1 (the warning
drops the count) at :625; D2 (the warning removed) at :624; D3 (a partly broken
feed becomes a broken source) at :674 and :698; D4 (the URL kept, the reason
dropped) at :626; D5 (the reason dropped) at :627. Intent: the production
warning at scripts/pick_daily.py:634-642 names how many and why, does not
return, the day file is written, the exit code is 0 - which is what the
requirement's source pointer says.

**4 - the citations.** `check_citations.py` -> "citations checked: 51 | stale: 0",
exit 0, run twice (before and after all mutations). The reviewer's own target
check: 51 citations, 0 mismatched - every citation lands on the heading of the
requirement the surrounding text claims (profile :24/:43/:57; feed
:8/:25/:55/:68/:83) and the block ranges match the file lengths (71 and 94
lines). R10b touched only the two clause test files, so it could not move the
authority; the Coordinator's 36beb18 / 766ff45 edits only corrected stale
source pointers and inserted the new requirement - no requirement or check text
was weakened.

**5 - the anti-skip guard.** Not vacuous. G1a (a skip mark on one of the named
existing tests) fails four guards; G1b (a mark on a non-named existing test)
fails exactly one; G2 (the existing suite gains a runtime `pytest.skip` helper)
dies at test_pick_daily_profile.py:665. Two blind spots SURVIVE and were
flagged, not repaired: G3 `pytest.importorskip` (the enumerated set
_RUNTIME_SKIP_CALLS at :204-216 does not name it) and G4 an aliased skip import
(`from pytest import skip as _skip_alias`). The guard's docstring and its test
name claimed "every call that skips or xfails" - broader than what is
implemented.

## Outside the five items

A full `pytest tests\scripts` did not finish on this host: the reviewer's
per-file runs with a 90 s cap never finished
`test_gen_docs_enrichment.py::TestEmitRecords::test_frontmatter_has_description_field`
and `test_anchor_repair_integration.py::TestCatalogWideRepair::test_every_manifest_record_is_repaired_without_skips`.
Neither file is touched by the ladder (`git diff 4525f25 --stat` lists only the
two requirement files, scripts/pick_daily.py and the two clause test files).

**The Coordinator re-ran it.** Both tests pass in **82.40 s** when run
together, and the whole non-slow suite passes (470 passed, 24 deselected). The
reviewer was not diagnosing a hang - its per-file cap was too tight for two
slow tests. The worry was reported honestly; it did not survive the re-run.

## Not run

The whole-repo suite (pytest -q at the repo root), the two slow files in
isolation, `mkdocs build --strict`, `pytest -q -m slow`, the link checker, any
network access, and the mutant probes for the two requirements the brief puts
out of scope (the profile clamp, the quiet feed) - their verdicts rest on round
10's acceptance plus the citation and anti-skip evidence.

## Hygiene

After the last mutation the scratch copy and the worktree were byte-identical
(822 files each, no differences); `git status` clean; no `__pycache__`,
`.pytest_cache` or `.ruff_cache` inside the worktree. The reviewer's artefacts
lived outside the worktree.

## Recommendation

Accept the ladder on these items. Two optional follow-ups, neither blocking:
(a) widen `_RUNTIME_SKIP_CALLS` with `pytest.importorskip` and note the alias
blind spot in the guard's docstring, or rename the test to say what it checks;
(b) decide whether the two slow out-of-scope test files need a separate look.

**Both were done.** (a) is the branch commit `e49d06e` ("the anti-skip guard says
what it actually sees"): the set now names `pytest.importorskip`, and the
docstring and the test's docstring state the two blind spots instead of implying
them away. (b) was answered by the Coordinator's re-run above - they are slow,
not broken.
