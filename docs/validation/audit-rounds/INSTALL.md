# The install route (2026-11-08)

## The decision

The user's directive (verbatim): **"yes, make it as the only one way to install"**.

One canonical route for `dsh-swarm-workflow`:

```
github:vanpipy/dsh-swarm-workflow
```

No npm publication, no marketplace index entry. The local checkout stays the **development**
route, and the README says so.

## What the host accepts

- `dsh-client-ui-plugin-manager/README.md:57` — "**Add plugin** takes a package name with an
  optional version, a Git address, a tarball, or an absolute local path".
- `dsh-plugin-manager/lib/types/install-spec.js` → `parseInstallSpec` classifies exactly four
  kinds: `registry | git | tarball | path`.
- The git forms: the `github:` / `gitlab:` / `bitbucket:` / `gist:` shorthand, `git://` URLs, hosted
  `https://` repository URLs, and scp-like `git@host:path`. For this plugin the canonical string is
  `github:vanpipy/dsh-swarm-workflow`.
- The marketplace (`@deepseek-ai/dsh-experimental-plugin-market-bundle`, enabled:false,
  installed:false) is only the **discover** route — a Discover tab that browses a third-party index
  JSON. A single plugin does not need it.
- The CLI equivalent of the app's Plugins page is `dsh plugin --profile desktop add <spec>`.

## The one precondition: Git on the PATH the app was launched with

- The desktop launcher builds the pnpm launcher fact:
  `packageManager: { command: process.execPath, args: ["--expose-internals", <supportDir>/primary-runtime/dependencies/pnpm/bin/pnpm.mjs], env: { ELECTRON_RUN_AS_NODE: "1", DSH_DESKTOP_NODE_EXECUTABLE: process.execPath, PATH: `${<supportDir>/bin}${delimiter}${process.env.PATH ?? ""}` } }`
  ⇒ the pnpm subprocess's PATH = the DSH support bin dir **+ the app process's own PATH**.
- pnpm shells out to `git` for a git dependency ⇒ git must be on the **app's** PATH.
- git was on neither the user PATH nor the machine PATH (it lives only at
  `C:\Program Files\Git\cmd\git.exe`).
- A `.env` cannot fix it: `dsh-app-boot/lib/index.js` `BOOTSTRAP_NAMES` (:3610) includes PATH, and
  `loadLayeredEnv` (:3736-3744) applies a `.env` layer only when `process.env[name] === void 0`
  ⇒ PATH is bootstrap-only and already defined.
- The profile's `package.json` cannot fix it either: the plugin manager reads
  `this.profile.packageManager ?? { command: this.pnpmCommand }` and merges
  `env: this.profile.packageManager.env` over `scrubbedParentEnv()`; the desktop always supplies
  its own fact.
- **The fix applied:** `C:\Program Files\Git\cmd` was added to the **user** PATH (persistent;
  `git --version` → `git version 2.50.1.windows.1`). The running app still carries the old PATH ⇒
  **one app restart** is needed for the in-app Plugins page to see git. Undo: remove that entry from
  the user PATH.

## The live proof (the real profile, the host's own CLI)

```
dsh plugin --profile desktop add github:vanpipy/dsh-swarm-workflow
→ EXIT 0, "dependencies: + dsh-swarm-workflow 1.0.0", "Done in 16.8s using pnpm v11.28.5"
```

The profile now holds a **real directory** with the whole bundle — index.js 44,902 ·
skills/swarm-engineering.md 34,381 · swarm-prompt.md 25,428 · swarm-worker-prompt.md 9,213 ·
client.js 1,093 · package.json 965 · cordis.patch.yml 71 · icon.svg 413 · locale/en.json 269 ·
locale/zh.json 261 · README.md 6,779. It arrives **CRLF** (pnpm's git fetch converts); the local
checkout stays LF — cosmetic for prompt text.

`list_bundles`:

```json
{"name":"dsh-swarm-workflow","availability":"profile","version":"1.0.0",
 "source":"git+https://github.com/vanpipy/dsh-swarm-workflow.git",
 "enabled":true,"installed":true,"removable":true,
 "rows":[{"rowId":"swarm-workflow","moduleName":"dsh-swarm-workflow","entryId":"include:swarm-workflow"}],
 "overrides":[]}
```

`set_plugin include:swarm-workflow enabled=false` → the `swarm-engineering` skill **left** the
`<available_skills>` catalog; `enabled=true` → it **returned** (the catalog description carries the
plugin's host note plus the user's verbatim sentence) ⇒ the app now loads the git-installed copy.

## The defect the proof found: a linked bundle and a git install collide

The **first** attempt failed:

```
[ERR_PNPM_EPERM] [importPackage …\node_modules\dsh-swarm-workflow]
EPERM: operation not permitted, rename '…\dsh-swarm-workflow_tmp_25824_4' -> '…\dsh-swarm-workflow'
```

pnpm could not replace the **existing junction** (the profile's `node_modules\dsh-swarm-workflow`
was a junction to the local checkout). The failed run had already rewritten the profile's
`package.json` to the git spec while `node_modules` still held the junction.

Worse: **the failed import deleted the interior of the local checkout through the junction.**
`D:\project\dsh-plugins\swarm-workflow\.git` survived only as `objects/` and `refs/` (HEAD, config,
index, logs and hooks were gone) ⇒ `git status` answered *"fatal: not a git repository"*. The twelve
working files were intact.

**The fix:** remove the junction *first* —
`C:\Windows\System32\cmd.exe /c rmdir` (the junction only, **never** `/s`; `cmd` is not on PATH in
the sandbox shell, so use the full path; verify `LinkType=Junction` and the `Target` before
removing). Then the install succeeds.

**The restore of the gutted checkout:** clone the published repository into a scratch directory,
compare all twelve files after normalising CRLF→LF (12/12 equal, no extra or missing files), move
the clone's `.git` into place, `git config core.autocrlf false` plus the identity, then
`git add -A` to refresh the index's stale stat cache (the clone's CRLF checkout had left every file
looking modified while `git diff --stat HEAD` was empty — the proof was `git ls-files -s` ==
`git rev-parse HEAD:<file>` == `git hash-object <file>`). Result: `git status --short` empty,
`git diff --cached --stat HEAD` empty, the history intact
(`15e7fc1 ← 204711f ← c9fbf2f ← 190cd38 ← 5756330 ← b68083f …`), the remote → the GitHub URL,
`git fsck` clean.

## Operating rules now

1. The canonical install is the GitHub address; the local checkout is the development route only.
2. The package keeps `"private": true` — npm refuses to publish it, which enforces the single route.
3. A **linked** bundle must be removed before installing from git: remove the bundle, then
   `cmd /c rmdir` the stale junction, then install.
4. The plugin's edits now travel: commit → push → re-install (the profile holds a copy, not the
   checkout).
5. The scope lives in four places: `package.json`'s name, the patch row's name, `client.js`'s module
   id, and the skill's `source` in `index.js`.
6. The app needs **one restart** after the user PATH changed.

## Evidence

- Bundle commit `15e7fc1` "docs: one install route - the GitHub address" (README.md, +47/-28),
  pushed: `204711f..15e7fc1  main -> main`, `PUSH_EXIT=0`.
- The live install above; `list_bundles` above; the skill's departure and return above.
- The isolated proof that the git address itself is sound:
  `pnpm add github:vanpipy/dsh-swarm-workflow` with `C:\Program Files\Git\cmd` prepended to PATH →
  exit 0 in 18.4 s (pnpm 11.28.5).

## The published history was rewritten (2026-11-08)

The user's decision: scrub the old scope names out of the published history, so the history matches
the name the plugin ships under. The rewrite changed **messages only**.

| old | new | what changed |
|---|---|---|
| `185e1ea` | `4c5f0cf` | subject: "refactor(scope): the plugin is @sages/swarm-workflow, not @local/swarm-workflow" -> "refactor(scope): rename the plugin's scope"; body: "profile now links @sages/swarm-workflow to this directory and the stale / @local link is gone" -> "profile now links the renamed bundle to this directory and the stale / link is gone" |
| `c9fbf2f` | `3cec879` | body: "The scope / @sages/swarm-workflow is gone:" -> "The previous scope name is gone:" |

The nine other commits kept their SHAs - their trees, messages and parents were untouched. **How:**
the raw commit objects were read with `git cat-file commit`, the `parent` lines were re-pointed
at the rewritten parents, the message text was replaced, and the result was written back with
`git hash-object -w -t commit` - so the tree, the author, the committer and both dates survive
byte for byte.

**Proof:** 11 commits, **0** tree mismatches; the tip's tree is unchanged
(`37dc6dd419b8df053dbd0ffe10e50c4174888230`); `git diff 15e7fc1 232e218` is empty; **0** hits
for `@local`/`@sages` in the surviving history; the old objects were pruned locally
(`git reflog expire --expire=now --all` + `git gc --prune=now`, and
`git cat-file -e 15e7fc1` now fails).

**The push:** `git push --force-with-lease origin main`; the remote's `main` is `232e218`
(`git ls-remote --heads origin main`). **This is a history rewrite** - anyone who cloned the old
history must re-clone (or `git fetch && git reset --hard origin/main`).

The content did not change, so the copy installed in the profile is still exactly what the
repository holds; no reinstall was needed.