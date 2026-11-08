# dsh-swarm-workflow

A DSH plugin that turns a session into a small engineering swarm: the main
agent becomes the **Coordinator**, every delegated agent gets a **worker
prompt**, and the `swarm-engineering` skill carries the role methods
(Developer, Tester, Reviewer) the swarm runs on.

## What it adds

| Surface | What it is |
| --- | --- |
| Coordinator prompt | injected into the main agent's system prompt (`swarm-workflow:swarm`) |
| Worker prompt | injected into every delegated agent |
| `swarm-engineering` skill | the role methods, loaded on demand |
| `swarm_worktree` | gives a lane its own Git worktree |
| `swarm_task` | reads and updates the shared team board |
| `swarm_child` | lists, steers and stops the delegated child lanes |
| `/swarm` | prints what the swarm can do in this session |

The three tools are registered **only when the host exposes the backing
service**. A surface this host lacks is dropped from the prompt and listed
under "Absent in this session" rather than advertised.

## The workflow

Understand → Investigate → Design → Implement → Verify → Integrate and accept

1. **Understand** — the Coordinator writes the objective, the scope and the
   acceptance criteria, and puts the requirement text in
   `.swarm/requirements/<work-item>.md`: one block per requirement, each with
   the requirement, the observable check that proves it, and its source.
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

**Roles.** *Developer* implements and writes the implementation smoke test.
*Tester* derives the checks from the requirement and owns one test file per
function. *Reviewer* reviews independently and produces the requirement
verdict table. *Coordinator* plans, dispatches, integrates and accepts.

**Every lane reports the same shape:** the investigation question, the
evidence and where it lives, the findings, the assumptions and their
confidence, any material unresolved question, the recommended next action,
and whether the exit criteria are satisfied.

## Install

Requirements: DSH with the Agent Teams profile enabled
(`include:agent-team`, `include:tool-agent-team`, `include:ui-agent-team`) —
that is what makes the native-team path available. A plain delegated
subagent works too, with a reduced toolkit.

**1. Get the bundle on disk** (clone or copy it), for example:

```
D:\project\dsh-plugins\swarm-workflow
```

**2. Install it into the profile** by pointing `install_bundle` at the
absolute package directory:

```
plugin_manager install_bundle   target=D:\project\dsh-plugins\swarm-workflow
```

The profile links the checkout directory, so later edits to the files are
picked up once you re-apply the bundle (step 3).

**3. Re-apply after every edit** to the prompt files:

```
plugin_manager set_plugin   include:swarm-workflow   enabled=false
plugin_manager set_plugin   include:swarm-workflow   enabled=true
```

Off then on is the live proof: the `swarm-engineering` skill leaves the
skill catalog and comes back.

**4. Start a new session.** The bundle's code is fixed for the life of a
session; the prompt files are re-read when they change and the skill is
re-registered on every re-apply — but validate changed behaviour in a new
session.

**5. Check it:** run `/swarm`. It prints the live delegation and
coordination surfaces of the current session.

## Uninstall and rename

* `plugin_manager remove_bundle dsh-swarm-workflow` — the skill leaves the
  catalog at once.
* pnpm's removal leaves the `node_modules` junction behind. Remove it with
  `cmd /c rmdir <profile>\node_modules\dsh-swarm-workflow` — the junction
  only, never `/s`.
* Renaming a bundle whose patch row id stays the same: remove the old
  bundle **first**, then install the new one; installing first would make two
  bundles contribute the same row id. The scope lives in four places:
  `package.json`'s name, the patch row's name, `client.js`'s module id, and
  the skill's `source` in `index.js`.

## Files

```
index.js                      the plugin: prompt section, skill, tools, /swarm command
swarm-prompt.md               the Coordinator prompt
swarm-worker-prompt.md        the delegated worker prompt
skills/swarm-engineering.md   the role methods
cordis.patch.yml              the profile row (id: swarm-workflow)
client.js, locale/, icon.svg  the Web-GUI side
```

## Notes

* The plugin describes the **live** host. The prompt is rendered per
  assembly from the bundled files and the host's tool registry, and a bullet
  whose tool is missing is dropped instead of shown. Do not hand-write host
  facts into the markdown.
* `swarm_worktree` appears only where the host exposes the worktree service
  (the `worktrees` bundle). Where it is absent, the prompt says so.
* The orchestration policy and the skill text are shipped verbatim; the
  host-specific facts live in the plugin's own sections, below the boundary
  marker in each file.
