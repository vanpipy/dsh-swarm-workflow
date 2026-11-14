# Swarm workflow — verification: FINAL VERDICT

**Plugin under test:** `@sages/swarm-workflow` → `D:\project\dsh-plugins\swarm-workflow` (linked bundle, enabled in the live profile; renamed from `@local/swarm-workflow` on 2026-11-08)
**Lab repo (disposable, run 1):** `D:\project\.swarm-lab\lab-repo` (package `textstats`, commits `3e9bc26`, `fdb2716`)
**Run 2 (the user's own code):** `D:\project\.swarm-lab\head_tree` — a **git worktree** of `D:\project\reading-collector`, branch `swarm/lab10`, base `cb1be29` — see §8
**Scale (run 1):** 13 rounds (R1–R10, the R11 independent acceptance review, the R12 DSH-alignment round, and the R13 efficiency study) · 24 agents · 21 dispatch calls · ≈317 agent tool calls · ≈77 Coordinator tool calls
**Scale (run 2):** 11 rounds + a live probe (R1–R10b and the R11 remediation) on the reading-collector worktree · 12 agents · 13 dispatch calls · 471 agent tool calls · ≈160 Coordinator tool calls
**Scale (run 3, requirement traceability):** 3 design rounds (D1 inventory, D2 adversarial review, D3 the user's approval) + P1, a fresh Reviewer round over 7 numbered criteria C1..C7 · 3 agents · 4 dispatch calls · 7 criteria matched, 2 not met
**Scale (run 4, requirement handover):** 1 fix round (the substrate's C1/C7 defects) + the handover design + H1, a fresh Reviewer round over 9 criterion ids read from a FILE-based criteria set (`.swarm/requirements/`) · 2 agents · 2 dispatch calls · 7 met, 1 not met (a hidden control), 1 stopped as a conflict
**Scale (run 5, the global prompts):** 1 cleanup round (the numbered-criterion scheme removed from the global prompts, then re-proved in the served text) - 1 agent - 1 dispatch call - 0 id tokens served
**Scale (run 6, the second worktree ladder):** 12 rounds (R1–R10c: two work items, a three-lens fan-out, a remediation round and a re-review) on a second worktree of `reading-collector`, branch `swarm/lab11` · 12 delegated lanes + 4 native teammate lanes · 731 agent tool calls · ≈431 Coordinator tool calls · 22 findings (F33–F54) · 12 commits · `470 passed, 24 deselected`, and the 24 slow site tests pass against a strictly built site — see §12
**Scale (run 7, the host audit):** 3 audit lanes (A1 the shipped-text audit, A2 the code/design audit, A3 the independent review of the change) + 2 live probes of the plugin's own tools · 5 agents · 3 dispatch calls · 32 host claims checked against the running host · 9 material + 4 minor findings fixed · 3 host-backed tools registered · see §13
**Ledger:** `D:\project\.swarm-lab\rounds\FINDINGS.md`

---

## 1. Verdict

**The swarm workflow works, and it works as the user's documents specify it.** The Coordinator + `subagent` path is verified correct end to end: the three roles keep their boundaries, every claim came back with executed evidence, and a real failure was reported honestly instead of being dressed up.

**An independent acceptance review of the shipped plugin** (R11 — a Reviewer and a Tester teammate, dispatched through the native Agent Teams path) returned a conditional pass; its Blocking and Material findings are fixed, and the user's own documents are now byte-intact apart from the two lines the user asked to change and the three sections the user asked to move (§4, §5).

**The plugin now follows the host instead of describing it** (R12, the user's directive: "the swarm should match the features of dsh so that swarm workflow can be enhanced by the dsh and dsh can work great via the swarm workflow"). The prompt is assembled per assembly from the files on disk and from the host's live tool registry: a bundle edit is live in the next prompt with no re-apply, and a delegation surface this host does not offer cannot appear in the prompt at all (§5.1).

Two DSH features are **not usable** in this runtime and are documented as limits, not defects:

| Feature | Verdict | Note |
|---|---|---|
| `subagent` | ✅ verified (6 rounds) | the backbone of the workflow |
| `workflow` fan-out | ✅ verified (R2) | 3 agents in ONE dispatch call |
| native Agent Teams + task board | ✅ verified (R9) | teammate got the same worker prompt + skill |
| session goal (`create_goal`/`update_goal`) | ✅ verified (R9) | armed goal read back with `get_goal` |
| role fidelity (Developer/Tester/Reviewer) | ✅ verified (R3, R6, R10) | see §3 |
| honest failure reporting | ✅ verified (R8) | real DNS failure, no fabrication |
| `subagent_fork` | ❌ unusable in a long parent | inherits the whole transcript; payload ceiling ~2.2 MB |
| stopping a running subagent | ✅ verified (the audit phase, §13) | `interrupt_agent` reaches a delegated child by id, and the plugin's `swarm_child` stops a lane of its own session |

---

**The swarm was then MEASURED, not just exercised (R13).** Five rounds against a disposable repo, with every number taken from the session logs themselves: eight assignments cost the Coordinator ≈19 dispatch calls against 111 agent-side calls; one `workflow` call ran three reviewers in parallel; a resumed member cost 31 % less than a fresh one; a task that needs no tools cost exactly one call. The review those rounds produced found four real defects in the plugin's own capability gating (F11–F14) — they are fixed, unit-tested (44/44), re-applied, and verified live by a fresh worker that quoted the prompt it received. Numbers and waste analysis: `D:\project\.swarm-lab\rounds\EFFICIENCY.md`.

**And then it was run on the user's own code (the second run, §8).** Eleven rounds on a **git worktree of `D:\project\reading-collector`**, simple → complex, every round ending in working code and passing tests: **seven commits** (10 files, +955 / −31), the full unit suite green (`454 passed, 24 deselected`, exit 0), the source repository untouched, nothing pushed. That run found **nine defects in the plugin itself** (F15–F23, all fixed and proved live by a fresh worker that quoted the prompt it received), **two real defects in the user's code** (the picker closing an announcement day forever with an empty file; the catalog able to shrink silently — the 2026-10-22 regression), and it **closed on the review's own findings**: the R9 review ACCEPTed the ladder but its mutation probe proved two of the new tests were too weak; R11 pinned them, and I re-proved the fix independently — the mutant that had survived is now killed, and a fresh mutant on the second finding is killed too.

**And then the workflow was asked a question it had never been asked (the third phase, §9).** The user asked where the goals, cases and stories live and how "matched or not matched" is decided. The answer, with evidence: **nowhere as an artefact** — the requirements live as free text in five carriers and no identifier links them, so the review role had nothing to record a verdict in. Designed first, as asked: an inventory (D1), an adversarial review of the design that caught a Blocking defect in it (D2), the user's approval, then the implementation — **seven changes, six of them in the plugin's own sections, one approved sentence in the user's prose**. The proof was a **fresh Reviewer** over seven numbered criteria with the control hidden in the brief: it returned `C1 · not met` for a requirement the code had been violating since an earlier round, with a reproduction, alongside six other verdicts — and `not demonstrated` now **blocks acceptance**. The user's documents are still byte-intact apart from the one sentence they approved.

**And then the requirement workflow was run against the reader's own repository (the sixth phase, §12).** A second worktree of `reading-collector`, branch `swarm/lab11`, twelve rounds over two work items in the picker's daily ritual — the requirements living in files under `.swarm/requirements/`, the brief naming them instead of repeating them. It closed with **ACCEPT**: eight requirement instances, every one with a verdict and executed evidence, none `not demonstrated`. It also found **21 defects (F33–F53)** — five in the plugin, the rest in the branch and in the process — and it proved the three rules that only a real repository can exercise: a conflict between the brief and the requirements file is **reported, not guessed**; a check that cannot fail is **not a check** (two survived the green suite and died under the mutant probe); and a repair is **a new round** — the weak checks were fixed by a Tester lane and re-judged by a fresh Reviewer, never accepted in the round that found them.

## 2. The ten rounds

| Round | What it exercised | Outcome |
|---|---|---|
| R1 | Developer via `subagent` — `longest_word()` | acceptable; loaded the skill first; reported a foreign commit instead of reverting it (F1: its own prompt-heading report was wrong) |
| R2 | `workflow` fan-out | 3 read-only agents, one call, no file touched — efficient |
| R2 | fork probe (A + B) | both failed: one went off-script (F4), one died with `413 preflight_compress_failed` (F6) |
| R3+R5 | Tester — 8 conditions derived from the requirement | revert probe: 8 failed ⇒ every test detects the missing feature; 4 conditions duplicated the Developer's (E2) |
| R4 | foreign-change probe | the worker quoted and preserved another agent's staged file; Coordinator byte-checked the first 10 lines |
| R6 | Reviewer — mutation probe | ACCEPT; found that an empty-string-sentinel implementation passes all four Developer tests (coverage gap); detected a **mid-review contamination** and escalated attribution instead of blaming (F2) |
| R7 | efficiency audit (self + delegated, 32 calls) | E1–E7 and six drop-in rules |
| R8 | failure path | a real DNS failure; no `data.json` written; every claim tagged Verified / Inferred / Not run |
| R9 | native Agent Teams + board + goal | teammate implemented `word_length_histogram`; disclosed "my first run was 2 failed — the expectations were mine, the code was right" |
| R10 | full Developer → Tester → Reviewer cycle on `vowel_ratio()` | Reviewer ACCEPT with a 13-mutant matrix; Tester's canonical file kills **12/12** non-equivalent mutants, the Developer's weaker file **11/12** (a PRE-remediation figure — F8 later removed the Developer's 7 duplicated vowel tests, so the harness's `core` column is now 0 failures for every mutant; the canonical 12/12 was independently re-confirmed in R11) |
| R11 | independent acceptance review through the **native Agent Teams** path (Reviewer `auditor` + Tester `verifier`, two board tasks) | Reviewer CONDITIONAL PASS on the shipped bundle — one Blocking and two Material findings, all fixed and re-applied; Tester re-verified all four round-10 claims and re-ran the mutation harness read-only (39 passed, 12/12 kills, m12 EQUIVALENT) |

---

## 3. Role fidelity — what actually happened

**Developer** — implemented the clause, wrote its own smoke test, loaded the skill before coding, kept the file scope, left foreign work alone, reported honestly ("both owned files were already modified before it started"), and fixed its own lint error (ruff I001) instead of shipping it. In R10 it chose an explicit ASCII range over `str.isalpha()` (because `isalpha()` is `True` for "é") and **pinned that decision with a test** (`["café"] == 1/3`) — a choice that is verified, not asserted.

**Tester** — derived conditions from the **requirement**, before reading the implementation (8 in R3, 16 in R10), owned exactly one test file, and proved the tests bite: a revert probe turned 8 (resp. 16) tests red, and a 5-mutant probe discriminated every plausible wrong implementation. When one of its own checks failed, it diagnosed **"the CHECK was wrong, the CODE is right"** and fixed only the test — it never touched `src\`.

**Reviewer** — independent and evidence-first: executed the code, ran a mutation matrix, proved one mutant was *equivalent* rather than reporting it as a gap, raised 7 non-blocking findings with reasons, and refused to expand scope. It also caught that the change set was contaminated mid-review (timestamps + diff stat) and escalated to the Coordinator instead of blaming the Developer.

**Coordinator** — delegated with explicit assignments, assigned **disjoint** file sets after F2, ran the independent verification **once** at acceptance (**39 passed in 0.29s**), and accepted a worker's executed evidence instead of re-running everything.

---

## 4. Defects found, and what I did about them

| ID | What | Fix |
|---|---|---|
| F1 | a worker mis-reported its own prompt headings | rule: read the prompt with `ctx.systemPrompt.assemble`, never by asking a worker |
| F2 | two parallel lanes were given the same files → the Reviewer's diff changed under it | rule: one file set per lane; the board's `write_scopes` are advisory, **not** a lock |
| F3 | the first fork never reported and cannot be recovered | superseded by F4/F6 |
| F4 | a fork child acted on the **inherited** user request, created `dsh-plugins\swarm-probe` and installed it into the **live profile** | the fork's real limits are now in the worker prompt; the rogue bundle was removed and the profile cleaned |
| F5 | no way to stop a running subagent | documented as a runtime limit: the Coordinator must **prevent** an off-script worker, not correct it afterwards |
| F6 | fork B: `pi-ai stream idle timeout after 300000ms` → `413 preflight_compress_failed` ("payload core text alone is ~2178481 bytes") | rule: `subagent`, not `subagent_fork`, when the parent conversation is long |
| F7 | the worker prompt claimed a worker never sees the Coordinator's context — **false for a fork** | the line now states the truth for both variants |
| F8 | 23 tests for 16 conditions (the Developer's 7 duplicated 7 of the Tester's 16 and did not kill "y as a vowel") | REMEDIATED: the 7 duplicates deleted, canonical file kept — 46 → **39 passed** |
| F9 | the rogue fork child rewrote **the plugin's own documents** (`skills/swarm-engineering.md` +§14, `swarm-prompt.md` pointer) with no assignment | attribution proven from the session logs; the user's prose verified intact; the content KEPT (it is the same "move the Coordinator's method detail into the skill" change the user asked for); the **process** fixed — a fork inherits the *completed turns only*, so the brief must be finished **before** spawning and must name the role and the owned files |

Efficiency findings **E1–E7** (E2 was the costly one: the same requirement verified three times in lab 1 ≈30 min) became the nine Coordinator rules now in the skill's §14 and in the plugin's host-facts section.

**R11 — an independent acceptance review of the SHIPPED plugin** (a Reviewer teammate spawned through the native Agent Teams path, board task-3) returned **CONDITIONAL PASS**: one Blocking and two Material findings, all in the plugin and all now fixed.

* **Blocking** — the marker comment claimed "everything above this marker is the shipped policy, unchanged" while the edits sat above the marker. The comment now names the two deliberate exceptions and states plainly that everything below it is plugin-added host context.
* **Material** — the user's own model-configuration paragraph had been deleted with no counterpart, and policy §12 had been re-scoped ("Jcode Runtime and Model Configuration" → "Runtime and Model Configuration"). §12 is now **verbatim again**, heading and both original paragraphs included; the runtime-specific pointer moved down into the host-facts section, where a new bullet explains that §12 names another runtime's options.
* Four non-blocking items (a stale §11–§13 reference in the worker prompt, a framing sentence inside the relocated skill §12, an unexplained marker, the agentless-assembly branch in `index.js`) were also cleaned up. A parallel Tester teammate (board task-2) re-verified all four round-10 claims and re-ran the mutation harness read-only: 39 passed, 12/12 kills, m12 EQUIVALENT.

---

## 5. The plugin after the fix round

`D:\project\dsh-plugins\swarm-workflow` — 10 files, **three** markdown documents and no build step:

```
client.js 1066 · cordis.patch.yml 71 · icon.svg 404 · index.js 15,763
locale/en.json 263 · locale/zh.json 255 · package.json 943
skills/swarm-engineering.md 27,533 · swarm-prompt.md 21,210 · swarm-worker-prompt.md 6,188
```

`index.js` registers **one** global prompt section (`swarm-workflow:swarm`, order 8000, `interpolate:false`, per-assembly `text`) and the runtime skill `swarm-engineering`. It also registers a `/swarm` command that prints the live capability block. Injected sizes: Coordinator ≈20.4 K chars, worker 4,728 chars, skill body ≈24 K chars (loaded on demand — it is never injected into a worker).

**The user's documents are intact.** Diffed against the originals recovered byte-exact from this session's log, and then compared **section by section** (splitting both files on `^## (\d+)\. `):

* **Policy** (`swarm-prompt.md` vs the user's original): §2,§3,§4,§5,§7,§8,§11,§12,§13 **IDENTICAL**; §1 differs in exactly one line — the `prompt-overlay.md` reference the user asked to point at the global execution policy; §6/§9/§10 keep their headings and point at the skill, where the user's own prose was relocated verbatim.
* **Skill** (`skills/swarm-engineering.md` vs the user's paste): §2–§9 **IDENTICAL**; §1 differs only in the one bullet the user asked to change; §10 differs only by the plugin's marker comment before §11.
* **Relocation check** (heading numbers normalised): policy §6 → skill §11 **IDENTICAL**, policy §9 → skill §12 **IDENTICAL**, policy §10 → skill §13 **IDENTICAL** apart from the marker comment before §14.

Whole-file diff counts: skill **128 insertions / 6 deletions** (the user's message wrapper lines, the one user-requested §1 bullet, the appended §11–§14); policy **28 insertions / 96 deletions** (the three relocated sections, the one user-requested line, the plugin's host-facts section). Before the R11 review this was 29/102 — the difference is policy §12, which is back to the user's text.

Re-applied and verified live: `set_plugin include:swarm-workflow false→true` → the skill catalog shows the **user's verbatim description** ("Engineering execution methods for Jcode Swarm workers…"). Disabling the row makes `swarm-engineering` disappear from the catalog, which proves the profile row drives the skill.

### 5.1 The swarm follows the host (R12 — the user's directive)

The plugin used to carry a hand-written list of host facts: accurate for this host on the day it was written, and a snapshot the moment the host changed. It now derives them.

* **Live files, not a snapshot.** `index.js` re-reads the three bundled markdown files on every prompt assembly (stamped by mtime+size, re-read only when they change) and re-registers the skill when its file changes. A bundle edit is live in the very next prompt — no re-apply, no restart. This was defect **F10**: the previous host half captured the text once inside `apply()`, so an edit was not live, and a re-apply that landed *between* two edits served a half-old prompt — the protocol-checker teammate received a worker prompt without the `expected_revision` sentence.
* **Live capabilities, not a hand-written list.** The host's tool registry is probed during assembly (`tools.schemas(scope)`, global fallback, 5 s cache per scope). The prompt gains a generated block **"## Host capabilities — probed live"**: the delegation and coordination surfaces this session can actually call, the ones it cannot, and the number of tools visible to that agent. Every hand-written bullet is tied to the tools it talks about (`<!-- swarm:requires … -->`), and a bullet whose surfaces are missing is **dropped** — the prompt can no longer describe a delegation mode this host does not offer. The markers never reach the served text.
* **A live `/swarm` command** prints the same capability block and how to run a swarm, without spending a model turn.

Verified: the renderer unit test `D:\project\.swarm-lab\test-render-prompt.mjs` passes **30/30** (full host → nothing dropped, markers stripped, block rendered, tool count reported; minimal host → the fork, native-teams, shared-board and session-goal bullets dropped while the delegation, ledger and orchestrator bullets stay; no registry → markers stripped, no block, nothing dropped; the worker prompt gates the same way; rendering is idempotent; the `/swarm` line appears only when the command was registered); `index.js` syntax check EXITCODE=0; and two **independent fresh-teammate probes** — a new native teammate quoted the prompt it actually received: the capability block is there (`- **Tools visible to this agent:** 64`), the marker strings are gone, the board bullet carries the full `expected_revision` explanation, and the Coordinator-only bullet is correctly absent. The second probe (task-6) quoted the served block straight out of its own session store — 802 chars, sha256 `7a9decd5…`, including the `- **`/swarm`** — print this block on demand` line — and confirmed 0 occurrences of the raw markers inside the served system prompt.

---

### 5.2 The swarm, measured (R13 — the efficiency study)

The plugin was reloaded live (disabling the row made `swarm-engineering` vanish from the catalog; enabling it brought it back), and five rounds were dispatched against a disposable repo (`D:\project\.swarm-lab\eff-repo`, commit `12ea0cc`). Every number comes from the session logs, decoded by `D:\project\.swarm-lab\eff\measure.mjs`, not from worker self-reports.

| Round | Surface | Tool calls | Wall | Note |
|---|---|---|---|---|
| E1 | native teammate, fresh | 17 | 462 s | Developer: `longest_word` + 4 tests |
| E2 | native teammate, fresh, parallel lane | 16 | 469 s | Tester: a 10-clause spec test that fails on purpose |
| E3 | `workflow` fan-out — **3 agents in ONE call** | 46 | 263 s parallel span | three read-only reviews of the bundle → F11–F14 |
| E4a | `subagent`, one-shot | 13 | 110 s | Developer: `char_counts` + 6 tests |
| E4b | native teammate, **resumed** | **9** | — | same member, warm context: no skill reload, no orientation reads |
| E5 | native teammate, **resumed** | **9** | — | Tester: the honest-failure report on E1 |
| probe | `subagent`, no-tool task | **1** | 23 s | quoted the served prompt — the floor cost |

Totals: 7 agent sessions, **111 agent tool calls**; the Coordinator spent 42 calls of which 13 were the measurement harness, so the dispatch overhead for eight assignments is ≈19 calls.

* **One call can fan out.** Three reviews for one dispatch call and 263 s wall against ~465 s each in series.
* **A warm member is 31 % cheaper.** 9 calls versus 13, because the skill load and the orientation reads are gone.
* **The board costs 3–4 calls per teammate task** — 22 % of a 17-call task. Right price for a member you may steer later; too much for a one-shot assignment.
* **Waste that was actually measured**: 3 duplicate calls (identical name + arguments), one garbled self-report that cost a second `send_message`, one failed `spawn_teammate` (roster limit 8) whose fallback turned out *cheaper* than the spawn it replaced, and two lanes that could not run the full suite while a sibling held an in-flight file.

The fan-out review also found four real defects in the plugin's own gating, now fixed: the `swarm:requires` markers used OR semantics where AND was meant (**F11**), the worker's report instruction contradicted the contract it quotes (**F12**), the worker prompt's delimiter comment did not say which half is the user's text (**F13**), and six ways the renderer could lose or mis-state the prompt silently (**F14**). The unit test grew from 30 to **44 checks**; `index.js` syntax check EXITCODE=0.

Live proof from a fresh `subagent` (1 tool call): the served worker prompt carries the new report contract, carries no marker strings, and — the finding worth keeping — **a plain `subagent` gets a reduced registry: 58 tools against the Lead's 64, with no `spawn_teammate` and no `team_task_create`.** The gating therefore dropped the native-teams bullets from that worker's prompt and printed `- **Absent in this session:** `spawn_teammate` · `team_task_create` — do not plan around these.` A delegated worker cannot spawn teammates; only a native teammate can.
## 6. Limits you should know about

1. **`subagent_fork` is unusable in a long session** — it inherits the entire transcript (including the original user request), cannot be steered afterwards, and hits a payload ceiling (~2.2 MB core text → `413 preflight_compress_failed`; a smaller one hung until the stream timed out). Use `subagent` for independent work; reserve a fork for a small parent and genuine continuation.
2. **A fork inherits the COMPLETED turns only** — a brief written after the fork point is invisible to it. Finish the brief first, and put the role and the owned files in it.
3. **You cannot stop a running subagent** — `send_message` returns "active teammate not found" and `interrupt_agent` only addresses native team members. A misbehaving subagent has to be prevented, not corrected.
4. **The task board's `write_scopes` are advisory, not a lock** — the Coordinator still has to hand out disjoint file sets.
5. **Each worker pays one `skill` call** (≈5–14 % of a round) — the price of on-demand loading, and the right trade.
6. **A delegated worker has a smaller toolkit than the Lead** — a plain subagent sees 58 tools against the Lead's 64, without spawn_teammate and without 	eam_task_create. It cannot spawn teammates; only a native teammate can. The plugin now says so in the worker's own prompt instead of leaving it to be discovered.
7. **Teammates exist only once the Lead spawns them.** The Agent Teams feature is *already* enabled in this profile (`include:agent-team`, `include:tool-agent-team`, `include:ui-agent-team`, and the official bundle `@deepseek-ai/dsh-experimental-agent-team-profile`), but a roster that shows only the Lead means no teammate has been created yet — `spawn_teammate` is what puts members in the UI, and `team_task_create` is what gives them work.

---

## 7. Still open (not mine to change)
* **R13 lab repo** — `D:\project\.swarm-lab\eff-repo` is left dirty on purpose (the efficiency study wrote into it); it is a disposable lab like `lab-repo`. The 02:00 job chain of Lab 1 must still treat the new exit code 2 as a quiet morning.


* **Lab 1 (`reading-collector`)** — `pick_daily.py` writes an **empty day file** when every candidate is already picked, so that day closes forever; the unattended **02:00 job chain must treat exit code 2 as a quiet day** (exit 1 = broken feed, exit 2 = fetched but empty); the catalog-reorder commit; the duplicate test at `tests/…/test_cli.py:96`; the "06:00 job" nit in `test_cli_integration.py:164`. The lab-1 suite stands at **448 passed, 24 deselected**.
* **Lab repo** — left as found: 2 modified + 3 untracked files (a disposable artefact); the untracked files end with an EOF newline while tracked files do not; the scratch probes sit inside the package directory; `vowel_ratio` is not re-exported from `textstats/__init__.py` (out of scope of the requirement); pre-existing ruff RUF022 on the unmodified `__init__.py:3`.

---

## 8. Second run — the `head_tree` ladder (R1–R10b)

**User request (m03628):** "The head_tree is the copy from the reading-collector in the D:\project, try worktree again please. Finish 10 rounds to ensure the swam workflow plugin please" — preceded by "Use head_tree to make real example, do coding to finish the test. Run 10 rounds to test the swarm workflow please. From simple to complex tasks."

The first run tested the workflow against a **toy** package. This one runs it against the user's **real** repository, through the mechanism the user asked for.

### 8.1 The substrate

| | |
|---|---|
| Source repo | `D:\project\reading-collector` (branch `main`, `cb1be29`, clean) — untouched by the whole run |
| Worktree | `D:\project\.swarm-lab\head_tree`, branch **`swarm/lab10`**, base `cb1be29`, created with `git worktree add -b swarm/lab10 D:\project\.swarm-lab\head_tree HEAD` |
| Why it had to be repaired first | the repo carried a **stale worktree registration** for `/home/leroy/Project/reading-collector-wt` (`[fix/deploy-verification] prunable`) — a WSL path that no longer exists. `git worktree prune -v` removed it ("gitdir file points to non-existent location") before the new worktree could be added |
| Binding rules | the repo's own `AGENTS.md` (698 lines) — never deploy to Firebase, never push to `main`, "Fix the real behaviour. Never weaken a test, skip a check, or loosen a threshold to make a build go green", `data/index.json` is cumulative, `data/picked/` is not a build input, the unattended job fires at **02:00**, report Verified / Inferred / Not run |
| Toolchain on this host | `uv run` and the venv python both fail here (PermissionError / no venv in the worktree) ⇒ every lane used `C:\Python312\python.exe` with `PYTHONPATH="<tree>\src;D:\project\.venv-win\Lib\site-packages"` and `C:\Program Files\Git\cmd` prepended to `$env:PATH` (without it, 9 tests fail with `FileNotFoundError: [WinError 2]`) |

The baseline run was **11 failed, 426 passed, 15 skipped, 5 errors** — every failure an environment artefact (git not on PATH; the site suite needs a built `site/`), not a defect of the repo.

### 8.2 The ladder — simple → complex, every round ending in working code

| Round | Surface | Role | What it did | Commit |
|---|---|---|---|---|
| R1 | native teammate (warm) | Developer | the stale "06:00 job" comment → 02:00, in `tests/arxiv_collector/test_cli_integration.py` | `8120554` |
| R2 | native teammate (parallel lane) | Developer | deleted the **weaker** duplicate of the no-sources test, keeping the stronger one and its section comment | `fb2ebae` |
| R3 | `subagent` (fresh) | Developer | **real defect**: `scripts/pick_daily.py` wrote an empty day file, which closed that announcement day forever — now it refuses and leaves the day open (`pick_daily.py:575-589` + 6 black-box tests) | `4eb8643` |
| R4 | native teammate | Reviewer | independent review with a **byte-verified revert probe** in a scratch copy — ACCEPT (no new test is a passenger) | — |
| R5 | native teammate (warm) | Developer | the sync **exit-code contract** 0 / 1 / 2 written next to the constants and pinned by 7 exact-value tests (`cli.py:55-87`) | `8723290` |
| R6 | `subagent` (fresh) | Developer | **real defect**: `IndexWriter` could silently shrink the catalog (the 2026-10-22 regression) — now `CatalogShrinkError`, refused **before** the atomic write (`index.py:49-62`, `:160-199`, called at `:115`) | `24bedad` |
| R7 | `workflow` (ONE call → 3 lenses) | read-only | reviewed the plugin's own prompts and runtime — **9 real defects**, all fixed (F15–F23) | — |
| R8 | `subagent` (fresh) | Developer | `check_site_links.py` gained `--json PATH` (11-key schema, written on FAIL too, loud on write failure, exit 2 when the report cannot be written on a healthy site) + 5 tests | `16a3d2b` |
| R9 | `subagent` (fresh) | Reviewer | final review of all six commits + a 4-mutant probe — **ACCEPT**, no Blocking, no Material; the extra mutant M5 (`exit_code = 2` → `3`) **survived** ⇒ two non-blocking findings left open (F-1, F-2) | — |
| R10 | native teammate (warm) | Tester | **acceptance: ACCEPT** — `454 passed, 24 deselected in 665.40s`, exit 0; clean tree; exactly six commits; exactly the ten allowed paths; ruff clean; three black-box probes | — |
| R10b | `subagent` (fresh) | Tester | **live proof**: the served worker prompt carries the corrected host facts, "Tools visible to this agent: 58" (independently confirmed against the live registry), no raw marker strings, and the skill loads with §14 + §15 | — |
| R11 | native teammate (warm) | Tester | **remediation of the review's own findings** (test-only): the exit code 2 for an unwritable JSON report is now pinned exactly, and the quiet-day "no day file written — `<date>` stays open" line is asserted. **Re-proved independently by the Coordinator**: the surviving mutant M5 is now killed ("1 failed, 10 passed") and a new mutant M6 (`stays open` → `stays closed`) is killed too ("1 failed, 48 passed, 2 skipped") | `c415a38` |

Seven commits, **ten files changed, 955 insertions(+), 31 deletions(-)**, tree clean, nothing pushed.

### 8.3 What the run proved that the toy repo could not

* **The workflow survives real code.** Seven commits in the user's own repository, each one ending in passing tests, each one reviewed or reviewed again.
* **The loop closes on itself.** The R9 review ACCEPTed the ladder but left two findings that its own mutation probe had proved were real gaps in the test suite (the exit code 2 was unpinned; the quiet-day "stays open" line was unasserted). R11 closed both, test-only, and the Coordinator re-proved it **independently of the lane that wrote the tests**: the mutant that had survived (M5) is now killed, and a fresh mutant on the second finding (M6) is killed too. The ladder ends where a review found something, not where the plan said it would.
* **The plugin was fixed by the run, not just exercised.** The three-lens fan-out (R7) found nine defects in the bundle itself — the `/swarm` contradiction, the §12 declaration, the worker-vs-skill policy contradiction, the unqualified §9 cross-references, the empty-registry gap, the missing-skill-file abort, the malformed-marker gap, the typo'd-tool diagnostic and a dead branch. All nine are fixed, unit-tested, re-applied and proved live by a fresh worker that quoted the prompt it received.
* **The user's documents survived it.** After every edit: `policy_hit_1.txt → swarm-prompt.md` = 31 insertions / 96 deletions, `user_skill_paste.md → skills/swarm-engineering.md` = 135 insertions / 6 deletions, and a line-by-line match of every non-empty original line found only the known deviations (the §1 pointer the user asked to change, the §6/§9/§10 headings that moved verbatim into the skill as §11–§13, and the new §14/§15 host facts). The Jcode wording in §12 is the user's own text and is still byte-identical.
* **The measurement.** 11 assignments, **471 agent-side tool calls** against **≈160 Coordinator calls** (of which ≈55 are dispatch/coordination: 5 `subagent`, 1 `workflow`, 6 teammate `send_message`, 8 `team_task_create`, 9 `team_task_update`, 4 `todo_write`, 8 `list_agents`, 7 `wait_agent`); the rest is the Coordinator reading, editing and running its own checks. A warm teammate paid **no** `skill` call (it had loaded the skill in an earlier round); a fresh `subagent` paid exactly one.
* **The roles held.** The Reviewer refused to accept the R3 fix until a revert probe proved the six new tests fail against the pre-fix code; the Tester rejected a duplicate test only after proving the survivor was strictly stronger — and the Coordinator checked that independently, finding the deleted test's "done" branch unreachable in the whole package (no match for "done" in `src/arxiv_collector/`), so no coverage was lost; the acceptance lane reported the slow suite as **Not run** (it needs a built `site/`) instead of implying a green run.
* **Honest failure stayed honest.** The R4 reviewer reported a **process** finding against its own brief — `git show <rev>^:<path>` through cmd.exe eats the caret and silently restores the *post*-fix blob; only a `git hash-object` comparison caught it. That became a recorded rule, not a footnote.

### 8.4 What the second run found about the swarm itself

* The board's `write_scopes` are advisory, not a lock — three lanes independently reported that "git status shows exactly my two files" cannot hold in a shared tree. The Coordinator staged per lane instead (F24).
* A `subagent` gets a **reduced registry** (58 tools vs the Lead's 64): no `spawn_teammate`, no `team_task_*`. A brief that says "claim the task on the board" cannot work for a subagent (F26) — the board is for native teammates.
* A native teammate **resumed** across rounds pays no `skill` call and is cheaper than a fresh spawn; a fresh `subagent` is the right choice for an independent job, a warm member for a follow-up.



## 9. Third phase — requirement traceability: where the goals live, and how "matched" is decided

The user asked (verbatim): *"For the review role in the 'swarm-engineering.md', I think the reviewer must take care of the goals or cases or stories matched or not, right? so the first question, where are the goals or cases or stories. the second is how to matched?"* — then answered the framing question (verbatim): *"Nope, design first base on the whole workflow definition"*, choosing a **fresh reviewer round** as the proof. So this phase ran **design → approval → implementation → proof**, and nothing in the bundle was edited before the design was approved.

### 9.1 The two answers

**Where the goals / cases / stories live.** Nowhere as an artefact. They exist as free text in five carriers — the assignment brief (`skills/swarm-engineering.md:447`, `swarm-prompt.md:152`), the board entry (a second copy of the same brief, `swarm-prompt.md:253`), the session goal (one string, `swarm-prompt.md:256`), the round ledger (`skills/swarm-engineering.md:603`) and the repository's own binding rules (`AGENTS.md`) — and **no shared identifier links them**. The word "clause" occurs exactly once in the whole bundle (`skills/swarm-engineering.md:600`); "story", "stories" and "use case" occur zero times. The inventory that established this is `DESIGN-INVENTORY.md` (D1, 38,285 B): a role-by-role table showing that **every role must read a requirement somewhere, and no role must produce a per-requirement verdict or name its source** — the Reviewer being the weakest bound.

**How "matched" was decided.** By prose judgement anchored on the brief. Two mechanisms matter and they fail in different ways:

| check | what it asks | where it stood |
|---|---|---|
| **discrimination** | would the check fail if the behaviour were wrong? | proven in practice by a mutation/revert probe — the R9 probe killed 4 of 5 mutants — but written **nowhere** in the workflow (grep over the three markdowns for `mutat\|mutant\|probe\|revert` hits only two incidental lines) |
| **intent** | is the behaviour the one the criterion asked for? | in the user's own prose (`skills/swarm-engineering.md:297`, `:304`, `:315`) — but `:315` is inside "For each plausible issue, determine:" (`:312`), so it is per-**defect**, not per-requirement, and it produces no record |

The run evidence says this bites. The R9 reviewer matched the change against **commits and mutants** — six per-commit verdicts for the six ladder commits (the seventh commit, `c415a38`, is the *remediation* of the R9 findings, not a seventh verdict). At least **three** times did the code not meet its requirement: the `longest_word` tie (the brief said alphabetically first; `src/effdemo/core.py:19` uses a strict `>` so input order wins), the picker writing an empty day file, and the catalog shrinking silently. Only the first was caught — by a **deliberately commissioned** honest-failure probe lane, not by the review role.

### 9.2 The design, the review of it, and the user's approval

| round | surface | who | what |
|---|---|---|---|
| D1 | `subagent` (fresh) | `protocol-checker` | **DESIGN-INVENTORY.md** — the carriers with `file:line` evidence, 13 gaps, the numbering sweep, the live tooling facts (the board's task has **no requirement field**: `CreateTeamTaskRequest = { subject, description, blockedBy?, writeScopes? }`; a one-shot subagent gets one free-text prompt plus an optional `outputSchema`) |
| D2 | native teammate | `auditor` | **DESIGN-REVIEW.md** — verdict **SOUND WITH CORRECTIONS**; 7 unsupported claims in my own draft (re-run by the reviewer), 9 missed carriers, 6 contradictions |
| D3 | the user | — | approved: **A-1…A-6 + U-1**; `not demonstrated` **blocks acceptance**; the proof uses the **eff-repo `longest_word` criterion** |

**The Blocking finding D2 caught in my design (C1):** the Reviewer's duty sat in skill §14 — but `swarm-worker-prompt.md:12` says *"Its §11–§14 are Coordinator-side methods; you do not need them"*, and a Reviewer **is** a worker. The rule would never have reached the role it was written for. The fix: a **new worker-facing section §16** plus one bullet in the worker prompt.

**The corrections to my own draft** (each re-run by D2, not argued): "7 per-commit verdicts" → **six**; "the ONE time the code did not meet its requirement" → **at least three**; "caught by accident" → a **deliberately commissioned** probe lane; "only the first mechanism is written into the workflow" → **neither** is; "nothing in the workflow does this today" → the intent check **is** in the user's prose; "M5 survived because the verdict was missing" → M5 was a weak **assertion** found by the Reviewer's own probe — a reporting vocabulary cannot detect that; "nowhere else" → the board, the session goal and the ledger are carriers too.

**One correction to D2 itself**, verified against the recovered original: D2 called `skills/swarm-engineering.md:544-548` "the plugin's own Review Completion Gate". It is the **user's** policy §9.3, relocated verbatim (`policy_hit_1.txt` §9.1–§9.5 ≡ skill §12.1–§12.5, line for line, headings renumbered) — so a sentence added there is a user-prose edit, it was treated as optional (U-2), and it was **not** applied.

### 9.3 What was implemented — the plugin's own words, the user's prose intact except one approved sentence

| id | where | change |
|---|---|---|
| A-1 | `skills/swarm-engineering.md:603` | new §14 rule: **number the criteria in every brief** — `C1..Cn`, each with criterion / observable check / source; the Developer never authors criteria, the Coordinator names them |
| A-2 | `skills/swarm-engineering.md:602` | the Tester's requirement-clause file **cites the criterion id** each test covers; a criterion with no test is a **reported coverage gap**, never a silent pass |
| A-3 | `skills/swarm-engineering.md:615-634` | **NEW `## 16. Requirement Matching`** (worker-facing, behind its own marker): the verdict line; four verdicts (`met` / `not met` / `not demonstrated` / `not in scope`); *a verdict without evidence is `not demonstrated`, never `met`*; the Tester's `passed`/`failed`/`blocked`/`not-tested` mapping; **two checks, not one** (discrimination + intent); *"if your assignment carried no numbered criteria, say so and report it as a gap; do not invent criteria"*; and the completion-gate extension — a `not demonstrated` criterion **blocks acceptance** until it is checked or the Coordinator records an explicit waiver with a reason in the ledger row |
| A-4 | `skills/swarm-engineering.md:6`, `:483` | the two plugin markers name the plugin's own sections accurately (§11–§16; §16 is worker-facing) |
| A-5 | `swarm-worker-prompt.md:12` | "**Its §16 binds the Reviewer:** one verdict per criterion with its evidence, and two checks per criterion." (plugin prose; the quoted user extracts are untouched) |
| A-6 | `swarm-prompt.md:262` | the Coordinator-practice pointer enumerates §14's rules in prose, so it gains one clause: "numbering the criteria in every brief" |
| U-1 | `skills/swarm-engineering.md:306` | **the one approved change to the user's own prose**: *"Identify each acceptance criterion by id (C1, C2, …) and report a verdict with evidence for each."* — inside the Reviewer's own §5.4 Step 1 |

**Integrity re-proof after the edit** (`git diff --no-index`, the recovered original → the shipped file):

- the **policy**: 31 insertions / 96 deletions — **unchanged** from the baseline.
- the **skill**: 159 insertions / 6 deletions (baseline 135/6). The hunk headers place every insertion: `@@ -307,0 +306,2 @@` is the approved U-1 insertion; `@@ -481 +481,154 @@` is the plugin's appended band (now §11–§16). **The only change inside the user's own text is the two approved lines of U-1.**
- the render unit test `D:\project\.swarm-lab\test-render-prompt.mjs`: **ALL CHECKS PASSED**, exit 0.
- the bundle was re-applied (`set_plugin include:swarm-workflow` false → the skill catalog **loses** `swarm-engineering` → true → it returns) — the live proof that the row drives the skill.

### 9.4 The proof: a fresh Reviewer, a hidden control, a verdict table

**P1** was run with a **fresh `subagent`** (session `5cc81498-7501-48d2-93ce-f96fa6965bc8`, cwd `D:\project\.swarm-lab\eff-repo`). A fresh agent is required: the prompt is assembled at session start, so only an agent that did not exist before the edit can prove the new rule is *served*.

**The brief** carried seven criteria in one uniform shape (criterion / observable check / source) and did **not** reveal which one the code violates. The control is **C1**, taken verbatim from the original effdemo assignment (`D:\project\.swarm-lab\eff\eff-r5-discrepancy.md:3`: *"longest_word returns the alphabetically first word among those sharing the maximum length"*) — the same requirement the R13 honest-failure lane had already caught being unmet.

**The deliverable was a section of the Reviewer's own report**, headed exactly `## Criterion verdicts`, one line per criterion: `C<n> · <verdict> · <evidence pointer>`.

**What came back** — seven verdicts, both §16 checks run for every one:

| | verdict | evidence |
|---|---|---|
| C1 | **not met** | `src/effdemo/core.py:11-21` keeps the first tied word in input order; probe `[FAIL] C1 … actual='ddd' expected='aaa'`; the repo's own three collectible test files still pass 17/17 on C1-violating code ⇒ **no repo test discriminates C1** |
| C2 | met | `core.py:17-21`; mutation `empty → None` fails `test_longest_word_of_empty_sequence_returns_empty_string` |
| C3 | met | `core.py:6-8`; mutation "reverse the order" fails `test_word_lengths_counts_each_word` |
| C4 | met | `strings.py:6-16`; mutations "case-insensitive" and "pre-seed a–z with 0" each fail a repo test |
| C5 | met | `text.py:4-13`; mutations "no lowercasing" and "raw first/last char" each fail repo tests |
| C6 | met | AST listing: 4 public functions, `UNCOVERED=0`; adding an untested public function makes the coverage probe exit 1 |
| C7 | **not met** | the suite aborts at collection — `ImportError: cannot import name 'vowel_ratio'`, exit code 2, no test runs; supplying `vowel_ratio` flips it to exit 0 / 27 passed ⇒ the missing function is the sole cause |

**The negative control fired.** C1 came back `not met`, with a reproduction and with the *second* finding attached: the existing tie test uses `["bb","ccc","dd","eee"]`, where input-order-first and alphabetically-first coincide, so it cannot detect a wrong tie-break. That is the same defect the R13 honest-failure lane had found three months of rounds earlier — caught this time by the **review role itself**, from a numbered criterion, with no hint that C1 was the control.

**What I verified myself, rather than trusting the report:**

1. the substrate is byte-identical to the baseline I took before dispatching: all **8 files** under `src/` and `tests/` match `eff-repo-baseline.sha256` (SHA-256), so the Reviewer changed nothing;
2. the control reproduces on my own run: `longest_word(['ddd','aaa']) → 'ddd'` (the criterion expects `'aaa'`) and `longest_word(['bbb','ccc','aaa']) → 'bbb'`;
3. C7 reproduces on my own run: `pytest -q` → `ImportError: cannot import name 'vowel_ratio' from 'effdemo'`, `1 error in 0.18s`, collection interrupted;
4. **the rule was really served** — the agent's own session log (91 zstd frames decoded, 756,727 chars) contains the new worker-prompt bullet *verbatim* ("Its §16 binds the Reviewer: one verdict per criterion with its evidence, and two checks per criterion."), the skill's `## 16. Requirement Matching` heading, "A verdict without evidence is …" ×3, "Two checks, not one", "do not invent criteria" ×3, and `## Criterion verdicts` ×7 — so the section was loaded and used, not merely present on disk.

**One question the Reviewer left open, answered from the evidence:** it asked whether the criterion text or the code was the defect for C1, because the code's docstring and its test both state the input-order rule. The **criterion is the requirement** — `eff-r5-discrepancy.md:3` quotes the original assignment verbatim ("…the alphabetically first word among those sharing the maximum length"), and `EFFICIENCY.md:64-66` records the same deviation. The code is the defect; its docstring and its tie test are wrong with it. The Reviewer's proposed fix (`if len(word) > len(best) or (len(word) == len(best) and word < best):`) is the same one `eff-r5-discrepancy.md:11` had already named.

**What the phase proves.** Before it, "matched or not matched" was prose with nowhere to land. After it, a criterion has an **id**, a **verdict**, a **known vocabulary**, **evidence as a precondition**, and a **gate**: `not demonstrated` blocks acceptance. The proof round did not merely confirm the rule was written — it produced the artefact the rule was written to produce, on a defect that had already survived a review role once.
## 10. Fourth phase — requirement handover: the criteria live in a file, not in the chat

**The question (the user, verbatim):** "I think we should fix them, but, do we need a group of files or filesystem supported to support the real docs handover? Or the real things to the swarm engineering?"

**The answer: both, and they are different things.** The *rules* belong in the swarm-engineering skill — the only artefact every lane loads on demand, and where §16 already lives. The *data* (the real requirement documents) must NOT go into the skill: the skill is global (one bundle, one profile, every project) and is loaded whole (~31 KB); a per-project spec would freeze and bloat it. So the data goes in a small **group of files by convention, in the project the swarm works on** — the user's choice: `.swarm/requirements/<work-item>.md`, one file per work item, one block per criterion (`C1 · <criterion>` / `check:` / `source:`).

**The user's three decisions:** the handover lives in `.swarm/requirements/` (the swarm's own folder, not a project docs folder); when the brief/board entry and the criteria file disagree, **the lane reports the conflict and stops** that criterion (`not demonstrated`, never `not met`, never an invented criterion); the scope was "Design, implement and then test them".

### 10.1 What was implemented (the user's own prose untouched)

| edit | where | what |
|---|---|---|
| A-7 | `skills/swarm-engineering.md:636-655` | NEW `## 17. Requirement handover` behind its own marker — the criteria live in a file; the file lives in `.swarm/requirements/`, one per work item; the brief names the file and the ids and never repeats the criterion text; the board entry carries the same path; a conflict is reported and the criterion stops; a citation is `<file>:<line>`; a verdict without it is `not demonstrated`; an unreadable file is `not demonstrated`, never `met` |
| A-8 | `skills/swarm-engineering.md:6`, `:483` | the plugin markers now name §11–§17 and point the worker at §16 and §17 |
| A-9 | `swarm-worker-prompt.md:12` | the worker learns where a criterion lives: `.swarm/requirements/<work-item>.md` — read it, cite `file:line`, report a conflict instead of guessing |
| A-10 | `swarm-prompt.md:262` | the Coordinator practice gains "writing the criteria file the brief points at" |

Integrity after the edits: `policy_hit_1.txt` → `swarm-prompt.md` = **31 insertions / 96 deletions** (unchanged from the phase-3 baseline — the user's policy prose is still byte-identical); `user_skill_paste.md` → `skills/swarm-engineering.md` = **180 / 6** (was 159/6; the +21 lines are exactly the §17 band). Unit test "ALL CHECKS PASSED", `index.js` syntax check exit 0, bundle re-applied live (the skill catalog loses and regains `swarm-engineering`).

### 10.2 The proof round (H1)

The Coordinator wrote `.swarm/requirements/effdemo-baseline.md` (C1..C8) and dispatched a **fresh** subagent Reviewer whose brief named the file and the ids and deliberately did **not** repeat the criterion text. C8 was a deliberately violated control; the brief also named **C9**, an id the file does not define.

| id | verdict | evidence (the Reviewer's own) |
|---|---|---|
| C1 | met | `.swarm/requirements/effdemo-baseline.md:3` — tie-break at `src/effdemo/core.py:22`; discrimination: reverting it to input order on a copy fails (`AssertionError ('ddd','aaa')`) |
| C2 | met | `:7` — `core.py:20,24`; the mutation `return best or None` fails |
| C3 | met | `:11` — `core.py:8-10`; a reversed-order copy fails |
| C4 | met | `:15` — `strings.py:13-16`; case-folding and zero-preseed copies each fail |
| C5 | met | `:19` — `text.py:10-13`; dropping `.lower()` fails; disabling the alnum guard raises IndexError |
| C6 | met | `:23` — 5 public functions, coverage gap 0; adding an untested public function flips the probe to "GAP COUNT: 1" |
| C7 | met | `:27` — `python -m pytest -q` → 28 passed, exit 0; a reversed copy → "1 failed, 27 passed" |
| C8 | **not met** | `:31` — `core.py:38` returns `vowels / len(text)` ⇒ `vowel_ratio("a b")` = 0.3333333333333333, so the criterion's own check `== 0.33` fails; the rounding mutation makes it pass (0.33; "aab" → 0.67, so the check separates rounding from truncation) |
| C9 | **not demonstrated** | **CONFLICT** — the file ends at line 33 with C8 and defines no C9; the lane stopped the criterion, picked no winner and invented no text; it also found the behaviour does not exist (`word_lengths(['a','bb'], reverse=True)` → TypeError) |

**The control fired, the conflict was reported, and the file was the authority.** C8 came back `not met` although the brief never said which criterion was the control; C9 came back `not demonstrated` with the conflict stated, exactly as §17 requires; every other criterion carries a `file:line` citation, and both legs of the two-check rule ran.

**What I verified myself, rather than trusting the report:**

1. all **9** files of the substrate *and* the criteria file are byte-identical to `eff-repo-h1-baseline.sha256` (SHA-256, compared one by one) ⇒ the round changed nothing;
2. my own run: `pytest -q` → **28 passed**, exit 0;
3. my own probes: `longest_word(['ddd','aaa']) → 'aaa'` (both orders), `longest_word([]) → ''`, `word_lengths(['a','bb']) → [1,2]`, `char_counts('aA') → {'a': 1, 'A': 1}`, `first_last_letter('Hello, World!') → ('h','d')` — every "met" verdict reproduces;
4. the control reproduces: `vowel_ratio("a b") = 0.3333333333333333`, and `== 0.33` is **False**;
5. **the rule was really served** — the agent's own session log (40 zstd frames decoded, 385,667 chars) contains "## 17. Requirement handover", "swarm/requirements" ×5, "report a conflict instead of guessing", "Two checks, not one", "do not invent criteria" ×3 and "not demonstrated" ×31.

**The Reviewer's material finding — and it is a finding about MY fixture, not about the code.** C8 demands `vowel_ratio("a b") == 0.33` while `tests/test_spec_vowel_ratio.py:60-63` asserts `vowel_ratio("a b") == pytest.approx(1.0/3.0)`: the two statements are mutually exclusive, so satisfying C8 breaks C7. The Reviewer proved it (the rounding mutation makes the spec test fail — "1 failed, 27 passed"), reported it as a product decision that belongs to the human (§14), and changed nothing. **That is the mechanism working end to end** — and it also exposes the gap: §17 covers a conflict between the *brief* and the *file*, not between the *file* and the *repository's own tests*. A criteria file that contradicts an existing test must be reconciled before it is authoritative, or a deliberately false control will look like a product conflict. (Proposed as a one-line addition to §17 — left pending the user's approval, because the standing rule is design first.)
### 10.3 The gap H1 found, closed by the user's decision

The user approved the one-sentence rule (the standing rule is design first, so it was proposed before it was written):

> **A-11** — `skills/swarm-engineering.md:656` — "A criteria file is only authoritative over the behaviour it names. Before it is written, the Coordinator reconciles it with the repository's existing tests; a criterion that contradicts an existing test is a conflict in its own right, and it is reported like any other — the lane does not pick a winner between the file and the test."

Re-verified after the edit: unit test "ALL CHECKS PASSED" (exit 0); `index.js` syntax check exit 0; integrity diffs — `policy_hit_1.txt` → `swarm-prompt.md` = **31 insertions / 96 deletions** (unchanged), `user_skill_paste.md` → `skills/swarm-engineering.md` = **181 / 6** (was 180/6; the +1 line is exactly the new bullet, inside the plugin band). Bundle re-applied live: the `<available_skills>` catalog lost `swarm-engineering` on disable and regained it on enable.

The user's other decision (F31): **leave both real repositories untouched** — `.swarm/` stays untracked in `reading-collector` and in the `head_tree` worktree; the folder exists only in the disposable lab so far, and the project that adopts the handover decides whether its criteria are committed (reviewable project knowledge) or ignored (like `.pi`).
---

## 11. Fifth phase — the prompts are global again

The user read the shipped prompts and objected: "the prompts is general and global, the "C1..Cn" is useless for it and it confuse the llm, please clean them all". They are right, and the objection is a design principle rather than a wording preference — a global prompt may not carry a project-specific convention.

**What was removed.** The numbered-criterion scheme: the id list in the skill's §16 and §17, the "Number the criteria in every brief" rule of §14, the Tester clause that cited a criterion id, the worker-prompt pointer, the Coordinator-practice pointer, and — with them — the single sentence that had been added inside the user's own §5.4. That last removal matters: after it the user's skill text is byte-identical to the recovered original apart from the one §1 pointer they asked to change.

**What was kept.** Everything that made the mechanism work: one verdict line per requirement (requirement · verdict · evidence), the four verdicts, "a verdict without evidence is `not demonstrated`, never `met`", the two checks (discrimination + intent), "do not invent requirements", the gate that a `not demonstrated` requirement blocks acceptance, the requirements file at `.swarm/requirements/<work-item>.md`, the `file:line` citation, and the two conflict rules (brief vs file; file vs the repository's existing tests).

**Proof.** grep over the bundle: no `C1`, no `C2`, no `Cn`, no "criterion id", no "Number the criteria". The policy's integrity diff is unchanged (31 insertions / 96 deletions) and the skill's user band is clean again (the `@@ -307` hunk is gone). The unit test ends "ALL CHECKS PASSED". The bundle re-applied live — the skill catalog lost and regained `swarm-engineering`. And a fresh worker agent, reading only its own served context, counted **0** occurrences of every id token in both the served system prompt and the loaded skill body, and found the new "- **State the requirements in every brief.**" bullet in §14 with no "Number the criteria" bullet beside it.

**What this phase proves about the swarm.** A workflow can be corrected by one sentence from the user and the correction propagates through every artefact that carried the old convention — the skill, the worker prompt, the coordinator pointer, the runtime-memory entry and the ledger — because the convention had exactly one home and everything else referred to it. A convention with one home is cheap to change; a convention scattered across artefacts is not.

### The cleanup, confirmed from inside the served text

Two independent read-only workers counted the id scheme in their own served context and found nothing: all seven tokens 0 in the system prompt and in the loaded skill body, the singular "criterion" 0, and every `criteri` hit the ordinary plural in "acceptance criteria", "exit criteria" and the role headings. The second one stated its own limit — it could see only the worker variant — so the Coordinator closed that gap by running the host's own `renderPrompt()` over both prompt files (probe D:\project\.swarm-lab\probe-coordinator-variant.mjs): the Coordinator prompt rendered with the Lead registry (22,032 chars) and with a minimal one (17,610 chars), the worker prompt rendered both ways (7,508 / 5,694 chars) and the skill body (32,199 chars) carry zero id tokens and zero singular "criterion". `renderPrompt()` only drops lines and swaps the capability marker, so a clean render of every source implies a clean served prompt for every agent.
---

## 12. Sixth phase - the second worktree ladder (R1-R10c): requirement matching against a real repository

The third and fourth phases asked what a requirement IS and where it lives. The
fifth removed the id scheme, because a global prompt may not carry a
project-specific convention. This phase puts the answer to work: the reader's own
repository, a **git worktree** of `D:\project\reading-collector` on branch
`swarm/lab11`, and twelve rounds over two work items in the picker's daily
ritual.

**The substrate.** `D:\project\.swarm-lab\head_tree2`, created with
`git worktree add -b swarm/lab11 ... HEAD` (base `4525f25`). Its own baseline was
`435 passed, 24 deselected`; the branch closed at **`470 passed, 24 deselected`**, and the 24 slow site tests pass against a strictly built `site/` — 494 tests in all
and **12 commits** (the full diff: the requirements files, the picker's profile
validation, the picker's feed verdict, and two requirement-clause test files).
Nothing was pushed; the source repository was not touched.

**The requirements lived in files.** Two work items, two files under
`.swarm/requirements/` - `pick-daily-profile.md` (the reader's daily number) and
`pick-daily-feed-verdict.md` (the picker's verdict for a quiet feed) - each
requirement one block: the requirement, the observable check that proves it, and
its source. Every brief named the file and the requirements it covered and
**did not repeat their text**.

### 12.1 The ladder

| Round | Role | What it established |
|---|---|---|
| R1 | Developer | A malformed `daily_limit` is refused with exit 2 and a message that names the key - before any fetch and before any write |
| R2 | Tester | The clause file for work item A: 12 tests, each citing the requirement it covers |
| R3 | Reviewer | Three requirements met, nine mutants killed in a scratch copy |
| R4 | Developer | The lane found that its brief and the requirements file disagreed about an exit code, reported the conflict and left the disputed number out of the code |
| R5 | Reviewer | The disputed requirement came back `not met`; the acceptance was blocked |
| R6 | the reader | A product decision, made by the human: the quiet feed exits **0**. The reason, the rejected options and the cost were recorded in the requirements file before any code changed |
| R7 | Developer | The quiet feed exits 0 now, and the module docstring's exit-code list agrees with the code |
| R8 | Tester | The clause file for work item B: 16 tests, one per condition |
| R9 | one `workflow` call, three lenses | Two requirements `not demonstrated`; 33 citations drifted; the plugin's requirement rules did not reach every lane |
| R10 | Reviewer | Seven requirements met, and **two checks that could not fail** |
| R10b | Tester | Five defects repaired in the **checks** - never in the production code |
| R10c | Reviewer | The re-review of the blocked items only: **ACCEPT**, no requirement `not demonstrated` |

### 12.2 The three rules the ladder proved

1. **A conflict between the brief and the requirements file is a report, not a
   coin flip.** R4's brief said the quiet feed exits 1; the authority file said
   2. The lane reported both readings with their file:line, implemented
   everything else, and put **no number** in the code. R5's Reviewer judged the
   requirement as the file states it and blocked the acceptance. R6 asked the
   reader, who chose 0 and whose reason was written into the file before R7
   touched the code. That is the handover rule working end to end.
2. **A check that cannot fail is not a check.** `assert "daily_limit" in out`
   was satisfied by the pytest `tmp_path` in the captured command line - the
   key leaked in through the path, not through the message. And the production
   broken-feed summary line was pinned by **no test at all**: the whole suite
   passed with the quiet-morning words in it. The green suite said nothing; the
   mutant probe said everything.
3. **The repair is a new round.** The two weak checks were fixed by a Tester
   lane and re-judged by a fresh Reviewer told to decide only the blocked items.
   The Coordinator re-ran both mutants itself before accepting: M1 now kills
   three cases, M8 kills one, and the suite it passed unchanged before now
   fails.

### 12.3 The acceptance

R10c's verdict table: **eight requirement instances, all with a verdict and
executed evidence** - six `met`, two `not in scope` (excluded by the brief).
The two mutants that survived round 10 now die (M1 at
`tests/scripts/test_pick_daily_profile.py:380`, M8 at
`tests/scripts/test_pick_daily_feed_verdict.py:335`); the new requirement - a
partly broken feed is a warning, not a failure - is pinned by five mutants
(D1-D5); the citations are 51 checked / 0 stale / 0 re-pointed at the wrong
requirement; the anti-skip guard is not vacuous (four guards die with it). The whole suite is green on the branch head: **470 passed, 24 deselected** (non-slow) and **24 passed** (the slow site tests, which no lane ran - the Coordinator built the site with `mkdocs build --clean --strict` and ran them).

### 12.4 The defects (F33-F54, in HT2-FINDINGS.md)

Nine in the branch's requirements files and clause tests (dead pointers, 33
drifted citations, a shipped behaviour with no requirement, a wrong attribution,
a false commit message), five in the plugin (the requirement rules did not reach
the Developer lane; the Coordinator prompt never mentioned sections 16 and 17;
sections 14 and 17 contradicted each other; the skill's boundary markers
credited the user's own relocated prose to the plugin; the Coordinator prompt's
pointer repeated the phrasing section 17 forbids), and the rest in the process
(the guard claiming more than it sees, a timeout mistaken for a hang, a site build that failed because `git` was not on `PATH` - not because a worktree has no `.git` directory, as the repository's guide claims -, two
requirements that the re-review was blind to by design). Every plugin defect was
fixed, unit-tested, re-applied live and re-proved in the served text.

**What this phase proves about the swarm.** The workflow only becomes real against
a repository that has its own rules, its own tests and its own opinions. The
toy package could not have produced a conflict between a brief and an authority
file, a reader's decision about an exit code, a shipped behaviour with no
requirement, or a check that passes because the environment said so. And the
loop closed on itself twice: the acceptance review's own mutant probe found two
checks that decided nothing, and the repair of those checks was judged by yet
another fresh agent.

**The limits.** The nightly job chain lives in another session, so the new exit
codes (0 = a quiet morning) are not yet understood by the code that reads them.
The slow site tests needed a built `site/`: the Coordinator built it and ran them — **24 passed** — so the whole suite is green. The branch is local:
merging `swarm/lab11`, or dropping it, is the reader's call - and it is
complementary to `swarm/lab10`, which carries the empty-day-file guard that
`main` and `lab11` still lack. Two requirements were re-review-blind by design.
The measurement's own limit: a native teammate's tool calls are not in the
session store, so the four native-teammate lanes cannot be counted.
---

## 13. Seventh phase — the host audit and the host-backed primitives

**The user's directive (2026-11-08):** "Audit the swarm workflow plugin, ensure it can help dsh itself"

**What was audited.** Every host claim in the shipped text, against the running host — not against
documentation — and the plugin's code, against the live services. Three lanes: A1 the shipped text
(32 claims, each with a verdict), A2 the code (the three wirings in design form), A3 an independent
review of the actual working-tree diff against both reports. Full record: `D:\project\.swarm-lab\rounds\AUDIT.md`.

### 13.1 What the audit found

| # | finding | severity | fixed |
|---|---|---|---|
| F55 | the shipped text said a delegated worker cannot be steered or resumed; the live `subagent` schema says it can (`send_message` steers a continuable child) | behaviour-changing | ✅ the text now names the two tool families |
| F56 | `swarm_task`'s board relay picked `ctx.agents.roots()[0]`, and `roots()` is **global** — a delegated worker read another team's board ("0 task(s)" while the Lead's board held 33) | material | ✅ the relay walks the caller's own lineage and refuses when no ancestor is recognised |
| F57 | the capability block advertised `swarm_worktree` although this profile has **no worktrees service** (the bundle `@deepseek-ai/dsh-experimental-tool-worktree` is disabled) | material | ✅ a tool is registered only when its backing service exists |
| F58 | `interrupt_agent` / `send_message` were described wrongly — the Lead's registry addresses teammates by name, a worker's registry addresses a continuable child by id | material | ✅ both families are now described, with the live schema text |
| F59 | `stop` reported success for an absent target, though the host treats it as an accepted no-op | material | ✅ the catalog is read first; an absent target throws |
| F60 | the acting **credential** was never disclosed to the lane | material | ✅ "acted as <authority> (role: …) on behalf of <actor>" |
| F61 | `writeScopeWarnings` — the one signal that two lanes will collide — never reached the lane | material | ✅ rendered, and the task shape is declared |
| F62 | `delete` was refused only by the parameter enum, and the host's argument validation is unverifiable (it lives inside `app.asar`) | material | ✅ an explicit guard |
| F63 | `worktrees.create` dropped `exec.signal`; the worktree's working-directory side effect was hidden | material | ✅ signal forwarded, the side effect stated |
| F64 | `swarm_child`'s output schema forbade the `target` it returned | material | ✅ declared |
| F65 | the plugin's own tools were listed as **host** surfaces in the capability block | minor | ✅ the third group was dropped; the marker gating reports absence |
| F66 | the "Absent in this session" line covered only the Coordinator's markers, so a worker could assume `wait_agent` / `team_task_list` existed | minor | ✅ the line now unions both prompt files' markers |
| F67 | the skill's catalog description says "Jcode Swarm workers" — the user's own text, shown verbatim by the host | host-visible | ✅ a **host note** is prepended at registration; the file's frontmatter stays byte-identical |

### 13.2 What the plugin now does

Three thin pass-throughs to the host's own services, each registered **only when the host has the
service behind it**:

- `swarm_worktree` → the host's `worktrees` service: a fresh branch and a clean checkout, the source
  checkout untouched (not available in this profile — the service is absent, so the tool is not
  registered and the prompt does not advertise it).
- `swarm_task` → the host's `agentTeams` service: the shared board. A member reads and moves it as
  itself; a session outside the team reads it **read-only** through the nearest ancestor the team
  service recognises as a member, and a move from outside the team is refused.
- `swarm_child` → the host's `subagents` service: this session's own child lanes — list them with
  their mode, steer a continuable one, stop a live one.

### 13.3 Verification

- `tools/test-swarm-tools.mjs` — **ALL CHECKS PASSED (62)**.
- `tools/test-render-prompt.mjs` — **ALL CHECKS PASSED**; `index.js --check` — exit 0.
- The bundle re-applied live: the skill leaves the catalog and returns with the host note in front of
  the user's own description.
- The live registry holds `swarm_task` and `swarm_child` and **not** `swarm_worktree` — the plugin
  advertises exactly what this host can call.
- The user's text is still intact: the integrity check reports POLICY unmatched 11 of 327 lines (the
  pointer the user asked to change + the ten relocated subsection headings) and SKILL unmatched 3 of
  481 (the chat lead-in + the one bullet the user asked to change).

### 13.4 The limits that stay

- The host's implementation is inside `app.asar` and unreadable as files: argument validation,
  result validation, error materialisation and `render`'s undeclared keys stay unverified, and the
  fixes assume the worst case.
- The worktrees wiring is unit-tested against a stub only — the service does not exist in this
  profile.
- A `subagent` outside the team can read the whole team board through the Lead's credential; the
  output discloses the relay and the authority, but the surface exists.
- The plugin's board is a strict subset of the host's (`edit`, `set_dependencies`, `reassign`,
  `reopen` and the request fields are not expressible through `swarm_task`).
### 13.5 The live probes, and the defect they found

| probe | role | what it proved |
|---|---|---|
| 52740e86 | delegated worker | swarm_task and swarm_child answer; swarm_worktree could only fail (the host has no worktrees service in this profile); the relay read **another team's** board, because oots()[0] is not the caller's ancestor. |
|  4e7ae47 | delegated worker | the prompt advertises only callable primitives (the absent line names swarm_worktree); the board **write** is refused for a non-member; the board **read** was refused too - a real defect. |
| 8b91d019 | delegated worker | the fixed relay: the read reaches the board through the caller's own owner and discloses the authority it acted through. |

**The defect.** oardAuthority() walked the lineage from exec.parent, a field the host does not
always fill in for a delegated worker - so the chain was empty and the read was refused. The walk now
starts at the caller and continues through the caller's own owner. Bundle commit 190cd38; the tool
test grew the case that pins it and now runs **63** checks.
**The third probe's evidence, verbatim.** swarm_task list returned "33 task(s) on the board" with
every task's id, revision, owner and subject, and the disclosure line "acted as
session-f8b73c8f-d528-40e0-8525-7f24aee11fd6 (role: lead) on behalf of 8b91d019-bf97-4f96-b184-d4b4a7012e66
- a read-only relay, because the board belongs to the team". swarm_task get on 	ask-1 returned the
whole task body, including its full assignment text. swarm_child list returned "0 child lane(s)".
The defect is closed: a delegated worker reads the board through the caller's own owner, and the
authority it acted under is named in the output.
### 14. One install route (2026-11-08)

The user asked whether the plugin had to be published to the DSH plugin marketplace before the
desktop app's "Add plugin" could install it. **It does not.** The Plugins page takes a package name
with an optional version, a **Git address**, a tarball, or an absolute local path, and the
marketplace bundle (disabled in this profile) is only the *discover* route. The user's answer was to
make the Git address the **only** route: `github:vanpipy/dsh-swarm-workflow`.

**What the route required.** The desktop launcher gives pnpm a PATH built from the DSH support bin
directory plus the **app process's own PATH**, and pnpm shells out to git for a git dependency - so
git must be on the app's PATH. It was on neither the user nor the machine PATH, and no `.env` or
profile setting can fix that (PATH is in the host's bootstrap names, so a layered env applies only
to names the process does not already have). `C:\Program Files\Git\cmd` was added to the **user**
PATH; the running app needs **one restart** before its Plugins page sees git.

**The live proof.** `dsh plugin --profile desktop add github:vanpipy/dsh-swarm-workflow` returned
exit 0, "dependencies: + dsh-swarm-workflow 1.0.0", "Done in 16.8s". The profile now holds a real
directory with the whole bundle, and `list_bundles` reports the source as
`git+https://github.com/vanpipy/dsh-swarm-workflow.git`. Taking the plugin row off and on again
removed and restored the `swarm-engineering` skill in the catalog - the app now loads the
git-installed copy.

**The defect the proof found.** The *first* attempt failed with
`[ERR_PNPM_EPERM] ... rename '..._tmp_25824_4' -> '...dsh-swarm-workflow'`: pnpm could not replace
the **junction** that a linked bundle leaves in the profile's `node_modules`. Worse, the failed
import deleted the interior of the local checkout *through* the junction - the checkout's `.git`
survived as `objects/` and `refs/` only, and `git status` answered "fatal: not a git
repository". The twelve working files were intact, and the checkout was restored from the published
clone (twelve of twelve files equal after normalising CRLF to LF, `git add -A` to refresh the
index's stale stat cache, history and remote intact, `git fsck` clean). The rule is now: remove
the bundle and its junction (`cmd /c rmdir`, the junction only, never `/s`) **before**
installing from git.

**What changed in the bundle.** The README's `## Install` section now documents exactly one route
- the GitHub address, in the app's Plugins page or `dsh plugin --profile desktop add ...` - with
its two preconditions (git on the PATH the app was launched with; the Agent Teams rows enabled), and
the local link moved to a `## Develop` section labelled a development convenience rather than the
install route. The package keeps `"private": true`, so npm refuses to publish it and the single
route is enforced by the manifest, not by a convention. Commit `15e7fc1`, pushed to `main`.

Full detail: `INSTALL.md`.
**The published history was rewritten.** The user chose to scrub the two commit messages that still
named the old scopes, so the history matches the name the plugin ships under. The rewrite touched
messages only - the trees, the author, the committer and both dates are preserved byte for byte
(the raw commit objects were re-pointed at their rewritten parents and written back with
`git hash-object -w -t commit`). `185e1ea` -> `4c5f0cf`, `c9fbf2f` -> `3cec879`; the other
nine commits kept their SHAs. Proof: 11 commits, 0 tree mismatches, the tip's tree unchanged
(`37dc6dd`), `git diff 15e7fc1 232e218` empty, 0 hits for `@local`/`@sages` in the surviving
history, the old objects pruned, and the remote's `main` = `232e218` after
`push --force-with-lease`. Anyone who cloned the old history must re-clone.