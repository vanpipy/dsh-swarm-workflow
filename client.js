window.__ModuleLoader__.load({
  id: '@local/swarm-workflow',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const ACCENT = '#247bbf';
    const NODE = '#5aa9e6';
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
    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock', id: 'swarm-workflow', order: 5,
        }, SwarmGlyph));
      },
    };
  },
});
