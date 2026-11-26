// What the client half registers, checked against a fake host.
//
// The client half is a browser module: it registers itself with
// window.__ModuleLoader__.load({ id, factory }) and, inside apply(ctx), with
// ctx.slots.inject / ctx.slots.register. This suite loads the real file in a
// fake host -- a fake window.__ModuleLoader__, a fake React and a fake ctx
// whose slot calls are captured -- and asserts:
//
//   1. a tool view keyed by the plugin's own wire tool name `swarm_task`
//      (the board tool), so a board call renders as a card in the transcript;
//   2. that the key is one of the bundle's own wire tool names;
//   3. a composer-dock entry with a non-empty, human-readable label;
//   4. that the dock cell renders the label and the board card renders the
//      text the tool returned;
//   5. that the board card renders from the owner props the host hands a tool
//      view, with no injected face -- `inject` is optional for this slot
//      (dsh-cordis-client-runner/lib/client.js:6805-6810 lists only `key` as a
//      register option; dsh-client-ui-renderer/lib/client.js:435-437 falls back
//      to empty injected props when an entry has none), so the view must not
//      depend on one.
//
// The file under test is an optional argument, so the same suite can be
// pointed at a mutated copy of the client half (the negative proof).

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = fileURLToPath(new URL('.', import.meta.url));
const bundle = resolve(here, '..');
const clientPath = process.argv[2] ? resolve(process.argv[2]) : resolve(bundle, 'client.js');

let failures = 0;
let checks = 0;

function check(label, fn) {
  checks += 1;
  try {
    fn();
    console.log('ok    ' + label);
  } catch (error) {
    failures += 1;
    console.log('FAIL  ' + label + ' -> ' + error.message);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// A React stand-in: the client half needs nothing but createElement, and the
// shape returned here is enough to walk the tree the host would render.
function createElement(type, props, ...children) {
  return { type, props: props || {}, children };
}
const react = { createElement };

// Load the client half in a fake browser: the module loader captures what the
// file registers with the host.
function loadClientHalf(path) {
  const definitions = [];
  const sandbox = {
    window: { __ModuleLoader__: { load(definition) { definitions.push(definition); } } },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(path, 'utf8'), sandbox, { filename: path });
  assert(definitions.length === 1,
    'the client half must register exactly one module with the host, saw ' + definitions.length);
  return definitions[0];
}

// Materialize the module the way the host does (factory(require) -> exports),
// then let apply(ctx) run against a ctx whose slot calls are captured.
function captureRegistrations(definition) {
  const module = definition.factory((name) => {
    if (name === 'react') return react;
    throw new Error('the client half asked for an unexpected module: ' + name);
  });
  const injected = [];
  const registered = [];
  const ctx = {
    slots: {
      inject(key, provider) { injected.push({ key, provider }); },
      register(options, component) {
        registered.push({ options, component });
        return { options, component };
      },
    },
  };
  module.apply(ctx);
  for (const entry of injected) entry.provider();
  return { injected, registered };
}

// Every string the host would render for this element tree.
function textsOf(node, out = []) {
  if (node === null || node === undefined) return out;
  if (typeof node === 'string') { out.push(node); return out; }
  if (Array.isArray(node)) { for (const child of node) textsOf(child, out); return out; }
  if (typeof node === 'object') {
    for (const child of node.children || []) textsOf(child, out);
    if (node.props && node.props.children !== undefined) textsOf(node.props.children, out);
  }
  return out;
}

const definition = loadClientHalf(clientPath);
const { injected, registered } = captureRegistrations(definition);

const toolview = registered.find((entry) => entry.options.name === 'tool.call.toolview');
const dock = registered.find((entry) =>
  entry.options.name === 'conversation.composer.dock' && entry.options.id === 'swarm-workflow');
const dockLabel = dock && (typeof dock.options.label === 'function'
  ? dock.options.label()
  : dock.options.label);

console.log('client half under test: ' + clientPath);

check('the client half registers itself with the host module loader', () => {
  assert(definition.id === 'dsh-swarm-workflow',
    'the module id is ' + JSON.stringify(definition.id));
});

check('the client half registers a tool view keyed by the wire tool name swarm_task', () => {
  assert(toolview, 'no registration into "tool.call.toolview"');
  assert(toolview.options.key === 'swarm_task',
    'the tool view is keyed ' + JSON.stringify(toolview.options.key) + ', expected "swarm_task"');
});

check('the tool view is a component', () => {
  assert(toolview, 'no registration into "tool.call.toolview"');
  assert(typeof toolview.component === 'function',
    'the tool view is ' + typeof toolview.component + ', expected a component');
});

check('the tool view declares no locale namespace', () => {
  assert(toolview, 'no registration into "tool.call.toolview"');
  assert(toolview.options.locale === undefined,
    'the plugin ships no locale face, so a locale namespace would make the renderer throw '
    + '(dsh-client-ui-renderer/lib/client.js:744)');
});

check('the tool view key is one of the bundle\'s own wire tool names', () => {
  const index = readFileSync(resolve(bundle, 'index.js'), 'utf8');
  const names = index.match(/SWARM_TOOL_NAMES\s*=\s*\[([^\]]*)\]/);
  assert(names, 'index.js does not export SWARM_TOOL_NAMES');
  assert(names[1].includes("'swarm_task'") || names[1].includes('"swarm_task"'),
    'the wire tool names are [' + names[1].trim() + ']');
});

check('the composer dock entry carries a non-empty label', () => {
  assert(dock, 'no registration into "conversation.composer.dock" for id "swarm-workflow"');
  assert(typeof dockLabel === 'string' && dockLabel.trim() !== '',
    'the dock label is ' + JSON.stringify(dock.options.label) + ', expected a non-empty string');
});

check('the composer dock cell renders its label', () => {
  assert(dock, 'no registration into "conversation.composer.dock" for id "swarm-workflow"');
  const rendered = textsOf(dock.component({}));
  assert(rendered.includes(dockLabel),
    'the dock cell rendered ' + JSON.stringify(rendered) + ', expected the label ' + JSON.stringify(dockLabel));
});

check('the board card renders the text the tool returned', () => {
  assert(toolview, 'no registration into "tool.call.toolview"');
  const rendered = textsOf(toolview.component({
    callId: 'call-1',
    toolName: 'swarm_task',
    phase: 'result',
    block: {
      kind: 'tool_result',
      content: [{ type: 'text', text: 'task-60 claimed by client-lane' }],
    },
  }));
  assert(rendered.includes('task-60 claimed by client-lane'),
    'the card rendered ' + JSON.stringify(rendered) + ', expected the tool output');
});

check('the board card renders the call arguments and the tool name', () => {
  assert(toolview, 'no registration into "tool.call.toolview"');
  const rendered = textsOf(toolview.component({
    callId: 'call-2',
    toolName: 'swarm_task',
    phase: 'start',
    block: { argsRaw: '{"action":"list"}' },
  }));
  assert(rendered.includes('{"action":"list"}'),
    'the card rendered ' + JSON.stringify(rendered) + ', expected the call arguments');
  assert(rendered.some((text) => text.includes('swarm_task')),
    'the card rendered ' + JSON.stringify(rendered) + ', expected the wire tool name');
});

check('the board card renders from the owner props alone (no injected face needed)', () => {
  assert(toolview, 'no registration into "tool.call.toolview"');
  // Exactly the owner props the host hands a tool view
  // (dsh-cordis-client-runner/lib/client.js:6811-6814) and nothing else: no
  // injected props, because this slot's `inject` is optional.
  const rendered = textsOf(toolview.component({
    callId: 'call-3',
    toolName: 'swarm_task',
    cwd: 'D:\\project',
    home: 'C:\\Users\\leroy',
    openFile: () => {},
    loadImage: () => {},
    inspect: () => {},
    useDisclosure: () => {},
    phase: 'result',
    block: {
      kind: 'tool_result',
      content: [{ type: 'text', text: 'task-60 completed' }],
    },
  }));
  assert(rendered.includes('task-60 completed'),
    'the card rendered ' + JSON.stringify(rendered) + ', expected the tool output');
  assert(rendered.some((text) => text.includes('swarm_task')),
    'the card rendered ' + JSON.stringify(rendered) + ', expected the wire tool name');
});

console.log('SUITE CHECKS: ' + checks);
console.log(failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED');
process.exit(failures === 0 ? 0 : 1);
