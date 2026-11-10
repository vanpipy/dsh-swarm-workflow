/**
 * A small model of the host's service semantics.
 *
 * This is NOT cordis. It models the four rules the swarm bundle's behaviour
 * turns on, so the bundle's registration logic can be tested on any machine
 * that runs Node, with or without a DSH host installed:
 *
 *   1. A service is readable by a fiber that declared it in `inject`.
 *   2. A service whose provider is not active reads as `undefined`.
 *   3. `ctx.inject([...], callback)` starts the callback when every named
 *      service resolves, and starts it later if a service arrives later.
 *   4. `ctx.effect(fn)` runs `fn` now and returns a disposer.
 *
 * When the real runtime can be found (see host-cordis.mjs) the same
 * scenarios run against it; this model is the portable net underneath.
 */

/** Services the host exposes without a declaration, the way cordis does. */
const AMBIENT = new Set(['tools', 'agents', 'skills', 'systemPrompt'])

export class ModelContext {
  /**
   * @param {object} [state] - the shared state of the host.
   * @param {Map<string, {value: unknown, active: boolean}>} [state.providers] - the services the host provides.
   * @param {Array<object>} [state.fibers] - the fibers the host has started or is waiting on.
   * @param {string[]} [inject] - the services this fiber declared.
   */
  constructor(state = {}) {
    this.providers = state.providers ?? new Map()
    this.fibers = state.fibers ?? []
    this.injectList = state.inject ?? []
    this.disposers = []
  }

  /**
   * Provide a service and wake the fibers that declared it.
   * @param {string} name - the service name.
   * @param {unknown} value - the service.
   * @returns {ModelContext} this context.
   */
  provide(name, value) {
    this.providers.set(name, { value, active: true })
    this.notify(name)
    return this
  }

  /**
   * Make a provided service inactive, the way a plugin that is still booting
   * is: the name resolves, but the value does not.
   * @param {string} name - the service name.
   * @returns {void}
   */
  deactivate(name) {
    const provider = this.providers.get(name)
    if (provider !== undefined) provider.active = false
  }

  /**
   * Wake the fibers that declared a service which has just become available.
   * @param {string} name - the service name.
   * @returns {void}
   */
  notify(name) {
    for (const fiber of this.fibers) {
      if (fiber.started) continue
      if (!fiber.inject.includes(name)) continue
      if (!fiber.inject.every((service) => this.get(service) !== undefined)) continue
      this.startFiber(fiber)
    }
  }

  /**
   * Read a service without a declaration. A service whose provider is not
   * active reads as `undefined`, exactly as it does in the host.
   * @param {string} name - the service name.
   * @returns {unknown} the service, or undefined.
   */
  get(name) {
    const provider = this.providers.get(name)
    if (provider === undefined || provider.active !== true) return undefined
    return provider.value
  }

  /**
   * Apply a plugin. Its `apply` runs once every service it declared resolves.
   * @param {object} definition - the plugin definition.
   * @param {string[]} definition.inject - the services it needs.
   * @param {Function} definition.apply - the plugin body.
   * @returns {object} the fiber.
   */
  plugin({ inject = [], apply }) {
    const ctx = new ModelContext({ providers: this.providers, fibers: this.fibers, inject })
    const fiber = { inject: [...inject], apply, ctx, started: false }
    this.fibers.push(fiber)
    if (inject.every((service) => this.get(service) !== undefined)) this.startFiber(fiber)
    return fiber
  }

  /**
   * Start a callback when the named services are available.
   * @param {string[]} inject - the services to wait for.
   * @param {Function} callback - the body, called with the child context.
   * @returns {object} the fiber.
   */
  inject(inject, callback) {
    return this.plugin({ inject, apply: callback })
  }

  /**
   * Run a fiber's body.
   * @param {object} fiber - the fiber.
   * @returns {void}
   */
  startFiber(fiber) {
    fiber.started = true
    fiber.apply(fiber.ctx)
  }

  /**
   * Run a body now and keep its disposer for the fiber's lifetime.
   * @param {Function} fn - the body.
   * @returns {Function} the disposer.
   */
  effect(fn) {
    const disposer = fn()
    this.disposers.push(disposer)
    return () => {
      if (typeof disposer === 'function') disposer()
    }
  }

  /** @returns {unknown} the tool registry, ambient on the host. */
  get tools() { return this.get('tools') }

  /** @returns {unknown} the agent registry, ambient on the host. */
  get agents() { return this.get('agents') }

  /** @returns {unknown} the skill registry, ambient on the host. */
  get skills() { return this.get('skills') }

  /** @returns {unknown} the prompt registry, ambient on the host. */
  get systemPrompt() { return this.get('systemPrompt') }
}

export { AMBIENT }
