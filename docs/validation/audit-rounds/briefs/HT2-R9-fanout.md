# HT2-R9 - one fan-out, three read-only lenses

Three lenses over the same run. Each lens is read-only and reports findings with
`file:line` evidence; none of them writes inside the worktree, none of them commits,
none of them pushes, none of them changes the plugin or the profile.

## Lens 1 - the served prompt and the skill

Read the shipped bundle at `D:\project\dsh-plugins\swarm-workflow` (files:
`index.js`, `swarm-prompt.md`, `swarm-worker-prompt.md`, `skills/swarm-engineering.md`)
and answer:

- Which sections of the skill are worker-facing, which are Coordinator-side, and does
  the worker prompt point the worker at the worker-facing ones? Cite `file:line` for
  each claim. A rule that exists in the skill but that no worker prompt points to is a
  finding.
- Does the worker prompt still carry any project-specific convention that a global
  prompt should not carry (an id scheme, a fixed file path, a specific repository)?
- Is the marker structure intact: the user's own text above the marker, the plugin's
  own text below it, one marker per file, no raw marker in the rendered prompt?
- Render the worker prompt the way the host renders it (import `renderPrompt` from
  `file:///D:/project/dsh-plugins/swarm-workflow/index.js`, read the file, call
  `renderPrompt(raw, names, options)`) and report what a worker with the full
  delegation registry and a worker without it actually receives. Write the rendered
  text to `D:\project\.swarm-lab\proof-scratch\ht2-r9\lens1-rendered-worker.txt`.

## Lens 2 - the branch diff

The work is on branch `swarm/lab11` of the worktree `D:\project\.swarm-lab\head_tree2`,
base commit `4525f25`.

- List every commit and every file it touched. For each change, name the requirement
  it serves, by the heading in the requirements file and its `file:line`. A change
  that serves no requirement is a finding; a requirement with no change is a gap.
- Read the requirements files in `.swarm\requirements\` and check that every source
  pointer in them still resolves: the file exists and the line is what the pointer
  claims. A pointer that drifted is a finding - say what it should be now.
- Look for weakened tests: a deleted or skipped test, a loosened assertion, a changed
  threshold, a renamed requirement, or a test that asserts less than it did before.
  Compare against the base commit with `git diff 4525f25..swarm/lab11 -- tests/`.
- Report the state of the working tree: any uncommitted change, any file no lane
  owns, any stray artefact (a `__pycache__`, a `.pyc`, a `.pytest_cache`, a
  `.ruff_cache`) inside the worktree.

## Lens 3 - the requirements and the evidence

- For each requirements file: is every block well formed (a requirement, an observable
  check, a source)? Is the check something a test can decide? Is the source something
  that exists? Cite `file:line`.
- For each requirement in both files: is there a test in the worktree that covers it,
  and does that test's assertion actually decide the requirement? A test that passes
  while the behaviour is wrong is a finding - say how to tell the difference.
- Are the two work items independent of each other, and does a change to one break
  the other?

## The report

One report, three sections, one per lens. For each finding: what, where
(`file:line`), why it matters, and what severity you would give it (Blocking /
Material / non-blocking). Then the limits of your own lens - what you could not see
and why. Report honestly: Verified (you ran it), Inferred (you read it), Not run.

No writes inside `D:\project\.swarm-lab\head_tree2`, no writes inside
`D:\project\dsh-plugins`, no git writes, no network, no plugins, no agents, no goals.
`D:\project\.swarm-lab\proof-scratch\ht2-r9` is yours for notes.

Toolchain: `git` is at `C:\Program Files\Git\cmd\git.exe` (not on PATH); Get-Content
needs `-Encoding UTF8`; python is `C:\Python312\python.exe`; node is not installed -
run a `.mjs` file with `$env:ELECTRON_RUN_AS_NODE = "1"` and
`Start-Process -FilePath "D:\software\dsh\DeepSeek Harness.exe" -ArgumentList <script>
-Wait -PassThru -NoNewWindow -RedirectStandardOutput <out> -RedirectStandardError <err>`
(a bare call prints nothing).
