/**
 * Host half of the swarm-workflow bundle.
 *
 * It contributes the swarm workflow that the global execution policy defers to
 * `swarm-prompt.md`: the session's main agent is the swarm Coordinator and
 * receives the orchestration policy, while a delegated worker receives the
 * worker prompt. It also registers the `swarm-engineering` skill that carries
 * the role-specific engineering methods, and a `/swarm` command that reports
 * what this session can actually do.
 *
 * The bundle ships three markdown files and nothing else:
 * `swarm-prompt.md` (the Coordinator policy plus this runtime's host facts for
 * the Coordinator), `swarm-worker-prompt.md` (the worker prompt plus the host
 * facts a worker needs) and `skills/swarm-engineering.md` (the role methods).
 * The plugin only reads them and never rewrites them.
 *
 * Two properties make the workflow track the host instead of a snapshot:
 * every file is re-read when it changes on disk, and the host facts are
 * generated from the live tool registry, so a prompt states only the surfaces
 * this session can actually call.
 */
import { readFileSync, statSync } from 'node:fs'

/**
 * Services this plugin needs: prompt assembly, the live agent registry, and the
 * skill registry.
 *
 * The tool registry and the command registry are NOT declared here. Both are
 * fetched defensively (see toolService() and the commands lookup in apply()),
 * because this bundle must still load — and still ship a prompt — on a host
 * that has no command service at all. A declared service that the host lacks
 * would take the whole plugin down instead of one feature.
 */
export const inject = ['systemPrompt', 'agents', 'skills']

/** Placement of the swarm section: after the tool sections, before the deliverable references. */
const SECTION_ORDER = 8000

/** Origin label the skill registry requires on every loaded skill definition. */
const SKILL_SOURCE = '@sages/swarm-workflow'

/** The three bundled markdown files, relative to this module. */
const COORDINATOR_PROMPT = './swarm-prompt.md'
const WORKER_PROMPT = './swarm-worker-prompt.md'
const SKILL_FILE = './skills/swarm-engineering.md'

/** Line the plugin replaces with the live capability block. */
const CAPABILITY_MARKER = '<!-- swarm:capabilities -->'

/**
 * Trailing marker that ties one prompt bullet to the tools it talks about.
 *
 * Inside one marker, ',' separates tools that are ALL required and '|' separates
 * alternatives of which ONE is enough. A marker with no tool list requires
 * nothing. A line may carry several markers; all of them have to be satisfied.
 *
 * The pattern tolerates a hand-edited marker: the closing sequence may carry
 * whitespace before '>' and the marker name is matched case-insensitively, so
 * `<!-- swarm:requires subagent-- >` and `<!-- SWARM:REQUIRES subagent -->`
 * are gated instead of shipping raw.
 */
const REQUIRE_MARKER = /<!--\s*swarm:requires\s*([^>]*?)--\s*>/gi

/**
 * The same marker, used to strip it from the rendered text.
 *
 * The strip is deliberately looser than the parser: it also removes a marker
 * that was never closed, so a hand-edited bundle never ships a raw comment to
 * the model.
 */
const REQUIRE_MARKER_STRIP = /<!--\s*swarm:requires[^\n]*?(?:--\s*>|$)/gim

/** Any text that looks like a requirement marker, well-formed or not. */
const REQUIRE_MARKER_LOOSE = /swarm:requires/gi

/**
 * The description a skill must carry, used when the bundled skill file is
 * missing or its frontmatter has none.
 *
 * The host refuses to register a skill without a description, and that refusal
 * would take the whole plugin down with it — the prompt section and the
 * `/swarm` command included.
 */
const DEFAULT_SKILL_DESCRIPTION =
  'Engineering execution methods for swarm workers: bounded investigation, Developer implementation, Tester verification, Reviewer code review, role boundaries, handoffs, and evidence-based completion.'

/** The prefix readText uses when a bundled file cannot be read. */
const FILE_ERROR_PREFIX = '> **The swarm bundle file'

/**
 * The host note prepended to the skill's registered description.
 *
 * The description in the skill file is the user's own text and stays byte for
 * byte; the runtime this plugin runs on is named in front of it, because the
 * catalog line is what an agent reads before it decides to load the skill.
 */
const HOST_NOTE =
  'On this host the runtime is DeepSeek Harness, not Jcode: the methods are the same, and the live surfaces are the ones the swarm prompt names. '

/** How long a probed tool list stays valid before it is probed again. */
const CAPABILITY_TTL_MS = 5000

/**
 * The surfaces the swarm workflow can use, grouped as the prompt shows them.
 * Each entry names the tool that proves the surface exists in this host.
 */
const CAPABILITY_GROUPS = [
  {
    group: 'Delegation',
    items: [
      { tool: 'subagent', text: '`subagent` — a worker with its own context' },
      { tool: 'subagent_fork', text: '`subagent_fork` — a worker that inherits this conversation' },
      { tool: 'workflow', text: '`workflow` — a scripted fan-out across many workers' },
      { tool: 'spawn_teammate', text: 'native teammate (`spawn_teammate`) — durable, steerable, resumable' },
    ],
  },
  {
    group: 'Coordination',
    items: [
      { tool: 'team_task_create', text: 'shared task board (`team_task_create`)' },
      { tool: 'create_goal', text: 'session goal (`create_goal`)' },
      { tool: 'todo_write', text: 'round ledger (`todo_write`)' },
      { tool: 'ask_user_question', text: 'ask the human (`ask_user_question`)' },
      { tool: 'schedule_create', text: 'reminders (`schedule_create`)' },
    ],
  },
]
// This list holds the HOST's own surfaces only. The tools this bundle adds
// are named by the prompt bullets that mention them, and a bullet is kept
// only when its tool is registered, so the block never advertises a
// primitive that this host cannot call.

/** Cached file contents, keyed by path, invalidated by the file's mtime and size. */
const fileCache = new Map()

/** Cached tool-name lists, keyed by the scope they were probed for. */
const capabilityCache = new Map()

/**
 * Read one bundled text file relative to this module.
 *
 * The file is re-read whenever its mtime or size changed, so an edit to the
 * bundle is live in the next prompt without a bundle re-apply.
 * @param {string} relativePath - path relative to this file.
 * @returns {string} the current file content.
 */
function readText(relativePath) {
  const url = new URL(relativePath, import.meta.url)
  let stamp = 'missing'
  try {
    const info = statSync(url)
    stamp = `${info.mtimeMs}:${info.size}`
  } catch {
    return `> **The swarm bundle file \`${relativePath}\` is missing.** This prompt is incomplete, and the host cannot ship it.`
  }
  const cached = fileCache.get(relativePath)
  if (cached !== undefined && cached.stamp === stamp) return cached.text
  let text
  try {
    text = readFileSync(url, 'utf8')
  } catch (error) {
    return `> **The swarm bundle file \`${relativePath}\` could not be read** (${error.message}). This prompt is incomplete, and the host cannot ship it.`
  }
  fileCache.set(relativePath, { stamp, text })
  return text
}

/**
 * Split a skill file into its frontmatter fields and its body.
 *
 * The skill file keeps the standard frontmatter shape, so its name and
 * description live in one place instead of being duplicated in this module.
 * @param {string} raw - the raw file content.
 * @returns {{ name: string, description: string, content: string }} the parsed skill.
 */
function parseSkillFile(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (match === null) {
    return { name: 'swarm-engineering', description: DEFAULT_SKILL_DESCRIPTION, content: raw }
  }
  const fields = {}
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line)
    if (field !== null) fields[field[1].toLowerCase()] = field[2].trim()
  }
  return {
    name: fields.name ?? 'swarm-engineering',
    // A skill without a description is refused by the host, and that refusal
    // would abort the whole plugin — the prompt section included.
    description: fields.description === undefined || fields.description.length === 0
      ? DEFAULT_SKILL_DESCRIPTION
      : fields.description,
    content: raw.slice(match[0].length),
  }
}

/**
 * Resolve the agent a prompt assembly belongs to.
 *
 * The assembly context carries the agent directly, and its scope is the agent
 * itself, so both are accepted.
 * @param {object} context - the prompt assembly context.
 * @returns {{ id: string } | undefined} the agent, when the context names one.
 */
function resolveAgent(context) {
  const candidate = context?.agent ?? context?.scope
  return typeof candidate?.id === 'string' ? candidate : undefined
}

/**
 * Whether an assembly belongs to the session's main agent, the swarm Coordinator.
 *
 * Top-level agents are the runtime roots; a delegated subagent is owned by its
 * parent and therefore not a root.
 * @param {object} ctx - the plugin context.
 * @param {object} context - the prompt assembly context.
 * @returns {boolean} true for the Coordinator prompt.
 */
function isCoordinator(ctx, context) {
  const agent = resolveAgent(context)
  // An assembly that names no agent is the session's own prompt, and the
  // session's own agent is the Coordinator. A delegated worker always resolves
  // to an agent that is not a root, so it never takes this branch.
  if (agent === undefined) return true
  return ctx.agents.roots().some((root) => root.id === agent.id)
}

/**
 * The host's tool registry, when this host has one.
 * @param {object} ctx - the plugin context.
 * @returns {object | undefined} the tool service.
 */
function toolService(ctx) {
  try {
    if (ctx.tools !== undefined) return ctx.tools
  } catch {
    // A missing service accessor throws in some hosts; fall through to get().
  }
  try {
    if (typeof ctx.get === 'function') return ctx.get('tools')
  } catch {
    return undefined
  }
  return undefined
}

/**
 * The names of the tools this agent can call, probed from the live registry.
 *
 * The scoped view is preferred, because a host may register a tool for one
 * agent only; the global view is the fallback when no scope resolves.
 * @param {object} ctx - the plugin context.
 * @param {object} context - the prompt assembly context.
 * @returns {string[] | undefined} the visible tool names.
 */
function probeToolNames(ctx, context) {
  const tools = toolService(ctx)
  if (tools === undefined) return undefined
  const agent = resolveAgent(context)
  const live = agent === undefined ? undefined : ctx.agents.get(agent.id)
  const scope = live ?? agent
  const key = scope === undefined ? 'global' : String(scope.id ?? 'scope')
  const cached = capabilityCache.get(key)
  const now = Date.now()
  if (cached !== undefined && now - cached.at < CAPABILITY_TTL_MS) return cached.names
  let names
  try {
    const schemas = scope === undefined ? tools.schemas() : tools.schemas(scope)
    names = schemas.map((schema) => schema.name)
  } catch {
    names = undefined
  }
  if (names === undefined || names.length === 0) {
    try {
      names = tools.schemas().map((schema) => schema.name)
    } catch {
      return undefined
    }
  }
  // An empty registry is not a working registry: it means the probe found
  // nothing, and treating that as "no tool is present" would drop every gated
  // bullet and report a tool count of zero.
  if (names.length === 0) return undefined
  capabilityCache.set(key, { at: now, names })
  return names
}

/**
 * The live capability block: what this session can actually call.
 * @param {string[] | undefined} names - the visible tool names.
 * @param {object} options - rendering options.
 * @param {boolean} options.command - whether the `/swarm` command is registered.
 * @param {string[]} options.referenced - tools named by a prompt marker.
 * @returns {string} the block.
 */
function capabilityBlock(names, options = {}) {
  if (names === undefined) {
    return [
      '## Host capabilities — not probed',
      '',
      'This host exposed no tool registry while this prompt was assembled, so the swarm surfaces could not be probed. Nothing was filtered out: every bullet is kept, and a surface named in one of them may still be absent. Verify a surface before you plan around it.',
    ].join('\n')
  }
  const present = (tool) => names.includes(tool)
  const lines = []
  for (const { group, items } of CAPABILITY_GROUPS) {
    const available = items.filter((item) => present(item.tool)).map((item) => item.text)
    if (available.length > 0) lines.push(`- **${group}:** ${available.join(' · ')}`)
  }
  const absent = CAPABILITY_GROUPS
    .flatMap(({ items }) => items)
    .filter((item) => !present(item.tool))
    .map((item) => item.tool)
  // A tool named by a marker but missing from the registry is a silent drop
  // unless it is named here — a typo in a marker must not look like a
  // deliberate omission.
  for (const tool of options.referenced ?? []) {
    if (!present(tool) && !absent.includes(tool)) absent.push(tool)
  }
  // The absent line is only worth printing when something is actually missing;
  // a host that offers every probed surface gets the plain list.
  if (absent.length > 0) {
    lines.push(`- **Absent in this session:** ${absent.map((tool) => `\`${tool}\``).join(' · ')} — do not plan around these.`)
  }
  if (options.command === true) {
    lines.push('- **`/swarm`** — print this block on demand, without spending a model turn')
  }
  lines.push(`- **Tools visible to this agent:** ${names.length}`)
  return [
    '## Host capabilities — probed live',
    '',
    "Probed from this host's tool registry while this prompt was assembled. This list is the ground truth for this session: a surface that is listed is callable now, and a surface that is absent must not be planned around.",
    '',
    ...lines,
  ].join('\n')
}

/**
 * The tool names a prompt's markers refer to.
 * @param {string} raw - the bundled markdown.
 * @returns {string[]} the referenced tool names, in the order they appear.
 */
function referencedTools(raw) {
  const tools = []
  for (const marker of raw.matchAll(REQUIRE_MARKER)) {
    for (const group of marker[1].split(',')) {
      for (const tool of group.split('|')) {
        const name = tool.trim()
        if (name.length > 0 && !tools.includes(name)) tools.push(name)
      }
    }
  }
  return tools
}

/**
 * Whether one prompt line survives capability gating.
 *
 * A line may carry several `swarm:requires` markers, and every one of them has
 * to be satisfied. Within a marker, ',' separates tools that are ALL required
 * and '|' separates alternatives of which ONE is enough.
 *
 * A marker that cannot be parsed — a hand-edited one, a half-written one — is
 * treated as unsatisfied. A bullet whose requirement is unreadable is not a
 * bullet this host can vouch for.
 * @param {string} line - the markdown line.
 * @param {string[]} names - the visible tool names.
 * @returns {boolean} true when the line may stay.
 */
function isLineSatisfied(line, names) {
  const parsed = [...line.matchAll(REQUIRE_MARKER)]
  // Every marker-shaped occurrence has to be one this code understands.
  if ([...line.matchAll(REQUIRE_MARKER_LOOSE)].length > parsed.length) return false
  for (const marker of parsed) {
    const groups = marker[1]
      .split(',')
      .map((group) => group.split('|').map((tool) => tool.trim()).filter((tool) => tool.length > 0))
      .filter((group) => group.length > 0)
    // A marker without a tool list requires nothing.
    if (groups.length === 0) continue
    if (!groups.every((group) => group.some((tool) => names.includes(tool)))) return false
  }
  return true
}

/**
 * Render one bundled prompt for one agent.
 *
 * A bullet whose marker names a missing tool is dropped, so the prompt never
 * describes a surface this host does not offer, and the live capability block
 * replaces the marker line.
 * @param {string} raw - the bundled markdown.
 * @param {string[] | undefined} names - the visible tool names.
 * @param {object} options - rendering options.
 * @returns {string} the rendered prompt.
 */
export function renderPrompt(raw, names, options = {}) {
  // An empty registry is not a working registry: it means the probe found
  // nothing, so nothing can be gated on it and nothing may be reported absent.
  const probed = names === undefined || names.length === 0 ? undefined : names
  let text = raw
  if (probed !== undefined) {
    const kept = []
    for (const line of text.split('\n')) {
      if (!isLineSatisfied(line, probed)) continue
      kept.push(line)
    }
    text = kept.join('\n')
  }
  text = text.replace(REQUIRE_MARKER_STRIP, '')
  // The referenced set is every tool the shipped text names — this file and
  // the other prompt of the same bundle — so a lane is told about a surface
  // it cannot call even when the mention sits in the other prompt.
  const referenced = [...new Set([
    ...referencedTools(raw),
    ...(Array.isArray(options.referenced) ? options.referenced : []),
  ])]
  const block = capabilityBlock(probed, { ...options, referenced })
  if (text.includes(CAPABILITY_MARKER)) {
    text = text.replace(CAPABILITY_MARKER, () => block)
  } else {
    text = `${text.trimEnd()}\n\n${block}\n`
  }
  return text
}

/**
 * The names of the host-backed tools this plugin contributes.
 *
 * They are the swarm's own way into the host's primitives: the retained Git
 * worktree, the shared board and the child lanes. Every one of them is a thin
 * pass-through to a host service, so the host keeps the behaviour and the
 * plugin only makes it reachable from a lane.
 */
export const SWARM_TOOL_NAMES = ['swarm_worktree', 'swarm_task', 'swarm_child']

/**
 * The host service behind each swarm tool.
 *
 * A tool is registered only when the host has that service, so the prompt
 * never advertises a primitive that this host can only fail at.
 * @type {Record<string, string>}
 */
export const SWARM_TOOL_SERVICES = {
  swarm_worktree: 'worktrees',
  swarm_task: 'agentTeams',
  swarm_child: 'subagents',
}

/**
 * One host service, when this host has it.
 *
 * The plugin declares only the services it cannot work without, so every
 * other service is fetched defensively: a host without the worktrees service
 * still loads the plugin, still ships the prompt, and reports the missing
 * service when a lane calls the tool.
 * @param {object} ctx - the plugin context.
 * @param {string} key - the service key.
 * @returns {object | undefined} the service, when the host has one.
 */
function optionalService(ctx, key) {
  try {
    if (ctx[key] !== undefined) return ctx[key]
  } catch {
    // A missing service accessor throws in some hosts; fall through to get().
  }
  try {
    if (typeof ctx.get === 'function') return ctx.get(key)
  } catch {
    return undefined
  }
  return undefined
}

/**
 * A text content block, the host's plain result form.
 * @param {string} text - the text.
 * @returns {{ type: string, text: string }} the block.
 */
function textBlock(text) {
  return { type: 'text', text }
}

/**
 * The agent a tool call belongs to.
 * @param {object} exec - the tool run context.
 * @returns {object | undefined} the agent, when the call names one.
 */
function callingAgent(exec) {
  const agent = exec?.agent
  return typeof agent?.id === 'string' ? agent : undefined
}

/**
 * Project one board task into the compact shape a lane reads.
 * @param {object} task - the host's task view.
 * @returns {object} the compact task.
 */
function projectTask(task) {
  return {
    id: task.id,
    revision: task.revision,
    subject: task.subject,
    status: task.status,
    owner: task.ownerName,
    ready: task.ready,
    blockedBy: Array.isArray(task.blockedBy) ? task.blockedBy : [],
    writeScopes: Array.isArray(task.writeScopes) ? task.writeScopes : [],
    writeScopeWarnings: Array.isArray(task.writeScopeWarnings) ? task.writeScopeWarnings : [],
    description: task.description,
  }
}

/**
 * Build the host-backed swarm tools.
 *
 * Each tool is a pass-through to one host service and never keeps state of its
 * own: the worktree comes from the host's worktrees service, the board from
 * the agent teams service, and the child lanes from the subagents service. The
 * calling agent is the authority for all three, so a lane acts on its own
 * behalf and never on somebody else's.
 * @param {object} ctx - the plugin context.
 * @returns {object[]} the tool definitions, ready for the tool registry.
 */
export function buildSwarmTools(ctx) {
  /**
   * The host's worktrees service.
   * @returns {object} the service.
   */
  const requireWorktrees = () => {
    const service = optionalService(ctx, 'worktrees')
    if (service === undefined) {
      throw new Error('This host has no worktrees service, so no retained worktree can be created. Fall back to a plain directory or a branch in the current checkout.')
    }
    return service
  }

  /**
   * The host's agent teams service.
   * @returns {object} the service.
   */
  const requireTeams = () => {
    const service = optionalService(ctx, 'agentTeams')
    if (service === undefined) {
      throw new Error('This host has no agent teams service, so the shared board does not exist in this session.')
    }
    return service
  }

  /**
   * The host's subagents service.
   * @returns {object} the service.
   */
  const requireSubagents = () => {
    const service = optionalService(ctx, 'subagents')
    if (service === undefined) {
      throw new Error('This host has no subagents service, so this session has no child lanes to list, steer or stop.')
    }
    return service
  }

  /**
   * The team this session belongs to, when it belongs to one.
   * @param {object} agent - the calling agent.
   * @returns {object | undefined} the membership.
   */
  const membershipOf = (agent) => {
    const teams = requireTeams()
    try {
      return teams.tryMembership(agent)
    } catch {
      return undefined
    }
  }

  /**
   * The agent that owns an agent, when the host still knows.
   *
   * The host exposes no parent accessor, so the lineage is walked with
   * isOwnedBy, which is true only while the exact child entry is live under
   * that owner.
   * @param {object} agent - the agent whose owner is looked for.
   * @returns {object | undefined} the owner, when one is live.
   */
  const ownerOf = (agent) => {
    let agents = []
    try {
      agents = ctx.agents.list()
    } catch {
      agents = []
    }
    return agents.find((candidate) => {
      if (candidate?.id === agent?.id) return false
      try {
        return ctx.agents.isOwnedBy(agent.id, candidate) === true
      } catch {
        return false
      }
    })
  }

  /**
   * The board authority for a read.
   *
   * A team member reads the board as itself. A session outside the team — a
   * delegated worker with no team membership — reads it through its own
   * lineage: the nearest ancestor the team service itself recognises as a
   * member. It only reads: the board belongs to the team, and a worker that
   * is not in the team must not move it.
   * @param {object} agent - the calling agent.
   * @param {object | undefined} parent - the agent that spawned the caller.
   * @returns {{ authority: object, relayed: boolean, role: string | undefined }} the authority, whether it was relayed, and the role.
   */
  const boardAuthority = (agent, parent) => {
    const membership = membershipOf(agent)
    if (membership !== undefined) return { authority: agent, relayed: false, role: membership.role }
    // An arbitrary root would read ANOTHER team's board and act with a
    // credential the service never granted it, which is the privilege
    // escalation path an audit must never open. So the lineage is walked,
    // and when it carries no member the read is refused, not guessed.
    const chain = []
    const seen = new Set()
    const push = (candidate) => {
      if (candidate?.id === undefined || seen.has(candidate.id)) return
      seen.add(candidate.id)
      chain.push(candidate)
    }
    // The walk starts at the CALLER, not at the parent the tool context
    // names: the host does not always fill that field in — a delegated
    // worker that called the tool with no parent in its context would
    // otherwise walk an empty chain and refuse a read it is entitled to.
    // The caller's own owner is the first ancestor either way.
    let current = agent
    while (current !== undefined) {
      push(current)
      const owner = ownerOf(current)
      if (owner === undefined || owner.id === current.id) break
      current = owner
    }
    if (parent !== undefined) push(parent)
    for (const candidate of chain) {
      const candidateMembership = membershipOf(candidate)
      if (candidateMembership !== undefined) {
        return { authority: candidate, relayed: true, role: candidateMembership.role }
      }
    }
    throw new Error('This session is not a team member, and no ancestor of it is recognised as one, so the board cannot be read from here. Ask the Coordinator for the task text.')
  }

  return [
    {
      name: 'swarm_worktree',
      description:
        "Create this host's own retained Git worktree for a lane: a fresh branch and a clean checkout at a pinned revision, while the source checkout keeps its uncommitted files. Use it to give a lane its own files instead of editing a shared tree. The host publishes the new checkout as the calling session's working directory, so the relative paths you resolve after this call point at that checkout.",
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Branch and checkout name. It must not exist yet.' },
          from: { type: 'string', description: 'The local revision to pin the checkout at. Defaults to the current HEAD.' },
        },
        additionalProperties: false,
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            branch: { type: 'string' },
            baseCommit: { type: 'string' },
            repositoryRoot: { type: 'string' },
          },
          required: ['path', 'branch', 'baseCommit', 'repositoryRoot'],
          additionalProperties: false,
        },
        render: (args, value) => [textBlock(
          `Worktree ready\n  path: ${value.path}\n  branch: ${value.branch}\n  base: ${value.baseCommit}\n  repository: ${value.repositoryRoot}\nyour working directory is now ${value.path}`,
        )],
      },
      execute: async (args, exec) => {
        const worktrees = requireWorktrees()
        const agent = callingAgent(exec)
        if (agent === undefined) throw new Error('This call carries no agent, so the worktree cannot be attributed to a lane.')
        const request = {}
        if (typeof args?.name === 'string' && args.name.length > 0) request.name = args.name
        if (typeof args?.from === 'string' && args.from.length > 0) request.from = args.from
        let created
        try {
          created = await worktrees.create(agent, request, exec.signal)
        } catch (error) {
          throw new Error(`swarm_worktree could not create the worktree: ${error?.message ?? String(error)}`)
        }
        return {
          path: created.path,
          branch: created.branch,
          baseCommit: created.baseCommit,
          repositoryRoot: created.repositoryRoot,
        }
      },
    },
    {
      name: 'swarm_task',
      description:
        "Read and update the shared task board of this session's team. A team member reads and updates it as itself; a session outside the team reads it read-only through the team root, because the board belongs to the team. Use it to check that your assignment and the board entry agree, and to claim and complete the work you were given.",
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'get', 'claim', 'complete', 'release'],
            description: 'list every task, get one task, or move one task through the board.',
          },
          task_id: { type: 'string', description: 'The task to get or to move. Required for every action except list.' },
          expected_revision: {
            type: 'integer',
            description: 'The revision the task had when you read it. The board refuses a move whose revision moved under you.',
          },
        },
        required: ['action'],
        additionalProperties: false,
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            relayed: { type: 'boolean' },
            actor: { type: 'string' },
            authority: { type: 'string' },
            authorityRole: { type: 'string' },
            task: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                revision: { type: 'integer' },
                subject: { type: 'string' },
                status: { type: 'string' },
                owner: { type: 'string' },
                ready: { type: 'boolean' },
                blockedBy: { type: 'array' },
                writeScopes: { type: 'array' },
                writeScopeWarnings: { type: 'array' },
                description: { type: 'string' },
              },
              additionalProperties: false,
            },
            tasks: { type: 'array' },
          },
          additionalProperties: false,
        },
        render: (args, value) => {
          const actor = value.actor ? `\nacting session: ${value.actor}` : ''
          const authority = value.relayed && value.authority
            ? `\nacted as ${value.authority}${value.authorityRole ? ` (role: ${value.authorityRole})` : ''} on behalf of ${value.actor} — a read-only relay, because the board belongs to the team`
            : ''
          if (Array.isArray(value.tasks)) {
            const rows = value.tasks.map((task) => `  ${task.id} [${task.status}] rev ${task.revision} ${task.owner ? `owner ${task.owner}` : 'unowned'} — ${task.subject}`)
            const note = value.relayed ? 'Read-only relay: this session is not a team member, so the board was read through an ancestor the team service recognises and cannot be changed from here.' : ''
            return [textBlock(`${value.tasks.length} task(s) on the board\n${rows.join('\n')}${note ? `\n${note}` : ''}${actor}${authority}`)]
          }
          const task = value.task
          const warnings = Array.isArray(task.writeScopeWarnings) && task.writeScopeWarnings.length > 0
            ? `\n  write scope warnings: ${task.writeScopeWarnings.join(', ')}`
            : ''
          return [textBlock(`Task ${task.id} [${task.status}] rev ${task.revision}\n  subject: ${task.subject}\n  owner: ${task.owner ?? 'unowned'}\n  ready: ${task.ready}\n  blocked by: ${task.blockedBy.length > 0 ? task.blockedBy.join(', ') : 'nothing'}\n  write scopes: ${task.writeScopes.length > 0 ? task.writeScopes.join(', ') : 'none'}${warnings}\n  ${task.description}${actor}${authority}`)]
        },
      },
      execute: async (args, exec) => {
        const teams = requireTeams()
        const agent = callingAgent(exec)
        if (agent === undefined) throw new Error('This call carries no agent, so the board cannot be read.')
        const action = args?.action
        if (action === 'delete') {
          throw new Error('This tool refuses to delete a task. The board keeps its history, and a task that is no longer needed is released, not deleted.')
        }
        if (action === 'list') {
          const { authority, relayed, role } = boardAuthority(agent, exec?.parent)
          let tasks
          try {
            tasks = teams.listTasks(authority)
          } catch (error) {
            throw new Error(`swarm_task could not list the board: ${error?.message ?? String(error)}`)
          }
          return { relayed, actor: agent.id, authority: authority.id, authorityRole: role, tasks: tasks.map(projectTask) }
        }
        const taskId = args?.task_id
        if (typeof taskId !== 'string' || taskId.length === 0) {
          throw new Error(`The "${action}" action needs a task_id.`)
        }
        if (action === 'get') {
          const { authority, relayed, role } = boardAuthority(agent, exec?.parent)
          let task
          try {
            task = teams.getTask(authority, taskId)
          } catch (error) {
            throw new Error(`swarm_task could not read task ${taskId}: ${error?.message ?? String(error)}`)
          }
          return { relayed, actor: agent.id, authority: authority.id, authorityRole: role, task: projectTask(task) }
        }
        const expectedRevision = args?.expected_revision
        if (!Number.isInteger(expectedRevision)) {
          throw new Error(`The "${action}" action needs expected_revision: the revision the task had when you read it. Read the task first.`)
        }
        const membership = membershipOf(agent)
        if (membership === undefined) {
          throw new Error('This session is not a team member, so it cannot change the shared board. The board belongs to the team; report the result to the Coordinator instead.')
        }
        let updated
        try {
          updated = await teams.updateTask(agent, {
            taskId,
            expectedRevision,
            action,
          })
        } catch (error) {
          throw new Error(`swarm_task could not ${action} task ${taskId}: ${error?.message ?? String(error)}`)
        }
        return { relayed: false, actor: agent.id, authority: agent.id, authorityRole: membership.role, task: projectTask(updated) }
      },
    },
    {
      name: 'swarm_child',
      description:
        "List, steer or stop the child lanes of this session. Use it to see which children are still running, to steer a running child with a new instruction, or to stop a child that is stuck. A `subagent` child is continuable and can be steered; a one-shot or external child cannot be steered, but any live child of this session can be stopped.",
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'steer', 'stop'],
            description: 'List the child lanes, steer one with a message, or stop one.',
          },
          target: { type: 'string', description: 'The child session id. Required for steer and stop.' },
          message: { type: 'string', description: 'The message to steer into the child. Required for steer.' },
        },
        required: ['action'],
        additionalProperties: false,
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            children: { type: 'array' },
            messageId: { type: 'string' },
            target: { type: 'string' },
            stopped: { type: 'string' },
          },
          additionalProperties: false,
        },
        render: (args, value) => {
          if (Array.isArray(value.children)) {
            const rows = value.children.map((child) => `  ${child.id} [${child.mode}]${child.label ? ` ${child.label}` : ''}`)
            return [textBlock(`${value.children.length} child lane(s)\n${rows.join('\n')}`)]
          }
          if (typeof value.stopped === 'string') return [textBlock(`Stopped child ${value.stopped}. The cancel signal was issued; the child may still be finishing its current step.`)]
          return [textBlock(`Steered ${value.target}: the message was accepted into the child's inbox (${value.messageId}).`)]
        },
      },
      execute: async (args, exec) => {
        const subagents = requireSubagents()
        const agent = callingAgent(exec)
        if (agent === undefined) throw new Error('This call carries no agent, so the child lanes cannot be attributed.')
        const action = args?.action
        if (action === 'list') {
          let children
          try {
            children = await subagents.listChildren(agent.id, exec.signal)
          } catch (error) {
            throw new Error(`swarm_child could not list the child lanes: ${error?.message ?? String(error)}`)
          }
          return {
            children: children.map((child) => ({
              id: child.id,
              mode: child.mode,
              label: child.label ?? null,
              createdAt: child.createdAt,
            })),
          }
        }
        const target = args?.target
        if (typeof target !== 'string' || target.length === 0) {
          throw new Error(`The "${action}" action needs a target: the child session id.`)
        }
        let children
        try {
          children = await subagents.listChildren(agent.id, exec.signal)
        } catch (error) {
          throw new Error(`swarm_child could not read the child lanes: ${error?.message ?? String(error)}`)
        }
        const child = children.find((entry) => entry.id === target)
        if (child === undefined) {
          // The host treats an absent target as an accepted no-op, so this
          // must not look like a successful stop.
          throw new Error(`No running child at ${target}; nothing was interrupted. Read the lane list first — the ids are the child session ids.`)
        }
        if (action === 'steer') {
          const message = args?.message
          if (typeof message !== 'string' || message.length === 0) {
            throw new Error('The "steer" action needs a message: the instruction the child receives at its next step boundary.')
          }
          if (child.mode !== 'continuable') {
            throw new Error(`That child is a ${child.mode} child, and only a continuable child can be steered. Use "stop" to end it instead.`)
          }
          let messageId
          try {
            messageId = await subagents.sendMessage(agent, target, [textBlock(message)], { signal: exec.signal })
          } catch (error) {
            throw new Error(`swarm_child could not steer ${target}: ${error?.message ?? String(error)}`)
          }
          return { target, messageId: String(messageId) }
        }
        if (action === 'stop') {
          try {
            subagents.interrupt(target, { kind: 'ancestor', agent })
          } catch (error) {
            throw new Error(`swarm_child could not stop ${target}: ${error?.message ?? String(error)}`)
          }
          return { stopped: target }
        }
        throw new Error(`Unknown action "${action}". Use list, steer or stop.`)
      },
    },
  ].filter((definition) => {
    const service = SWARM_TOOL_SERVICES[definition.name]
    return service === undefined || optionalService(ctx, service) !== undefined
  })
}

/**
 * Apply the swarm workflow to the host.
 * @param {object} ctx - the plugin context.
 */
export function apply(ctx) {
  let skillStamp = null
  let skillDisposer = null
  let commandRegistered = false

  /**
   * Register the skill, and re-register it when its file changed on disk.
   * @returns {void}
   */
  const syncSkill = () => {
    const raw = readText(SKILL_FILE)
    const stamp = fileCache.get(SKILL_FILE)?.stamp ?? 'missing'
    if (stamp === skillStamp) return
    skillStamp = stamp
    if (skillDisposer !== null) {
      skillDisposer()
      skillDisposer = null
    }
    const skill = parseSkillFile(raw)
    const disposer = ctx.skills.register({
      name: skill.name,
      // The description in the file is the user's own text and stays byte for
      // byte; the runtime this plugin runs on is named in front of it,
      // because the catalog line is what an agent reads before it decides to
      // load the skill.
      description: HOST_NOTE + skill.description,
      content: skill.content,
      source: SKILL_SOURCE,
      whenToUse: 'Use before non-trivial engineering work in a swarm: leading and briefing subagents, reviewing their results, or executing a delegated task.',
    })
    skillDisposer = typeof disposer === 'function' ? disposer : null
  }

  ctx.effect(() => {
    syncSkill()
    return () => {
      if (skillDisposer !== null) {
        skillDisposer()
        skillDisposer = null
      }
    }
  })

  // The host-backed swarm primitives. They are registered globally, so every
  // lane — the Coordinator, a native teammate, a delegated worker — reaches
  // the host's own worktree, board and child lanes through one call.
  const tools = toolService(ctx)
  if (tools !== undefined) {
    ctx.effect(() => {
      const disposers = []
      for (const definition of buildSwarmTools(ctx)) {
        try {
          const disposer = tools.register(definition)
          if (typeof disposer === 'function') disposers.push(disposer)
        } catch {
          // One host that refuses a tool must not skip the others.
        }
      }
      return () => {
        for (const disposer of disposers.reverse()) {
          try {
            disposer()
          } catch {
            // A disposer that fails must not block the others.
          }
        }
      }
    })
  }

  ctx.effect(() => ctx.systemPrompt.section({
    name: 'swarm-workflow:swarm',
    order: SECTION_ORDER,
    interpolate: false,
    text: (context) => {
      try {
        syncSkill()
      } catch {
        // A skill that cannot be re-registered must not break the prompt.
      }
      const names = probeToolNames(ctx, context)
      const raw = isCoordinator(ctx, context) ? readText(COORDINATOR_PROMPT) : readText(WORKER_PROMPT)
      const referenced = [
        ...referencedTools(readText(COORDINATOR_PROMPT)),
        ...referencedTools(readText(WORKER_PROMPT)),
      ]
      return renderPrompt(raw, names, { command: commandRegistered, referenced })
    },
  }))

  let commands
  try {
    commands = typeof ctx.get === 'function' ? ctx.get('commands') : undefined
  } catch {
    commands = undefined
  }
  if (commands !== undefined) {
    ctx.effect(() => {
      try {
        const disposer = commands.register({
          name: 'swarm',
          description: "Report what the swarm workflow can do in this session: the live delegation and coordination surfaces, and how to run a swarm.",
          input: { hint: 'swarm' },
          handler: (invocation) => {
            const names = probeToolNames(ctx, { agent: invocation.agent })
            if (names === undefined) {
              return { kind: 'error', text: 'The swarm workflow is active, but this host exposes no tool registry to probe.' }
            }
            // The referenced set names every tool the prompts gate on, so a
            // marker whose tool this host lacks is reported here too.
            const referenced = [
              ...referencedTools(readText(COORDINATOR_PROMPT)),
              ...referencedTools(readText(WORKER_PROMPT)),
            ]
            const block = capabilityBlock(names, { referenced })
            return {
              kind: 'success',
              text: `${block}\n\nThe Coordinator drives the swarm: open a session goal, give every parallel lane its own files, and delegate with the surfaces listed above. The \`swarm-engineering\` skill carries the role methods — Developer, Tester, Reviewer.`,
            }
          },
        })
        commandRegistered = true
        return typeof disposer === 'function' ? disposer : undefined
      } catch {
        // A host that refuses the command must not break the prompt.
        commandRegistered = false
        return undefined
      }
    })
  }
}
