import type { App, Component, VNode } from 'vue'
import type { ContextProviderEvent, ContextRequestEvent } from './context'
import type { ElementEventOptions } from './events'
import type { PartMeta } from './meta'
import type { RootNode } from '@/shared/getRootNode'
import { camelize, defineComponent, h, nextTick, queuePostFlushCb, shallowReactive, toHandlerKey } from 'vue'
import { containsComposed, getRootNode, resolveTeleportTarget } from '@/shared/getRootNode'
import {
  getRegistry,
  hasLiveDescendants,
  PARENT_CONTEXT,
  ContextProviderEvent as ProviderEvent,
  requestParent,
} from './context'
import { dispatchElementEvent } from './events'
import { getRenderer, HOST_PROP, HOST_TAG, HostBinding, hostsAwayFrom } from './host'
import { parseAttribute } from './meta'
import { ensureRootSetup, UNMOUNTED_ATTR } from './styles'

export interface ResolvedElementOptions {
  prefix: string
  shadowRoot: false | ShadowRootInit
  styles: CSSStyleSheet[]
  events: ElementEventOptions
}

export interface ResolvedPart {
  /** Component export name, e.g. `DialogContent`. */
  name: string
  tag: string
  component: Component
  meta: PartMeta
  options: ResolvedElementOptions
}

/** Brand of every Reka element class, shared between copies of the library. */
export const REKA_ELEMENT: unique symbol = Symbol.for('reka-ui.element') as never

/** Props whose attribute is reflected from the property: the browser reads it on a form-associated host. */
const REFLECTED_PROPS = new Set(['disabled'])
/** Attributes an element adds while its part is not rendered. */
const UNMOUNTED_STATE_ATTRS = ['inert', 'hidden']
/**
 * Roots of parts that open over the page: an open overlay is not reopened by
 * moving it, like a remounted Vue component starts closed.
 */
const OVERLAY_ROOTS = new Set(['AlertDialogRoot', 'DialogRoot', 'DrawerRoot', 'HoverCardRoot', 'PopoverRoot', 'TooltipRoot'])
const UPDATE_EMIT = /^update:(.+)$/

const BaseElement = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement

function noop() {}

function warn(message: string) {
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production')
    console.warn(`[reka-ui] ${message}`)
}

/** The uncontrolled-default prop of a model: `modelValue` → `defaultValue`, `open` → `defaultOpen`. */
function defaultPropOf(model: string) {
  return model === 'modelValue' ? 'defaultValue' : `default${model[0].toUpperCase()}${model.slice(1)}`
}

function isMissingInjection(error: unknown) {
  return error instanceof Error && error.message.startsWith('Injection `')
}

function modelOfDefault(name: string): string | undefined {
  if (name === 'defaultValue')
    return 'modelValue'
  if (name.startsWith('default') && name.length > 7)
    return `${name[7].toLowerCase()}${name.slice(8)}`
}

/** Disabled by a `<fieldset disabled>` around it (outside the fieldset's first legend). */
function inDisabledFieldset(el: Element) {
  let fieldset = el.parentElement?.closest('fieldset[disabled]')
  while (fieldset) {
    const legend = fieldset.querySelector(':scope > legend')
    if (!legend || !legend.contains(el))
      return true
    fieldset = fieldset.parentElement?.closest('fieldset[disabled]')
  }
  return false
}

type ElementState = 'idle' | 'waiting' | 'mounted'

/**
 * Base class of every Reka custom element. Each element runs its own small Vue app
 * that renders the part's component with `asChild` onto the element itself (see
 * `host.ts`), so the element is the rendered part: its attributes, `data-*` state,
 * role, focus and listeners are the component's.
 *
 * Context crosses element boundaries like it crosses components in Vue. An element
 * finds its parent with a `context-request` event (see `context.ts`), mounts once
 * that parent has rendered its part, and inherits the provides visible at that
 * part, so `<reka-dialog-trigger>` injects the `DialogRoot` context of the
 * `<reka-dialog-root>` around it. When a part stops rendering (a closed
 * `Presence`), the elements below it unmount too, and remount when it renders
 * again. Moved under another parent, an element remounts there.
 */
export class RekaElement extends BaseElement {
  /** Set on each generated subclass by `defineRekaElements`. */
  static rekaPart: ResolvedPart
  static readonly [REKA_ELEMENT] = true

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
  /** State the element adds to the props: a disabled `<fieldset>` around it. */
  private readonly _extra = shallowReactive<{ fieldsetDisabled: boolean, rootNode?: RootNode }>({ fieldsetDisabled: false })
  private readonly _listeners: Record<string, (...args: unknown[]) => void> = {}
  /**
   * Last value of each uncontrolled model (`update:modelValue`, `update:open`):
   * passed as its default when the part mounts again, so the element keeps its
   * state when it is removed and re-inserted, or when its parent part re-renders.
   */
  private _carried: Record<string, unknown> = {}
  private _app: App | null = null
  private _upgraded = false
  private _reflecting = false
  private _warnedOrphan = false

  constructor() {
    super()
    const part = (this.constructor as typeof RekaElement).rekaPart
    this._part = part
    // Without form-associated internals (Safari < 16.4, jsdom) the element still
    // works, it just does not submit with a form.
    const attached = part.meta.formAssociated && typeof this.attachInternals === 'function'
      ? this.attachInternals()
      : undefined
    const internals = typeof attached?.setFormValue === 'function' ? attached : undefined
    this._binding = new HostBinding(this, part.meta.semantics, {
      onPartMounted: () => this._onPartMounted(),
      onPartUnmount: () => this._onPartUnmount(),
      formState: () => 'modelValue' in this._carried ? JSON.stringify(this._carried.modelValue) : undefined,
    }, internals)
    for (const emit of part.meta.emits) {
      this._listeners[toHandlerKey(camelize(emit))] = (...args) => {
        this._track(emit, args[0])
        dispatchElementEvent(this, emit, args, part.options.events)
      }
    }

    const { shadowRoot, styles } = part.options
    if (shadowRoot && !this.shadowRoot) {
      const root = this.attachShadow(shadowRoot)
      root.append(document.createElement('slot'))
      if (styles.length)
        root.adoptedStyleSheets = [...styles]
    }
    this.addEventListener('context-request', this._onContextRequest)
    this.addEventListener('context-provider', this._onContextProvider)
  }

  connectedCallback() {
    ensureRootSetup(this)
    if (!this._upgraded) {
      this._upgraded = true
      // A `cloneNode()` copy of a mounted element: start from the consumer's attributes.
      HostBinding.cleanCopiedState(this)
      this._setUnmounted(false)
      this._upgradeProperties()
    }
    // Moved by its own part (a `Teleport`, a wrapper): same parent, nothing to do.
    if (this._binding.moving)
      return
    // Moved by the consumer: portals (here, or moved away from here) follow to the
    // new document or shadow root.
    this._checkRootNode()
    for (const host of hostsAwayFrom(this))
      (host as RekaElement)._checkRootNode?.()
    if (this._state !== 'idle') {
      // Moved by the consumer: remount if it now sits under another parent.
      this._resolveParent()
      return
    }
    if (!this._binding.active)
      this._setUnmounted(true)
    getRegistry().live.add(this)
    this._attach(requestParent<RekaElement>(this))
    // Upgraded after elements below it resolved their parent: they ask again.
    if (hasLiveDescendants(this))
      this.dispatchEvent(new ProviderEvent(PARENT_CONTEXT, this))
  }

  disconnectedCallback() {
    // Moves (a Teleport, a reorder) disconnect and reconnect within the same task.
    queueMicrotask(() => {
      if (this.isConnected)
        return
      // A portal whose target went away while its home moved: the move retargets
      // it in the next render.
      if (this._binding.away && this._binding.homeNode.isConnected) {
        void nextTick(() => {
          if (!this.isConnected)
            this._teardown()
        })
        return
      }
      this._teardown()
    })
  }

  static get observedAttributes(): string[] {
    // `hidden` / `inert`: a consumer write takes them over from the unrendered state.
    return [...(this.rekaPart?.meta.observedAttributes ?? []), ...UNMOUNTED_STATE_ATTRS]
  }

  attributeChangedCallback(name: string, _previous: string | null, value: string | null) {
    // The part writing its own attributes (`disabled`, `id`, …) is not consumer input.
    if (this._binding.writing)
      return
    if (UNMOUNTED_STATE_ATTRS.includes(name))
      this._consumerStateWrite(name)
    this._binding.consumerWrote(name, value)
    if (this._reflecting)
      return
    const prop = this._part.meta.byAttribute.get(name)
    if (prop)
      this._setProp(prop.name, parseAttribute(prop, value))
  }

  formResetCallback() {
    this._carried = {}
    this._remount()
  }

  formStateRestoreCallback(state: unknown, mode: 'restore' | 'autocomplete') {
    if (mode !== 'restore' || typeof state !== 'string')
      return
    try {
      this._carried.modelValue = JSON.parse(state)
    }
    catch {
      return
    }
    this._remount()
  }

  formDisabledCallback(disabled: boolean) {
    // Also called for the host's own `disabled` attribute, which the prop drives.
    this._extra.fieldsetDisabled = disabled && inDisabledFieldset(this)
  }

  /** @internal */
  _getProp(name: string): unknown {
    return this._props[name]
  }

  /**
   * A prop read as a property. A reflected one (`disabled`) is its attribute, like
   * a native control's: the consumer's setting, not the part's effective state
   * (that is `data-disabled` / `aria-disabled`).
   * @internal
   */
  _getProperty(name: string): unknown {
    return REFLECTED_PROPS.has(name) ? this.hasAttribute(name) : this._props[name]
  }

  /** @internal */
  _setProp(name: string, value: unknown) {
    if (value === undefined)
      delete this._props[name]
    else
      this._props[name] = value
    // The consumer took over the model, or gave it a new default.
    delete this._carried[name]
    const model = modelOfDefault(name)
    if (model)
      delete this._carried[model]
  }

  /**
   * A prop set as a property. `disabled` is also reflected to its attribute: on a
   * form-associated host the browser reads the attribute (`:disabled`, `<fieldset>`).
   * @internal
   */
  _setProperty(name: string, value: unknown) {
    this._setProp(name, value)
    if (!REFLECTED_PROPS.has(name))
      return
    this._reflecting = true
    try {
      this.toggleAttribute(name, !!value)
    }
    finally {
      this._reflecting = false
    }
  }

  /**
   * Whether elements below can mount: the part is rendered.
   * @internal
   */
  _isReady(): boolean {
    return this._state === 'mounted' && this._binding.active
  }

  /**
   * Asks for the parent again; remounts under it when it changed.
   * @internal
   */
  _resolveParent() {
    if (this._state === 'idle' || !this.isConnected)
      return
    const parent = requestParent<RekaElement>(this)
    if (parent === this._rekaParent)
      return
    this._rekaParent?._rekaChildren.delete(this)
    this._unmountApp()
    this._attach(parent)
  }

  /**
   * The root node the element sits in (its home, while a Teleport has it away).
   * Read by portals' render, so they retarget when it changes.
   * @internal
   */
  _checkRootNode() {
    const root = getRootNode(this._binding.homeNode)
    if (this._extra.rootNode !== root)
      this._extra.rootNode = root
  }

  /** @internal */
  _mount() {
    this._checkRootNode()
    const app = getRenderer().createApp(defineComponent({
      name: this._part.name,
      setup: () => () => this._render(),
    }))
    // Vue's `useId` counts per app: give every element app its own id namespace,
    // unique across copies of the library.
    app.config.idPrefix = `rekael${++getRegistry().appUid}`
    const parent = this._rekaParent
    const provides = parent?._binding.provides
    if (provides)
      Object.setPrototypeOf(app._context.provides, provides)
    // A part that cannot find its family's context fails to set up: without a
    // parent (a trigger outside its root) it waits for one; under a parent from
    // another copy of the library (contexts are per copy) it stays unrendered.
    // Either way it warns once instead of throwing.
    let failed = false
    app.config.errorHandler = (error) => {
      if (isMissingInjection(error)) {
        failed = true
        return
      }
      console.error(error)
    }
    app.config.warnHandler = (message, _instance, trace) => {
      if (!message.startsWith('injection'))
        console.warn(`[Vue warn]: ${message}${trace}`)
    }
    this._app = app
    this._state = 'mounted'
    app.mount(this._binding.container)
    app.config.errorHandler = undefined
    app.config.warnHandler = undefined
    if (!failed)
      return
    this._unmountApp()
    this._state = 'waiting'
    if (this._warnedOrphan)
      return
    this._warnedOrphan = true
    if (parent)
      warn(`<${this.localName}> cannot find its family's context in <${parent.localName}>. Elements share context within one copy of reka-ui: are both defined by the same copy?`)
    else
      warn(`<${this.localName}> cannot render outside its family's root element. It renders once it is placed (or its ancestors are defined) under one.`)
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

  private _attach(parent: RekaElement | null) {
    const registry = getRegistry()
    this._rekaParent = parent
    if (parent) {
      registry.orphans.delete(this)
      parent._rekaChildren.add(this)
      if (!parent._isReady()) {
        // `parent` mounts us once its part renders.
        this._state = 'waiting'
        return
      }
    }
    else {
      registry.orphans.set(this, this._retry)
    }
    this._mount()
  }

  private _retry = () => this._resolveParent()

  private _remount() {
    if (this._state !== 'mounted')
      return
    this._unmountApp()
    this._mount()
  }

  private _teardown() {
    const registry = getRegistry()
    this._unmountApp()
    this._binding.dispose()
    this._rekaParent?._rekaChildren.delete(this)
    this._rekaParent = null
    this._state = 'idle'
    registry.orphans.delete(this)
    registry.live.delete(this)
    this._setUnmounted(false)
  }

  /** Remembers an uncontrolled model's value for the next mount. */
  private _track(emit: string, value: unknown) {
    const model = UPDATE_EMIT.exec(emit)?.[1]
    if (model === 'open' && OVERLAY_ROOTS.has(this._part.name))
      return
    if (model && this._props[model] === undefined)
      this._carried[model] = value
  }

  /** The consumer wrote `hidden` / `inert`: it is theirs, not the unrendered state's. */
  private _consumerStateWrite(name: string) {
    const current = this.getAttribute(UNMOUNTED_ATTR)
    if (current === null || !current.split(' ').includes(name))
      return
    this.setAttribute(UNMOUNTED_ATTR, current.split(' ').filter(added => added !== name).join(' '))
  }

  /** `data-reka-unmounted`, plus `inert` and `hidden` unless the consumer set them. */
  private _setUnmounted(on: boolean) {
    const current = this.getAttribute(UNMOUNTED_ATTR)
    if (on) {
      if (current !== null)
        return
      const added = UNMOUNTED_STATE_ATTRS.filter(name => this._binding.setStateAttribute(name, true))
      this.setAttribute(UNMOUNTED_ATTR, added.join(' '))
      return
    }
    if (current === null)
      return
    for (const name of current.split(' ')) {
      if (UNMOUNTED_STATE_ATTRS.includes(name))
        this._binding.setStateAttribute(name, false)
    }
    this.removeAttribute(UNMOUNTED_ATTR)
  }

  private _render(): VNode {
    const { component, meta } = this._part
    const props: Record<string, unknown> = { ...this._props }
    for (const [model, value] of Object.entries(this._carried)) {
      const defaultProp = defaultPropOf(model)
      if (props[model] === undefined && meta.propNames.has(defaultProp))
        props[defaultProp] = value
    }
    if (this._extra.fieldsetDisabled && meta.propNames.has('disabled'))
      props.disabled = true
    if (meta.propNames.has('to') && meta.propNames.has('forceMount') && !props.disabled)
      props.to = this._portalTarget(props.to)
    return h(
      component,
      {
        ...props,
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

  /**
   * A portal's target, resolved from where the element sits. The portal's own
   * lookup runs from its DOM anchor, which here is in the element's detached
   * container, and only once mounted: on a force-mounted portal that costs a render,
   * and inside a shadow root it would send the content to the document's body.
   * A selector that matches nothing yet is left to the portal.
   */
  private _portalTarget(to: unknown): unknown {
    if (to && typeof to !== 'string')
      return to
    const root = this._extra.rootNode ?? getRootNode(this._binding.homeNode)
    const target = resolveTeleportTarget(to as string | undefined, root)
    if (typeof target !== 'string')
      return target
    return root.querySelector(target) ?? this.ownerDocument.querySelector(target) ?? to
  }

  private _onContextRequest = (event: ContextRequestEvent<RekaElement>) => {
    if (event.context !== PARENT_CONTEXT || event.contextTarget === this)
      return
    event.stopPropagation()
    event.callback(this)
  }

  private _onContextProvider = (event: ContextProviderEvent) => {
    if (event.context !== PARENT_CONTEXT || event.contextTarget === this)
      return
    for (const child of [...this._rekaChildren]) {
      if (containsComposed(event.contextTarget, child))
        child._resolveParent()
    }
  }

  private _onPartMounted() {
    this._setUnmounted(false)
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
    this._setUnmounted(true)
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
        // The part around it went away, as a Vue subtree would: it starts over
        // when it renders again. (Moves by the consumer keep the state.)
        child._carried = {}
        child._unmountApp()
        child._state = 'waiting'
        if (this._isReady())
          child._mount()
      }
    })
  }
}
