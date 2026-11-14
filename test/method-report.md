# Tester report — the craft wiring and the craft files

Bundle: `D:\project\dsh-plugins\dsh-swarm-workflow`
Lane: Tester (the change was made by the Developer lane and by the Lead; this
report covers the checks that hold the change up).
Date of this revision: the five-file layout, after the third restructure.

---

## 1. What I changed

I own the `test/` directory and nothing else. The files I changed in this
round:

| File | What it does now |
| --- | --- |
| `test/render-prompt.test.mjs` | the composed prompts: the Coordinator view, the worker view, capability gating, the `/swarm` output, the craft wiring (token resolution, paths, unknown token, missing-file notice), the craft skills by name, and the CRLF checkout. **128 checks.** |
| `test/method.test.mjs` | the five craft files themselves: the sections, the three checks, the twelve shared pieces, the nineteen Python sections, and host-neutrality. **83 checks.** |
| `test/skill-stamp.test.mjs` | the six registrations: the catalog line, the content, the `whenToUse`, the frontmatter, and the re-registration stamp over the note, the skill file and the five craft files. **76 checks.** |
| `test/run.mjs` | registers `method.test.mjs`, so the runner ends in `ALL SUITES PASSED (6)`. |

I did not touch `index.js`, `runtime-note.md`, `package.json`, `README.md`,
`skills/`, `prompt-overlay.md`, `swarm-prompt.md` or `skills/swarm-engineering/swarm-engineering.md`.
Nothing is committed.

### The contract of record, and the one it replaces

**This is the third shape of the craft guidance, and the earlier shapes are
superseded.** They are named here so nobody reads this report as if the older
contract still holds:

| Shape | Status |
| --- | --- |
| a root `methodology.md` with seven numbered principles, three lane sections, a role table and a Python appendix | **superseded** — the file was deleted from the bundle; the suites no longer reference it |
| `skills/craft-methodology.md` + `skills/craft-python.md` (two files) | **superseded** — both were replaced by the five files below |
| **`skills/swarm-engineering/` — five files, each registered as a skill of its own** | **the contract of record**; this is what the suites check |

The contract of record, in the words the suites assert:

1. **Five craft files ship under `skills/swarm-engineering/`:**
   `shared.md` (`# The shared craft`; §1 How to use this file, §2 The three
   checks that hold in every language — `### 2.1`–`### 2.3`, each with
   `**The principle.**`, `**In practice.**` and `**How you show it.**` — §3 The
   pieces that hold in every language — `### 3.1`–`### 3.12` — §4 The same
   piece in another stack, §5 What this directory does not cover),
   `developer.md` (`# The developer's craft`; §1–§6), `tester.md`
   (`# The tester's craft`; §1–§6), `reviewer.md` (`# The reviewer's craft`;
   §1–§7) and `languages/python.md` (`# The Python pieces`; §0 plus §1–§19).
2. **Each craft file carries its own frontmatter** (`name`, `description`,
   `whenToUse`) and is registered as a skill of its own, so the host catalog
   holds six skills with `swarm-engineering`: `swarm-craft-shared`,
   `swarm-craft-developer`, `swarm-craft-tester`, `swarm-craft-reviewer`,
   `swarm-craft-python`. The registered description is the host note in front of
   the file's own description; the registered content is the note's
   skill-scoped blocks plus the body with its frontmatter stripped; `whenToUse`
   comes from the frontmatter.
3. **The note names the five files** with the tokens `{{swarm:shared}}`,
   `{{swarm:developer}}`, `{{swarm:tester}}`, `{{swarm:reviewer}}` and
   `{{swarm:python}}`. Each token is resolved to the absolute path of the file
   that ships with the **loaded** bundle; no token survives into a composed
   prompt (Coordinator, worker or skill); a token the bundle does not know stays
   visible as written; a missing file yields the notice that names it.
4. **The stamp covers the note, the skill file and all five craft files**, and
   the six skills are disposed and registered again when any one of them
   changes.

### The one defect this lane found

The stamp was built from the file cache **before** the craft files were read,
so a change to `skills/swarm-engineering/swarm-engineering.md` or to a craft file alone did not
re-register the skills — only a change to `runtime-note.md` did. The evidence
was my own suite:

```
FAIL a change to the skill file alone re-registers the skills -> 12 (expected 18)
FAIL a change to a craft file alone re-registers the skills -> 18 (expected 24)
```

The Lead fixed `index.js` at 00:02:13 (`const bodies = files.map((file) =>
readText(file))` before the stamp is built). The suite now passes, and the
proof at the end of this report shows the same edit still going red.

---

## 2. The validation command and its real output

There is no `node` on PATH on this host, so the runner is started through the
DSH binary in node mode:

```
$env:ELECTRON_RUN_AS_NODE="1"; & "D:\software\dsh\DeepSeek Harness.exe" "D:\project\dsh-plugins\dsh-swarm-workflow\test\run.mjs"
```

Exit code: `0`. No `FAIL` line anywhere.

| Suite | Checks |
| --- | --- |
| `render-prompt.test.mjs` | 128 |
| `method.test.mjs` | 83 |
| `swarm-tools.test.mjs` | 79 |
| `gating.test.mjs` | 62 |
| `verbatim.test.mjs` | 27 |
| `skill-stamp.test.mjs` | 76 |
| **total** | **455** |

The full runner output is at the end of this report.

---

## 3. Every check

The labels below are the ones the runner printed, in the order it printed
them. The three suites I did not change in this round (`swarm-tools`,
`gating`, `verbatim`) are listed with their counts and their labels, so the
list is the whole suite.

#### `render-prompt.test.mjs`

- `coordinator: the host note is in it`
- `coordinator: the surface map is in it`
- `coordinator: the requirement handover is in it`
- `coordinator: the verification path is in it`
- `coordinator: the live capability section is in it`
- `coordinator: the coordinator lane note is in it`
- `coordinator: the whole policy is in it`
- `coordinator: the orchestration section is in it`
- `coordinator: the whole brief is in it`
- `coordinator: the capability block is in it`
- `coordinator: the worker lane note is not in it`
- `coordinator: the skill lane note is not in it`
- `coordinator: the note comes first, then the policy, then the brief`
- `worker: the worker lane note is in it`
- `worker: the policy up to section 12 is in it`
- `worker: the assignment contract is in it`
- `worker: the requirement matching section is in it`
- `worker: the requirement handover section is in it`
- `worker: the orchestration section is not in it`
- `worker: the orchestration subsections are not in it`
- `worker: the coordinator lane note is not in it`
- `worker: the surface map is not in it`
- `worker: the assignment contract body is in it`
- `worker: the matching section body is in it`
- `worker: the handover section body is in it`
- `worker: the skill sections come in the order 8, 12, 13`
- `worker: the note comes first, then the policy, then the skill`
- `gating: the todo ledger bullet is kept on a full host`
- `gating: the teammate bullet is kept on a full host`
- `gating: the session goal bullet is kept on a full host`
- `gating: the native team bullet is kept on a full host`
- `gating: the human-decision bullet is kept on a full host`
- `gating: the board bullet is kept on a full host`
- `gating: the worker skill bullet is kept on a full host`
- `gating: the todo ledger bullet survives a minimal host`
- `gating: the teammate bullet is gone on a minimal host`
- `gating: the session goal bullet is gone on a minimal host`
- `gating: the native team bullet is gone on a minimal host`
- `gating: the human-decision bullet is gone on a minimal host`
- `gating: the board bullet is gone on a minimal host`
- `gating: the worker board bullet is gone on a minimal host`
- `gating: the worker skill bullet is gone on a minimal host`
- `gating: the surface map stays in the coordinator view on a minimal host`
- `gating: no plugin marker survives in the coordinator view`
- `gating: no plugin marker survives in the worker view`
- `gating: no gating fragment survives in the coordinator view`
- `gating: no gating fragment survives in the worker view`
- `gating: a minimal host prints the absent-tool line`
- `gating: the absent-tool line names a withheld surface`
- `gating: the absent-tool line does not name a present surface`
- `gating: a full host prints no absent-tool line`
- `capabilities: the block appears exactly once in the coordinator view`
- `capabilities: the block sits inside the live-capabilities section`
- `capabilities: the block sits inside the live-capabilities section of the worker view`
- `command: the coordinator view carries the /swarm line`
- `command: the worker view carries the /swarm line`
- `command: the coordinator view hides the /swarm line by default`
- `command: the worker view hides the /swarm line by default`
- `command: the /swarm output names the craft files by their resolved paths`
- `command: the /swarm output carries no raw token`
- `idempotent: the coordinator view composes to the same bytes twice`
- `idempotent: the worker view composes to the same bytes twice`
- `not probed: the coordinator view says the registry was not probed`
- `not probed: the coordinator view keeps every bullet`
- `not probed: the worker view says the registry was not probed`
- `missing section: the composition still returns text`
- `missing section: the sections that are present are kept`
- `missing section: the missing section is named in the result`
- `craft: the coordinator view carries the craft section`
- `craft: the worker view carries the craft section`
- `craft: the coordinator view names shared.md by its resolved path`
- `craft: the worker view names shared.md by its resolved path`
- `craft: the coordinator view carries no raw {{swarm:shared}} token`
- `craft: the worker view carries no raw {{swarm:shared}} token`
- `craft: the resolved path of shared.md is a file that exists`
- `craft: the coordinator view names developer.md by its resolved path`
- `craft: the worker view names developer.md by its resolved path`
- `craft: the coordinator view carries no raw {{swarm:developer}} token`
- `craft: the worker view carries no raw {{swarm:developer}} token`
- `craft: the resolved path of developer.md is a file that exists`
- `craft: the coordinator view names tester.md by its resolved path`
- `craft: the worker view names tester.md by its resolved path`
- `craft: the coordinator view carries no raw {{swarm:tester}} token`
- `craft: the worker view carries no raw {{swarm:tester}} token`
- `craft: the resolved path of tester.md is a file that exists`
- `craft: the coordinator view names reviewer.md by its resolved path`
- `craft: the worker view names reviewer.md by its resolved path`
- `craft: the coordinator view carries no raw {{swarm:reviewer}} token`
- `craft: the worker view carries no raw {{swarm:reviewer}} token`
- `craft: the resolved path of reviewer.md is a file that exists`
- `craft: the coordinator view names python.md by its resolved path`
- `craft: the worker view names python.md by its resolved path`
- `craft: the coordinator view carries no raw {{swarm:python}} token`
- `craft: the worker view carries no raw {{swarm:python}} token`
- `craft: the resolved path of python.md is a file that exists`
- `craft: the skill was registered`
- `craft: the registered skill carries the craft section`
- `craft: the registered skill names shared.md by its resolved path`
- `craft: the registered skill carries no raw {{swarm:shared}} token`
- `craft: the registered skill names developer.md by its resolved path`
- `craft: the registered skill carries no raw {{swarm:developer}} token`
- `craft: the registered skill names tester.md by its resolved path`
- `craft: the registered skill carries no raw {{swarm:tester}} token`
- `craft: the registered skill names reviewer.md by its resolved path`
- `craft: the registered skill carries no raw {{swarm:reviewer}} token`
- `craft: the registered skill names python.md by its resolved path`
- `craft: the registered skill carries no raw {{swarm:python}} token`
- `craft: an unknown token stays visible in the worker view`
- `craft: a missing craft file yields a notice that names it`
- `craft: a missing craft file yields no path`
- `crlf: the worker view keeps the requirement handover section`
- `crlf: the worker view keeps the assignment contract section`
- `crlf: the worker view keeps the requirement matching section`
- `crlf: the worker view still cuts the orchestration section`
- `crlf: the worker view leaves no plugin marker`
- `crlf: the worker view leaves no raw token`
- `crlf: the worker view still names the craft files by their resolved paths`
- `crlf: a note with CRLF endings keeps the same sections`
- `crlf: a note with CRLF endings still names the craft files`
- `crlf: no section is reported missing`
- `crlf gate: the bullet whose tool this host has is kept`
- `crlf gate: the bullet whose tool this host lacks is dropped`
- `crlf gate: the plain neighbour survives either way`
- `crlf gate: the marker itself never reaches the view`
- `craft: the coordinator view names the registered craft skills`
- `craft: the worker view names the registered craft skills`
- `craft: the registered skill names the craft skills`
- `craft: the host registers every craft skill under the name the note names`
#### `method.test.mjs`

- `craft: shared.md ships with the bundle`
- `craft: shared.md is not empty`
- `craft: shared.md carries the top-level heading`
- `craft: shared.md carries its sections in order`
- `craft: developer.md ships with the bundle`
- `craft: developer.md is not empty`
- `craft: developer.md carries the top-level heading`
- `craft: developer.md carries its sections in order`
- `craft: tester.md ships with the bundle`
- `craft: tester.md is not empty`
- `craft: tester.md carries the top-level heading`
- `craft: tester.md carries its sections in order`
- `craft: reviewer.md ships with the bundle`
- `craft: reviewer.md is not empty`
- `craft: reviewer.md carries the top-level heading`
- `craft: reviewer.md carries its sections in order`
- `craft: python.md ships with the bundle`
- `craft: python.md is not empty`
- `craft: python.md carries the top-level heading`
- `craft: python.md carries its sections in order`
- `craft: shared section 1 says which file owns the process and which the craft`
- `craft: shared section 1 names the files a lane can read`
- `craft: shared section 1 tells a brief how to point at a piece`
- `craft: shared section 2 carries exactly the three checks 2.1 to 2.3`
- `craft: shared check 2.1 carries the three labels`
- `craft: shared check 2.2 carries the three labels`
- `craft: shared check 2.3 carries the three labels`
- `craft: shared section 3 carries exactly the twelve pieces 3.1 to 3.12`
- `craft: shared every piece carries at least one rule`
- `craft: shared section 4 carries the other stacks`
- `craft: shared section 5 says what this directory does not cover`
- `craft: developer.md section 1 says what the file owns`
- `craft: developer.md section 1 tells a brief how to point at a piece`
- `craft: every developer.md section after section 1 carries at least one rule`
- `craft: tester.md section 1 says what the file owns`
- `craft: tester.md section 1 tells a brief how to point at a piece`
- `craft: every tester.md section after section 1 carries at least one rule`
- `craft: reviewer.md section 1 says what the file owns`
- `craft: reviewer.md points into the shared craft`
- `craft: every reviewer.md section after section 1 carries at least one rule`
- `craft: the python file carries the section 0 and the nineteen numbered sections`
- `craft: every Python section carries at least one rule`
- `craft: section 0 of the python file says which file owns the idioms`
- `craft: shared.md carries no plugin marker`
- `craft: shared.md carries no gating fragment`
- `craft: shared.md carries no host prose`
- `craft: shared.md does not name the host note`
- `craft: shared.md carries no unresolved token`
- `craft: shared.md names no absolute path of any drive`
- `craft: shared.md names no D: path of this machine`
- `craft: shared.md names no C: path of this machine`
- `craft: developer.md carries no plugin marker`
- `craft: developer.md carries no gating fragment`
- `craft: developer.md carries no host prose`
- `craft: developer.md does not name the host note`
- `craft: developer.md carries no unresolved token`
- `craft: developer.md names no absolute path of any drive`
- `craft: developer.md names no D: path of this machine`
- `craft: developer.md names no C: path of this machine`
- `craft: tester.md carries no plugin marker`
- `craft: tester.md carries no gating fragment`
- `craft: tester.md carries no host prose`
- `craft: tester.md does not name the host note`
- `craft: tester.md carries no unresolved token`
- `craft: tester.md names no absolute path of any drive`
- `craft: tester.md names no D: path of this machine`
- `craft: tester.md names no C: path of this machine`
- `craft: reviewer.md carries no plugin marker`
- `craft: reviewer.md carries no gating fragment`
- `craft: reviewer.md carries no host prose`
- `craft: reviewer.md does not name the host note`
- `craft: reviewer.md carries no unresolved token`
- `craft: reviewer.md names no absolute path of any drive`
- `craft: reviewer.md names no D: path of this machine`
- `craft: reviewer.md names no C: path of this machine`
- `craft: python.md carries no plugin marker`
- `craft: python.md carries no gating fragment`
- `craft: python.md carries no host prose`
- `craft: python.md does not name the host note`
- `craft: python.md carries no unresolved token`
- `craft: python.md names no absolute path of any drive`
- `craft: python.md names no D: path of this machine`
- `craft: python.md names no C: path of this machine`
#### `swarm-tools.test.mjs`


($(System.Collections.Hashtable[1]) checks, counted by the suite itself)

#### `gating.test.mjs`

- `F4 no marker text survives`
- `F4 no fragment survives`
- `F4 a readable two-line marker keeps its bullet`
- `F4 the rest of the document survives`
- `F4b no marker text survives`
- `F4b no fragment survives`
- `F4b an unreadable marker drops its bullet`
- `F4b the rest of the document survives`
- `F4b an unclosed marker does not delete the document`
- `F4b an unclosed marker leaves no marker text`
- `V1 the host note has scope blocks`
- `V1 every scope block in the file becomes a block`
- `V1 the blocks come back in file order`
- `V1 the first block is scoped for every audience`
- `V1 one block is scoped for the coordinator only`
- `V1 one block is scoped for the worker only`
- `V1 one block is scoped for the skill only`
- `V1 the text before the first marker is not a block`
- `V1 no block carries a marker line`
- `V2 the fixture yields three blocks`
- `V2 a two-word marker yields both scopes`
- `V2 the first block carries its own text`
- `V2 the second block is scoped skill only`
- `V2 a block stops before the next marker`
- `V2 a marker with no words yields an empty scope list`
- `V2 the last block runs to the end of the file`
- `V2 the leading comment is not a block`
- `V3 a section starts with its own heading`
- `V3 a section carries the user prose under it`
- `V3 a section stops before the next section of the same level`
- `V3 the assignment contract stops before definition of success`
- `V3 the assignment contract carries its own body`
- `V3 the orchestration section starts where it was asked for`
- `V3 the orchestration section keeps its subsections`
- `V3 a section of the same level ends the one before it`
- `V3 a heading that is not there yields null`
- `V3 a title is matched without regard to case`
- `V3 a title is matched with the number prefix stripped`
- `V4 everything before the heading is kept`
- `V4 the heading itself is not included`
- `V4 the text before the first heading is kept`
- `V4 a heading that is not there yields null`
- `[host runtime] A services-before-apply registers all three primitives`
- `[host runtime] B nothing registered before the service arrives`
- `[host runtime] B the late services register their primitives`
- `[host runtime] C a late agentTeams registers only swarm_task`
- `[host runtime] D no service means no primitive`
- `[host runtime] E the prompt hides /swarm before the command exists`
- `[host runtime] E the late command registry registers the command`
- `[host runtime] E the prompt advertises /swarm once the command exists`
- `[host runtime] F3 the command output carries the /swarm line`
- `[host runtime] F3 the command output carries the probed-live header`
- `[local model] A services-before-apply registers all three primitives`
- `[local model] B nothing registered before the service arrives`
- `[local model] B the late services register their primitives`
- `[local model] C a late agentTeams registers only swarm_task`
- `[local model] D no service means no primitive`
- `[local model] E the prompt hides /swarm before the command exists`
- `[local model] E the late command registry registers the command`
- `[local model] E the prompt advertises /swarm once the command exists`
- `[local model] F3 the command output carries the /swarm line`
- `[local model] F3 the command output carries the probed-live header`
#### `verbatim.test.mjs`

- `prompt-overlay.md: no plugin marker`
- `prompt-overlay.md: no gating fragment`
- `swarm-prompt.md: no plugin marker`
- `swarm-prompt.md: no gating fragment`
- `skills/swarm-engineering/swarm-engineering.md: no plugin marker`
- `skills/swarm-engineering/swarm-engineering.md: no gating fragment`
- `prompt-overlay.md: no host name`
- `prompt-overlay.md: no host-note file name`
- `swarm-prompt.md: no host name`
- `swarm-prompt.md: no host-note file name`
- `skills/swarm-engineering/swarm-engineering.md: no host name`
- `skills/swarm-engineering/swarm-engineering.md: no host-note file name`
- `runtime-note.md: it names the host`
- `runtime-note.md: it carries scope blocks`
- `the host note is the only shipped file that carries markers (found: runtime-note.md)`
- `prompt-overlay.md: keeps the orchestration section`
- `prompt-overlay.md: keeps the policy boundaries section`
- `swarm-prompt.md: keeps the requirement rule`
- `swarm-prompt.md: keeps the brief contract`
- `skills/swarm-engineering/swarm-engineering.md: keeps the requirement handover section`
- `skills/swarm-engineering/swarm-engineering.md: keeps the requirement matching section`
- `skills/swarm-engineering/swarm-engineering.md: keeps the assignment contract section`
- `skills/swarm-engineering/swarm-engineering.md: keeps the handover citation rule`
- `skills/swarm-engineering/swarm-engineering.md: keeps the handover carrier rule`
- `skills/swarm-engineering/swarm-engineering.md: it starts with a frontmatter block`
- `skills/swarm-engineering/swarm-engineering.md: the frontmatter names the skill`
- `skills/swarm-engineering/swarm-engineering.md: the frontmatter carries a description`
#### `skill-stamp.test.mjs`

- `the bundle registers the skill when it is applied`
- `the registered skills carry their names in the order they are registered`
- `the registered skill keeps the name from the file`
- `the registered skill names this host in its catalog line`
- `the catalog line keeps the user's own description byte for byte`
- `the registered content carries the note's skill block`
- `the registered content carries the user's skill body`
- `the registered content leaves the coordinator's note out`
- `the registered content leaves the worker's note out`
- `the registered content is the body, not the frontmatter`
- `the swarm-engineering/shared.md registration carries its own body`
- `the swarm-engineering/shared.md registration carries the note's skill block`
- `the swarm-engineering/shared.md registration starts with the note's first block`
- `the swarm-engineering/shared.md registration names this host in its catalog line`
- `the swarm-engineering/shared.md catalog line keeps the file's own description byte for byte`
- `the swarm-engineering/shared.md registration carries the whenToUse from the file`
- `the swarm-engineering/shared.md registration carries the bundle as its source`
- `the swarm-engineering/shared.md registration does not leak its frontmatter into the content`
- `the swarm-engineering/developer.md registration carries its own body`
- `the swarm-engineering/developer.md registration carries the note's skill block`
- `the swarm-engineering/developer.md registration starts with the note's first block`
- `the swarm-engineering/developer.md registration names this host in its catalog line`
- `the swarm-engineering/developer.md catalog line keeps the file's own description byte for byte`
- `the swarm-engineering/developer.md registration carries the whenToUse from the file`
- `the swarm-engineering/developer.md registration carries the bundle as its source`
- `the swarm-engineering/developer.md registration does not leak its frontmatter into the content`
- `the swarm-engineering/tester.md registration carries its own body`
- `the swarm-engineering/tester.md registration carries the note's skill block`
- `the swarm-engineering/tester.md registration starts with the note's first block`
- `the swarm-engineering/tester.md registration names this host in its catalog line`
- `the swarm-engineering/tester.md catalog line keeps the file's own description byte for byte`
- `the swarm-engineering/tester.md registration carries the whenToUse from the file`
- `the swarm-engineering/tester.md registration carries the bundle as its source`
- `the swarm-engineering/tester.md registration does not leak its frontmatter into the content`
- `the swarm-engineering/reviewer.md registration carries its own body`
- `the swarm-engineering/reviewer.md registration carries the note's skill block`
- `the swarm-engineering/reviewer.md registration starts with the note's first block`
- `the swarm-engineering/reviewer.md registration names this host in its catalog line`
- `the swarm-engineering/reviewer.md catalog line keeps the file's own description byte for byte`
- `the swarm-engineering/reviewer.md registration carries the whenToUse from the file`
- `the swarm-engineering/reviewer.md registration carries the bundle as its source`
- `the swarm-engineering/reviewer.md registration does not leak its frontmatter into the content`
- `the swarm-engineering/languages/python.md registration carries its own body`
- `the swarm-engineering/languages/python.md registration carries the note's skill block`
- `the swarm-engineering/languages/python.md registration starts with the note's first block`
- `the swarm-engineering/languages/python.md registration names this host in its catalog line`
- `the swarm-engineering/languages/python.md catalog line keeps the file's own description byte for byte`
- `the swarm-engineering/languages/python.md registration carries the whenToUse from the file`
- `the swarm-engineering/languages/python.md registration carries the bundle as its source`
- `the swarm-engineering/languages/python.md registration does not leak its frontmatter into the content`
- `a change to runtime-note.md alone re-registers the skills`
- `the re-registered skill carries the changed note`
- `the re-registered skill keeps the user's body`
- `the previous registrations are disposed when the skills are re-registered`
- `the disposed registrations are the first ones`
- `a change to the skill file alone re-registers the skills`
- `the re-registered skill carries the changed body`
- `the re-registered skill keeps the changed note`
- `the second round of registrations is disposed as well`
- `a change to a craft file alone re-registers the skills`
- `the re-registered craft file carries the changed body`
- `the re-registered craft file keeps its name`
- `the third round of registrations is disposed as well`
- `a change to a craft file's frontmatter re-registers the skills`
- `the re-registered description carries the edited description`
- `the re-registered description still names this host`
- `the re-registered content still carries the unedited body`
- `the re-registered content starts with the note's first block`
- `the edited frontmatter does not leak into the content`
- `the fourth round of registrations is disposed as well`
- `a change to the policy alone does not re-register the skills`
- `the shipped runtime note does not carry the sandbox edit`
- `the shipped skill file does not carry the sandbox edit`
- `the shipped policy does not carry the sandbox edit`
- `the shipped craft file does not carry the sandbox edit`
- `the shipped tester craft file does not carry the sandbox edit`

---

## 4. The requirement verdicts

A verdict without evidence is `not demonstrated`, so every line carries the
run or the proof it rests on.

| # | Requirement | Verdict | Evidence |
| --- | --- | --- | --- |
| R1 | Five craft files ship under `skills/swarm-engineering/`, each with the sections its design names | **met** | `method.test.mjs`: 20 checks (ships, not empty, top heading, sections in order) over the five files — all green in the run of §2 |
| R2 | `shared.md` carries the three checks 2.1–2.3, each with `**The principle.**`, `**In practice.**`, `**How you show it.**` | **met** | `craft: shared section 2 carries exactly the three checks 2.1 to 2.3` and the three per-check label checks — green |
| R3 | `shared.md` carries the twelve pieces 3.1–3.12, each with at least one rule | **met** | `craft: shared section 3 carries exactly the twelve pieces 3.1 to 3.12` and `craft: shared every piece carries at least one rule` — green; proof 03 turns both red |
| R4 | `shared.md` §4 names the other stacks and §5 says what the directory does not cover | **met** | `craft: shared section 4 carries the other stacks`, `craft: shared section 5 says what this directory does not cover` — green |
| R5 | Each role file says what it owns, names the shared craft and carries at least one rule per section | **met** | 9 checks over `developer.md`, `tester.md`, `reviewer.md` — green; proof 04 turns two of them red |
| R6 | `languages/python.md` carries §0 and the nineteen numbered sections, each with at least one rule | **met** | `craft: the python file carries the section 0 and the nineteen numbered sections`, `craft: every Python section carries at least one rule`, `craft: section 0 of the python file says which file owns the idioms` — green; proof 05 turns three of them red |
| R7 | Every craft file is host-neutral and portable | **met** | 40 checks (8 per file: no plugin marker, no gating fragment, no host prose, no `runtime-note`, no unresolved token, no absolute path of any drive, no `D:\`, no `C:\`) — green; proof 09 turns five of them red |
| R8 | The note names the five files with the five tokens, and both views carry `## The craft guidance on this host` | **met** | `craft: the coordinator view carries the craft section`, `craft: the worker view carries the craft section`, `craft: the registered skill carries the craft section` — green; proofs 11 and 12 turn them red |
| R9 | Each token resolves to the absolute path of the file that ships with the loaded bundle | **met** | 10 path checks over the two views + 5 over the registered skill, each requiring the exact resolved path **and** a line that ends with the file name and is absolute; `craft: the resolved path of <file> is a file that exists` ×5 — green; proof 01 turns all of them red |
| R10 | No token survives into a composed prompt (Coordinator, worker or skill) | **met** | 20 token checks (`carries no raw {{swarm:<name>}} token`) — green; proof 02 turns all of them red |
| R11 | A token the bundle does not know stays visible as written | **met** | `craft: an unknown token stays visible in the worker view` — green; proof 08 turns it red |
| R12 | A missing craft file yields the notice that names it, and no path that opens nothing | **met** | `craft: a missing craft file yields a notice that names it`, `craft: a missing craft file yields no path` — green; proof 07 turns both red |
| R13 | `/swarm` names the craft files by their resolved paths, and carries no raw token | **met** | `command: the /swarm output names the craft files by their resolved paths`, `command: the /swarm output carries no raw token` — green; proof 10 turns the first red |
| R14 | The five craft files are registered as skills of their own, under the names the note names | **met** | `craft: the coordinator view names the registered craft skills`, `craft: the worker view names the registered craft skills`, `craft: the registered skill names the craft skills`, `craft: the host registers every craft skill under the name the note names` — green |
| R15 | The registered description is the host note in front of the file's own description; the content is the note's skill blocks plus the body with the frontmatter stripped; `whenToUse` comes from the frontmatter | **met** | `skill-stamp.test.mjs`: 8 checks per craft file (body, note block, first block, host-note prefix, description byte for byte, `whenToUse`, source, no frontmatter leak) — green |
| R16 | The stamp covers the note, the skill file and all five craft files; the skills are disposed and registered again when any of them changes | **met** | the four rounds of `skill-stamp.test.mjs` (6 → 12 → 18 → 24 → 30 registrations) and the disposed counts (6/12/18/24) — green; proof 14 shows the frontmatter round is a real check |
| R17 | A CRLF checkout still composes: the worker's sections survive, the orchestration section is still cut, no marker or token survives | **met** | the ten `crlf:` checks — green; proof 06 turns five of them red |
| R18 | The CRLF gate keeps a bullet whose tool the host has, drops one whose tool it lacks, and keeps the plain neighbour | **met** | the four `crlf gate:` checks — green; proof 13 turns one of them red and the gating suite goes red too |
| R19 | The old contract (root `methodology.md`, the two-file layout) is superseded and the suites no longer reference it | **met** | `grep` over `test/`: no reference to `methodology.md`, `craft-methodology.md` or `craft-python.md`; the file `skills/craft-methodology.md` is an orphan the bundle does not reference either |
| R20 | The README wording for the test description | **not in scope** | the README is the Lead's file. The exact sentence I would add is in §7 of this report |

---

## 5. The discrimination proofs

A check that has never failed is not a check. Every proof below was run on a
**throwaway copy** of the whole bundle at `%TEMP%\swarm-method-probe` (the
repository was never modified); the copy was restored from the pristine source
before each proof, and the copy and the proof outputs were deleted afterwards.

The runner was the same one the repository uses:

```
$env:ELECTRON_RUN_AS_NODE="1"; & "D:\software\dsh\DeepSeek Harness.exe" "<copy>\test\run.mjs"
```

**Baseline of the copy, unmodified:** `ALL SUITES PASSED (6)`.

### Proof 01 —the five tokens in ``runtime-note.md`` are replaced with plain text, so no token is resolved into a path

```
FAIL  craft: the coordinator view names shared.md by its resolved path
FAIL  craft: the worker view names shared.md by its resolved path
FAIL  craft: the coordinator view names developer.md by its resolved path
FAIL  craft: the worker view names developer.md by its resolved path
FAIL  craft: the coordinator view names tester.md by its resolved path
FAIL  craft: the worker view names tester.md by its resolved path
FAIL  craft: the coordinator view names reviewer.md by its resolved path
FAIL  craft: the worker view names reviewer.md by its resolved path
FAIL  craft: the coordinator view names python.md by its resolved path
FAIL  craft: the worker view names python.md by its resolved path
FAIL  craft: the registered skill names shared.md by its resolved path
FAIL  craft: the registered skill names developer.md by its resolved path
FAIL  craft: the registered skill names tester.md by its resolved path
FAIL  craft: the registered skill names reviewer.md by its resolved path
FAIL  craft: the registered skill names python.md by its resolved path
FAIL  craft: an unknown token stays visible in the worker view
FAIL  craft: a missing craft file yields a notice that names it
FAIL  crlf: the worker view still names the craft files by their resolved paths
FAIL  crlf: a note with CRLF endings still names the craft files
19 CHECK(S) FAILED
SUITE FAILED: render-prompt.test.mjs (exit 1)
```

### Proof 02 —``resolveNote`` hands the note back untouched (``return raw``), so the tokens reach the prompt as written

```
FAIL  gating: no plugin marker survives in the coordinator view
FAIL  gating: no plugin marker survives in the worker view
FAIL  craft: the coordinator view names shared.md by its resolved path
FAIL  craft: the worker view names shared.md by its resolved path
FAIL  craft: the coordinator view carries no raw {{swarm:shared}} token
FAIL  craft: the worker view carries no raw {{swarm:shared}} token
FAIL  craft: the coordinator view names developer.md by its resolved path
FAIL  craft: the worker view names developer.md by its resolved path
FAIL  craft: the coordinator view carries no raw {{swarm:developer}} token
FAIL  craft: the worker view carries no raw {{swarm:developer}} token
FAIL  craft: the coordinator view names tester.md by its resolved path
FAIL  craft: the worker view names tester.md by its resolved path
FAIL  craft: the coordinator view carries no raw {{swarm:tester}} token
FAIL  craft: the worker view carries no raw {{swarm:tester}} token
FAIL  craft: the coordinator view names reviewer.md by its resolved path
FAIL  craft: the worker view names reviewer.md by its resolved path
FAIL  craft: the coordinator view carries no raw {{swarm:reviewer}} token
FAIL  craft: the worker view carries no raw {{swarm:reviewer}} token
FAIL  craft: the coordinator view names python.md by its resolved path
FAIL  craft: the worker view names python.md by its resolved path
FAIL  craft: the coordinator view carries no raw {{swarm:python}} token
FAIL  craft: the worker view carries no raw {{swarm:python}} token
FAIL  craft: the registered skill names shared.md by its resolved path
FAIL  craft: the registered skill carries no raw {{swarm:shared}} token
FAIL  craft: the registered skill names developer.md by its resolved path
FAIL  craft: the registered skill carries no raw {{swarm:developer}} token
FAIL  craft: the registered skill names tester.md by its resolved path
FAIL  craft: the registered skill carries no raw {{swarm:tester}} token
FAIL  craft: the registered skill names reviewer.md by its resolved path
FAIL  craft: the registered skill carries no raw {{swarm:reviewer}} token
FAIL  craft: the registered skill names python.md by its resolved path
FAIL  craft: the registered skill carries no raw {{swarm:python}} token
FAIL  craft: a missing craft file yields a notice that names it
FAIL  crlf: the worker view leaves no plugin marker
FAIL  crlf: the worker view leaves no raw token
FAIL  crlf: the worker view still names the craft files by their resolved paths
FAIL  crlf: a note with CRLF endings still names the craft files
37 CHECK(S) FAILED
SUITE FAILED: render-prompt.test.mjs (exit 1)
```

### Proof 03 —the heading ``### 3.5 State, data and its shape`` is deleted from ``skills/swarm-engineering/shared.md``

```
FAIL  craft: shared section 3 carries exactly the twelve pieces 3.1 to 3.12
FAIL  craft: shared every piece carries at least one rule
2 CHECK(S) FAILED
SUITE FAILED: method.test.mjs (exit 1)
```

### Proof 04 —the heading ``## 5. Prove the check can fail`` is deleted from ``skills/swarm-engineering/tester.md``, so the role file loses a section

```
FAIL  craft: tester.md carries its sections in order
FAIL  craft: every tester.md section after section 1 carries at least one rule
2 CHECK(S) FAILED
SUITE FAILED: method.test.mjs (exit 1)
```

### Proof 05 —the heading ``## 6. Errors`` is deleted from ``skills/swarm-engineering/languages/python.md``, so the Python file loses a section

```
FAIL  craft: python.md carries its sections in order
FAIL  craft: the python file carries the section 0 and the nineteen numbered sections
FAIL  craft: every Python section carries at least one rule
3 CHECK(S) FAILED
SUITE FAILED: method.test.mjs (exit 1)
```

### Proof 06 —the CRLF fix in ``index.js`` is reverted: ``const HEADING = /^(#{1,6})\s+(.+?)\s*$/`` becomes ``/^(#{1,6})\s+(.+)$/``

```
FAIL  crlf: the worker view keeps the requirement handover section
FAIL  crlf: the worker view keeps the assignment contract section
FAIL  crlf: the worker view keeps the requirement matching section
FAIL  crlf: a note with CRLF endings keeps the same sections
FAIL  crlf: no section is reported missing
5 CHECK(S) FAILED
SUITE FAILED: render-prompt.test.mjs (exit 1)
```

### Proof 07 —the guard in ``bundlePointer`` is dropped, so a missing craft file yields a path instead of the notice

```
FAIL  craft: a missing craft file yields a notice that names it
FAIL  craft: a missing craft file yields no path
2 CHECK(S) FAILED
SUITE FAILED: render-prompt.test.mjs (exit 1)
```

### Proof 08 —an unknown token is swallowed: ``if (!relativePath) return match`` becomes ``return bundlePointer(CRAFT_FILES.shared)``

```
FAIL  craft: the coordinator view names developer.md by its resolved path
FAIL  craft: the worker view names developer.md by its resolved path
FAIL  craft: the coordinator view names tester.md by its resolved path
FAIL  craft: the worker view names tester.md by its resolved path
FAIL  craft: the coordinator view names reviewer.md by its resolved path
FAIL  craft: the worker view names reviewer.md by its resolved path
FAIL  craft: the coordinator view names python.md by its resolved path
FAIL  craft: the worker view names python.md by its resolved path
FAIL  craft: the registered skill names developer.md by its resolved path
FAIL  craft: the registered skill names tester.md by its resolved path
FAIL  craft: the registered skill names reviewer.md by its resolved path
FAIL  craft: the registered skill names python.md by its resolved path
FAIL  craft: an unknown token stays visible in the worker view
FAIL  craft: a missing craft file yields a notice that names it
FAIL  crlf: the worker view still names the craft files by their resolved paths
FAIL  crlf: a note with CRLF endings still names the craft files
16 CHECK(S) FAILED
SUITE FAILED: render-prompt.test.mjs (exit 1)
```

### Proof 09 —host facts are injected into ``skills/swarm-engineering/shared.md``: a plugin marker, the host name, ``runtime-note.md`` and a ``D:\`` path

```
FAIL  craft: shared.md carries no plugin marker
FAIL  craft: shared.md carries no host prose
FAIL  craft: shared.md does not name the host note
FAIL  craft: shared.md names no absolute path of any drive
FAIL  craft: shared.md names no D: path of this machine
5 CHECK(S) FAILED
SUITE FAILED: method.test.mjs (exit 1)
```

### Proof 10 —the ``/swarm`` output stops naming the craft files (the five ``bundlePointer`` calls are replaced by words)

```
FAIL  command: the /swarm output names the craft files by their resolved paths
1 CHECK(S) FAILED
SUITE FAILED: render-prompt.test.mjs (exit 1)
```

### Proof 11 —the craft heading in the note is renamed: ``## The craft guidance on this host`` becomes ``## The craft files on this host``

```
FAIL  craft: the coordinator view carries the craft section
FAIL  craft: the worker view carries the craft section
FAIL  craft: the registered skill carries the craft section
3 CHECK(S) FAILED
SUITE FAILED: render-prompt.test.mjs (exit 1)
```

### Proof 12 —the craft block is narrowed to the Coordinator: its scope marker becomes ``<!-- swarm:note coordinator -->``

```
FAIL  craft: the worker view carries the craft section
FAIL  craft: the worker view names shared.md by its resolved path
FAIL  craft: the worker view names developer.md by its resolved path
FAIL  craft: the worker view names tester.md by its resolved path
FAIL  craft: the worker view names reviewer.md by its resolved path
FAIL  craft: the worker view names python.md by its resolved path
FAIL  craft: the registered skill carries the craft section
FAIL  craft: the registered skill names shared.md by its resolved path
FAIL  craft: the registered skill names developer.md by its resolved path
FAIL  craft: the registered skill names tester.md by its resolved path
FAIL  craft: the registered skill names reviewer.md by its resolved path
FAIL  craft: the registered skill names python.md by its resolved path
FAIL  crlf: the worker view still names the craft files by their resolved paths
FAIL  crlf: a note with CRLF endings still names the craft files
FAIL  craft: the registered skill names the craft skills
15 CHECK(S) FAILED
SUITE FAILED: render-prompt.test.mjs (exit 1)
```

### Proof 13 —the gate stops dropping unsatisfied bullets: ``isLineSatisfied`` returns true for every line

```
FAIL  gating: the teammate bullet is gone on a minimal host
FAIL  gating: the session goal bullet is gone on a minimal host
FAIL  gating: the native team bullet is gone on a minimal host
FAIL  gating: the human-decision bullet is gone on a minimal host
FAIL  gating: the board bullet is gone on a minimal host
FAIL  gating: the worker board bullet is gone on a minimal host
FAIL  gating: the worker skill bullet is gone on a minimal host
FAIL  crlf gate: the bullet whose tool this host lacks is dropped
8 CHECK(S) FAILED
SUITE FAILED: render-prompt.test.mjs (exit 1)
FAIL F4b an unreadable marker drops its bullet -> true (expected false)
1 CHECK(S) FAILED
SUITE FAILED: gating.test.mjs (exit 1)
```

### Proof 14 —``skills/swarm-engineering/tester.md`` loses its frontmatter, so the registration falls back to the plugin's default description

```
FAIL the swarm-engineering/tester.md catalog line keeps the file's own description byte for byte -> false (expected true)
FAIL the swarm-engineering/tester.md registration carries the whenToUse from the file -> "Use in a swarm lane that works on code: the craft guidance for the role in play." (expected undefined)
FAIL the re-registered description carries the edited description -> false (expected true)
3 CHECK(S) FAILED
SUITE FAILED: skill-stamp.test.mjs (exit 1)
```


---

## 6. What I did not check

* **The craft guidance's own quality.** The suites check the shape of the
  craft files (their sections, their labels, their rules) and that they stay
  host-neutral. They cannot say whether the advice inside them is good.
* **The other stacks in `shared.md` §4.** The suite checks that TypeScript, Go,
  Rust and Java are named; it does not check what those blocks say, and it
  does not check C#, Ruby or Shell.
* **The wording of the note's craft block** beyond the heading, the tokens and
  the scope marker. The bullets around them are the Lead's text and are not
  asserted.
* **The `whenToUse` of the main `swarm-engineering` skill** is a constant in
  `index.js`; the suite checks that the craft files' `whenToUse` comes from
  their frontmatter, not that the main skill's text is the one the Lead wants.
* **The live host.** The suites run against a local model of the host's
  service semantics (`test/lib/cordis-model.mjs`). The `gating.test.mjs` suite
  also runs against the real runtime when the machine has one, but on this
  machine that part is the `host-cordis` path, not a live DSH session.
* **A checkout with `core.autocrlf` on.** The CRLF checks build CRLF copies of
  the files in memory; they do not check out the repository with CRLF endings.
* **The `package.json` `exports` and `files` entries for the craft files.**
  Those are the Lead's file; the suite checks that the files ship in the
  working tree, not that the published package carries them.
* **Performance.** No suite measures how long the composition takes.

---

## 7. The README sentence

The README's `## Tests` section is the Lead's file. This is the exact
sentence I would add to the test description paragraph, after the sentence
that names `method.test.mjs`:

> The `method.test.mjs` suite also reads the craft files themselves: it
> asserts that each of the five still carries the sections, the three checks,
> the twelve shared pieces and the nineteen Python sections its design names,
> and that every one of them stays host-neutral — no plugin marker, no host
> name, no machine path.

---

## 8. The full runner output

```

=== render-prompt.test.mjs ===
ok    coordinator: the host note is in it
ok    coordinator: the surface map is in it
ok    coordinator: the requirement handover is in it
ok    coordinator: the verification path is in it
ok    coordinator: the live capability section is in it
ok    coordinator: the coordinator lane note is in it
ok    coordinator: the whole policy is in it
ok    coordinator: the orchestration section is in it
ok    coordinator: the whole brief is in it
ok    coordinator: the capability block is in it
ok    coordinator: the worker lane note is not in it
ok    coordinator: the skill lane note is not in it
ok    coordinator: the note comes first, then the policy, then the brief
ok    worker: the worker lane note is in it
ok    worker: the policy up to section 12 is in it
ok    worker: the assignment contract is in it
ok    worker: the requirement matching section is in it
ok    worker: the requirement handover section is in it
ok    worker: the orchestration section is not in it
ok    worker: the orchestration subsections are not in it
ok    worker: the coordinator lane note is not in it
ok    worker: the surface map is not in it
ok    worker: the assignment contract body is in it
ok    worker: the matching section body is in it
ok    worker: the handover section body is in it
ok    worker: the skill sections come in the order 8, 12, 13
ok    worker: the note comes first, then the policy, then the skill
ok    gating: the todo ledger bullet is kept on a full host
ok    gating: the teammate bullet is kept on a full host
ok    gating: the session goal bullet is kept on a full host
ok    gating: the native team bullet is kept on a full host
ok    gating: the human-decision bullet is kept on a full host
ok    gating: the board bullet is kept on a full host
ok    gating: the worker skill bullet is kept on a full host
ok    gating: the todo ledger bullet survives a minimal host
ok    gating: the teammate bullet is gone on a minimal host
ok    gating: the session goal bullet is gone on a minimal host
ok    gating: the native team bullet is gone on a minimal host
ok    gating: the human-decision bullet is gone on a minimal host
ok    gating: the board bullet is gone on a minimal host
ok    gating: the worker board bullet is gone on a minimal host
ok    gating: the worker skill bullet is gone on a minimal host
ok    gating: the surface map stays in the coordinator view on a minimal host
ok    gating: no plugin marker survives in the coordinator view
ok    gating: no plugin marker survives in the worker view
ok    gating: no gating fragment survives in the coordinator view
ok    gating: no gating fragment survives in the worker view
ok    gating: a minimal host prints the absent-tool line
ok    gating: the absent-tool line names a withheld surface
ok    gating: the absent-tool line does not name a present surface
ok    gating: a full host prints no absent-tool line
ok    capabilities: the block appears exactly once in the coordinator view
ok    capabilities: the block sits inside the live-capabilities section
ok    capabilities: the block sits inside the live-capabilities section of the worker view
ok    command: the coordinator view carries the /swarm line
ok    command: the worker view carries the /swarm line
ok    command: the coordinator view hides the /swarm line by default
ok    command: the worker view hides the /swarm line by default
ok    command: the /swarm output names the craft files by their resolved paths
ok    command: the /swarm output carries no raw token
ok    idempotent: the coordinator view composes to the same bytes twice
ok    idempotent: the worker view composes to the same bytes twice
ok    not probed: the coordinator view says the registry was not probed
ok    not probed: the coordinator view keeps every bullet
ok    not probed: the worker view says the registry was not probed
ok    missing section: the composition still returns text
ok    missing section: the sections that are present are kept
ok    missing section: the missing section is named in the result
ok    craft: the coordinator view carries the craft section
ok    craft: the worker view carries the craft section
ok    craft: the coordinator view names shared.md by its resolved path
ok    craft: the worker view names shared.md by its resolved path
ok    craft: the coordinator view carries no raw {{swarm:shared}} token
ok    craft: the worker view carries no raw {{swarm:shared}} token
ok    craft: the resolved path of shared.md is a file that exists
ok    craft: the coordinator view names developer.md by its resolved path
ok    craft: the worker view names developer.md by its resolved path
ok    craft: the coordinator view carries no raw {{swarm:developer}} token
ok    craft: the worker view carries no raw {{swarm:developer}} token
ok    craft: the resolved path of developer.md is a file that exists
ok    craft: the coordinator view names tester.md by its resolved path
ok    craft: the worker view names tester.md by its resolved path
ok    craft: the coordinator view carries no raw {{swarm:tester}} token
ok    craft: the worker view carries no raw {{swarm:tester}} token
ok    craft: the resolved path of tester.md is a file that exists
ok    craft: the coordinator view names reviewer.md by its resolved path
ok    craft: the worker view names reviewer.md by its resolved path
ok    craft: the coordinator view carries no raw {{swarm:reviewer}} token
ok    craft: the worker view carries no raw {{swarm:reviewer}} token
ok    craft: the resolved path of reviewer.md is a file that exists
ok    craft: the coordinator view names python.md by its resolved path
ok    craft: the worker view names python.md by its resolved path
ok    craft: the coordinator view carries no raw {{swarm:python}} token
ok    craft: the worker view carries no raw {{swarm:python}} token
ok    craft: the resolved path of python.md is a file that exists
ok    craft: the skill was registered
ok    craft: the registered skill carries the craft section
ok    craft: the registered skill names shared.md by its resolved path
ok    craft: the registered skill carries no raw {{swarm:shared}} token
ok    craft: the registered skill names developer.md by its resolved path
ok    craft: the registered skill carries no raw {{swarm:developer}} token
ok    craft: the registered skill names tester.md by its resolved path
ok    craft: the registered skill carries no raw {{swarm:tester}} token
ok    craft: the registered skill names reviewer.md by its resolved path
ok    craft: the registered skill carries no raw {{swarm:reviewer}} token
ok    craft: the registered skill names python.md by its resolved path
ok    craft: the registered skill carries no raw {{swarm:python}} token
ok    craft: an unknown token stays visible in the worker view
ok    craft: a missing craft file yields a notice that names it
ok    craft: a missing craft file yields no path
ok    crlf: the worker view keeps the requirement handover section
ok    crlf: the worker view keeps the assignment contract section
ok    crlf: the worker view keeps the requirement matching section
ok    crlf: the worker view still cuts the orchestration section
ok    crlf: the worker view leaves no plugin marker
ok    crlf: the worker view leaves no raw token
ok    crlf: the worker view still names the craft files by their resolved paths
ok    crlf: a note with CRLF endings keeps the same sections
ok    crlf: a note with CRLF endings still names the craft files
ok    crlf: no section is reported missing
ok    crlf gate: the bullet whose tool this host has is kept
ok    crlf gate: the bullet whose tool this host lacks is dropped
ok    crlf gate: the plain neighbour survives either way
ok    crlf gate: the marker itself never reaches the view
ok    craft: the coordinator view names the registered craft skills
ok    craft: the worker view names the registered craft skills
ok    craft: the registered skill names the craft skills
ok    craft: the host registers every craft skill under the name the note names
ALL CHECKS PASSED

=== method.test.mjs ===
ok    craft: shared.md ships with the bundle
ok    craft: shared.md is not empty
ok    craft: shared.md carries the top-level heading
ok    craft: shared.md carries its sections in order
ok    craft: developer.md ships with the bundle
ok    craft: developer.md is not empty
ok    craft: developer.md carries the top-level heading
ok    craft: developer.md carries its sections in order
ok    craft: tester.md ships with the bundle
ok    craft: tester.md is not empty
ok    craft: tester.md carries the top-level heading
ok    craft: tester.md carries its sections in order
ok    craft: reviewer.md ships with the bundle
ok    craft: reviewer.md is not empty
ok    craft: reviewer.md carries the top-level heading
ok    craft: reviewer.md carries its sections in order
ok    craft: python.md ships with the bundle
ok    craft: python.md is not empty
ok    craft: python.md carries the top-level heading
ok    craft: python.md carries its sections in order
ok    craft: shared section 1 says which file owns the process and which the craft
ok    craft: shared section 1 names the files a lane can read
ok    craft: shared section 1 tells a brief how to point at a piece
ok    craft: shared section 2 carries exactly the three checks 2.1 to 2.3
ok    craft: shared check 2.1 carries the three labels
ok    craft: shared check 2.2 carries the three labels
ok    craft: shared check 2.3 carries the three labels
ok    craft: shared section 3 carries exactly the twelve pieces 3.1 to 3.12
ok    craft: shared every piece carries at least one rule
ok    craft: shared section 4 carries the other stacks
ok    craft: shared section 5 says what this directory does not cover
ok    craft: developer.md section 1 says what the file owns
ok    craft: developer.md section 1 tells a brief how to point at a piece
ok    craft: every developer.md section after section 1 carries at least one rule
ok    craft: tester.md section 1 says what the file owns
ok    craft: tester.md section 1 tells a brief how to point at a piece
ok    craft: every tester.md section after section 1 carries at least one rule
ok    craft: reviewer.md section 1 says what the file owns
ok    craft: reviewer.md points into the shared craft
ok    craft: every reviewer.md section after section 1 carries at least one rule
ok    craft: the python file carries the section 0 and the nineteen numbered sections
ok    craft: every Python section carries at least one rule
ok    craft: section 0 of the python file says which file owns the idioms
ok    craft: shared.md carries no plugin marker
ok    craft: shared.md carries no gating fragment
ok    craft: shared.md carries no host prose
ok    craft: shared.md does not name the host note
ok    craft: shared.md carries no unresolved token
ok    craft: shared.md names no absolute path of any drive
ok    craft: shared.md names no D: path of this machine
ok    craft: shared.md names no C: path of this machine
ok    craft: developer.md carries no plugin marker
ok    craft: developer.md carries no gating fragment
ok    craft: developer.md carries no host prose
ok    craft: developer.md does not name the host note
ok    craft: developer.md carries no unresolved token
ok    craft: developer.md names no absolute path of any drive
ok    craft: developer.md names no D: path of this machine
ok    craft: developer.md names no C: path of this machine
ok    craft: tester.md carries no plugin marker
ok    craft: tester.md carries no gating fragment
ok    craft: tester.md carries no host prose
ok    craft: tester.md does not name the host note
ok    craft: tester.md carries no unresolved token
ok    craft: tester.md names no absolute path of any drive
ok    craft: tester.md names no D: path of this machine
ok    craft: tester.md names no C: path of this machine
ok    craft: reviewer.md carries no plugin marker
ok    craft: reviewer.md carries no gating fragment
ok    craft: reviewer.md carries no host prose
ok    craft: reviewer.md does not name the host note
ok    craft: reviewer.md carries no unresolved token
ok    craft: reviewer.md names no absolute path of any drive
ok    craft: reviewer.md names no D: path of this machine
ok    craft: reviewer.md names no C: path of this machine
ok    craft: python.md carries no plugin marker
ok    craft: python.md carries no gating fragment
ok    craft: python.md carries no host prose
ok    craft: python.md does not name the host note
ok    craft: python.md carries no unresolved token
ok    craft: python.md names no absolute path of any drive
ok    craft: python.md names no D: path of this machine
ok    craft: python.md names no C: path of this machine
ALL CHECKS PASSED

=== swarm-tools.test.mjs ===
ALL CHECKS PASSED (79)

=== gating.test.mjs ===
PASS F4 no marker text survives -> false
PASS F4 no fragment survives -> false
PASS F4 a readable two-line marker keeps its bullet -> true
PASS F4 the rest of the document survives -> true
PASS F4b no marker text survives -> false
PASS F4b no fragment survives -> false
PASS F4b an unreadable marker drops its bullet -> false
PASS F4b the rest of the document survives -> true
PASS F4b an unclosed marker does not delete the document -> true
PASS F4b an unclosed marker leaves no marker text -> false
PASS V1 the host note has scope blocks -> true
PASS V1 every scope block in the file becomes a block -> 11
PASS V1 the blocks come back in file order -> true
PASS V1 the first block is scoped for every audience -> true
PASS V1 one block is scoped for the coordinator only -> true
PASS V1 one block is scoped for the worker only -> true
PASS V1 one block is scoped for the skill only -> true
PASS V1 the text before the first marker is not a block -> true
PASS V1 no block carries a marker line -> true
PASS V2 the fixture yields three blocks -> 3
PASS V2 a two-word marker yields both scopes -> ["coordinator","worker"]
PASS V2 the first block carries its own text -> true
PASS V2 the second block is scoped skill only -> ["skill"]
PASS V2 a block stops before the next marker -> true
PASS V2 a marker with no words yields an empty scope list -> []
PASS V2 the last block runs to the end of the file -> true
PASS V2 the leading comment is not a block -> true
PASS V3 a section starts with its own heading -> true
PASS V3 a section carries the user prose under it -> true
PASS V3 a section stops before the next section of the same level -> true
PASS V3 the assignment contract stops before definition of success -> true
PASS V3 the assignment contract carries its own body -> true
PASS V3 the orchestration section starts where it was asked for -> true
PASS V3 the orchestration section keeps its subsections -> true
PASS V3 a section of the same level ends the one before it -> true
PASS V3 a heading that is not there yields null -> null
PASS V3 a title is matched without regard to case -> true
PASS V3 a title is matched with the number prefix stripped -> true
PASS V4 everything before the heading is kept -> true
PASS V4 the heading itself is not included -> true
PASS V4 the text before the first heading is kept -> true
PASS V4 a heading that is not there yields null -> null
host runtime: file:///D:/software/dsh/resources/app.asar/node_modules/@deepseek-ai/cordis/lib/index.js
PASS [host runtime] A services-before-apply registers all three primitives -> ["swarm_child","swarm_task","swarm_worktree"]
PASS [host runtime] B nothing registered before the service arrives -> []
PASS [host runtime] B the late services register their primitives -> ["swarm_child","swarm_task","swarm_worktree"]
PASS [host runtime] C a late agentTeams registers only swarm_task -> ["swarm_task"]
PASS [host runtime] D no service means no primitive -> []
PASS [host runtime] E the prompt hides /swarm before the command exists -> false
PASS [host runtime] E the late command registry registers the command -> ["swarm"]
PASS [host runtime] E the prompt advertises /swarm once the command exists -> true
PASS [host runtime] F3 the command output carries the /swarm line -> true
PASS [host runtime] F3 the command output carries the probed-live header -> true
PASS [local model] A services-before-apply registers all three primitives -> ["swarm_child","swarm_task","swarm_worktree"]
PASS [local model] B nothing registered before the service arrives -> []
PASS [local model] B the late services register their primitives -> ["swarm_child","swarm_task","swarm_worktree"]
PASS [local model] C a late agentTeams registers only swarm_task -> ["swarm_task"]
PASS [local model] D no service means no primitive -> []
PASS [local model] E the prompt hides /swarm before the command exists -> false
PASS [local model] E the late command registry registers the command -> ["swarm"]
PASS [local model] E the prompt advertises /swarm once the command exists -> true
PASS [local model] F3 the command output carries the /swarm line -> true
PASS [local model] F3 the command output carries the probed-live header -> true
ALL CHECKS PASSED

=== verbatim.test.mjs ===
ok    prompt-overlay.md: no plugin marker
ok    prompt-overlay.md: no gating fragment
ok    swarm-prompt.md: no plugin marker
ok    swarm-prompt.md: no gating fragment
ok    skills/swarm-engineering/swarm-engineering.md: no plugin marker
ok    skills/swarm-engineering/swarm-engineering.md: no gating fragment
ok    prompt-overlay.md: no host name
ok    prompt-overlay.md: no host-note file name
ok    swarm-prompt.md: no host name
ok    swarm-prompt.md: no host-note file name
ok    skills/swarm-engineering/swarm-engineering.md: no host name
ok    skills/swarm-engineering/swarm-engineering.md: no host-note file name
ok    runtime-note.md: it names the host
ok    runtime-note.md: it carries scope blocks
ok    the host note is the only shipped file that carries markers (found: runtime-note.md)
ok    prompt-overlay.md: keeps the orchestration section
ok    prompt-overlay.md: keeps the policy boundaries section
ok    swarm-prompt.md: keeps the requirement rule
ok    swarm-prompt.md: keeps the brief contract
ok    skills/swarm-engineering/swarm-engineering.md: keeps the requirement handover section
ok    skills/swarm-engineering/swarm-engineering.md: keeps the requirement matching section
ok    skills/swarm-engineering/swarm-engineering.md: keeps the assignment contract section
ok    skills/swarm-engineering/swarm-engineering.md: keeps the handover citation rule
ok    skills/swarm-engineering/swarm-engineering.md: keeps the handover carrier rule
ok    skills/swarm-engineering/swarm-engineering.md: it starts with a frontmatter block
ok    skills/swarm-engineering/swarm-engineering.md: the frontmatter names the skill
ok    skills/swarm-engineering/swarm-engineering.md: the frontmatter carries a description
ALL CHECKS PASSED

=== skill-stamp.test.mjs ===
PASS the bundle registers the skill when it is applied -> 6
PASS the registered skills carry their names in the order they are registered -> ["swarm-engineering","swarm-craft-shared","swarm-craft-developer","swarm-craft-tester","swarm-craft-reviewer","swarm-craft-python"]
PASS the registered skill keeps the name from the file -> "swarm-engineering"
PASS the registered skill names this host in its catalog line -> true
PASS the catalog line keeps the user's own description byte for byte -> true
PASS the registered content carries the note's skill block -> true
PASS the registered content carries the user's skill body -> true
PASS the registered content leaves the coordinator's note out -> false
PASS the registered content leaves the worker's note out -> false
PASS the registered content is the body, not the frontmatter -> false
PASS the swarm-engineering/shared.md registration carries its own body -> true
PASS the swarm-engineering/shared.md registration carries the note's skill block -> true
PASS the swarm-engineering/shared.md registration starts with the note's first block -> true
PASS the swarm-engineering/shared.md registration names this host in its catalog line -> true
PASS the swarm-engineering/shared.md catalog line keeps the file's own description byte for byte -> true
PASS the swarm-engineering/shared.md registration carries the whenToUse from the file -> "Read in any lane before a non-trivial edit: the core the role files apply."
PASS the swarm-engineering/shared.md registration carries the bundle as its source -> "dsh-swarm-workflow"
PASS the swarm-engineering/shared.md registration does not leak its frontmatter into the content -> true
PASS the swarm-engineering/developer.md registration carries its own body -> true
PASS the swarm-engineering/developer.md registration carries the note's skill block -> true
PASS the swarm-engineering/developer.md registration starts with the note's first block -> true
PASS the swarm-engineering/developer.md registration names this host in its catalog line -> true
PASS the swarm-engineering/developer.md catalog line keeps the file's own description byte for byte -> true
PASS the swarm-engineering/developer.md registration carries the whenToUse from the file -> "Read in a Developer lane before it changes code."
PASS the swarm-engineering/developer.md registration carries the bundle as its source -> "dsh-swarm-workflow"
PASS the swarm-engineering/developer.md registration does not leak its frontmatter into the content -> true
PASS the swarm-engineering/tester.md registration carries its own body -> true
PASS the swarm-engineering/tester.md registration carries the note's skill block -> true
PASS the swarm-engineering/tester.md registration starts with the note's first block -> true
PASS the swarm-engineering/tester.md registration names this host in its catalog line -> true
PASS the swarm-engineering/tester.md catalog line keeps the file's own description byte for byte -> true
PASS the swarm-engineering/tester.md registration carries the whenToUse from the file -> "Read in a Tester lane before it writes or judges a check."
PASS the swarm-engineering/tester.md registration carries the bundle as its source -> "dsh-swarm-workflow"
PASS the swarm-engineering/tester.md registration does not leak its frontmatter into the content -> true
PASS the swarm-engineering/reviewer.md registration carries its own body -> true
PASS the swarm-engineering/reviewer.md registration carries the note's skill block -> true
PASS the swarm-engineering/reviewer.md registration starts with the note's first block -> true
PASS the swarm-engineering/reviewer.md registration names this host in its catalog line -> true
PASS the swarm-engineering/reviewer.md catalog line keeps the file's own description byte for byte -> true
PASS the swarm-engineering/reviewer.md registration carries the whenToUse from the file -> "Read in a Reviewer lane before it reviews a change."
PASS the swarm-engineering/reviewer.md registration carries the bundle as its source -> "dsh-swarm-workflow"
PASS the swarm-engineering/reviewer.md registration does not leak its frontmatter into the content -> true
PASS the swarm-engineering/languages/python.md registration carries its own body -> true
PASS the swarm-engineering/languages/python.md registration carries the note's skill block -> true
PASS the swarm-engineering/languages/python.md registration starts with the note's first block -> true
PASS the swarm-engineering/languages/python.md registration names this host in its catalog line -> true
PASS the swarm-engineering/languages/python.md catalog line keeps the file's own description byte for byte -> true
PASS the swarm-engineering/languages/python.md registration carries the whenToUse from the file -> "Read in any lane that changes Python code, before it changes it."
PASS the swarm-engineering/languages/python.md registration carries the bundle as its source -> "dsh-swarm-workflow"
PASS the swarm-engineering/languages/python.md registration does not leak its frontmatter into the content -> true
PASS a change to runtime-note.md alone re-registers the skills -> 12
PASS the re-registered skill carries the changed note -> true
PASS the re-registered skill keeps the user's body -> true
PASS the previous registrations are disposed when the skills are re-registered -> 6
PASS the disposed registrations are the first ones -> true
PASS a change to the skill file alone re-registers the skills -> 18
PASS the re-registered skill carries the changed body -> true
PASS the re-registered skill keeps the changed note -> true
PASS the second round of registrations is disposed as well -> 12
PASS a change to a craft file alone re-registers the skills -> 24
PASS the re-registered craft file carries the changed body -> true
PASS the re-registered craft file keeps its name -> "swarm-craft-shared"
PASS the third round of registrations is disposed as well -> 18
PASS a change to a craft file's frontmatter re-registers the skills -> 30
PASS the re-registered description carries the edited description -> true
PASS the re-registered description still names this host -> true
PASS the re-registered content still carries the unedited body -> true
PASS the re-registered content starts with the note's first block -> true
PASS the edited frontmatter does not leak into the content -> false
PASS the fourth round of registrations is disposed as well -> 24
PASS a change to the policy alone does not re-register the skills -> 30
PASS the shipped runtime note does not carry the sandbox edit -> false
PASS the shipped skill file does not carry the sandbox edit -> false
PASS the shipped policy does not carry the sandbox edit -> false
PASS the shipped craft file does not carry the sandbox edit -> false
PASS the shipped tester craft file does not carry the sandbox edit -> false
ALL CHECKS PASSED

ALL SUITES PASSED (6)
```
