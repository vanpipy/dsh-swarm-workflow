/**
 * Unit test for the host-backed swarm tools of the @sages/swarm-workflow bundle.
 *
 * It drives the three tools against stub host services, so every claim in this
 * file is about the plugin's own code: what it calls, with which authority,
 * and what it reports when a host lacks a service or a session lacks a right.
 *
 * Run it with the host's own binary as Node:
 *   $env:ELECTRON_RUN_AS_NODE="1"
 *   & "D:\software\dsh\DeepSeek Harness.exe" D:\project\.swarm-lab\rounds\tools\test-swarm-tools.mjs
 */
import {
  buildSwarmTools,
  SWARM_TOOL_NAMES,
} from 'file:///D:/project/dsh-plugins/swarm-workflow/index.js'

const checks = []
let failures = 0

/**
 * Record one check.
 * @param {string} name - what the check proves.
 * @param {boolean} ok - whether it held.
 * @param {string} [detail] - the evidence when it did not hold.
 * @returns {void}
 */
function check(name, ok, detail = '') {
  checks.push({ name, ok, detail })
  if (!ok) failures += 1
}

/**
 * Assert that a call throws, and that the message says what it must say.
 * @param {string} name - what the check proves.
 * @param {() => Promise<unknown>} run - the call.
 * @param {string} needle - the text the error must carry.
 * @returns {Promise<void>}
 */
async function checkThrows(name, run, needle) {
  try {
    await run()
    check(name, false, 'the call resolved instead of throwing')
  } catch (error) {
    const message = String(error?.message ?? error)
    check(name, message.includes(needle), `message was: ${message}`)
  }
}

const agent = { id: 'session-lead' }
const worker = { id: 'session-worker' }
const root = { id: 'session-root' }
const signal = new AbortController().signal

/**
 * A tool by name.
 * @param {object} tools - the built tools.
 * @param {string} name - the tool name.
 * @returns {object} the tool definition.
 */
function tool(tools, name) {
  const found = tools.find((entry) => entry.name === name)
  if (found === undefined) throw new Error(`no tool named ${name}`)
  return found
}

/**
 * A stub host.
 *
 * The lineage is the one the host exposes: a session has no parent field, so
 * the owner is found with isOwnedBy. session-worker is owned by session-lead,
 * and session-lead by session-root.
 * @param {object} overrides - the services the host has.
 * @returns {object} the plugin context.
 */
function hostCtx(overrides = {}) {
  const owners = { 'session-worker': 'session-lead', 'session-lead': 'session-root' }
  return {
    agents: {
      roots: () => [root],
      list: () => [root, agent, worker],
      isOwnedBy: (childId, owner) => owners[childId] === owner?.id,
    },
    ...overrides,
  }
}

// --- the shape of the tools -------------------------------------------------

const worktreesService = {
  create: async () => ({ path: 'D:/worktrees/lane', branch: 'swarm/lane', baseCommit: 'abc123', repositoryRoot: 'D:/repo' }),
}
const teamsService = {
  tryMembership: (candidate) => (candidate === agent ? { role: 'lead' } : undefined),
  listTasks: () => [],
  getTask: () => { throw new Error('no task') },
  updateTask: async () => { throw new Error('no update') },
}
const subagentsService = {
  listChildren: async () => [],
  sendMessage: async () => 'message-1',
  interrupt: () => {},
}

const fullTools = buildSwarmTools(hostCtx({
  worktrees: worktreesService,
  agentTeams: teamsService,
  subagents: subagentsService,
}))
check('three tools are built', fullTools.length === 3, `got ${fullTools.length}`)
check('the tool names are the declared ones',
  JSON.stringify(fullTools.map((entry) => entry.name)) === JSON.stringify(SWARM_TOOL_NAMES),
  JSON.stringify(fullTools.map((entry) => entry.name)))
for (const definition of fullTools) {
  check(`${definition.name} carries a description`, typeof definition.description === 'string' && definition.description.length > 0)
  check(`${definition.name} carries a parameter schema`, definition.parameters?.type === 'object')
  check(`${definition.name} carries an output schema`, definition.output?.schema?.type === 'object')
  check(`${definition.name} can render its result`, typeof definition.output?.render === 'function')
  check(`${definition.name} can execute`, typeof definition.execute === 'function')
}

// A tool is registered only when the host has the service behind it, so the
// prompt never advertises a primitive this host can only fail at.
check('a host without the worktrees service builds two tools',
  buildSwarmTools(hostCtx({ agentTeams: teamsService, subagents: subagentsService })).length === 2)
check('a host without the teams service builds two tools',
  buildSwarmTools(hostCtx({ worktrees: worktreesService, subagents: subagentsService })).length === 2)
check('a host without the subagents service builds two tools',
  buildSwarmTools(hostCtx({ worktrees: worktreesService, agentTeams: teamsService })).length === 2)
check('a host without any of the three services builds no swarm tool',
  buildSwarmTools(hostCtx()).length === 0)

// --- swarm_worktree ---------------------------------------------------------

{
  const calls = []
  const ctx = hostCtx({
    worktrees: {
      create: async (calling, request, cancel) => {
        calls.push({ calling, request, cancel })
        return { path: 'D:/worktrees/lane', branch: 'swarm/lane', baseCommit: 'abc123', repositoryRoot: 'D:/repo' }
      },
    },
    agentTeams: teamsService,
    subagents: subagentsService,
  })
  const tools = buildSwarmTools(ctx)
  const result = await tool(tools, 'swarm_worktree').execute({ name: 'swarm/lane', from: 'HEAD~2' }, { agent, signal })
  check('swarm_worktree returns the host worktree', result.path === 'D:/worktrees/lane' && result.branch === 'swarm/lane' && result.baseCommit === 'abc123' && result.repositoryRoot === 'D:/repo', JSON.stringify(result))
  check('swarm_worktree attributes the worktree to the calling agent', calls[0]?.calling === agent)
  check('swarm_worktree passes the name and the revision', calls[0]?.request?.name === 'swarm/lane' && calls[0]?.request?.from === 'HEAD~2', JSON.stringify(calls[0]?.request))
  check('swarm_worktree forwards the cancellation signal', calls[0]?.cancel === signal)

  await tool(tools, 'swarm_worktree').execute({}, { agent, signal })
  check('swarm_worktree omits an absent name and revision', Object.keys(calls[1].request).length === 0, JSON.stringify(calls[1].request))

  const rendered = tool(tools, 'swarm_worktree').output.render({}, result)
  check('swarm_worktree renders its result as text', rendered[0]?.type === 'text' && rendered[0].text.includes('D:/worktrees/lane'))
  check('swarm_worktree states the working-directory side effect', rendered[0].text.includes('your working directory is now D:/worktrees/lane'))

  await checkThrows('swarm_worktree refuses a call without an agent',
    () => tool(tools, 'swarm_worktree').execute({}, { signal }), 'no agent')

  const failing = buildSwarmTools(hostCtx({
    worktrees: { create: async () => { throw new Error('branch exists') } },
    agentTeams: teamsService,
    subagents: subagentsService,
  }))
  await checkThrows('swarm_worktree reports the host reason',
    () => tool(failing, 'swarm_worktree').execute({}, { agent, signal }), 'swarm_worktree could not create the worktree: branch exists')
}

// --- swarm_task -------------------------------------------------------------

{
  const task = {
    id: 'task-1',
    revision: 3,
    subject: 'R3 review',
    description: 'Review the change.',
    status: 'pending',
    blockedBy: [],
    writeScopes: ['src/'],
    ownerName: undefined,
    ready: true,
    writeScopeWarnings: ['src/ overlaps task-2'],
  }
  const updates = []
  const reads = []
  const memberTeams = {
    tryMembership: (candidate) => (candidate === agent ? { role: 'lead' } : undefined),
    listTasks: (caller) => {
      reads.push(caller)
      return [task]
    },
    getTask: (caller, id) => {
      reads.push(caller)
      if (id !== task.id) throw new Error(`no task ${id}`)
      return task
    },
    updateTask: async (caller, request) => {
      updates.push({ caller, request })
      return { ...task, ...request, revision: task.revision + 1, status: request.action === 'complete' ? 'completed' : 'in_progress', ownerName: 'lead' }
    },
  }
  const tools = buildSwarmTools(hostCtx({ agentTeams: memberTeams }))

  const listed = await tool(tools, 'swarm_task').execute({ action: 'list' }, { agent, signal })
  check('swarm_task lists the board', listed.tasks.length === 1 && listed.tasks[0].id === 'task-1')
  check('swarm_task reads the board as the calling member', reads[0] === agent)
  check('swarm_task reports a direct read as not relayed', listed.relayed === false)
  check('swarm_task discloses the acting session', listed.actor === agent.id, String(listed.actor))
  check('swarm_task discloses the acting authority', listed.authority === agent.id && listed.authorityRole === 'lead', `${listed.authority} ${listed.authorityRole}`)

  const got = await tool(tools, 'swarm_task').execute({ action: 'get', task_id: 'task-1' }, { agent, signal })
  check('swarm_task gets one task', got.task.id === 'task-1' && got.task.subject === 'R3 review')
  const renderedTask = tool(tools, 'swarm_task').output.render({}, got)
  check('swarm_task renders the write scope warnings', renderedTask[0].text.includes('write scope warnings: src/ overlaps task-2'))

  const claimed = await tool(tools, 'swarm_task').execute({ action: 'claim', task_id: 'task-1', expected_revision: 3 }, { agent, signal })
  check('swarm_task claims a task with the compare-and-set', updates[0]?.request?.action === 'claim' && updates[0]?.request?.expectedRevision === 3 && updates[0]?.request?.taskId === 'task-1', JSON.stringify(updates[0]?.request))
  check('swarm_task authorizes a move with the calling member', updates[0]?.caller === agent)
  check('swarm_task returns the new revision', claimed.task.revision === 4)

  await checkThrows('swarm_task refuses a move without a revision',
    () => tool(tools, 'swarm_task').execute({ action: 'claim', task_id: 'task-1' }, { agent, signal }), 'expected_revision')
  await checkThrows('swarm_task refuses a move without a task id',
    () => tool(tools, 'swarm_task').execute({ action: 'complete', expected_revision: 3 }, { agent, signal }), 'task_id')
  await checkThrows('swarm_task refuses to delete a task',
    () => tool(tools, 'swarm_task').execute({ action: 'delete', task_id: 'task-1', expected_revision: 3 }, { agent, signal }), 'refuses to delete')

  // The relay is only allowed through an ancestor of the CALLER that the TEAM
  // SERVICE recognises as a member: an arbitrary root would act with a
  // credential the service never granted it, which is the privilege-
  // escalation path an audit must not open.
  const outsiderTeams = {
    ...memberTeams,
    tryMembership: (candidate) => (candidate === agent ? { role: 'lead' } : undefined),
    listTasks: (caller) => {
      reads.push(caller)
      return [task]
    },
    getTask: (caller, id) => {
      reads.push(caller)
      return task
    },
  }
  const outsiderTools = buildSwarmTools(hostCtx({ agentTeams: outsiderTeams }))
  const relayed = await tool(outsiderTools, 'swarm_task').execute({ action: 'list' }, { agent: worker, parent: agent, signal })
  check('a session outside the team reads the board through its own ancestor', relayed.relayed === true && reads[reads.length - 1] === agent, `reads: ${reads.length}`)
  check('a relayed read discloses the acting session', relayed.actor === worker.id, String(relayed.actor))
  check('a relayed read discloses the authority it acted through', relayed.authority === agent.id && relayed.authorityRole === 'lead', `${relayed.authority} ${relayed.authorityRole}`)
  const renderedRelay = tool(outsiderTools, 'swarm_task').output.render({}, relayed)
  check('a relayed read says who acted', renderedRelay[0].text.includes(`acted as ${agent.id}`) && renderedRelay[0].text.includes(worker.id))
  // The host does not always fill `parent` in for a delegated worker, so the
  // lineage walk starts at the CALLER: a worker whose tool context carries no
  // parent is still entitled to the read its own owner allows, and must not be
  // refused for a field the host left empty.
  const noParentRelay = await tool(outsiderTools, 'swarm_task').execute({ action: 'list' }, { agent: worker, signal })
  check('a delegated worker with no parent in its context still reads through its own owner',
    noParentRelay.relayed === true && reads[reads.length - 1] === agent && noParentRelay.authority === agent.id,
    `reads: ${reads.length} authority: ${noParentRelay.authority}`)
  await checkThrows('a session outside the team cannot move the board',
    () => tool(outsiderTools, 'swarm_task').execute({ action: 'claim', task_id: 'task-1', expected_revision: 3 }, { agent: worker, parent: agent, signal }), 'not a team member')

  const noMemberTeams = {
    ...outsiderTeams,
    tryMembership: () => undefined,
  }
  const noMemberTools = buildSwarmTools(hostCtx({ agentTeams: noMemberTeams }))
  await checkThrows('a read is refused when no ancestor is a recognised team member',
    () => tool(noMemberTools, 'swarm_task').execute({ action: 'list' }, { agent: worker, parent: agent, signal }), 'recognised as one')

  const noTeams = buildSwarmTools(hostCtx())
  check('a host without the teams service has no board tool', noTeams.length === 0)
}

// --- swarm_child ------------------------------------------------------------

{
  const sent = []
  const stopped = []
  const children = [
    { id: 'child-one-shot', mode: 'one-shot', label: 'probe', createdAt: 1 },
    { id: 'child-continuable', mode: 'continuable', label: 'worker', createdAt: 2 },
  ]
  const ctx = hostCtx({
    subagents: {
      listChildren: async (parentId) => {
        if (parentId !== agent.id) throw new Error(`wrong parent ${parentId}`)
        return children
      },
      sendMessage: async (sender, targetId, content, options) => {
        sent.push({ sender, targetId, content, options })
        return 'message-9'
      },
      interrupt: (targetSessionId, authority) => {
        stopped.push({ targetSessionId, authority })
      },
    },
  })
  const tools = buildSwarmTools(ctx)

  const listed = await tool(tools, 'swarm_child').execute({ action: 'list' }, { agent, signal })
  check('swarm_child lists the child lanes', listed.children.length === 2 && listed.children[0].id === 'child-one-shot' && listed.children[0].mode === 'one-shot')

  const steered = await tool(tools, 'swarm_child').execute({ action: 'steer', target: 'child-continuable', message: 'focus on the tests' }, { agent, signal })
  check('swarm_child steers a continuable child', steered.messageId === 'message-9' && steered.target === 'child-continuable')
  check('swarm_child sends the message as the calling agent', sent[0]?.sender === agent && sent[0]?.content?.[0]?.text === 'focus on the tests')
  check('swarm_child passes the cancellation signal', sent[0]?.options?.signal === signal)

  await checkThrows('swarm_child refuses to steer a one-shot child',
    () => tool(tools, 'swarm_child').execute({ action: 'steer', target: 'child-one-shot', message: 'stop that' }, { agent, signal }), 'only a continuable child can be steered')

  const stoppedResult = await tool(tools, 'swarm_child').execute({ action: 'stop', target: 'child-one-shot' }, { agent, signal })
  check('swarm_child stops a live child', stoppedResult.stopped === 'child-one-shot')
  check('swarm_child interrupts with the calling agent as the ancestor authority',
    stopped[0]?.targetSessionId === 'child-one-shot' && stopped[0]?.authority?.kind === 'ancestor' && stopped[0]?.authority?.agent === agent,
    JSON.stringify(stopped[0]?.authority))

  // The host treats an absent target as an accepted no-op, so the tool must not
  // report a successful stop for an id that is not a live child.
  await checkThrows('swarm_child refuses to stop a child that is not there',
    () => tool(tools, 'swarm_child').execute({ action: 'stop', target: 'child-ghost' }, { agent, signal }), 'nothing was interrupted')
  await checkThrows('swarm_child refuses to steer a child that is not there',
    () => tool(tools, 'swarm_child').execute({ action: 'steer', target: 'child-ghost', message: 'stop' }, { agent, signal }), 'nothing was interrupted')

  await checkThrows('swarm_child refuses a steer without a message',
    () => tool(tools, 'swarm_child').execute({ action: 'steer', target: 'child-continuable' }, { agent, signal }), 'needs a message')
  await checkThrows('swarm_child refuses an action without a target',
    () => tool(tools, 'swarm_child').execute({ action: 'stop' }, { agent, signal }), 'needs a target')

  const noSubagents = buildSwarmTools(hostCtx())
  check('a host without the subagents service has no child tool', noSubagents.length === 0)
}

// --- the report -------------------------------------------------------------

const failed = checks.filter((entry) => !entry.ok)
if (failed.length > 0) {
  console.log(`FAILED ${failed.length} of ${checks.length} checks`)
  for (const entry of failed) console.log(`  FAIL ${entry.name}${entry.detail ? ` — ${entry.detail}` : ''}`)
  process.exitCode = 1
} else {
  console.log(`ALL CHECKS PASSED (${checks.length})`)
}
