# The section-symbol references are gone

**The request (2026-11-08, the user, verbatim):** "the text like "§7" is useless, please clean them in swarm workflow".

## What was found

Every `§` in the bundle was a cross-reference to a section, and there were **20 of them** across three files (21 lines changed in the end — a fresh probe found one more pointer that named a quoted phrase instead of a title, and it was fixed too):

| File | References | What they pointed at |
|---|---|---|
| `swarm-prompt.md` | 8 | the skill's role-pattern, review, stalling and requirement sections; the policy's own acceptance section; the boundary marker; two host facts; the Coordinator-practice pointer |
| `swarm-worker-prompt.md` | 7 | the policy's four quoted passages; the skill pointer sentence; the boundary marker; the host fact about the global execution policy |
| `skills/swarm-engineering.md` | 5 | the three boundary markers; the requirement rules in the Coordinator practice; the Jcode host fact |

**None of them was the user's text.** The recovered originals — `policy_hit_1.txt` (327 lines) and `user_skill_paste.md` (481 lines) — contain **zero** `§` characters. Every reference was written by the plugin: the pointer bodies that replaced the user's sections 6, 9 and 10 at the user's own request ("Please optimize them"), the plugin's own rules, and the boundary markers. So the cleanup touched no line of the user's own words.

## Why the form was the problem

A pointer that says `§12` does not say *which* document, and it rots the moment a section is inserted — the ladder already lost 33 citations to a four-line insert in one requirements file. A worker that loads the skill sees a different numbering from the one the prompt used.

## What replaced them

Each pointer now names the document **and** the section by its title:

- "defined in the `swarm-engineering` Skill, under *Role Dependencies and Execution Patterns*"
- "the reviewer's own procedure is under *Reviewer Role* in that Skill and the handoffs under *Role Handoffs*"
- "you accept the work only against the original acceptance criteria (see *Integration and Final Acceptance* in this policy)"
- "Its *Requirement Matching* section binds you whenever your assignment carries requirements"
- "> — the `swarm-prompt.md` section *Assignment Contract*"

The section **headings** keep their numbers ("## 16. Requirement Matching"), because the numbering is the user's own document style and the headings are structure, not reference. Only the *cross-references* changed.

## Verification

- `grep '§'` over the whole bundle (every file, including `index.js`, `client.js` and the locale files): **0 occurrences**.
- The render unit test passes, and it now carries a new guard — `full: no section-symbol reference survives` — that fails if a `§` ever comes back into either prompt file. The one check that pinned the old wording (`minimal: unmarked bullets kept`) was updated to the new sentence, not weakened: it still asserts that a specific unmarked bullet survives the capability gating.
- The integrity diffs against the user's recovered originals are **unchanged**: policy 32 insertions / 96 deletions, skill 179 insertions / 6 deletions. The only original lines that still differ are the three the user asked to change (the `prompt-overlay.md` pointer, the one section-1 bullet) plus the ten subsection headings that the pointer bodies relocated into the skill.
- The bundle was re-applied live: `include:swarm-workflow` off → the `swarm-engineering` skill leaves the catalog; on → it returns.
- A fresh read-only probe subagent confirmed the **served** worker prompt: the section sign appears **zero times** in the whole system prompt (swarm block, host facts, harness text), every pointer inside the swarm block names its section by title, and the only number-like tokens left are file citations (`file:line`) and the requirements path. The probe also flagged two soft spots that no `§` check would catch — the pointer at the end of *What you report back* named the skill without a title, and the host fact pointed at the skill's *"the active Jcode version"* phrase instead of its section. Both were rewritten (*Common Engineering Principles* / *Role Handoffs*, and *Skill Availability and Execution*), which is why the diff is 21 lines and not 20.

## The tool

`tools/clean_sections.py` holds the twenty exact replacements and asserts that each old string occurs exactly once — it fails loudly rather than half-applying. It is kept with the other tools in this ledger repo.

## Commits

- bundle: `b68083f` "refactor(prompt): name every section by its title, not by a number" — 3 files, 21 insertions, 21 deletions (one line per reference).
