# HT2 - the requirements-file corrections to apply AFTER R10's verdict

The round-9 lens and my own reads found these in the two authority files.
Apply them only after R10 has reported, so the authority file does not change
under the Reviewer. Apply the requirements-file fixes BEFORE the R10b Tester
lane, so the Tester fixes the citations once, against the final line numbers.

## Verified line numbers (D:\project\.swarm-lab\head_tree2\scripts\pick_daily.py, 723 lines)

    :92   MAX_PICKS_PER_DAY = 20
    :106  class ProfileError(ValueError):
    :162  limit = _daily_limit(raw.get("daily_limit", MAX_PICKS_PER_DAY))
    :165  daily_limit=min(limit, MAX_PICKS_PER_DAY),
    :179  def _daily_limit(value: Any) -> int:
    :200  raise ProfileError(f"daily_limit must be a positive integer, got {value!r}")
    :430  lines.append(f"> **{len(items)} papers** - the daily cap is {limit}.")
    :25-27 the docstring: "A ``daily_limit`` that is not a positive integer is an
           error, not a quiet day: the picker says which key is wrong and exits
           with its bad-input code, and writes nothing."
    :35-38 "It will not confuse a quiet morning with a broken feed ..."
    :42-52 the Exit codes list
    :567-571 a bad --date            -> return 2
    :574-576 a missing taste profile  -> return 2
    :577-579 a missing feeds config   -> return 2
    :581-587 a broken profile         -> print :586, return 2 :587
    :592    daily_limit = min(MAX_PICKS_PER_DAY, taste.daily_limit)
    :599-602 no arxiv feeds           -> return 2
    :604-613 the feed could not be fetched -> return 1 (:613)
    :618-632 the collector-health path     -> return 1 (:632)
    :634-642 the PARTLY broken feed: a WARNING line, the run continues
    :644-652 a fetched but empty feed      -> return 0 (:652)
    :666-668 every day already picked      -> return 0
    :680-686 no papers on the chosen day   -> return 0
    :701-703 a dry run                     -> return 0
    :706-711 the refusal to overwrite      -> return 1

## Fix 1 - pick-daily-profile.md, the Decision paragraph (currently :8-18)

Eight bare pointers do not resolve any more, and the exit-1 paths are described
with two strings the code no longer prints. Replace the paragraph with:

    Decision (Coordinator, 2026-11-07, before the Tester's round): the bad-input
    code of this picker is 2, and a malformed profile is a bad input, so the
    picker exits 2. The reason is the picker's own convention, not the
    implementation: every input and configuration refusal returns 2 - a bad date
    (scripts/pick_daily.py:567-571), a missing profile (:574-576), a missing
    feeds config (:577-579), no arxiv feeds (:599-602) - while the exit-1 paths
    are runtime failures: a feed that could not be fetched (:604-613) and the
    refusal to overwrite a curated list (:706-711). The implementation of this
    work item lives at scripts/pick_daily.py:106-112 (ProfileError),
    :179-201 (_daily_limit), :162 (the read of the profile's number),
    :583-587 (the refusal).

## Fix 2 - pick-daily-profile.md, the source of the first requirement (:35-36)

"AGENTS.md section 4 (a bad input is an error, not a quiet day)" is attributed to
a section that does not contain it. The words live in the picker's own docstring.
Replace the tail with:

    config/taste.yaml:45, AGENTS.md section 3 (the number lives in the
    profile), scripts/pick_daily.py:25-27 (the picker's own words: a bad input
    is an error, not a quiet day)

## Fix 3 - pick-daily-feed-verdict.md:22

"src/arxiv_collector/base.py:29-54 (FeedHealth.empty and .failed)" - .failed
runs to :56. Replace the range with :29-56.

## Fix 4 - a NEW requirement for the partly broken feed (pick-daily-feed-verdict.md)

Shipped behaviour with no requirement and no test (the round-9 lens's F5).
Insert it AFTER "A broken feed still fails loudly" and BEFORE "The existing
refusals survive":

    ### A partly broken feed is a warning, not a failure

        requirement: When the feed yielded entries although some of its feed URLs
        failed, the picker prints a warning that names how many URLs failed and
        why, and carries on: the entries that arrived are still picked, the day
        file is still written and the run still succeeds. This is the same
        verdict the collector takes for a source that lost one of its feed URLs.

        check: with a feed that yields one entry and reports one failed URL, the
        picker prints a warning that names the failure, writes the day file, and
        exits 0. The network is never touched: the fetch is stubbed.

        source: scripts/pick_daily.py:634-642 (the warning), src/arxiv_collector/cli.py:278,
        src/arxiv_collector/base.py:29-56 (FeedHealth.failures)

NOTE: inserting this block shifts the line numbers of every later block in the
file - the Tester must fix the citations AFTER this edit, not before.

## What must NOT change

The requirement headings, their wording, their checks and the reader's decision
(exit 0 for a quiet feed) stay exactly as they are. The clauses' CITATIONS move;
the clauses do not.
