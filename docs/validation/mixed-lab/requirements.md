# mixed-lab — requirement set

Work item: how does the swarm workflow behave when the work is split across
five languages? The repo holds one small contract and five implementations of
it, each written by its own lane in its own language, each judged against the
same contract and the same fixture.

Every requirement below names its own check. A requirement whose check was not
run is `not demonstrated`, never `met`.

### R1 — the contract is written before any lane starts

requirement: One contract file states the input format, the rules, the output
shape and the failure behaviour. Every implementation answers to it, and it is
written before the first language lane is dispatched.
check: `docs/contract.md` exists, names the fixture, and every lane report
names it as the source it implemented.
source: the Coordinator wrote the contract in the round before the lanes.

### R2 — one lane per language, one file set per lane

requirement: Each language has its own lane and its own files. No lane edits
another lane's files, and no lane writes a file outside the set it was given.
check: the per-lane write scopes are disjoint, and the diff after the round
shows each file touched by one lane only.
source: the skill's rule — a lane owns its file set.

### R3 — every lane loads its language piece

requirement: Each language lane loads the craft file for its language and the
developer's craft, and its report says which rule from which file shaped the
code.
check: every lane report names the craft file it read and cites at least one
rule from it in its implementation notes.
source: `skills/swarm-engineering/languages/<language>.md`.

### R4 — the Python implementation is proven by execution

requirement: The Python implementation passes its own tests, and the shared
fixture is processed by the command line with the documented output.
check: `python -m unittest discover -s tests -t .` exits 0, and
`python -m ledger fixtures/ledger.jsonl` prints the documented balance and
totals and exits 0.
source: the host has a Python runtime; it has no Go, JDK, Node or Rust
toolchain, so this is the only implementation that can be executed here.

### R5 — the contract is judged the same way for every language

requirement: Each implementation is checked against the same fixture and the
same rules. A rule that cannot be executed on this host is judged by reading,
and the report says which it was.
check: the per-language verdict table names the fixture for every language and
marks each row `executed` or `read`.
source: the craft's rule 2.3 — a check proves something about the environment
it ran in.

### R6 — the cross-language contract holds

requirement: Where two implementations can be compared, they agree: the same
fixture gives the same balance, the same totals and the same error on the same
malformed input.
check: the Python output and the documented expected values are recorded in the
report, and every other language's output shape is compared against them.
source: the contract, `docs/contract.md`.

### R7 — the workflow's own surfaces are exercised

requirement: The round uses the surfaces this host offers: a delegated lane, a
native teammate, the shared board as the requirement carrier, and the scripted
fan-out. Each one is recorded with what it did.
check: the report names each surface used, the lane it carried, and the
result it produced.
source: the host note's surface map.

### R8 — the work is written down in the workspace

requirement: The requirement set, the decisions and every lane report live
under `.swarm/` in this repository.
check: `.swarm/requirements/mixed-lab.md` exists, the decision files exist,
and one report file exists per lane.
source: the host note — "where the work is written down on this host".
