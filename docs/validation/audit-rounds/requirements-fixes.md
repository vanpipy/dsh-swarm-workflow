# Requirements — swarm-workflow fix round (F1–F15)

Work item: fix the fifteen findings of the 2026-11-10 review of
`D:\project\dsh-plugins\swarm-workflow` (report:
`D:\project\.swarm-lab\rounds\FINAL-REVIEW-2026-11-10.md`).

Out of scope: the user's own prose. `swarm-prompt.md` lines 1–237, the quoted
blocks in `swarm-worker-prompt.md`, and the user's own text inside
`skills/swarm-engineering.md` are shipped verbatim and are not edited. Plugin
bands, markers, plugin-written pointers and plugin-written prose ARE editable.

Rules for every block below:
- One finding at a time; each is verified before the next starts.
- A fix is done when its check passes, not when the code reads right.
- The plugin's own `inject` list stays minimal: a host that lacks a service
  must still load the plugin and still ship the prompt.

### F1 — a primitive registers when its host service arrives

The three primitives (`swarm_worktree`, `swarm_task`, `swarm_child`) and the
`/swarm` command must be registered when the host exposes the backing service,
even when that service appears after the plugin was applied.

check: with the real cordis runtime, a host that provides `agentTeams` AFTER
the plugin is applied still ends up with `swarm_task` registered; same for
`subagents` → `swarm_child` and `worktrees` → `swarm_worktree`; and a host
that never provides a service registers none of its primitives.
source: `index.js:34`, `index.js:921-924`, `index.js:977-999`, `index.js:1021-1027`

### F2 — no ungated claim about a surface this session may not have

The prompt prose must not assert that the swarm primitives or the `/swarm`
command are available unless the live block proves it.

check: no shipped prompt line claims the primitives are callable or that
`/swarm` prints the block, unless that claim is inside the capability block,
which is rendered from the live registry.
source: `swarm-prompt.md:248`, `swarm-prompt.md:255`, `swarm-prompt.md:263`, `swarm-worker-prompt.md:58`

### F3 — the command prints the block the prompt shows

`/swarm` must print the same capability block the served prompt shows,
including the `/swarm` line itself.

check: the text the command handler returns contains the `/swarm` entry that
the served prompt contains for the same registry.
source: `index.js:325-327`, `index.js:1017`, `index.js:1045`

### F4 — a hand-edited requirement marker never leaks a fragment

A `swarm:requires` marker that spans two lines must be removed completely;
nothing of it may reach the model.

check: rendering a line whose marker spans two lines yields text with no
`swarm:requires` substring and no leftover marker fragment.
source: `index.js:62`, `index.js:71`, `index.js:410`

### F5 — the worker prompt states the verdict vocabulary

A worker that reports against a requirement must know the four verdicts, the
two checks and the evidence rule without loading the skill.

check: `swarm-worker-prompt.md` names `met`, `not met`, `not demonstrated`,
`not in scope`, the discrimination check, the intent check, and the rule that
a verdict without evidence is `not demonstrated`.
source: `swarm-worker-prompt.md:12`, `skills/swarm-engineering.md:621-632`

### F6 — the handover example matches the file the Coordinator writes

The example block in *Requirement handover* must show the shape the
Coordinator's own requirements file uses.

check: the example shows `check:` and `source:` at the start of the line, and
the `### <ID> — <title>` heading the Coordinator writes.
source: `skills/swarm-engineering.md:641-647`

### F7 — the bundle carries its own verification

A clone of the published repository must be able to run the bundle's tests.

check: `package.json` has a `scripts.test`, the `files` list carries the test
directory, and `npm test` (run as `node test/run.mjs` where no npm exists)
runs the suite and exits non-zero on a failed assertion.
source: `package.json`, `D:\project\.swarm-lab\rounds\tools\test-render-prompt.mjs:11`, `D:\project\.swarm-lab\rounds\tools\test-swarm-tools.mjs:15`

### F8 — the README states the gating condition the code delivers

The README must say what the code actually does: the plugin waits for the
service, so a host that provides it later still gets the tool.

check: the README sentence about the three tools states the waiting behaviour,
not only the "only when the host exposes" part.
source: `README.md:20-22`, `README.md:150-151`

### F9 — the development route does not claim a link it cannot prove

The README must not claim that the profile links the checkout directory when
the host may copy it.

check: the develop section states what is verifiable (the bundle is installed
from that path and an edit is picked up after a re-apply) without asserting
the link mechanism.
source: `README.md:104-118`

### F10 — the worker prompt's marker states the real provenance

The marker above the host-facts band must not claim that everything above it
is the user's own text.

check: the marker names the quoted passages as the user's text and the
framing lines as plugin glue.
source: `swarm-worker-prompt.md:44`

### F11 — every plugin-written paragraph carries its own marker

The plugin pointer paragraphs in the Coordinator prompt are outside the
plugin band; each must be marked as plugin-written.

check: each of the three pointer paragraphs in the Coordinator prompt is
preceded by a marker comment that says the paragraph is plugin-written.
source: `swarm-prompt.md:135`, `swarm-prompt.md:186`, `swarm-prompt.md:192`

### F12 — the relocation markers disclose the renumbering

The markers that say "relocated verbatim" must also say the headings were
renumbered, and where the original headings still stand.

check: the marker text in the skill and in the Coordinator prompt names the
heading numbers before and after.
source: `skills/swarm-engineering.md:487`, `skills/swarm-engineering.md:527`, `swarm-prompt.md:239`

### F13 — the dropped chat lead-ins are disclosed

The skill's marker must say that the two chat lead-in lines of the original
paste are not shipped.

check: the marker text names the two dropped lines.
source: `skills/swarm-engineering.md:6`, `skills/swarm-engineering.md:481`

### F14 — an absence is not presented as a host limitation

The capability block and the prompt bullets must not present the bundle's own
gap as something the host lacks.

check: the wording of the "not probed" block and of the umbrella bullet names
what was probed, not a cause the probe cannot establish.
source: `index.js:296-303`, `swarm-prompt.md:255`, `swarm-worker-prompt.md:58`

### F15 — the tool count says what it counts

The count in the capability block must not claim that every counted tool is
callable.

check: the count line says the registry's count for this scope, and the
block's lead-in does not promise that every counted tool is callable.
source: `index.js:328`, `index.js:332`
