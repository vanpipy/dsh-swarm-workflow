# A1 — Audit the shipped TEXT of @sages/swarm-workflow against the live DSH host

**Role:** Reviewer (independent audit; you change nothing but your report).
**Your files:** `D:\project\.swarm-lab\rounds\AUDIT-TEXT.md` (the only file you write).
**Read-only:** `D:\project\dsh-plugins\swarm-workflow\*` (all ten files), the host, the profile.

## The question

The plugin ships three markdown documents that tell the Coordinator and the workers how to run a swarm
**inside this DSH host**. The host's capabilities change; the documents were written over days and can
drift. The user's instruction for this round is: *"Audit the swarm workflow plugin, ensure it can help
dsh itself."*

So the audit question for YOU is:

> **Every sentence of the shipped text that makes a claim about the HOST — a tool that exists, a service
> that exists, a capability that exists, a limit that exists, a count — is it still true in this host,
> and does the text UNDER-USE what the host can actually do?**

The second half matters as much as the first. The plugin's "host facts" were written by hand; the host
has a large service catalog. A hand-written list is a snapshot; the host is live. Where the plugin
describes less than the host really offers, that is a finding too — but a finding of a different kind:
it is an **opportunity**, and it must be labelled as such.

## How to verify (do not guess)

1. `cordis_inspect_list` → then `cordis_inspect_query` with `platform: "host"`, `provider: "Service"`,
   `method: "listService"` for the full service directory; call it again with `input: {"service": "<key>"}`
   for the exact contract of any service you rely on. The directory is large — the output spills to a
   temp file; use `grep`/`read` with offset+limit on that spill path rather than re-calling.
2. `cordis_inspect_query` with `provider: "Tool"`, `method: "listTools"` for the tools visible to YOU
   (a delegated worker) — that is what a worker actually gets.
3. Read `D:\project\dsh-plugins\swarm-workflow\index.js` (the host half) to see what the plugin
   actually registers and what it hard-codes (e.g. the capability groups, the tool-name lists it probes).
4. Read the three shipped markdown files in full.
5. You may run read-only commands (`pwsh` read-only, `grep`, `read`). You may NOT edit the bundle, the
   profile, or any repository.

## The deliverable

`D:\project\.swarm-lab\rounds\AUDIT-TEXT.md`, in this shape:

### Part 1 — the claim table

One row per host claim. Columns:

| # | claim (file:line) | what the text says | what the host actually offers (with the service/tool you checked) | verdict | recommended fix |
|---|---|---|---|---|---|

Verdict vocabulary: **correct** / **stale** (true once, not now) / **wrong** / **unverifiable from here**.
For every row mark **Verified** (you ran/queried it), **Inferred** (you read the contract, did not exercise it),
or **Not run** — never a bare assertion.

### Part 2 — what the plugin under-uses (opportunities)

The host services a swarm round would benefit from that the shipped text does NOT mention, with the
service key and the method that would serve the need. For each, say in one line what a Coordinator or a
worker could do with it. Rank them by value. (Hint: the host has a `worktrees` service that creates
retained git worktrees; check what the plugin says about worktrees today. Check also what the host
exposes for steering or stopping a delegated worker, and what a delegated worker can reach of the
team task board.)

### Part 3 — the three findings that matter most

Ranked, each with file:line, the evidence, and the smallest change that would fix it.

### Part 4 — your limits

What you did not check, and why.

## Rules

- The user's own prose is not plugin text: `swarm-prompt.md` sections 1–13 (except the plugin-written
  pointer bodies and the plugin's host-facts block below the boundary marker) and `skills/swarm-engineering.md`
  sections 1–10 are the user's words. Do NOT propose editing them for style. DO report a host claim
  inside them if it is false (e.g. the "Jcode" wording) — but report it as a fact about the host, with the
  host's real answer, and leave the decision about the text to the Coordinator.
- No claims about the plugin's quality, taste or length. Claims about facts only.
- No file other than your report. No git writes, no installs, no profile changes, no agents.
