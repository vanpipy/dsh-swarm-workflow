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
  const block = capabilityBlock(probed, { ...options, referenced: referencedTools(raw) })
  if (text.includes(CAPABILITY_MARKER)) {
    text = text.replace(CAPABILITY_MARKER, () => block)
  } else {
    text = `${text.trimEnd()}\n\n${block}\n`
  }
  return text
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
      description: skill.description,
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
      return renderPrompt(raw, names, { command: commandRegistered })
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
