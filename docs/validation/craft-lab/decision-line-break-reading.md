# The `lines` clause: which characters end a line

Date: 2026-11-14
Decided by: the Coordinator, after the Reviewer lane showed the two arms disagree here.

## The ambiguity

`spec/textnorm-spec.md` says the `lines` count is "the ORIGINAL text split on
universal newlines". Two readings of that phrase exist, and the two arms took
different ones:

- **The literal enumeration.** A line ends at `\r\n`, `\r` or `\n`, and nowhere
  else. This is the craft arm's reading, and it is the one the Tester lane's
  conformance suite pins.
- **Python's `str.splitlines()`.** A line also ends at `\v`, `\f`, `\x1c`–`\x1e`,
  `\x85`, `U+2028` and `U+2029`. This is the control arm's reading.

The two arms produce different answers for the same input: `stats("a\fb")` is
`lines: 1` in the craft arm and `lines: 2` in the control arm, and the same for
`stats("a\u2028b")`.

## The decision

**The literal enumeration wins.** A work item stands on the reading its
specification's own words support most directly, and "split on universal
newlines" names the three newline sequences, not every character Python's
`splitlines()` happens to treat as a break. The `U+2028` case is the one worth
naming: it IS a line break in Unicode, but it is not one in universal newlines,
and a spec that wanted it would have said so.

The craft arm's reading is therefore the one this work item stands on, and the
control arm's implementation differs from it.

## Why this file exists

The Reviewer lane found that the only check in the lab that can tell the two
readings apart — the Tester lane's conformance suite — was hard-wired to the
craft arm, so the control arm's reading was never tested by anyone. The
Coordinator re-ran that same suite against the control arm (a throwaway copy in
`%TEMP%`, the repository untouched): **40 checks, 2 failures** — the form feed
(`test_spec_conformance.py:237`) and the Unicode line separator
(`test_spec_conformance.py:243`), both `2 != 1`.

So the divergence is now adjudicated rather than merely observed, and the
specification's silence is recorded instead of being papered over by whichever
arm happened to be judged.

## What would settle it properly

A specification that names the three sequences explicitly, or that says "split
on `str.splitlines()`". This spec says neither, and that ambiguity is the
specification's gap, not either arm's defect.
