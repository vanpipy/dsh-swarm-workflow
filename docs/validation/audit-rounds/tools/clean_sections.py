# -*- coding: utf-8 -*-
"""Replace every section-symbol cross-reference in the shipped bundle with a
self-contained, title-based pointer.

The user's own recovered originals contain no '§' at all, so every replacement
here touches plugin-authored text only.  Each replacement must match exactly
once; the script fails loudly otherwise.
"""
import io
import sys

BUNDLE = r"D:\project\dsh-plugins\swarm-workflow"

PROMPT = BUNDLE + r"\swarm-prompt.md"
WORKER = BUNDLE + r"\swarm-worker-prompt.md"
SKILL = BUNDLE + r"\skills\swarm-engineering.md"

EDITS = [
    (PROMPT,
     "The patterns themselves \u2014 Developer Only, Developer + Tester, Developer + Reviewer, Developer + Tester + Reviewer, Multiple Developers \u2014 and the flow each one implies are defined in the `swarm-engineering` Skill (\u00a711). Load that section when you are choosing a role composition; the role summary stays in \u00a73.",
     "The patterns themselves \u2014 Developer Only, Developer + Tester, Developer + Reviewer, Developer + Tester + Reviewer, Multiple Developers \u2014 and the flow each one implies are defined in the `swarm-engineering` Skill, under *Role Dependencies and Execution Patterns*. Load that section when you are choosing a role composition; the role summary stays in *Role Routing*, here in this policy."),

    (PROMPT,
     "The review scope, the finding classification, the review completion gate, the remediation loop and the verification completion gate are defined in the `swarm-engineering` Skill (\u00a712) \u2014 the reviewer's own procedure is \u00a75 of that Skill and the handoffs are \u00a76 of that Skill. Load that section when you are closing a review or a verification.",
     "The review scope, the finding classification, the review completion gate, the remediation loop and the verification completion gate are defined in the `swarm-engineering` Skill, under *Review and Verification Termination* \u2014 the reviewer's own procedure is under *Reviewer Role* in that Skill and the handoffs under *Role Handoffs*. Load that section when you are closing a review or a verification."),

    (PROMPT,
     "Your obligation stays here: you decide whether findings require action, and you accept the work only against the original acceptance criteria (\u00a711 of this policy).",
     "Your obligation stays here: you decide whether findings require action, and you accept the work only against the original acceptance criteria (see *Integration and Final Acceptance* in this policy)."),

    (PROMPT,
     "The signs of a stalled worker and the recovery procedure are defined in the `swarm-engineering` Skill (\u00a713). Load that section when progress stops; do not restart a completed step without a reason.",
     "The signs of a stalled worker and the recovery procedure are defined in the `swarm-engineering` Skill, under *Stalling Detection and Recovery*. Load that section when progress stops; do not restart a completed step without a reason."),

    (PROMPT,
     "<!-- Added by the @sages/swarm-workflow plugin: host facts for this runtime. Everything above this marker is the user's own policy text, with two deliberate exceptions: \u00a71's dangling `prompt-overlay.md` reference now points at the global execution policy (changed on the user's request), and the bodies of \u00a76, \u00a79 and \u00a710 are plugin-written pointers \u2014 they keep the user's headings and point at the `swarm-engineering` Skill (\u00a711\u2013\u00a713), where the user's own prose was relocated verbatim. \u00a712 is the user's own text, kept verbatim; the host fact below this marker says how this runtime supersedes it. Everything below this marker is plugin-added host context, not policy. -->",
     "<!-- Added by the @sages/swarm-workflow plugin: host facts for this runtime. Everything above this marker is the user's own policy text, with two deliberate exceptions: the *Mission and Ownership* section's dangling `prompt-overlay.md` reference now points at the global execution policy (changed on the user's request), and the bodies of the *Role Dependencies and Execution Patterns*, *Review and Verification Termination* and *Stalling Detection and Recovery* sections are plugin-written pointers \u2014 they keep the user's headings and point at the `swarm-engineering` Skill, where the user's own prose was relocated verbatim under the same titles. *Jcode Runtime and Model Configuration* is the user's own text, kept verbatim; the host fact below this marker says how this runtime supersedes it. Everything below this marker is plugin-added host context, not policy. -->"),

    (PROMPT,
     "- **The policy's \u00a712 was written for another runtime, and it is kept verbatim above.** \u00a712 names Jcode and the model-routing options that runtime documents; that wording is the user's own text and is not edited here.",
     "- **The policy's *Jcode Runtime and Model Configuration* section was written for another runtime, and it is kept verbatim above.** That section names Jcode and the model-routing options that runtime documents; that wording is the user's own text and is not edited here."),

    (PROMPT,
     "- **The skill's \u00a716 and \u00a717 are yours as well as the lanes'.** \u00a716 is the requirement-matching rule every lane reports against: one verdict per requirement with its evidence, two checks per requirement, and a `not demonstrated` requirement that blocks acceptance until it is checked or you record a waiver with a reason in the ledger row. \u00a717 is the requirement handover: you write the requirements file",
     "- **The skill's *Requirement Matching* and *Requirement handover* sections are yours as well as the lanes'.** *Requirement Matching* is the rule every lane reports against: one verdict per requirement with its evidence, two checks per requirement, and a `not demonstrated` requirement that blocks acceptance until it is checked or you record a waiver with a reason in the ledger row. *Requirement handover* is the handover: you write the requirements file"),

    (PROMPT,
     "The practice learned in the field now lives in the `swarm-engineering` Skill (\u00a714, \"Coordinator Practice\"): the parallel-lane file rule,",
     "The practice learned in the field now lives in the `swarm-engineering` Skill, under *Coordinator Practice*: the parallel-lane file rule,"),

    (WORKER,
     "> \u2014 `swarm-prompt.md` \u00a71",
     "> \u2014 the `swarm-prompt.md` section *Mission and Ownership*"),

    (WORKER,
     "Its \u00a711\u2013\u00a713 are Coordinator-side methods; you do not need them. Its \u00a715 holds the host facts that apply to you too. Its \u00a716 binds you whenever your assignment carries requirements \u2014 the Reviewer always, any lane when it has to report against one: one verdict per requirement with its evidence, and two checks per requirement. Its \u00a717 says where the requirements live when the work has a requirements file:",
     "Its *Role Dependencies and Execution Patterns*, *Review and Verification Termination* and *Stalling Detection and Recovery* sections are Coordinator-side methods; you do not need them. Its *Host facts \u2014 this runtime* section holds the host facts that apply to you too. Its *Requirement Matching* section binds you whenever your assignment carries requirements \u2014 the Reviewer always, any lane when it has to report against one: one verdict per requirement with its evidence, and two checks per requirement. Its *Requirement handover* section says where the requirements live when the work has a requirements file:"),

    (WORKER,
     "> \u2014 `swarm-prompt.md` \u00a77",
     "> \u2014 the `swarm-prompt.md` section *Assignment Contract*"),

    (WORKER,
     "> \u2014 `swarm-engineering` \u00a78",
     "> \u2014 the `swarm-engineering` section *Assignment and Reporting Contract*"),

    (WORKER,
     "> \u2014 `swarm-prompt.md` \u00a74.4",
     "> \u2014 the `swarm-prompt.md` section *Investigation Handoff*"),

    (WORKER,
     "except the \u00a71 pointer, which the user asked to change.",
     "except the pointer to the global execution policy, which the user asked to change."),

    (WORKER,
     "The skill's \u00a71 names the policy it does not replace, and its \u00a72 requires every role to follow the global `Goal-Directed Execution Principle` \u2014 that requirement reaches you here.",
     "The skill's *Purpose* section names the policy it does not replace, and its *Common Engineering Principles* section requires every role to follow the global `Goal-Directed Execution Principle` \u2014 that requirement reaches you here."),

    (SKILL,
     "<!-- Added by the @sages/swarm-workflow plugin: this file is the user's own skill text. Two deliberate exceptions: the \u00a71 bullet below that points at the global execution policy (changed on the user's request, because `prompt-overlay.md` does not exist), and the tail of the file: \u00a711\u2013\u00a713 are the USER's own prose relocated verbatim (the orchestration policy's \u00a76, \u00a79 and \u00a710), while \u00a714\u2013\u00a717 are the plugin's own rules. Each section sits behind its own marker comment. -->",
     "<!-- Added by the @sages/swarm-workflow plugin: this file is the user's own skill text. Two deliberate exceptions: the bullet in the *Purpose* section below that points at the global execution policy (changed on the user's request, because `prompt-overlay.md` does not exist), and the tail of the file: the three sections *Role Dependencies and Execution Patterns*, *Review and Verification Termination* and *Stalling Detection and Recovery* are the USER's own prose relocated verbatim from the orchestration policy's matching sections, while *Coordinator Practice*, *Host facts \u2014 this runtime*, *Requirement Matching* and *Requirement handover* are the plugin's own rules. Each section sits behind its own marker comment. -->"),

    (SKILL,
     "<!-- Added by the @sages/swarm-workflow plugin: the Coordinator-side methods the orchestration policy no longer carries inline. \u00a711\u2013\u00a713 are the USER's own prose \u2014 the orchestration policy's \u00a76, \u00a79 and \u00a710, relocated verbatim \u2014 and \u00a714\u2013\u00a717 are the plugin's own rules. A worker needs its own role section (\u00a73, \u00a74, \u00a75), the shared contract in \u00a78, and the requirement rules in \u00a716 and \u00a717. -->",
     "<!-- Added by the @sages/swarm-workflow plugin: the Coordinator-side methods the orchestration policy no longer carries inline. The three sections *Role Dependencies and Execution Patterns*, *Review and Verification Termination* and *Stalling Detection and Recovery* are the USER's own prose \u2014 relocated verbatim from the orchestration policy's matching sections \u2014 and the sections after them are the plugin's own rules. A worker needs its own role section (*Developer Role*, *Tester Role*, *Reviewer Role*), the shared contract in *Assignment and Reporting Contract*, and the requirement rules in *Requirement Matching* and *Requirement handover*. -->"),

    (SKILL,
     "<!-- Added by the @sages/swarm-workflow plugin: the Coordinator practice that the orchestration policy no longer carries inline. \u00a714 is Coordinator-side; a worker needs its own role section (\u00a73, \u00a74, \u00a75) and the shared contract in \u00a78. -->",
     "<!-- Added by the @sages/swarm-workflow plugin: the Coordinator practice that the orchestration policy no longer carries inline. *Coordinator Practice* is Coordinator-side; a worker needs its own role section (*Developer Role*, *Tester Role*, *Reviewer Role*) and the shared contract in *Assignment and Reporting Contract*. -->"),

    (SKILL,
     "\u00a717 carries the full handover rule, \u00a716 the matching rule every lane reports against.",
     "The *Requirement handover* section carries the full handover rule and *Requirement Matching* the matching rule every lane reports against."),

    (SKILL,
     "- This host is the DeepSeek Harness, not Jcode. Where \u00a710 says \"the active Jcode version\", read it as the runtime you actually run in: check the tool surfaces you are given, and use the ones the host lists. The same applies to the orchestration policy's \u00a712, whose runtime-specific wording belongs to another runtime.",
     "- This host is the DeepSeek Harness, not Jcode. Where *Skill Availability and Execution* says \"the active Jcode version\", read it as the runtime you actually run in: check the tool surfaces you are given, and use the ones the host lists. The same applies to the orchestration policy's *Jcode Runtime and Model Configuration* section, whose runtime-specific wording belongs to another runtime."),
]


def main() -> int:
    by_file = {}
    for path, old, new in EDITS:
        by_file.setdefault(path, []).append((old, new))

    changed = 0
    for path, pairs in by_file.items():
        with io.open(path, "r", encoding="utf-8", newline="") as fh:
            text = fh.read()
        for old, new in pairs:
            n = text.count(old)
            if n != 1:
                print("FAIL %s: %d matches for %r" % (path, n, old[:70]))
                return 1
            text = text.replace(old, new)
            changed += 1
        with io.open(path, "w", encoding="utf-8", newline="") as fh:
            fh.write(text)
        print("rewrote %s (%d replacements)" % (path, len(pairs)))

    print("total replacements: %d" % changed)
    return 0


if __name__ == "__main__":
    sys.exit(main())
