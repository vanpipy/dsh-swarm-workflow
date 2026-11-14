---
name: swarm-craft-developer
description: The developer's craft - name the target before the edit, shape the change, make the code say what it means, prove it as you go.
whenToUse: Read in a Developer lane before it changes code.
---
# The developer's craft

## 1. How to use this file

The `swarm-engineering` skill owns the **process**: what a Developer lane does,
in what order, and what its report has to carry. This file owns the **craft of
the edit** — how a change is shaped before it is written, what the finished
code says by itself, and what is proved while the writing happens.

`shared.md`, beside this file, holds the shared core: the three checks that
hold in every language, the twelve pieces, the other stacks. This file says
how a Developer applies that core while writing code. Where the two overlap,
this file is the narrower reading of it, for the Developer's hand.

Everything here is a rule you can be shown to have followed or broken. If a
piece cannot be checked, it is advice, not guidance — treat advice as optional
and guidance as binding.

A brief names this file and the section that applies: "read §3 of the
developer's craft before you change a module boundary". A brief that names a
role and no piece leaves the lane guessing what good looks like.

The language file under `languages/` carries the idioms. The repository's own
conventions win where they disagree with any of these files.

## 2. Name the target before the edit

* Name every file the change touches, before the first edit, with the behaviour
  each file carries.
* Name the behaviour the change changes, and the behaviour it must leave alone.
  The second name is what keeps the change small.
* Write down the files that will not be touched. Touching one is an event you
  report, not a detail you fix quietly.
* Make the smallest coherent change: one requirement's worth of edits, in the
  files that own that behaviour.
* Do not refactor what the requirement does not name. A cleanup riding along
  with a feature is two changes in one diff, and neither can be judged on its
  own.
* Do not overwrite unrelated work. Read a file before you write it, and keep
  every change in it that you did not make.
* Keep the public surface stable unless the requirement names it. A changed
  signature is a requirement, not a detail settled on the way past.
* If you cannot name the target, that is the finding. Report it instead of
  editing the nearest file that looks right.

## 3. Shape the change

The bullets below are the order the pieces bite while you write, not the order
they appear in the shared file. The rules stay in `shared.md`; this section
says what the Developer does with them.

* Settle the first three before you type. They decide the shape of the change,
  and everything after them fills that shape in.
* When a piece does not apply, write one line saying so and why. Silence reads
  as an omission.
* `shared.md` §3.2 — types and contracts. This one bites first: settle the
  input, the output and the failure mode in the signature before the body, and
  let the body assume them.
* `shared.md` §3.1 — boundaries and modules. Put the change in the module that
  owns the behaviour, and be able to name the one reason that module changes.
* `shared.md` §3.3 — errors, exit codes and streams. Choose the failure
  channel first — a value, an exception, an exit code, a diagnostic — and say
  where the diagnostic goes and what each exit code means.
* `shared.md` §3.7 — input, output and the outside world. Parse and convert at
  the edge of the change, so the code behind it may assume validity.
* `shared.md` §3.5 — state, data and shape. Keep one source of truth for every
  fact the change touches, and derive the rest from it.
* `shared.md` §3.6 — time, concurrency and ordering. Take the clock as an
  argument rather than reading it, and name the ordering guarantee the change
  relies on.
* `shared.md` §3.4 — dependencies and the standard library. Reach for what the
  project already has, and name what a new dependency replaces before you take
  it.
* `shared.md` §3.9 — tests and test design. Write the test in the same change
  as the code, against the public surface, one behaviour per test.
* `shared.md` §3.10 — security and secrets. Take configuration from the
  environment, validate what you did not produce, and never build a command
  line out of input.
* `shared.md` §3.8 — performance and how you know. Measure before you change
  anything, and report the cost in bytes, milliseconds or requests.
* `shared.md` §3.11 — diagnostics and logging. Log at the boundary of the
  operation, with the identifiers that let two log lines be joined.
* `shared.md` §3.12 — naming, comments and documentation. Name a thing after
  what it is, and make the comment say why the code is the way it is.

## 4. Make the code say what it means

* The contract is visible in the signature: the names, the types, the return
  type, and how the function fails.
* The error says what to do next, not what went wrong inside.
* The name says what it is, not how it is implemented.
* The comment says why. The code says what.
* A docstring is a promise to the caller: the contract, the arguments, the
  return value, the failure modes. Keep it true.
* If a line needs a comment to be understood, the line is wrong before the
  comment is right.
* Delete the commented-out code you find beside the line you touched. It is a
  bug with a comment attached.
* Update a docstring in the same change that breaks it. A stale docstring is
  worse than a missing one.
* A reader holding the requirement should not need a second pass over the code
  to learn what it does.

## 5. Prove it as you go

* Write the check with the code, in the same change, so the check exists
  before the claim does.
* A check that cannot fail is not a check. Make it fail on purpose, show that
  it fails, and report the failing observation.
* A check that compares the wrong thing passes for the wrong reason. Assert on
  the behaviour the requirement names, not on a name or a substring.
* Re-derive every number a second way before you report it, and give both
  numbers with the methods named.
* Run the code where it runs: the interpreter, the working directory and the
  configuration the consumer uses. A scratch copy proves something about the
  scratch copy.
* Run the check again after the last edit to the code it covers. A check that
  ran before the final change is not evidence about the final change.
* Report the failures you found and the failures you caused. Do not hide
  either, and do not report a check you did not run.
* The validation that matters for this change is the one that fails when the
  behaviour is wrong. Find it, and run it.

## 6. The language pieces

* The language file for the language in play sits under `languages/`: Python,
  Java, Go, TypeScript and Rust today.
* Read the piece that matches what you are changing, before you change it.
* A brief names the language file and the piece: "read §6 of the Python craft
  before you touch the error handling".
* The shared pieces apply on top of the language file. The language file
  carries the idiom; the shared file carries the rule behind it.
* A language that deserves its own file gets one, under `languages/`: the same
  twelve pieces, in that language's own idioms.
* Where the repository's conventions disagree with the language file, the
  repository wins. Say in the report that they did.
