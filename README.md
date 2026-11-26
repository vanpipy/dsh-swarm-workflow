# dsh-swarm-workflow

A DSH plugin that turns a session into a small engineering swarm: the main
agent becomes the **Coordinator**, every delegated agent gets a scoped view of
the execution policy, and the `swarm-engineering` skill carries the role
methods (Developer, Tester, Reviewer) the swarm runs on.

## The boundary

The bundle ships the user's own text, carried from the canonical source, and
keeps every host-specific fact in one separate file. The three shipped policy
files are the user's text with this host's surfaces substituted for the
canonical runtime's; every such passage is listed, with its reason, in
[`docs/host-adaptation.md`](docs/host-adaptation.md) and
[`docs/host-adaptation.json`](docs/host-adaptation.json). A passage the record
does not list is identical to the canonical, character for character, and the
plugin composes a view of the shipped text at runtime instead of rewriting it.

| File | Owner | What it is |
| --- | --- | --- |
| `prompt-overlay.md` | the user | the global execution policy |
| `swarm-prompt.md` | the user | the delegation briefing: what to delegate, what a brief must carry, where a requirement lives |
| `skills/swarm-engineering/swarm-engineering.md` | the user | the role methods, the assignment contract, requirement matching and handover |
| `runtime-note.md` | the plugin | the host note: the host identity, the Jcode-to-DeepSeek-Harness surface map, the requirement carrier, the verification path, and the live capabilities of the session |
| `skills/swarm-engineering/shared.md` | the plugin | the shared craft: the three checks that hold in every language, the pieces that shape the code, the other stacks |
| `skills/swarm-engineering/developer.md` | the plugin | the developer's craft: how a Developer applies the core to an edit |
| `skills/swarm-engineering/tester.md` | the plugin | the tester's craft: how a Tester applies the core to a check |
| `skills/swarm-engineering/reviewer.md` | the plugin | the reviewer's craft: how a Reviewer applies the core to a change |
| `skills/swarm-engineering/languages/python.md` | the plugin | the Python pieces: the idioms, the version floors, the traps |
| `skills/swarm-engineering/languages/java.md` | the plugin | the Java pieces: the idioms, the version floors, the traps |
| `skills/swarm-engineering/languages/go.md` | the plugin | the Go pieces: the idioms, the version floors, the traps |
| `skills/swarm-engineering/languages/typescript.md` | the plugin | the TypeScript pieces: the idioms, the version floors, the traps |
| `skills/swarm-engineering/languages/rust.md` | the plugin | the Rust pieces: the idioms, the version floors, the traps |

`runtime-note.md` is written in scope blocks, marked
`<!-- swarm:note coordinator worker skill -->`. The plugin prepends the blocks
that match the audience it is assembling a prompt for and never rewrites the
text it composes. The marker that gates a bullet on a tool
(`<!-- swarm:requires subagent -->`) exists only in that file, so the shipped
text stays free of host mechanics.

The note also names the craft files where a lane has to read them. The paths
are substituted at composition time, so they point at the copy of the bundle
the session actually loaded — a profile install, a junction and a source
checkout each get their own.

Each craft file is also registered with the host as a skill, the way
`skills/swarm-engineering/swarm-engineering.md` is, so a lane can load one by name instead of
opening a file: `swarm-craft-shared`, `swarm-craft-developer`,
`swarm-craft-tester`, `swarm-craft-reviewer`, `swarm-craft-python`,
`swarm-craft-java`, `swarm-craft-go`, `swarm-craft-typescript` and
`swarm-craft-rust`. The name
and the description live in the file's own frontmatter, so the catalog and the
file never drift apart.

## What it adds

| Surface | What it is |
| --- | --- |
| Coordinator prompt | injected into the main agent's system prompt (`swarm-workflow:swarm`) |
| Worker prompt | injected into every delegated agent |
| `swarm-engineering` skill | the role methods, loaded on demand |
| `swarm-craft-*` skills | the craft guidance: `swarm-craft-shared`, one per role (`developer`, `tester`, `reviewer`) and one per language (`python`, `java`, `go`, `typescript`, `rust`) |
| `swarm_worktree` | gives a lane its own Git worktree |
| `swarm_task` | reads and updates the shared team board |
| `swarm_child` | lists, steers and stops the delegated child lanes |
| `/swarm` | prints what the swarm can do in this session (when the host has a command registry) |

The table lists what the bundle ships. Each surface appears in a session only
when the host provides the backing service behind it — `swarm_worktree` needs
`worktrees`, `swarm_task` needs `agentTeams`, `swarm_child` needs `subagents`,
and `/swarm` needs the host's command registry.

The plugin waits for that service instead of sampling availability once: each
primitive is registered when its service arrives, so a host that provides
`agentTeams` (or `subagents`, or `worktrees`) after the plugin was applied
still gets the tool. A surface the host never provides is dropped from the
prompt and listed under "Absent in this session" rather than advertised.

## How a prompt is composed

The same shipped text produces three views, and every view is assembled from
the files on disk at prompt-assembly time:

* **Coordinator** — the runtime note's coordinator blocks, the whole execution
  policy (sections 1 to 12), and the whole delegation briefing. Section 12,
  Swarm Orchestration, is the Coordinator's operating manual.
* **Worker** — the runtime note's worker blocks, sections 1 to 11 of the
  execution policy (the policy governs delegated work as well as direct
  work), and the three sections of the skill a lane cannot infer from its
  assignment alone: the assignment and reporting contract, requirement
  matching, and requirement handover.
* **Skill** — the runtime note's skill blocks and the skill text itself, with
  the host note in front of the registered description.

The live capability block is generated from the session's own tool registry and
is written into the prompt in place of the marker in the runtime note, so the
prompt states only the surfaces this session can actually call. A bullet whose
tool is missing is dropped rather than shown, and a section the shipped file no
longer contains is replaced by a visible notice rather than dropped silently.

## The craft guidance

The craft guidance is additive: the skill owns the process and the roles, the
craft directory owns the craft. It sits under the skill's own directory, so a
lane reads the process and the craft in the same place, and it carries one file
per role.

```
skills/
  swarm-engineering/
    swarm-engineering.md  the role methods (the user's file)
    shared.md             the core every lane uses
    developer.md          the developer's craft
    tester.md             the tester's craft
    reviewer.md           the reviewer's craft
    languages/
      python.md     the Python pieces
      java.md        the Java pieces
      go.md          the Go pieces
      typescript.md  the TypeScript pieces
      rust.md        the Rust pieces
```

### `shared.md`

| Section | What it is |
| --- | --- |
| 1 | how to use this file: which file owns the process and which the craft |
| 2 | the three checks that hold in every language: make the check falsifiable, re-derive every number a second way, validate where the artifact runs |
| 3 | the pieces that hold in every language: boundaries, types, errors, dependencies, state, time, the outside world, performance, tests, security, diagnostics, naming |
| 4 | the same piece in another stack |
| 5 | what this directory does not cover |

### The role files

| File | What it is |
| --- | --- |
| `developer.md` | 1 how to use this file; 2 name the target before the edit; 3 shape the change; 4 make the code say what it means; 5 prove it as you go; 6 the language pieces |
| `tester.md` | 1 how to use this file; 2 choose the oracle; 3 make the check discriminate; 4 cover the boundary, not the middle; 5 prove the check can fail; 6 report honestly |
| `reviewer.md` | 1 how to use this file; 2 read the change as a claim; 3 re-derive the evidence yourself; 4 the review smells; 5 hunt the check that cannot fail; 6 name what you did not check; 7 the severity vocabulary |

Each row names every section of its file, so a brief can point at one by number.
The rule the whole index follows: every craft file opens with a "how to use this
file" section — section 1 in the shared craft and in the three role files,
section 0 in each language file — and the sections after it are the file's own.

### The language files

One file per language: `python.md`, `java.md`, `go.md`, `typescript.md` and
`rust.md`. Each opens with section 0 (how to use this file) and then carries
the same nineteen topics, one per section — the surface and the version floor,
typing, data modelling, collections, iteration, errors, resources, files and
paths, the shell and the outside world, time and clocks, concurrency, testing,
the command line, performance, style and documentation, dependencies and
environments, logging and diagnostics, security, and the common traps — with
each section titled and written in that language's own idioms. The topics are
the same; the section titles are worded per language, and four files word one
of theirs differently: `go.md` names its fifth section
"Iteration and the loop variable" (Go has no lazy sequence), `typescript.md`
names its second "Typing and the compiler options", `java.md` names its
fifteenth "Style, naming and documentation comments", and `rust.md` names its
sixth "Errors and the Result type". A language that deserves its own file gets
one beside it.

The craft reaches the lanes by path and by name. The runtime note names the
files where the Coordinator writes a brief and where a lane reads them, and
every file is registered as a skill, so a brief names the skill and the piece
that applies to the lane's role — "load `swarm-craft-developer`, section 3,
before you change a module boundary". A brief that gives a lane a role and no
piece leaves the lane guessing what good looks like. The files are never
composed into a prompt: a lane loads the skill, or opens the file, and reads
the piece it needs.

## The workflow

Understand → Investigate → Design → Implement → Verify → Integrate and accept

1. **Understand** — the Coordinator writes the objective, the scope and the
   acceptance criteria, and puts each requirement in the task it creates on
   the shared board: one block per requirement, each with the requirement, the
   observable check that proves it, and its source. The same requirement set is
   written to `.swarm/requirements/<work-item>.md` in the workspace of the work
   item, so the next session in that workspace finds it.
2. **Investigate** — one bounded question, one lane, evidence before
   conclusions.
3. **Design** — the interface and the work boundaries before anything is built.
4. **Implement** — a Developer lane owns its files; parallel lanes get
   disjoint file sets.
5. **Verify** — a Tester lane turns the requirements into black-box checks.
   Two checks per requirement: *discrimination* (would the check fail if the
   behaviour were wrong?) and *intent* (is the behaviour the one the
   requirement asked for?).
6. **Review** — a Reviewer lane matches every requirement against the change
   and reports one verdict per requirement: `met`, `not met`,
   `not demonstrated`, `not in scope`. A verdict without evidence is
   `not demonstrated`, never `met`.
7. **Integrate and accept** — the Coordinator accepts the work against the
   original acceptance criteria. A `not demonstrated` requirement blocks
   acceptance until it is checked, or until an explicit waiver is recorded in
   the ledger row.

**Where the work is written down.** Everything a work item produces is written
into the `.swarm` directory of the workspace it targets:
`.swarm/requirements/<work-item>.md` (the requirement set),
`.swarm/decisions/<YYYY-MM-DD>-<slug>.md` (a decision that changes the work
item) and `.swarm/reports/<work-item>-<lane>.md` (what a lane reported). The
requirement file and the board task carry the same requirement; when they
disagree, the file wins and the disagreement is reported.

**Roles.** *Developer* implements and writes the implementation smoke test.
*Tester* derives the checks from the requirement and owns one test file per
function. *Reviewer* reviews independently and produces the requirement
verdict table. *Coordinator* plans, dispatches, integrates and accepts.

**Every lane reports the same shape:** the investigation question, the
evidence and where it lives, the findings, the assumptions and their
confidence, any material unresolved question, the recommended next action,
and whether the exit criteria are satisfied.

**Independent verification.** This host has no native review or judge command,
so the Coordinator reviews its own diff and states what it verified, or spends
a Reviewer lane — one verification run at acceptance, and a second one is the
user's to start.

## The validation record

This bundle has been run against three test beds: `swarm-lab`, which asked
whether the workflow, the host surfaces and code quality hold when a swarm runs
the work; `craft-lab`, which asked whether a lane that loads the craft guidance
produces a different artefact from a lane that does not; and `mixed-lab`, which
asked whether the workflow holds when the same contract is implemented across
five languages. Their requirement sets, decisions, lane reports and acceptance
reports are in [`docs/validation/`](docs/validation/README.md).

The acceptance reports there carry their own boundary sections: what was
demonstrated, and what this host could not verify. Two findings from them are
worth reading before quoting any number — the craft comparison is between two
briefs and not two environments, and one material cross-language divergence
(Go accepts an unknown record key) is left open on purpose.

## Install

**One route: the GitHub address.** In the desktop app open **Plugins → Add
plugin** and paste

```
github:vanpipy/dsh-swarm-workflow
```

or on the command line:

```
dsh plugin --profile desktop add github:vanpipy/dsh-swarm-workflow
```

Two things have to be true before that works:

* **Git on the machine's PATH.** The host resolves a git address by running
  `git ls-remote`, and the app inherits the PATH it was launched with — so
  Git has to be installed (on Windows: `C:\Program Files\Git\cmd`), added to
  the user PATH, and the app restarted once.
* **The Agent Teams rows enabled** in the profile
  (`include:agent-team`, `include:tool-agent-team`, `include:ui-agent-team`) —
  that is what makes the native-team path available. A plain delegated
  subagent works too, with a reduced toolkit.

Then:

1. **Start a new session.** A bundle's code is fixed for the life of a
   session; the prompt files are re-read when they change and the skill is
   re-registered on every re-apply — but validate changed behaviour in a new
   session.
2. **Check it:** run `/swarm`. It prints the live delegation and
   coordination surfaces of the current session.

The profile records the plugin as a git dependency of that repository, so the
installed copy lives in the profile (`node_modules/dsh-swarm-workflow`). To
move to a newer commit, publish it and run the install command again.

Two things about that install are worth knowing before you touch it:

* **The manifest names a branch; the lockfile names a commit.** The profile's
  `package.json` records `github:vanpipy/dsh-swarm-workflow`, and a git
  dependency without a revision follows the default branch. The commit that is
  really installed is pinned in `pnpm-lock.yaml` — read that file, not the
  manifest, to know what runs, and pin the commit yourself when you install:
  `github:vanpipy/dsh-swarm-workflow#<commit>`.
* **The installed copy is hard-linked into the package store.** pnpm links the
  files instead of copying them, so a file edited in place under
  `node_modules/dsh-swarm-workflow` is edited in the store too, for every
  project on that version. Change the checkout, not the installed copy.

Two things about that install are worth knowing before you touch it:

* **The manifest names a branch; the lockfile names a commit.** The profile's
  `package.json` records `github:vanpipy/dsh-swarm-workflow`, and a git
  dependency without a revision follows the default branch. The commit that
  really runs is pinned in `pnpm-lock.yaml` — read that file, not the manifest,
  to know what is installed. A `pnpm update` moves the pin.
* **The installed copy is hard-linked into the package store.** pnpm links the
  files instead of copying them, so a file edited in place under
  `node_modules/dsh-swarm-workflow` is edited in the store too, for every
  project on that version. Change the checkout, never the installed copy.

## Develop

The repository is also the checkout you edit. To work on the plugin itself,
install the bundle from the local path instead of from GitHub:

```
plugin_manager install_bundle   target=D:\project\dsh-plugins\dsh-swarm-workflow
```

The bundle is installed from that path, so an edit is picked up after a
re-apply:

```
plugin_manager set_plugin   include:swarm-workflow   enabled=false
plugin_manager set_plugin   include:swarm-workflow   enabled=true
```

Off then on is the live proof: the `swarm-engineering` skill leaves the skill
catalog and comes back. The local path is a development convenience — it is
not the install route.

## Uninstall and rename

* `plugin_manager remove_bundle dsh-swarm-workflow` — the skill leaves the
  catalog at once.
* A bundle that was installed by **linking** a checkout leaves the
  `node_modules` junction behind. Remove it with
  `cmd /c rmdir <profile>\node_modules\dsh-swarm-workflow` — the junction
  only, never `/s`.
* To go back from a linked install to the published package, restore the
  profile's own `package.json` and `pnpm-lock.yaml` and then reinstall **with
  `--force`**: `pnpm install --frozen-lockfile --force`. The force matters.
  Without it pnpm answers "Already up to date" and leaves the checkout's
  junction in `node_modules`, so the manifest claims the published package
  while the directory is still the checkout — a fork the manifest cannot see.
  An older backup of the profile restores an older **commit of the plugin**, so
  read the commit in `pnpm-lock.yaml` before you restore one.
* To move the install to another repository, remove the bundle **first**, then
  install from the new address: two bundles contributing the same row id is a
  conflict. The scope lives in four places: `package.json`'s name, the patch
  row's name, `client.js`'s module id, and the skill's `source` in `index.js`.

## Files

```
index.js                      the plugin: prompt section, skill, tools, /swarm command
prompt-overlay.md             the global execution policy (the user's text, adapted to this host — see docs/host-adaptation.md)
swarm-prompt.md               the delegation briefing (the user's text, adapted to this host — see docs/host-adaptation.md)
runtime-note.md               the host note: the host facts this plugin wrote
skills/swarm-engineering/swarm-engineering.md  the role methods (the user's text, adapted to this host — see docs/host-adaptation.md)
skills/swarm-engineering/shared.md   the shared craft every lane uses (the plugin's prose)
skills/swarm-engineering/developer.md  the developer's craft (the plugin's prose)
skills/swarm-engineering/tester.md   the tester's craft (the plugin's prose)
skills/swarm-engineering/reviewer.md the reviewer's craft (the plugin's prose)
skills/swarm-engineering/languages/  the language pieces, one file per language (python, java, go, typescript, rust)
cordis.patch.yml              the profile row (id: swarm-workflow)
client.js, locale/, icon.svg  the Web-GUI side (the card renders the English literals today, so the locale files are carried for the face that is not wired up yet and no code path reads them)
package.json                   the manifest: the name, the version, and the `files` allowlist that decides what ships
README.md                     this file: what the bundle does, how it is installed, and how it is checked
test/                         the suite that travels with the bundle
tools/                         the drift guard: the section-by-section checker and its Node wrapper
docs/host-adaptation.md       the record of every passage of the shipped text adapted to this host, with its reason
docs/host-adaptation.json     the same record, machine-readable: the sections, both hashes and the reason
docs/validation/              the validation record: the three test beds' evidence (it ships with the package, like the rest of docs/)
```

## Tests

```
npm test
```

The runner starts every suite in its own process and exits non-zero when one
fails, and its last line names how many suites ran and how many checks they
made (`ALL SUITES PASSED (11 suites, N checks)`). The suites under `test/` cover
the prompt composition and gating (`render-prompt.test.mjs`), the three
primitives against stub host services (`swarm-tools.test.mjs`), the parsing and
registration timing (`gating.test.mjs`), the verbatim guarantee — that the
shipped text still carries the user's own anchors and none of the host's
(`verbatim.test.mjs`) — and the skill re-registration stamp, which has to cover
the runtime note, the skill file and every craft file (`skill-stamp.test.mjs`),
the craft wiring — that the note names the craft files, that each path is
resolved where the bundle lives, that each craft file is registered as a skill
of its own, and that a CRLF checkout still composes (`method.test.mjs`), and
the encoding of the shipped text — that every text file is valid UTF-8 and that
no replacement character or mojibake signature survived outside the historical
quotes under `docs/validation/` (`encoding.test.mjs`), the live capability block
— that every surface the note names is probed, reported present or named absent
(`capability-probe.test.mjs`), the client half — that it registers the board as
a tool view keyed by the plugin's own wire tool name and that the dock entry
carries a label (`client-registration.test.mjs`), and the host's own tool
inventory — that the note names every model-facing tool the host ships, or
lists the ones it does not with a reason (`host-surface.test.mjs`). The eleventh
step is the policy self-check, which compares the bundle against its own record
and needs no canonical repository. The method suite also reads the craft files
themselves: it asserts that each of the nine still carries the sections its
design names — the three checks and the twelve shared pieces in the shared
craft, and the nineteen numbered sections each language file carries, which are
the same count but not the same titles — and that every one of them stays
host-neutral — no plugin marker, no host name, no machine path, and no surface
of another host. The
gating suite runs the same scenarios twice: against the host's real runtime
when this machine has one, and against a local model of the host's service
semantics (`test/lib/cordis-model.mjs`) when it does not — so the suite runs on
a machine with no DSH host at all.

The method suite also checks the README against the bundle's own record: that
the README claims no unmodified shipping of text the record says was adapted,
that it describes the drift guard as the section-by-section comparison the
guard performs, that the craft index names every section of the craft files it
lists, and that the number of test beds it names is the number the validation
record names. The checks read the claims themselves, not a copy of the
wording, so a legitimate rewording does not break them.

The shipped text is carried from a canonical source that lives in another
repository, so that pair needs its own gate. The guard is
`tools/check-policy-sync.ps1`, and it compares the three shipped policy files
**section by section** against the canonical, using the record in
`docs/host-adaptation.json`. A section nobody adapted must be identical to the
canonical, character for character; an adapted section must be listed with
both hashes and a reason. An unrecorded difference, an out-of-date hash, an
entry with no reason and a record that lists a section which no longer differs
all fail; a heading that was renamed is recorded with its canonical wording in
`canonicalHeading`, so a deliberate rename is an adaptation and not a failure.
The canonical side is read at the revision the record pins, and the canonical's
working tree is reported next to it, so a canonical that has moved is its own
failure instead of a quiet change to the comparison. The nine craft files are
compared through the documented port transform and reported separately from the
policy files. Run it with `npm run check:policy` (the bundle against the
canonical) or `node tools/check-policy.mjs --self` (the bundle half only, which
needs no canonical repository); the command exits 0 when every comparison it
made agreed, 1 when something drifted, failed, or a comparison could not be
made at all, and 2 when the guard could not run — an argument it does not know,
no PowerShell to run it with, or no bundle tree to compare.

## Notes

* The plugin describes the **live** host. The prompt is rendered per
  assembly from the bundled files and the host's tool registry, and a bullet
  whose tool is missing is dropped instead of shown. Do not hand-write host
  facts into the shipped text.
* `swarm_worktree` appears only where the host exposes the worktree service
  (the `worktrees` bundle). Where it is absent, the prompt says so.
* The execution policy, the delegation briefing and the skill text are the
  user's own text, carried from the canonical and adapted to this host where
  the canonical named a surface this host does not have. Every adaptation is
  listed, with its reason, in [`docs/host-adaptation.md`](docs/host-adaptation.md);
  every other passage is identical to the canonical, character for character.
  Every host-specific fact lives in `runtime-note.md`, and the plugin composes
  a view of the shipped text instead of editing it.
* The files under `skills/swarm-engineering/` are plugin prose as well: the
  craft guidance, kept in their own directory under the skill they belong to so
  it can grow without touching the note or the user's text. The note names
  them, every brief names the file and the piece that applies, each one is
  registered as a skill of its own, and they are never composed into a prompt —
  a lane loads the skill it was pointed at.
