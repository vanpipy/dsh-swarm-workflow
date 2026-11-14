#!/usr/bin/env python3
"""Apply the audit round's host-claim corrections to the shipped prompt text.

The pairs below were derived from the live host's tool schemas and service
contracts (audit lane A1) and from the plugin's own host-backed tools
(`swarm_child`, `swarm_task`, `swarm_worktree`).  Every pair must match
exactly once; a pair that does not match is a failure, not a no-op, so a
re-run can never silently rewrite a different sentence.

Run:  C:\\Python312\\python.exe fix-host-claims.py
"""
import pathlib
import sys

BUNDLE = pathlib.Path(r"D:\project\dsh-plugins\swarm-workflow")

PROMPT = BUNDLE / "swarm-prompt.md"

REPLACEMENTS = [
    # 1. A fork bullet: `send_message` addresses native teammates by name, so a
    #    delegated child is not reachable through it.  The host CAN steer a
    #    continuable child, through the plugin's own `swarm_child` tool.
    (
        "and it cannot be steered afterwards (`send_message` does not reach a subagent).",
        "and it is not a team member, so `send_message` — which addresses native teammates by name — does not reach it; a fork that has gone off-script is usually cheaper to stop (`swarm_child`) than to correct.",
    ),
    # 2. The native-teams bullet: the resume claim was true only of the team
    #    tool, and the host's own service has a narrower, real limit.
    (
        "A teammate keeps its context and can be sent a follow-up, asked to re-verify a remediation, or handed the next task; a `subagent` cannot be resumed.",
        "A teammate keeps its context and can be sent a follow-up, asked to re-verify a remediation, or handed the next task; a delegated `subagent` is not a team member, so it cannot be resumed that way — a continuable child can be steered through `swarm_child`.",
    ),
    # 3. The delegation-surface bullet: the same correction, in the sentence
    #    that tells the Coordinator which surface to pick.
    (
        "A `subagent` is one-shot and independent: use it for a bounded, self-contained piece of work you will not steer or resume.",
        "A `subagent` is independent and starts with a clean context: use it for a bounded, self-contained piece of work. It reports back when it finishes; if you must steer or stop it mid-run, use `swarm_child` — a one-shot child cannot be steered, but any live child of yours can be stopped.",
    ),
    # 4. The assemble() bullet named a plugin-side API that no agent-facing
    #    tool exposes.  Say what a Coordinator can actually do instead.
    (
        "- **You can read the prompt an agent actually receives.** `ctx.systemPrompt.assemble({ agent, scope: agent })` returns the assembled text for that agent, and `ctx.agents.roots()` lists the top-level agents (a delegated worker is owned, so it is not a root). Use that instead of asking a worker what it was given — it is exact, and it costs no agent.",
        "- **What a worker actually receives is the text in this bundle.** The worker prompt and the skill are rendered from these files, so read them here instead of asking a worker to describe its own prompt — the brief is the contract, and the file is the prompt. The one part that differs per session is the capability block, and `/swarm` prints it on demand.",
    ),
]


def main() -> int:
    text = PROMPT.read_text(encoding="utf-8")
    for old, new in REPLACEMENTS:
        count = text.count(old)
        if count != 1:
            print(f"FAILED: {count} matches for: {old[:70]!r}")
            return 1
        text = text.replace(old, new)
    PROMPT.write_text(text, encoding="utf-8", newline="")
    print(f"rewrote {PROMPT.name}: {len(REPLACEMENTS)} replacements")
    return 0


if __name__ == "__main__":
    sys.exit(main())
