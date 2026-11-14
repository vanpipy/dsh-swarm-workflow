# dsh-swarm-workflow

A DSH plugin that turns a session into a small engineering swarm: the main
agent becomes the **Coordinator**, every delegated agent gets a scoped view of
the execution policy, and the `swarm-engineering` skill carries the role
methods (Developer, Tester, Reviewer) the swarm runs on.

## The boundary

The bundle ships the user's own text **byte for byte** and keeps every
host-specific fact in one separate file. Nothing in the shipped text is
rewritten for this host, and no host fact is written into the shipped text.

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
`swarm-craft-tester`, `swarm-craft-reviewer` and `swarm-craft-python`. The name
and the description live in the file's own frontmatter, so the catalog and the
file never drift apart.

## What it adds

| Surface | What it is |
| --- | --- |
| Coordinator prompt | injected into the main agent's system prompt (`swarm-workflow:swarm`) |
| Worker prompt | injected into every delegated agent |
| `swarm-engineering` skill | the role methods, loaded on demand |
| `swarm-craft-*` skills | the craft guidance: `swarm-craft-shared`, one per role (`developer`, `tester`, `reviewer`) and one per language (`python`) |
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
    languages/python.md   the language pieces
```

### `shared.md`

| Section | What it is |
| --- | --- |
| 1 | how to use the directory, and which file owns the process and which the craft |
| 2 | the three checks that hold in every language: make the check falsifiable, re-derive every number a second way, validate where the artifact runs |
| 3 | the pieces that hold in every language: boundaries, types, errors, dependencies, state, time, the outside world, performance, tests, security, diagnostics, naming |
| 4 | the same piece in another stack |
| 5 | what the directory does not cover |

### The role files

| File | What it is |
| --- | --- |
| `developer.md` | name the target before the edit, shape the change, make the code say what it means, prove it as you go, the language pieces |
| `tester.md` | choose the oracle, make the check discriminate, cover the boundary rather than the middle, prove the check can fail, report honestly |
| `reviewer.md` | read the change as a claim, re-derive the evidence yourself, the review smells, hunt the check that cannot fail, name what you did not check, the severity vocabulary |

### `languages/python.md`

Nineteen sections, one per topic: the surface and the version floor, typing,
data modelling, collections, iteration and laziness, errors, resources, files
and paths, the shell and the outside world, time and clocks, concurrency,
testing, the command line, performance, style and docstrings, dependencies and
environments, logging and diagnostics, security, and the common traps. A
language that deserves its own file gets one beside it.

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
* To move the install to another repository, remove the bundle **first**, then
  install from the new address: two bundles contributing the same row id is a
  conflict. The scope lives in four places: `package.json`'s name, the patch
  row's name, `client.js`'s module id, and the skill's `source` in `index.js`.

## Files

```
index.js                      the plugin: prompt section, skill, tools, /swarm command
prompt-overlay.md             the global execution policy (the user's text, verbatim)
swarm-prompt.md               the delegation briefing (the user's text, verbatim)
runtime-note.md               the host note: the host facts this plugin wrote
skills/swarm-engineering/swarm-engineering.md  the role methods (the user's text, verbatim)
skills/swarm-engineering/shared.md   the shared craft every lane uses (the plugin's prose)
skills/swarm-engineering/developer.md  the developer's craft (the plugin's prose)
skills/swarm-engineering/tester.md   the tester's craft (the plugin's prose)
skills/swarm-engineering/reviewer.md the reviewer's craft (the plugin's prose)
skills/swarm-engineering/languages/  the language pieces, one file per language
cordis.patch.yml              the profile row (id: swarm-workflow)
client.js, locale/, icon.svg  the Web-GUI side
test/                         the suite that travels with the bundle
```

## Tests

```
npm test
```

The runner starts every suite in its own process and exits non-zero when one
fails. The suites under `test/` cover the prompt composition and gating
(`render-prompt.test.mjs`), the three primitives against stub host services
(`swarm-tools.test.mjs`), the parsing and registration timing (`gating.test.mjs`),
the verbatim guarantee — that the shipped text still carries the user's
own anchors and none of the host's (`verbatim.test.mjs`) — and the skill
re-registration stamp, which has to cover the runtime note, the skill file and
every craft file (`skill-stamp.test.mjs`), and the craft wiring — that the note
names the craft files, that each path is resolved where the bundle lives, that
each craft file is registered as a skill of its own, and that a CRLF checkout
still composes (`method.test.mjs`). The method suite also reads the craft
files themselves: it asserts that each of the five still carries the sections,
the three checks, the twelve shared pieces and the nineteen Python sections its
design names, and that every one of them stays host-neutral — no plugin marker,
no host name, no machine path. The gating suite runs
the same scenarios twice: against the host's real runtime when this machine
has one, and against a local model of the host's service semantics
(`test/lib/cordis-model.mjs`) when it does not — so the suite runs on a
machine with no DSH host at all.

## Notes

* The plugin describes the **live** host. The prompt is rendered per
  assembly from the bundled files and the host's tool registry, and a bullet
  whose tool is missing is dropped instead of shown. Do not hand-write host
  facts into the shipped text.
* `swarm_worktree` appears only where the host exposes the worktree service
  (the `worktrees` bundle). Where it is absent, the prompt says so.
* The execution policy, the delegation briefing and the skill text are shipped
  verbatim. Every host-specific fact lives in `runtime-note.md`, and the plugin
  composes a view of the shipped text instead of editing it.
* The files under `skills/swarm-engineering/` are plugin prose as well: the
  craft guidance, kept in their own directory under the skill they belong to so
  it can grow without touching the note or the user's text. The note names
  them, every brief names the file and the piece that applies, each one is
  registered as a skill of its own, and they are never composed into a prompt —
  a lane loads the skill it was pointed at.
