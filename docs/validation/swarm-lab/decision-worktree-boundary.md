# Decision — the worktree primitive stays disabled

Date: 2026-11-11
Status: accepted by the human (Team Lead asked, user answered)

## What was decided

The optional bundle `@deepseek-ai/dsh-experimental-tool-worktree` is **not**
installed in the desktop profile. `swarm_worktree` therefore stays absent from
the live surface list, and the swarm workflow plans around it.

This is recorded as a **verified boundary of the host**, not as a gap in the
work.

## The facts behind it

- The registry carries `@deepseek-ai/dsh-experimental-tool-worktree@0.2.1-alpha.2`
  only. The host runs `dsh 0.2.2-rc.1`, and the bundle's requirements
  (`@deepseek-ai/dsh-tools@0.2.1-alpha.2`,
  `@deepseek-ai/dsh-experimental-worktree@0.2.1-alpha.2`) pin the same older
  version.
- `plugin_manager install_bundle target=@deepseek-ai/dsh-experimental-tool-worktree`
  was attempted and rejected with `incompatible-version`. The host warns that
  running it "may cause crashes or data loss", and the only way forward is an
  exact-version exemption.
- The live capability probe confirms the consequence: the `/swarm` output reads
  `**Absent in this session:** `swarm_worktree``.

## Options considered

1. **Keep it disabled** — the human chose this. No host risk, and the workflow
   keeps the surface it actually has.
2. **Grant an exact-version exemption** for the alpha bundle. Rejected: the
   host's own warning names crashes and data loss, and the gain is one
   convenience primitive.
3. **Wait for a compatible release.** Kept as the follow-up: the primitive
   returns on its own when the registry carries a build that matches
   `0.2.2-rc.1`.

## Why

The swarm workflow never depended on `swarm_worktree`. A lane that needs an
isolated tree uses the host's own surfaces, and the runtime note tells the
Coordinator to pick a delegation surface that the live capability block actually
lists. Installing an incompatible alpha bundle into the working profile to
satisfy one optional primitive would trade a known, documented boundary for an
unknown risk.

## Consequences

- `swarm_worktree` appears in the absent line of the live capability block, so
  every session sees that it is not there.
- No requirement in `.swarm/requirements/swarm-lab.md` depends on it.
- Revisit when the registry ships a build that matches the host version; the
  decision needs no other change to be lifted.
