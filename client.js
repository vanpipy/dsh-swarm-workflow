// The swarm workflow's client half.
//
// Everything this plugin shows a human goes through the host's slot API:
//   ctx.slots.inject(key, provider)  -> dsh-client-ui-renderer/lib/client.js:1368
//   ctx.slots.register(options, C)    -> dsh-client-ui-renderer/lib/client.js:1813
//
// Two registrations:
//
// 1. A tool view keyed by this plugin's own wire tool name `swarm_task` (the
//    board tool, index.js:1237). The host dispatches that keyed slot by the
//    wire tool name: dsh-client-ui-tool/lib/client.js:1965-1970 renders
//    `renderSlot("tool.call.toolview", owner, { entryKey: toolName, ... })`
//    and the renderer looks the entry up by `options.key`
//    (dsh-client-ui-renderer/lib/client.js:1179-1180). The host's own
//    contract for the slot: dsh-cordis-client-runner/lib/client.js:6801-6810
//    ("Register with `key: '<tool name>'`").
// 2. The composer-dock glyph, with a readable label.
//
// The board's live state is not read here. The view renders what the board
// tool call reported -- the call's arguments and the text the tool returned --
// which is the host's own result flattening
// (dsh-client-ui-tool/lib/client.js:193-199).

window.__ModuleLoader__.load({
  id: 'dsh-swarm-workflow',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const ACCENT = '#247bbf';
    const NODE = '#5aa9e6';
    // The dock cell's label. `label` is a documented register option of this
    // slot (dsh-cordis-client-runner/lib/client.js:2976-2981), but the dock
    // owner projects no label of its own -- the renderer reads only `id` and
    // `order` (dsh-client-ui-renderer/lib/client.js:1205-1211) -- so the text
    // is rendered inside the cell as well.
    const DOCK_LABEL = 'Swarm';

    function SwarmGlyph() {
      return h('svg', {
        viewBox: '0 0 64 64', width: 48, height: 48,
        'aria-hidden': true,
        style: { display: 'block', pointerEvents: 'none' },
      },
        h('g', { stroke: ACCENT, strokeWidth: 3, fill: 'none' },
          h('path', { d: 'M32 32 L16 18 M32 32 L48 18 M32 32 L32 48' })),
        h('circle', { cx: 32, cy: 32, r: 8, fill: ACCENT }),
        h('circle', { cx: 16, cy: 18, r: 5, fill: NODE }),
        h('circle', { cx: 48, cy: 18, r: 5, fill: NODE }),
        h('circle', { cx: 32, cy: 48, r: 5, fill: NODE }));
    }

    // The dock cell: the glyph plus the label, because this slot's owner
    // renders no label of its own.
    function SwarmDockEntry() {
      return h('span', {
        className: 'dsh-swarm-dock',
        title: DOCK_LABEL,
        style: { display: 'inline-flex', alignItems: 'center', gap: '4px' },
      },
        h('span', { style: { display: 'inline-flex' } }, SwarmGlyph()),
        h('span', {
          className: 'dsh-swarm-dock-label',
          style: { fontSize: '11px', lineHeight: '1', color: ACCENT },
        }, DOCK_LABEL));
    }

    // The host's own result flattening (dsh-client-ui-tool/lib/client.js:193-199):
    // text blocks verbatim, other blocks as JSON, an error as `name: code`.
    function resultText(node) {
      if (!node || !Array.isArray(node.content)) return '';
      const parts = [];
      for (const block of node.content) {
        if (block && block.type === 'text') parts.push(block.text == null ? '' : String(block.text));
        else parts.push(JSON.stringify(block, null, 2));
      }
      if (parts.length === 0 && node.error !== void 0) {
        parts.push(node.error.name + ': ' + node.error.code);
      }
      return parts.join('\n');
    }

    // The call's own arguments: the settled call head, else the running one
    // (dsh-client-ui-tool/lib/client.js:311).
    function callArguments(block) {
      if (!block) return '';
      if (block.call && typeof block.call.argsRaw === 'string') return block.call.argsRaw;
      if (typeof block.argsRaw === 'string') return block.argsRaw;
      return '';
    }

    // The board card. The owner hands a tool view the call's phase and node
    // (dsh-cordis-client-runner/lib/client.js:6811-6814), so the card shows
    // what the board tool was asked and what it answered.
    function SwarmBoardCard(props) {
      const block = props && props.block ? props.block : null;
      const phase = props && props.phase
        ? props.phase
        : (block && block.kind ? 'result' : 'unknown');
      const argsRaw = callArguments(block);
      const output = resultText(block);
      const toolName = props && props.toolName ? props.toolName : 'swarm_task';
      return h('div', {
        className: 'dsh-swarm-board',
        'data-swarm-board': 'true',
        style: { display: 'flex', flexDirection: 'column', gap: '4px' },
      },
        h('div', {
          className: 'dsh-swarm-board-head',
          style: { display: 'flex', alignItems: 'baseline', gap: '8px' },
        },
          h('span', { style: { fontWeight: 600 } }, 'Swarm board'),
          h('span', { style: { opacity: 0.7 } }, toolName + ' · ' + phase)),
        argsRaw
          ? h('pre', {
            className: 'dsh-swarm-board-args',
            style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 },
          }, argsRaw)
          : null,
        output
          ? h('pre', {
            className: 'dsh-swarm-board-output',
            style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 },
          }, output)
          : h('div', { className: 'dsh-swarm-board-empty' },
            phase === 'result' ? '(the board returned nothing)' : '(running)'));
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        // `key` is the only register option this slot requires
        // (dsh-cordis-client-runner/lib/client.js:6805-6810). `inject` is
        // optional and deliberately absent: the renderer falls back to empty
        // injected props when an entry has none
        // (dsh-client-ui-renderer/lib/client.js:435-437), and the card needs
        // nothing beyond the owner props the host already hands a tool view
        // (dsh-cordis-client-runner/lib/client.js:6811-6814).
        ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
          name: 'tool.call.toolview', key: 'swarm_task',
        }, SwarmBoardCard));
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock', id: 'swarm-workflow', order: 5,
          label: DOCK_LABEL,
        }, SwarmDockEntry));
      },
    };
  },
});
