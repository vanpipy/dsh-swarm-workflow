# The renames (2026-11-08)

Two renames, the same day. First `@local/swarm-workflow` →
`@sages/swarm-workflow` (equal-length scopes, so a byte-level replacement).
Then `@sages/swarm-workflow` → `dsh-swarm-workflow` (unscoped).

The second rename is below, under "The second rename".

## The first rename: to @sages/swarm-workflow

The user asked for the plugin to be renamed to `@sages/swarm-workflow`. It was
`@local/swarm-workflow`.

## What carried the scope

Four identifiers, plus the boundary markers in the shipped markdown:

| File | Line | What it is |
|---|---|---|
| `package.json` | 2 | the package name — the identity the profile records |
| `cordis.patch.yml` | 3 | the bundle row's `name` — the plugin id the host registers |
| `client.js` | 2 | the client module id the web app's module loader resolves |
| `index.js` | 40 | `SKILL_SOURCE` — the `source` the skill is registered with (the host refuses a skill without a string source) |
| `swarm-prompt.md`, `swarm-worker-prompt.md`, `skills/swarm-engineering.md` | the marker comments | the eight boundary comments that name the plugin that added them |

Twelve occurrences in seven files. The two scopes are the same length
(`@local/` and `@sages/` are six characters each), so the rename was done as a
byte-level replacement: every other byte of the user's own text is untouched.

## The order that worked

1. Edit the seven files (byte-level replace).
2. `remove_bundle @local/swarm-workflow` — the live proof came immediately:
   the `swarm-engineering` skill **vanished** from the `<available_skills>`
   catalog in the next system-reminder.
3. `install_bundle` with the directory `D:\project\dsh-plugins\swarm-workflow`
   — the host read the package name from the manifest and registered the
   bundle as `@sages/swarm-workflow` 1.0.0, enabled, applied, no warnings.
   The skill **returned** to the catalog with the user's verbatim description.
4. The stale junction `node_modules\@local\swarm-workflow` survived pnpm's
   removal, so it was removed by hand (`cmd /c rmdir` on the junction only —
   never with `/s`, which would delete the target's contents). The empty
   `@local` scope directory went with it.

The row id did not change: `include:swarm-workflow` is still the toggle
target, because the row id in `cordis.patch.yml` is unscoped.

## Verified

- The render test (`rounds/tools/test-render-prompt.mjs`): ALL CHECKS PASSED.
- `index.js --check`: exit 0.
- The integrity diffs against the recovered originals are unchanged: policy
  32/96, skill 179/6 — the only unmatched lines are the three the user asked
  to change (the chat lead-in, the frontmatter, the §1 bullet).
- `git diff --stat`: 7 files, 12 insertions, 12 deletions — the scope token
  and nothing else.
- The profile: one local package, `@sages/swarm-workflow`, linked to
  `D:\project\dsh-plugins\swarm-workflow`.
- The bundle repo commit: `185e1ea`.

## Not changed

- The **directory** stays `D:\project\dsh-plugins\swarm-workflow`; the scope
  is the package name, not the folder. The ledger, the tool paths and the
  memory entries refer to that path.
- The skill's name (`swarm-engineering`) and its frontmatter description are
  the user's own text and were not touched.
---

# The second rename: to dsh-swarm-workflow (2026-11-08)

The user asked for the plugin to be renamed to dsh-swarm-workflow. It was
@sages/swarm-workflow. The scope is gone - the name is unscoped now.

## What changed

The same twelve occurrences, in the same seven files: package.json (the
package name), cordis.patch.yml (the bundle row's 
ame), client.js (the
client module id), index.js (SKILL_SOURCE), and the eight boundary
comments in swarm-prompt.md, swarm-worker-prompt.md and
skills/swarm-engineering.md.

This time the two names are **not** the same length (@sages/swarm-workflow
is 21 characters, dsh-swarm-workflow is 18), so the replacement was done
with a script that counted the occurrences per file and refused to write
unless every count matched: package.json 1, cordis.patch.yml 1, client.js 1,
index.js 1, swarm-prompt.md 1, swarm-worker-prompt.md 1,
skills/swarm-engineering.md 6 - twelve in all. The files were read and
written with the line endings preserved, so the diff is exactly the name:
seven files, twelve insertions, twelve deletions.

## The order that worked (the same one as the first rename)

1. Edit the seven files.
2. emove_bundle @sages/swarm-workflow - the live proof came immediately:
   the swarm-engineering skill **vanished** from the <available_skills>
   catalog.
3. install_bundle with the directory D:\project\dsh-plugins\swarm-workflow
   - the host read the package name from the manifest and registered the
   bundle as dsh-swarm-workflow 1.0.0, enabled, applied, no warnings. The
   skill **returned** with the user's verbatim description.
4. The stale junction 
ode_modules\@sages\swarm-workflow survived pnpm's
   removal; its target was checked (D:\project\dsh-plugins\swarm-workflow,
   LinkType Junction) and the junction alone was removed with
   cmd /c rmdir - never /s, which would delete the target's contents.
   The empty @sages scope directory went with it.

The row id did not change: include:swarm-workflow is still the toggle
target, because the row id in cordis.patch.yml is unscoped.

## Verified

- The profile lists exactly one local bundle: dsh-swarm-workflow 1.0.0,
  source: link:D:\project\dsh-plugins\swarm-workflow, enabled: true,
  installed: true, one row include:swarm-workflow, no overrides. No
  @sages/… bundle is left.
- 
ode_modules\dsh-swarm-workflow points at the bundle directory; the
  @sages scope directory is gone.
- The render test (ounds/tools/test-render-prompt.mjs): ALL CHECKS PASSED.
- The tool test (ounds/tools/test-swarm-tools.mjs): ALL CHECKS PASSED (63).
- index.js --check: exit 0.
- The integrity diffs against the recovered originals are unchanged: policy
  11 unmatched of 327, skill 3 unmatched of 481 - the same three the user
  asked to change (the chat lead-in twice, and the prompt-overlay bullet).
- The bundle repo commit: c9fbf2f.

## Not changed

- The **directory** stays D:\project\dsh-plugins\swarm-workflow; the name
  is the package name, not the folder. The ledger, the tool paths and the
  memory entries refer to that path.
- The skill's name (swarm-engineering) and its frontmatter description are
  the user's own text and were not touched.