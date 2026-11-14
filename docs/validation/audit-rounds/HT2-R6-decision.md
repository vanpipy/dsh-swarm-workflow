# HT2-R6 - the product decision that the ladder puts to the human

## The question

When the picker's feed was fetched successfully and holds no entries - a quiet
announcement day - which exit code should `scripts/pick_daily.py` return?

## How the question arose (and why it is not a trick)

The Developer's brief for work item B said the picker keeps its own exit code for this
case; the requirements file said the picker takes the collector's code for a
fetched-but-empty feed. The two disagree, and both readings are defensible. The
ladder deliberately let the conflict stand so that the lanes would have to detect it
and report it instead of quietly picking one - that is the path the skill's section 17
and the "not demonstrated blocks acceptance" rule exist for. The question behind the
conflict is a real product question about the nightly job, and it is the user's to
answer.

## The picker's exit codes today (scripts/pick_daily.py)

    540 545 548 556 571   2   bad input / configuration: a bad date, a missing
                             profile, a missing feeds file, a malformed daily_limit
                             (work item A), no arxiv feeds in the config
    576                   1   "the feed returned no papers"  <- the disputed case
    592                   0   every day in the feed is already picked - nothing new
                             to read yet (no day file is written)
    610                   0   no papers announced on the chosen day
    627                   0   dry run
    635                   1   refusing to overwrite a curated list without --force
    643                   0   wrote the day file

The line that matters: the picker's OWN "nothing to pick" cases already exit 0
(:592, :610) and write no day file. The fetched-but-empty feed is the only
"nothing to pick" case that exits 1.

## The collector's exit codes (src/arxiv_collector/cli.py)

    0   every configured source produced entries
    1   at least one source is broken
    2   a source was fetched and held no entries - a quiet day

The collector has no "bad input" code, so 2 is free there. In the picker, 2 already
means bad input.

## The options

1. **Exit 2 - the collector's code.** The picker joins the collector: 2 = fetched
   fine, nothing to pick. Cost: 2 would then mean two different things in the picker
   (a malformed profile and a quiet feed). The requirements file acknowledges this and
   accepts it, because the two are told apart by their message. But the nightly job
   reads CODES: a malformed profile - the thing work item A just made loud - would
   look like a quiet morning and the reading list would silently skip a day.
2. **Exit 1 - the picker's code today.** Nothing changes for the job chain, but a
   quiet day keeps looking like a failure, and a broken feed and a quiet feed differ
   only in the message. This is the status quo the work item exists to fix.
3. **A third code for the picker** (for example 3 = quiet). Every case stays
   distinct: 0 ok, 1 broken, 2 bad input, 3 quiet. Cost: the picker and the collector
   stop sharing a code space, and the chain has a third meaning to learn.
4. **Exit 0 - the picker's own convention for nothing to pick.** 0 = the pick ran
   (and there was nothing to pick), 1 = a failure, 2 = bad input. This is what the
   picker already does for the two other nothing-to-pick cases (:592, :610), and it
   matches the repository's own words about the ritual: a quiet morning, not a
   failure. Cost: a chain that reads only the code cannot tell "picked 20 papers"
   from "the feed was empty" - the day file's absence and the log line carry that.

## The recommendation

Option 4 - exit 0 for the fetched-but-empty feed - with the broken feed staying exit
1 and bad input staying exit 2.

The reasons: the picker already treats "nothing to pick" as a successful run (:592,
:610); option 1 would make a malformed profile indistinguishable from a quiet day
for every code-reading caller, which is the one thing work item A was built to
prevent; and option 2 keeps calling a quiet morning a failure. The only cost of
option 4 is that the code no longer says "the feed was empty" - the message says it,
and the day file's absence says it.

## The condition, whichever option is chosen

The nightly job chain runs the collector's sync and then the picker, and it must
know what the picker's code means. The resolution is therefore not only a number in
the picker: the meaning has to be written down where the job can read it, and the job
lives in another session. Whichever option is chosen, the reason and the date go
into the requirements file, and the job-chain follow-up is reported to the user.

## Where the decision is recorded

The resolution goes into
`D:\project\.swarm-lab\head_tree2\.swarm\requirements\pick-daily-feed-verdict.md`,
in the block "A quiet feed is not a failure", with the reason and the date. The
requirements file is the authority the lanes are judged against, so the decision
becomes part of what the next rounds verify.
