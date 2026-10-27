import type { App, Component, VNode } from 'vue'
import type { PartMeta } from './meta'
import { camelize, defineComponent, h, queuePostFlushCb, shallowReactive, toHandlerKey } from 'vue'
import { dispatchElementEvent } from './events'
import { getRenderer, HOST_PROP, HOST_TAG, HostBinding } from './host'
import { parseAttribute } from './meta'
import { ensureBaseStyles, UNMOUNTED_ATTR } from './styles'

export interface ResolvedElementOptions {
  prefix: string
  shadowRoot: false | ShadowRootInit
  styles: CSSStyleSheet[]
}

export interface ResolvedPart {
  /** Component export name, e.g. `DialogContent`. */
  name: string
  tag: string
  component: Component
  meta: PartMeta
  options: ResolvedElementOptions
}

/** Tag prefixes that have been registered: an undefined ancestor using one is waited for. */
export const registeredPrefixes = new Set<string>()

const BaseElement = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement

let appUid = 0
function noop() {}

type ElementState = 'idle' | 'waiting' | 'mounted'

function isRekaTag(name: string) {
  for (const prefix of registeredPrefixes) {
    if (name.startsWith(`${prefix}-`))
      return true
  }
  return false
}

/**
 * The nearest Reka element above `el` in the DOM, through the hosts of any shadow
 * roots in between. A Reka-prefixed ancestor that is not defined yet is waited for,
 * so registration order does not matter.
 */
function findParentElement(el: Element): RekaElement | null | Promise<unknown> {
  let node: Node | null = el.parentNode
  while (node) {
    if (node instanceof RekaElement)
      return node
    if (node instanceof Element && !customElements.get(node.localName) && isRekaTag(node.localName))
      return customElements.whenDefined(node.localName)
    node = node instanceof ShadowRoot ? node.host : node.parentNode
  }
  return null
}

/**
 * Base class of every Reka custom element. Each element runs its own small Vue app
 * that renders the part's component with `asChild` onto the element itself (see
 * `host.ts`), so the element is the rendered part: its attributes, `data-*` state,
 * role, focus and listeners are the component's.
 *
 * Context crosses element boundaries like it crosses components in Vue: an element
 * mounts once the nearest Reka element above it has rendered its part, and inherits
 * the provides visible at that part, so `<reka-dialog-trigger>` injects the
 * `DialogRoot` context of the `<reka-dialog-root>` around it. When a part stops
 * rendering (a closed `Presence`), the elements below it unmount too, and remount
 * when it renders again.
 */
export class RekaElement extends BaseElement {
  /** Set on each generated subclass by `defineRekaElements`. */
  static rekaPart: ResolvedPart

  /** @internal */
  _rekaParent: RekaElement | null = null
  /** @internal */
  readonly _rekaChildren = new Set<RekaElement>()
  /** @internal */
  _state: ElementState = 'idle'
  /** @internal */
  readonly _binding: HostBinding

  private readonly _part: ResolvedPart
  private readonly _props = shallowReactive<Record<string, unknown>>({})
  private readonly _listeners: Record<string, (...args: unknown[]) => void> = {}
  private _app: App | null = null
  private _upgraded = false

  constructor() {
    super()
    const part = (this.constructor as typeof RekaElement).rekaPart
    this._part = part
    this._binding = new HostBinding(this, part.meta.semantics, {
      onPartMounted: () => this._onPartMounted(),
      onPartUnmount: () => this._onPartUnmount(),
    })
    for (const emit of part.meta.emits)
      this._listeners[toHandlerKey(camelize(emit))] = (...args) => dispatchElementEvent(this, emit, args)

    const { shadowRoot, styles } = part.options
    if (shadowRoot && !this.shadowRoot) {
      const root = this.attachShadow(shadowRoot)
      root.append(document.createElement('slot'))
      if (styles.length)
        root.adoptedStyleSheets = [...styles]
    }
  }

  connectedCallback() {
    ensureBaseStyles(this)
    if (!this._upgraded) {
      this._upgraded = true
      this._upgradeProperties()
    }
    // Moved by its own part (a Teleport) or by the consumer: nothing to do.
    if (this._state !== 'idle')
      return
    if (!this._binding.active)
      this.setAttribute(UNMOUNTED_ATTR, '')
    this._connect()
  }

  disconnectedCallback() {
    // Moves (a Teleport, a reorder) disconnect and reconnect within the same task.
    queueMicrotask(() => {
      if (!this.isConnected)
        this._teardown()
    })
  }

  static get observedAttributes(): string[] {
    return this.rekaPart?.meta.observedAttributes ?? []
  }

  attributeChangedCallback(name: string, _previous: string | null, value: string | null) {
    // The part writing its own attributes (`disabled`, `id`, …) is not consumer input.
    if (this._binding.writing)
      return
    const prop = this._part.meta.byAttribute.get(name)
    if (prop)
      this._setProp(prop.name, parseAttribute(prop.kind, name, value))
  }

  /** @internal */
  _getProp(name: string): unknown {
    return this._props[name]
  }

  /** @internal */
  _setProp(name: string, value: unknown) {
    if (value === undefined)
      delete this._props[name]
    else
      this._props[name] = value
  }

  /**
   * Whether elements below can mount: the part is rendered.
   * @internal
   */
  _isReady(): boolean {
    return this._state === 'mounted' && this._binding.active
  }

  /** Properties set before the element was defined shadow the prototype accessors. */
  private _upgradeProperties() {
    for (const name of this._part.meta.properties) {
      if (Object.hasOwn(this, name)) {
        const value = (this as Record<string, unknown>)[name]
        delete (this as Record<string, unknown>)[name]
        ;(this as Record<string, unknown>)[name] = value
      }
    }
  }

  private _connect() {
    const parent = findParentElement(this)
    if (parent instanceof Promise) {
      this._state = 'waiting'
      parent.then(() => {
        if (this._state === 'waiting' && !this._rekaParent && this.isConnected) {
          this._state = 'idle'
          this._connect()
        }
      })
      return
    }
    this._rekaParent = parent
    if (parent) {
      parent._rekaChildren.add(this)
      if (!parent._isReady()) {
        // `parent` mounts us once its part renders.
        this._state = 'waiting'
        return
      }
    }
    this._mount()
  }

  /** @internal */
  _mount() {
    const app = getRenderer().createApp(defineComponent({
      name: this._part.name,
      setup: () => () => this._render(),
    }))
    // Vue's `useId` counts per app: give every element app its own id namespace.
    app.config.idPrefix = `rekael${++appUid}`
    const provides = this._rekaParent?._binding.provides
    if (provides)
      Object.setPrototypeOf(app._context.provides, provides)
    this._app = app
    this._state = 'mounted'
    app.mount(this._binding.container as unknown as Element)
  }

  /** @internal */
  _unmountApp() {
    const app = this._app
    if (!app)
      return
    this._app = null
    app.unmount()
    this._binding.dispose()
  }

  private _teardown() {
    this._unmountApp()
    this._binding.dispose()
    this._rekaParent?._rekaChildren.delete(this)
    this._rekaParent = null
    this._state = 'idle'
    this.removeAttribute(UNMOUNTED_ATTR)
  }

  private _render(): VNode {
    const { component, meta } = this._part
    return h(
      component,
      {
        ...this._props,
        ...this._listeners,
        ...(meta.hasAsChild ? { asChild: true } : undefined),
      },
      {
        default: () => h(HOST_TAG, {
          [HOST_PROP]: this._binding,
          onVnodeMounted: () => this._binding.partMounted(),
          onVnodeBeforeUnmount: () => this._binding.partUnmount(),
        }),
      },
    )
  }

  private _onPartMounted() {
    this.removeAttribute(UNMOUNTED_ATTR)
    let mounted = false
    for (const child of this._rekaChildren) {
      if (child._state === 'waiting' && child._rekaParent === this && child.isConnected) {
        child._mount()
        mounted = true
      }
    }
    // A nested app mounted inside this flush leaves its `mounted` hooks queued:
    // make sure a flush picks them up.
    if (mounted)
      queuePostFlushCb(noop)
  }

  private _onPartUnmount() {
    this.setAttribute(UNMOUNTED_ATTR, '')
    const children = [...this._rekaChildren].filter(child => child._state === 'mounted')
    if (!children.length)
      return
    // Elements below inherited the provides of the tree that is going away: remount
    // them against the next one (or wait for it). Deferred so no app unmounts in the
    // middle of this one's patch.
    queueMicrotask(() => {
      for (const child of children) {
        if (child._rekaParent !== this || child._state !== 'mounted')
          continue
        child._unmountApp()
        child._state = 'waiting'
        if (this._isReady())
          child._mount()
      }
    })
  }
}
