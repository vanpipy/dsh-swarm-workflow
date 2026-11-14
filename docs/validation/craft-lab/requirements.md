# craft-lab — requirement set

Work item: does a lane that reads the craft guidance produce better work than
a lane that does not? The repo is a test bed, not a product: the package it
contains is a small Python module written twice, once under the craft guidance
and once without it, and the two are measured with the same instrument and the
same hidden cases.

Every requirement below names its own check. A requirement whose check was not
run is `not demonstrated`, never `met`.

### R1 — the specification exists and is identical for both arms

requirement: One specification file describes the module both arms implement.
The craft arm and the control arm read the same file, unchanged.
check: `spec/textnorm-spec.md` exists, and both lane reports name the same
file as their source.
source: the Coordinator wrote the spec before dispatching either arm.

### R2 — the craft arm reads the craft guidance

requirement: The craft arm loads the shared craft, the developer's craft and
the Python pieces before it writes code, and its report says which piece it
applied to which decision.
check: the craft lane's report names each of the three craft files it read
and cites at least one rule from each in its implementation notes.
source: the skill's craft directory, `skills/swarm-engineering/`.

### R3 — the control arm does not read the craft guidance

requirement: The control arm receives the specification and nothing else. It
is not given a craft file, a skill name, or a mention that craft guidance
exists.
check: the control lane's brief contains no craft file path and no craft skill
name, and its report shows no craft citation.
source: the comparison is only meaningful if the arms differ in exactly this.

### R4 — both arms produce a runnable package

requirement: Both arms produce a `textnorm` package importable as
`textnorm`, with a `normalize`, a `stats` and a `__main__` CLI, plus tests
that run under the interpreter on this host.
check: `python -m unittest discover -s tests -t .` exits 0 in both arms, and
`python -m textnorm <fixture>` exits 0.
source: the specification, `spec/textnorm-spec.md`.

### R5 — the hidden cases decide the comparison

requirement: A case set the arms never saw is run against both packages after
both are finished. The cases live outside this repository so neither arm can
read them by accident.
check: the case runner reports the per-case result for both arms, and the
report says how many cases each arm passed.
source: the Coordinator owns the case set; it is not part of either arm.

### R6 — the difference is measured, not asserted

requirement: The same instrument measures both arms, and the report states
what the numbers can and cannot show.
check: the report gives the per-arm numbers from one instrument, and its
boundary section says that two arms from one model family are indicative
rather than conclusive.
source: the craft's own rule 2.2 — a number reported once is an assertion.
