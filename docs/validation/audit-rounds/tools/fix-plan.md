# Fix plan — the audit round's corrections to @sages/swarm-workflow

Status: PREPARED, NOT YET APPLIED (the independent review of the wiring is still running; the bundle must not move under it).

## Why these fixes

The live probe (fresh subagent, 61 tools) found three defects the code alone could not show:

1. `swarm_worktree` was advertised in the capability block but the host has **no worktrees service** — the bundle `@deepseek-ai/dsh-experimental-tool-worktree` is `enabled:false` in this profile, so the tool could only ever error.
2. The read-only board relay picked `ctx.agents.roots()[0]`. `roots()` is **global across every live agent in the process**, so the relay read ANOTHER team's board: the probe saw "0 task(s)" while the Coordinator's own board holds 33+.
3. `wait_agent` and `team_task_list` are absent from a worker's registry but were not named in the "Absent in this session" line, because that line was built from the capability groups only.

## F1 — register a tool only when its backing service exists

`index.js` `buildSwarmTools(ctx)`: the array literal becomes `const definitions = [...]` and the return becomes a filter over the service that backs each tool.

```js
  const definitions = [
    { name: 'swarm_worktree', ... },
    { name: 'swarm_task', ... },
    { name: 'swarm_child', ... },
  ]
  // A primitive is registered only when the host service behind it exists, so
  // the capability block never advertises a tool that can only fail.
  const services = { swarm_worktree: 'worktrees', swarm_task: 'agentTeams', swarm_child: 'subagents' }
  return definitions.filter((definition) => optionalService(ctx, services[definition.name]) !== undefined)
```

## F2 — relay the board through the caller's own lineage, never an arbitrary root

`index.js`: a new `lineage(agent)` helper walks the ownership chain with the host's own `agents.isOwnedBy(id, owner)` (the only parent relation the host exposes — `Agent` is `{ id }` and has no parent field), and `boardAuthority` picks the NEAREST agent in that chain that the team service recognises as a member.

```js
  const lineage = (agent) => {
    const all = ctx.agents.list()
    const chain = []
    let current = agent
    for (let depth = 0; depth < 16; depth += 1) {
      const owner = all.find((candidate) => {
        if (candidate.id === current.id) return false
        try { return ctx.agents.isOwnedBy(current.id, candidate) } catch { return false }
      })
      if (owner === undefined) break
      chain.push(owner)
      current = owner
    }
    return chain
  }
```

```js
  const boardAuthority = (agent) => {
    const membership = membershipOf(agent)
    if (membership !== undefined) return { authority: agent, relayed: false }
    for (const candidate of lineage(agent)) {
      if (membershipOf(candidate) !== undefined) return { authority: candidate, relayed: true }
    }
    throw new Error('This session is not a team member, and no agent in its own lineage is one either, so the board cannot be read from here. Ask the Coordinator for the task text.')
  }
```

## F3 — the absent line must cover every tool the shipped text names

`index.js` `renderPrompt`: `referenced: referencedTools(raw)` becomes the union of the rendered file's references and `options.referenced`; `apply()` passes the references of BOTH prompt files, so a tool named in the Coordinator prompt (`wait_agent`, `team_task_list`) is reported absent in a worker's block instead of being silently missing.

## F4 — `projectTask` needs defensive defaults

`blockedBy`, `writeScopes` and `writeScopeWarnings` default to `[]` when the host returns them undefined; the render reads `task.blockedBy.length`.

## F5 — the host note on the registered skill description

The skill file keeps the user's frontmatter byte for byte. The REGISTRATION prepends a separate host note, because the catalog line is host-visible and "Jcode Swarm workers" is not this host:

```js
const HOST_NOTE = 'On this host the swarm runs in DeepSeek Harness, not Jcode; the role methods are unchanged.'
```

## F6 — one bullet per primitive, each gated by its own tool

`swarm-prompt.md` and `swarm-worker-prompt.md`: the single "Host-backed swarm primitives" bullet becomes three bullets, each with its own `<!-- swarm:requires … -->` marker, so a host without the worktrees service drops only the worktree bullet.

## F7 — the relay wording follows the code

"reads it read-only through the team root" becomes "reads it read-only through the session that spawned it".

## The tests that must go green

`D:\project\.swarm-lab\rounds\tools\test-swarm-tools.mjs`:
- a context WITHOUT the worktrees service yields two tools, not three;
- the relay goes through the caller's own owner, and the stub proves the RIGHT board was read (the stub's owner returns the Coordinator's tasks, another root returns a different board);
- a lineage without a member refuses the read;
- `projectTask` defaults.

`D:\project\.swarm-lab\rounds\tools\test-render-prompt.mjs`:
- the absent line names a tool the OTHER prompt file mentions;
- the primitives bullet is dropped when its own tool is missing, and kept when it is there.

## The live proof that must follow

1. `set_plugin include:swarm-workflow false` → the skill leaves the catalog; `true` → it returns.
2. A fresh read-only subagent: the registry must NOT contain `swarm_worktree` on this host, and the "Absent in this session" line must name it; `swarm_task` list must show the Coordinator's tasks (not "0 task(s)"); `wait_agent` must be named as absent.
