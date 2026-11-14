// Unit test for the swarm plugin's renderPrompt(): the capability gating that
// makes the swarm prompt describe only what this host actually offers.
//
// Semantics under test (fixed in R13 after the R3 fan-out review):
//   - ',' inside one `swarm:requires` marker means ALL of those tools are needed.
//   - '|' inside one marker means ONE of those alternatives is enough.
//   - A marker with no tool list requires nothing.
//   - Several markers on one line must all be satisfied.
//   - No tool registry at all: nothing is filtered, and the prompt says so.
import { readFileSync } from 'node:fs'
import { renderPrompt } from 'file:///D:/project/dsh-plugins/swarm-workflow/index.js'

const prompt = readFileSync('D:/project/dsh-plugins/swarm-workflow/swarm-prompt.md', 'utf8')
const worker = readFileSync('D:/project/dsh-plugins/swarm-workflow/swarm-worker-prompt.md', 'utf8')

const ALL = [
  'subagent', 'subagent_fork', 'workflow', 'spawn_teammate', 'send_message', 'interrupt_agent',
  'list_agents', 'wait_agent', 'team_task_create', 'team_task_get', 'team_task_list',
  'team_task_update', 'create_goal', 'get_goal', 'update_goal', 'todo_write',
  'ask_user_question', 'schedule_create',
  // The plugin registers these three itself, so a live host has them in the
  // registry the moment the bundle is applied.
  'swarm_worktree', 'swarm_task', 'swarm_child',
]
const MINIMAL = ['subagent', 'todo_write']

let failures = 0
const check = (label, ok) => {
  if (!ok) { failures += 1; console.log('FAIL  ' + label) } else { console.log('ok    ' + label) }
}

// 1. Every surface present: nothing dropped, markers stripped, block rendered.
const full = renderPrompt(prompt, ALL)
check('full: no section-symbol reference survives', !full.includes('§') && !worker.includes('§'))
check('full: no raw requires marker survives', !full.includes('swarm:requires'))
check('full: no raw capability marker survives', !full.includes('swarm:capabilities'))
check('full: capability block present', full.includes('## Host capabilities — probed live'))
check('full: delegation group listed', full.includes('- **Delegation:**'))
check('full: coordination group listed', full.includes('- **Coordination:**'))
check('full: fork bullet kept', full.includes('A fork inherits everything'))
check('full: native teams bullet kept', full.includes('Native teams and a shared task board'))
check('full: shared board bullet kept', full.includes('The shared board carries the assignments'))
check('full: session goal bullet kept', full.includes('The session goal is your own persistence'))
check('full: delegation-surface bullet kept', full.includes('Choose the delegation surface that matches the work'))
check('full: tool count reported', full.includes(`- **Tools this agent's registry lists:** ${ALL.length}`))
check('full: no absent line', !full.includes('Absent in this session'))
check('full: the plugin primitives are not advertised as host surfaces', !full.includes('- **Host-backed swarm primitives:**'))
check('full: the plugin primitives are named', full.includes('`swarm_worktree`') && full.includes('`swarm_task`') && full.includes('`swarm_child`'))

// 2. Minimal host: every bullet that names a missing surface is dropped.
const min = renderPrompt(prompt, MINIMAL)
check('minimal: fork bullet dropped', !min.includes('A fork inherits everything'))
check('minimal: native teams bullet dropped', !min.includes('Native teams and a shared task board'))
check('minimal: shared board bullet dropped', !min.includes('The shared board carries the assignments'))
check('minimal: session goal bullet dropped', !min.includes('The session goal is your own persistence'))
check('minimal: delegation bullet dropped (AND)', !min.includes('**Delegation tools.**'))
check('minimal: delegation-surface bullet dropped', !min.includes('Choose the delegation surface that matches the work'))
check('minimal: round ledger bullet kept', min.includes('The round ledger is yours'))
check('minimal: orchestrator bullet kept', min.includes('You stay the orchestrator and the acceptance owner'))
check('minimal: unmarked bullets kept', min.includes('The policy\'s *Jcode Runtime and Model Configuration* section was written for another runtime'))
check('minimal: absent surfaces named', min.includes('`subagent_fork`') && min.includes('`spawn_teammate`') && min.includes('`create_goal`'))
check('minimal: tool count reported', min.includes("- **Tools this agent's registry lists:** 2"))
check('minimal: no raw marker survives', !min.includes('swarm:requires'))

// 3. No registry at all: nothing is filtered, and the prompt says it was not probed.
const raw = renderPrompt(prompt, undefined)
check('raw: not-probed block present', raw.includes('## Host capabilities — not probed'))
check('raw: no raw markers', !raw.includes('swarm:requires') && !raw.includes('swarm:capabilities'))
check('raw: every bullet kept', raw.includes('A fork inherits everything') && raw.includes('Native teams and a shared task board'))
check('raw: worker prompt not probed either', renderPrompt(worker, undefined).includes('## Host capabilities — not probed'))

// 3b. An EMPTY registry is not a working registry: it must read as "not probed"
// and must not drop a single bullet (the R7 lens-3 gap: an empty probe used to
// delete every gated bullet and still claim "probed live").
const empty = renderPrompt(prompt, [])
check('empty registry: not-probed block present', empty.includes('## Host capabilities — not probed'))
check('empty registry: no bullet dropped', empty.includes('A fork inherits everything') && empty.includes('Native teams and a shared task board'))
check('empty registry: no zero tool count claimed', !empty.includes("registry lists:** 0"))

// 4. The worker prompt gates the same way.
const wmin = renderPrompt(worker, MINIMAL)
check('worker minimal: board bullet dropped', !wmin.includes('the board holds your assignment'))
check('worker minimal: delegation bullet dropped', !wmin.includes('**Delegation tools.**'))
check('worker minimal: scoped-prompt bullet dropped', !wmin.includes('You run with a scoped prompt'))
check('worker minimal: round ledger bullet kept', wmin.includes('Your assignment names the files you own'))
check('worker minimal: capability block present', wmin.includes('## Host capabilities — probed live'))
const wNoTeammate = renderPrompt(worker, ['subagent', 'subagent_fork', 'workflow', 'team_task_get', 'team_task_update', 'todo_write'])
check('worker: board bullet dropped without spawn_teammate', !wNoTeammate.includes('the board holds your assignment'))
const wFull = renderPrompt(worker, ALL)
check('worker full: the primitives are announced', wFull.includes("The three primitives below are thin pass-throughs to the host's own services"))
check('worker full: the three primitive bullets are kept',
  wFull.includes('`swarm_worktree` gives you a tree of your own') &&
  wFull.includes('`swarm_task` reads the shared board') &&
  wFull.includes('`swarm_child` reaches your own child lanes'))
check('worker minimal: the primitive bullets are dropped',
  !wmin.includes('`swarm_worktree` gives you a tree of your own') &&
  !wmin.includes('`swarm_task` reads the shared board') &&
  !wmin.includes('`swarm_child` reaches your own child lanes'))
check('worker without the plugin tools: the primitive bullets are dropped',
  !renderPrompt(worker, ALL.filter((name) => !name.startsWith('swarm_'))).includes('`swarm_worktree` gives you a tree of your own'))
check('worker minimal: a surface named in the other prompt is named as absent',
  renderPrompt(worker, MINIMAL, { referenced: ['wait_agent'] }).includes('`wait_agent`'))

// 5. Marker edge cases.
const one = (line, names) => renderPrompt(line, names)
check('marker: stray comma does not delete a valid bullet',
  one('- keep me <!-- swarm:requires subagent,,todo_write -->', ['subagent', 'todo_write']).includes('- keep me'))
check('marker: empty requirement keeps the bullet',
  one('- keep me <!-- swarm:requires-->', ['subagent']).includes('- keep me'))
check('marker: spaced empty requirement keeps the bullet',
  one('- keep me <!-- swarm:requires -->', ['subagent']).includes('- keep me'))
check('marker: two markers must both be satisfied',
  one('- drop me <!-- swarm:requires subagent --><!-- swarm:requires workflow -->', ['subagent']).includes('- drop me') === false)
check('marker: two satisfied markers keep the bullet',
  one('- keep me <!-- swarm:requires subagent --><!-- swarm:requires workflow -->', ['subagent', 'workflow']).includes('- keep me'))
check('marker: alternatives are satisfied by one of them',
  one('- keep me <!-- swarm:requires subagent|workflow -->', ['workflow']).includes('- keep me'))

// 6. Idempotence: rendering the same input twice gives the same output.
check('idempotent', renderPrompt(prompt, ALL) === full)

// 7. The `/swarm` line appears only when the host registered the command.
const withCommand = renderPrompt(prompt, ALL, { command: true })
check('command: /swarm line present when registered', withCommand.includes('- **`/swarm`** — print this block on demand, without spending a model turn'))
check('command: /swarm line absent by default', !full.includes('/swarm**'))
check('command: rest of the block unchanged', withCommand.replace('- **`/swarm`** — print this block on demand, without spending a model turn\n', '') === full)

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
