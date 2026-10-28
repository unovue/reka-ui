import type { ComponentInternalInstance, ElementNamespace, Renderer } from 'vue'
import { createRenderer, nodeOps, normalizeClass, normalizeStyle, patchProp } from 'vue'
import { containsComposed, getRootNode } from '@/shared/getRootNode'

/**
 * Vnode type of the placeholder each element's Vue tree renders in place of the
 * part's own element. The renderer below resolves it to the custom element itself,
 * so the host IS the rendered part: Reka's `asChild` merges the part's attributes,
 * listeners and ref onto it, exactly as it would onto a consumer's child element.
 */
export const HOST_TAG = 'reka-element-host'
/** Vnode prop carrying the {@link HostBinding} of the placeholder. */
export const HOST_PROP = '__rekaHost'
/**
 * What the part's tree added to the host, so a `cloneNode()` copy of a mounted
 * element can drop it: space-separated attribute names (`name` when the attribute
 * was not there before, `name=<encoded original>` when it replaced the consumer's),
 * `.token` for classes and `;property` for inline style properties.
 */
export const OWNED_ATTR = 'data-reka-owned'

const HYPHENATE = /\B([A-Z])/g
const WHITESPACE = /\s+/
const STYLE_DECLARATIONS = /;(?![^(]*\))/g
const STYLE_PROPERTY = /:([\s\S]+)/
const IMPORTANT = /\s*!important$/
const EVENT_KEY = /^on[^a-z]/
const FORM_FIELD = /^(?:INPUT|SELECT|TEXTAREA)$/

/**
 * Marks the `CustomEvent`s an element dispatches for its part's emits. The part's
 * own DOM listeners on the host skip them: `FormRoot` listens to `submit` and
 * emits `submit`, which would otherwise reach its own listener again.
 */
export const ELEMENT_EVENT: unique symbol = Symbol.for('reka-ui.element-event') as never

type Handler = (...args: unknown[]) => unknown
const guardedHandlers = new WeakMap<Handler, Handler>()

function guardHandler(handler: Handler): Handler {
  let guarded = guardedHandlers.get(handler)
  if (!guarded) {
    guarded = function (this: unknown, ...args: unknown[]) {
      if (!(args[0] as Record<symbol, unknown> | undefined)?.[ELEMENT_EVENT])
        return handler.apply(this, args)
    }
    guardedHandlers.set(handler, guarded)
  }
  return guarded
}

/** The part's listener, skipping the element's own emit events. */
function guardListener(value: unknown): unknown {
  if (typeof value === 'function')
    return guardHandler(value as Handler)
  return Array.isArray(value) ? value.map(guardListener) : value
}

export function hyphenate(value: string): string {
  return value.replace(HYPHENATE, '-$1').toLowerCase()
}

/** HTML boolean attributes: `true` / `''` set them, `false` removes them. */
const BOOLEAN_ATTRS = new Set(['disabled', 'hidden', 'required', 'readonly', 'checked', 'selected', 'open', 'multiple', 'inert', 'autofocus'])
/** DOM property spellings Vue code may use for attributes. */
const ATTR_ALIASES: Record<string, string> = { tabIndex: 'tabindex', htmlFor: 'for', readOnly: 'readonly', className: 'class' }

/**
 * Native semantics the host element has to stand in for. A custom element is a
 * generic element: when a part renders as a `<button>` or a heading in Vue, the host
 * needs the role, focusability and keyboard activation the native element provides.
 */
export interface HostSemantics {
  role?: string
  /** `aria-level` for headings. */
  level?: number
  /** Button behaviour: focusable, activates with Enter / Space, inert while disabled. */
  button?: boolean
}

const TAG_SEMANTICS: Record<string, HostSemantics> = {
  button: { role: 'button', button: true },
  h1: { role: 'heading', level: 1 },
  h2: { role: 'heading', level: 2 },
  h3: { role: 'heading', level: 3 },
  h4: { role: 'heading', level: 4 },
  h5: { role: 'heading', level: 5 },
  h6: { role: 'heading', level: 6 },
  ul: { role: 'list' },
  ol: { role: 'list' },
  li: { role: 'listitem' },
  nav: { role: 'navigation' },
}

export function semanticsForTag(tag: unknown): HostSemantics | undefined {
  return typeof tag === 'string' ? TAG_SEMANTICS[tag] : undefined
}

export interface HostLifecycle {
  /** The part's placeholder was mounted (the part is rendered). */
  onPartMounted: () => void
  /** The part's placeholder is about to unmount (`Presence`, `v-if`, app teardown). */
  onPartUnmount: () => void
  /** `state` argument of `ElementInternals.setFormValue()` (restored by the browser). */
  formState?: () => string | undefined
}

const bindings = new WeakMap<Node, HostBinding>()
const containers = new WeakMap<Node, HostBinding>()
const relocatedOwners = new WeakMap<Node, HostBinding>()
/** Bindings whose element currently sits away from its home position (teleported or wrapped). */
const awayBindings = new Set<HostBinding>()

/** Hosts a Teleport moved away whose home position is inside `node`. */
export function hostsAwayFrom(node: Node): HTMLElement[] {
  const hosts: HTMLElement[] = []
  for (const binding of awayBindings) {
    if (containsComposed(node, binding.homeNode))
      hosts.push(binding.el)
  }
  return hosts
}

let attributeObserver: MutationObserver | undefined

/** Consumer writes to attributes the part owns but the element does not observe (`id`, `role`, …). */
function observeAttributes(el: HTMLElement) {
  attributeObserver ??= new MutationObserver((records) => {
    for (const record of records)
      bindings.get(record.target)?.onAttributeMutation(record.attributeName!)
  })
  attributeObserver.observe(el, { attributes: true })
}

function warn(message: string) {
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production')
    console.warn(`[reka-ui] ${message}`)
}

type StyleValue = Record<string, string | number | null | undefined>

function toStyleObject(value: unknown): StyleValue {
  const normalized = normalizeStyle(value)
  if (!normalized)
    return {}
  if (typeof normalized !== 'string')
    return normalized as StyleValue
  const result: StyleValue = {}
  for (const declaration of normalized.split(STYLE_DECLARATIONS)) {
    const [property, rest] = declaration.split(STYLE_PROPERTY)
    if (property && rest)
      result[property.trim()] = rest.trim()
  }
  return result
}

function toCssProperty(key: string) {
  return key.startsWith('--') ? key : hyphenate(key)
}

function toAttributeValue(name: string, value: unknown): string | null {
  if (value == null)
    return null
  if (BOOLEAN_ATTRS.has(name))
    return value === false ? null : ''
  return String(value)
}

const VALIDITY_FLAGS = [
  'badInput',
  'customError',
  'patternMismatch',
  'rangeOverflow',
  'rangeUnderflow',
  'stepMismatch',
  'tooLong',
  'tooShort',
  'typeMismatch',
  'valueMissing',
] as const

function copyValidity(validity: ValidityState): ValidityStateFlags {
  const flags: ValidityStateFlags = {}
  for (const flag of VALIDITY_FLAGS) {
    if (validity[flag])
      flags[flag] = true
  }
  return flags
}

/** The entries a form field contributes to its form's data set. */
export function fieldEntries(field: Element): [string, string | File][] {
  const control = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  if (!FORM_FIELD.test(field.tagName) || !control.name || control.disabled)
    return []
  if (control instanceof HTMLSelectElement)
    return Array.from(control.selectedOptions, option => [control.name, option.value])
  if (control instanceof HTMLInputElement) {
    if ((control.type === 'checkbox' || control.type === 'radio') && !control.checked)
      return []
    if (control.type === 'file')
      return Array.from(control.files ?? [], file => [control.name, file])
    if (control.type === 'button' || control.type === 'submit' || control.type === 'reset' || control.type === 'image')
      return []
  }
  return [[control.name, control.value]]
}

/** What the part's tree owns of an attribute. */
interface OwnedAttribute {
  /** The consumer's value, given back when the part lets go (kept up to date while owned). */
  original: string | null
  /** The value the part (or the semantics shim) wants. */
  value: string
  /** Written by the semantics shim: a consumer write takes it over for good. */
  shim: boolean
}

/**
 * Owns everything the part's Vue tree does to the host element and undoes it when
 * the part unmounts, so the element returns to the attributes, classes, styles and
 * listeners the consumer gave it.
 *
 * - Attributes are written as attributes (never as DOM properties: the element's
 *   own properties are its public prop API). While the part renders an attribute it
 *   owns it: a consumer write in the meantime updates the value given back when the
 *   part lets go, and the part's value stays.
 * - `class` and `style` are merged into the consumer's, not replaced.
 * - The part's root-level siblings (`v-if` anchors, hidden form inputs) stay in a
 *   detached container: a custom element has nowhere to put them. Form values reach
 *   the form through `ElementInternals` instead.
 * - When the part's tree moves the placeholder (a `Teleport`, a positioning wrapper),
 *   the host itself moves; a comment keeps its home position for the way back, and
 *   a wrapper takes the host's place.
 */
export class HostBinding {
  /** Root container handed to `app.mount()`. Never attached; see the renderer below. */
  readonly container: HTMLElement
  /** Provides visible at the placeholder: what a nested element inherits. */
  provides: Record<string | symbol, unknown> | null = null
  /** `true` while the binding writes to the host (attribute changes are not consumer input). */
  writing = false
  /** `true` while the renderer moves the host (a `Teleport`, a wrapper, back home). */
  moving = false
  /** `true` while the placeholder is mounted. */
  active = false
  /** The part renders as disabled. */
  partDisabled = false

  private homeMarker: Comment | null = null
  private readonly owned = new Map<string, OwnedAttribute>()
  private readonly vueClasses = new Set<string>()
  private readonly styleOriginals = new Map<string, [string, string]>()
  /** The consumer's `style` attribute before the part first styled the host. */
  private styleAttribute: string | null | undefined
  private readonly events = new Map<string, unknown>()
  private spaceArmed = false
  private markerQueued = false
  private formQueued = false
  private warned = false
  /**
   * Root-level elements of the part's tree placed outside the detached container:
   * a wrapper around the host, a `<style>`, siblings appended inside the host.
   */
  private readonly relocated = new Set<Element>()

  constructor(
    readonly el: HTMLElement,
    private readonly semantics: HostSemantics | undefined,
    readonly lifecycle: HostLifecycle,
    private readonly internals?: ElementInternals,
    /** Root-level elements next to the part go inside the host (`siblings: 'append'`). */
    private readonly appendSiblings = false,
  ) {
    bindings.set(el, this)
    this.container = el.ownerDocument.createElement('div')
    containers.set(this.container, this)
    observeAttributes(el)
    if (internals) {
      const sync = () => this.scheduleFormSync()
      this.container.addEventListener('input', sync)
      this.container.addEventListener('change', sync)
    }
    if (semantics?.button) {
      // Capture runs before the part's own listeners: a disabled button-like host
      // swallows the click, like a native disabled `<button>` that never fires one.
      el.addEventListener('click', this.onClickCapture, true)
      this.addKeyboardShims()
    }
  }

  /**
   * Drops what a mounted element's tree had added to `el` before it was copied with
   * `cloneNode()`: a copy starts from the consumer's attributes only.
   */
  static cleanCopiedState(el: HTMLElement) {
    const owned = el.getAttribute(OWNED_ATTR)
    if (owned === null)
      return
    const hadStyle = el.hasAttribute('style')
    for (const token of owned.split(' ')) {
      if (!token)
        continue
      if (token[0] === '.') {
        el.classList.remove(token.slice(1))
      }
      else if (token[0] === ';') {
        el.style.removeProperty(token.slice(1))
      }
      else {
        const separator = token.indexOf('=')
        if (separator === -1)
          el.removeAttribute(token)
        else
          el.setAttribute(token.slice(0, separator), decodeURIComponent(token.slice(separator + 1)))
      }
    }
    el.removeAttribute(OWNED_ATTR)
    if (hadStyle && !el.style.length)
      el.removeAttribute('style')
    if (el.classList.length === 0)
      el.removeAttribute('class')
  }

  get away() {
    return this.homeMarker !== null
  }

  /** Where the host sits in the consumer's tree: itself, or its marker while moved away. */
  get homeNode(): Node {
    return this.homeMarker ?? this.el
  }

  /** Puts the host back at its home position. */
  goHome() {
    const marker = this.homeMarker
    if (!marker)
      return
    this.homeMarker = null
    awayBindings.delete(this)
    this.moving = true
    try {
      if (marker.parentNode)
        marker.parentNode.replaceChild(this.el, marker)
      else
        this.el.remove()
    }
    finally {
      this.moving = false
    }
  }

  moveTo(parent: Node, anchor: Node | null) {
    this.moving = true
    try {
      if (!this.homeMarker) {
        this.homeMarker = this.el.ownerDocument.createComment('')
        this.el.parentNode?.insertBefore(this.homeMarker, this.el)
        awayBindings.add(this)
      }
      parent.insertBefore(this.el, anchor && anchor.parentNode === parent ? anchor : null)
    }
    finally {
      this.moving = false
    }
  }

  /**
   * A root-level node of the part's tree: wrappers take the host's place, a
   * `<style>` goes to the document's head (or the shadow root), and the rest stays
   * detached, or inside the host with `siblings: 'append'`.
   */
  insertRootNode(child: Node, anchor: Node | null) {
    const element = child.nodeType === Node.ELEMENT_NODE ? child as Element : null
    if (element && this.homeMarker && element.contains(this.el)) {
      this.relocate(element)
      this.homeMarker.parentNode?.insertBefore(element, this.homeMarker)
      return
    }
    if (element?.localName === 'style') {
      this.relocate(element)
      const root = getRootNode(this.homeNode)
      ;(root.nodeType === Node.DOCUMENT_NODE ? (root as Document).head : root).append(element)
      return
    }
    if (element && this.appendSiblings && !FORM_FIELD.test(element.tagName)) {
      this.relocate(element)
      this.el.append(element)
      return
    }
    if (element && !FORM_FIELD.test(element.tagName) && !this.warned) {
      this.warned = true
      warn(`<${this.el.localName}> renders a <${(child as Element).localName}> next to its part. A custom element has nowhere to put it, so it is not in the document.`)
    }
    this.container.insertBefore(child, anchor && anchor.parentNode === this.container ? anchor : null)
    this.scheduleFormSync()
  }

  /** Removes everything the binding added to the document. */
  dispose() {
    this.strip()
    // Taken out of its wrapper or portal target by the consumer: it stays out.
    if (this.homeMarker && !this.el.parentNode) {
      this.homeMarker.remove()
      this.homeMarker = null
      awayBindings.delete(this)
    }
    this.goHome()
    this.removeRelocated()
    this.internals?.setFormValue(null)
    this.internals?.setValidity({})
  }

  /** Called by the renderer for every prop the part's tree sets on the host. */
  patch(key: string, prev: unknown, next: unknown, namespace: ElementNamespace, parentComponent?: ComponentInternalInstance | null) {
    if (key === HOST_PROP) {
      if (next) {
        this.active = true
        this.provides = (parentComponent as (ComponentInternalInstance & { provides?: Record<string | symbol, unknown> }) | null | undefined)?.provides ?? null
      }
      return
    }
    this.write(() => {
      if (key === 'class' || key === 'className') {
        this.patchClass(prev, next)
      }
      else if (key === 'style') {
        this.patchStyle(prev, next)
      }
      else if (EVENT_KEY.test(key)) {
        patchProp(this.el, key, guardListener(prev), guardListener(next), namespace, parentComponent)
        if (next == null)
          this.events.delete(key)
        else
          this.events.set(key, next)
        // The keyboard shim has to see whether the part handled the key itself,
        // so it must stay the last listener on the host.
        if (this.semantics?.button)
          this.addKeyboardShims()
      }
      else if (key === 'disabled') {
        // Kept as state, not written: on a form-associated host the attribute would
        // disable the element by itself, and hide a `<fieldset disabled>` going
        // away. The host's `disabled` attribute stays the consumer's.
        this.partDisabled = toAttributeValue(key, next) !== null
      }
      else if (!(key === 'type' && this.semantics?.button)) {
        // (`type="button"` only means something on a native `<button>`.)
        const name = ATTR_ALIASES[key] ?? key
        this.setPartAttribute(name, toAttributeValue(name, next))
      }
    })
    this.syncSemantics()
  }

  partMounted() {
    this.active = true
    this.syncSemantics()
    this.lifecycle.onPartMounted()
  }

  partUnmount() {
    this.active = false
    this.strip()
    // Once Vue is done unmounting: what it could not reach (see `removeRelocated`).
    queueMicrotask(() => {
      if (this.active)
        return
      this.goHome()
      this.removeRelocated()
    })
    this.lifecycle.onPartUnmount()
  }

  /**
   * Sets an attribute the element itself manages (`inert` / `hidden` while the part
   * is not rendered). Like the semantics shim, a value the consumer set wins.
   */
  setStateAttribute(name: string, on: boolean): boolean {
    if (on) {
      if (this.el.hasAttribute(name))
        return false
      this.write(() => this.el.setAttribute(name, ''))
      return true
    }
    this.write(() => this.el.removeAttribute(name))
    return false
  }

  /**
   * A consumer changed an attribute (an observed one, from
   * `attributeChangedCallback`). While the part owns it, the change becomes the
   * value given back later and the part's value stays.
   */
  consumerWrote(name: string, value: string | null) {
    const entry = this.owned.get(name)
    if (!entry)
      return
    if (entry.shim) {
      this.owned.delete(name)
      this.markerDirty()
      return
    }
    entry.original = value
    this.markerDirty()
    if (this.el.getAttribute(name) !== entry.value)
      this.write(() => this.el.setAttribute(name, entry.value))
  }

  /** @internal */
  onAttributeMutation(name: string) {
    const entry = this.owned.get(name)
    // Our own writes, and consumer writes already handled synchronously, leave the
    // part's value in place.
    if (!entry || this.el.getAttribute(name) === entry.value)
      return
    this.consumerWrote(name, this.el.getAttribute(name))
  }

  /** Vue removed a root-level node itself. */
  released(element: Element) {
    this.relocated.delete(element)
    relocatedOwners.delete(element)
  }

  private relocate(element: Element) {
    this.relocated.add(element)
    relocatedOwners.set(element, this)
  }

  /**
   * Vue removes a fragment's nodes by walking the siblings between its anchors in
   * the detached container, so it never reaches the ones placed elsewhere (a
   * wrapper next to a `<style>`, as in `ScrollAreaViewport`): they go here.
   */
  private removeRelocated() {
    for (const element of [...this.relocated]) {
      this.released(element)
      element.remove()
    }
  }

  /** Undoes every change the part's tree (and the semantics shim) made to the host. */
  strip() {
    this.write(() => {
      for (const [key, handler] of this.events)
        patchProp(this.el, key, handler, null)
      this.events.clear()
      for (const token of this.vueClasses)
        this.el.classList.remove(token)
      this.vueClasses.clear()
      for (const [property, [value, priority]] of this.styleOriginals)
        this.restoreStyle(property, value, priority)
      this.styleOriginals.clear()
      if (this.styleAttribute === null && !this.el.style.length)
        this.el.removeAttribute('style')
      this.styleAttribute = undefined
      for (const name of [...this.owned.keys()])
        this.release(name)
      this.partDisabled = false
      this.el.removeAttribute(OWNED_ATTR)
    })
  }

  /** Form value: the entries of the hidden form fields the part renders next to itself. */
  scheduleFormSync() {
    if (!this.internals || this.formQueued)
      return
    this.formQueued = true
    queueMicrotask(() => {
      this.formQueued = false
      this.syncForm()
    })
  }

  private syncForm() {
    const internals = this.internals!
    const data = new FormData()
    let count = 0
    let invalid: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
    for (const field of this.container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')) {
      for (const [name, value] of fieldEntries(field)) {
        data.append(name, value)
        count++
      }
      if (!invalid && field.willValidate && !field.validity.valid)
        invalid = field
    }
    internals.setFormValue(count ? data : null, this.lifecycle.formState?.())
    // The hidden fields' constraints (`required`, …) are the element's: the form
    // checks them through the element, as it checks the fields in a Vue app.
    if (invalid)
      internals.setValidity(copyValidity(invalid.validity), invalid.validationMessage || 'Invalid value')
    else
      internals.setValidity({})
  }

  private write(fn: () => void) {
    const writing = this.writing
    this.writing = true
    try {
      fn()
    }
    finally {
      this.writing = writing
    }
  }

  private markerDirty() {
    if (this.markerQueued)
      return
    this.markerQueued = true
    queueMicrotask(() => {
      this.markerQueued = false
      this.writeMarker()
    })
  }

  private writeMarker() {
    if (!this.active)
      return
    const tokens: string[] = []
    for (const [name, { original }] of this.owned)
      tokens.push(original === null ? name : `${name}=${encodeURIComponent(original)}`)
    for (const token of this.vueClasses)
      tokens.push(`.${token}`)
    for (const [property, [value]] of this.styleOriginals) {
      if (!value)
        tokens.push(`;${property}`)
    }
    const marker = tokens.join(' ')
    if (this.el.getAttribute(OWNED_ATTR) !== (marker || null))
      this.write(() => marker ? this.el.setAttribute(OWNED_ATTR, marker) : this.el.removeAttribute(OWNED_ATTR))
  }

  private release(name: string) {
    const entry = this.owned.get(name)
    if (!entry)
      return
    this.owned.delete(name)
    this.markerDirty()
    this.write(() => {
      if (entry.original === null)
        this.el.removeAttribute(name)
      else
        this.el.setAttribute(name, entry.original)
    })
  }

  private setPartAttribute(name: string, value: string | null) {
    const entry = this.owned.get(name)
    if (value === null) {
      if (entry && !entry.shim)
        this.release(name)
      return
    }
    if (!entry) {
      this.owned.set(name, { original: this.el.getAttribute(name), value, shim: false })
      this.markerDirty()
    }
    else {
      entry.value = value
      entry.shim = false
    }
    if (this.el.getAttribute(name) !== value)
      this.el.setAttribute(name, value)
  }

  private patchClass(prev: unknown, next: unknown) {
    const nextTokens = new Set(normalizeClass(next).split(WHITESPACE).filter(Boolean))
    for (const token of normalizeClass(prev).split(WHITESPACE)) {
      if (token && !nextTokens.has(token) && this.vueClasses.delete(token))
        this.el.classList.remove(token)
    }
    for (const token of nextTokens) {
      if (!this.el.classList.contains(token)) {
        this.el.classList.add(token)
        this.vueClasses.add(token)
      }
    }
    this.markerDirty()
  }

  private patchStyle(prev: unknown, next: unknown) {
    const prevStyle = toStyleObject(prev)
    const nextStyle = toStyleObject(next)
    const style = this.el.style
    for (const key in prevStyle) {
      const value = nextStyle[key]
      if (value == null || value === '') {
        const property = toCssProperty(key)
        const original = this.styleOriginals.get(property)
        if (original) {
          this.styleOriginals.delete(property)
          this.restoreStyle(property, ...original)
        }
      }
    }
    for (const key in nextStyle) {
      const value = nextStyle[key]
      if (value == null || value === '')
        continue
      const property = toCssProperty(key)
      if (this.styleAttribute === undefined)
        this.styleAttribute = this.el.getAttribute('style')
      if (!this.styleOriginals.has(property))
        this.styleOriginals.set(property, [style.getPropertyValue(property), style.getPropertyPriority(property)])
      const text = String(value)
      const important = IMPORTANT.test(text)
      style.setProperty(property, important ? text.replace(IMPORTANT, '') : text, important ? 'important' : '')
    }
    this.markerDirty()
  }

  private restoreStyle(property: string, value: string, priority: string) {
    if (value)
      this.el.style.setProperty(property, value, priority)
    else
      this.el.style.removeProperty(property)
  }

  /** Sets (or, with `null`, gives back) an attribute the native element would have implied. */
  private shimAttribute(name: string, value: string | null) {
    const entry = this.owned.get(name)
    if (entry && !entry.shim)
      return
    if (value === null) {
      if (entry)
        this.release(name)
      return
    }
    if (!entry) {
      // The consumer set it: theirs wins.
      if (this.el.hasAttribute(name))
        return
      this.owned.set(name, { original: null, value, shim: true })
      this.markerDirty()
    }
    else {
      entry.value = value
    }
    if (this.el.getAttribute(name) !== value)
      this.el.setAttribute(name, value)
  }

  private syncSemantics() {
    const semantics = this.semantics
    if (!semantics || !this.active)
      return
    this.write(() => {
      if (semantics.role)
        this.shimAttribute('role', semantics.role)
      if (semantics.level)
        this.shimAttribute('aria-level', String(semantics.level))
      if (semantics.button) {
        const disabled = this.isDisabled()
        this.shimAttribute('tabindex', disabled ? null : '0')
        this.shimAttribute('aria-disabled', disabled ? 'true' : null)
      }
    })
  }

  /** Disabled as the part renders it: the `disabled` prop, not a leftover attribute. */
  private isDisabled() {
    const disabled = this.owned.get('data-disabled')
    return this.partDisabled || (!!disabled && !disabled.shim)
  }

  private onClickCapture = (event: MouseEvent) => {
    if (this.active && this.isDisabled()) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }

  private addKeyboardShims() {
    // Re-adding moves the listeners behind the part's own, so `defaultPrevented`
    // tells whether the part already handled the key (Switch toggles on Enter).
    this.el.removeEventListener('keydown', this.onKeydown)
    this.el.removeEventListener('keyup', this.onKeyup)
    this.el.addEventListener('keydown', this.onKeydown)
    this.el.addEventListener('keyup', this.onKeyup)
  }

  // Native `<button>` activation: Enter clicks on keydown, Space on keyup.
  private onKeydown = (event: KeyboardEvent) => {
    if (!this.active || event.target !== this.el || event.defaultPrevented || this.isDisabled())
      return
    if (event.key === 'Enter') {
      event.preventDefault()
      this.el.click()
    }
    else if (event.key === ' ') {
      // Stops the page from scrolling, like a native button.
      event.preventDefault()
      this.spaceArmed = true
    }
  }

  private onKeyup = (event: KeyboardEvent) => {
    if (event.key !== ' ' || !this.spaceArmed)
      return
    this.spaceArmed = false
    if (this.active && event.target === this.el && !event.defaultPrevented && !this.isDisabled())
      this.el.click()
  }
}

let renderer: Renderer<Element> | undefined

/**
 * A Vue renderer identical to `runtime-dom`'s except for the host placeholder:
 *
 * - `createElement(HOST_TAG)` returns the custom element instead of a new node;
 * - inserting it into the app's root container keeps it where the consumer put it,
 *   inserting it anywhere else (a `Teleport` target, a positioning wrapper) moves it;
 * - removing it never detaches it, it only goes back home;
 * - other root-level nodes stay in the detached root container, except a wrapper
 *   around the host, which takes the host's place.
 *
 * Every element app shares this one renderer.
 */
export function getRenderer(): Renderer<Element> {
  return renderer ??= createRenderer<Node, Element>({
    ...nodeOps,
    patchProp(el, key, prev, next, namespace, parentComponent) {
      const binding = bindings.get(el)
      if (binding) {
        binding.patch(key, prev, next, namespace, parentComponent)
        return
      }
      patchProp(el, key, prev, next, namespace, parentComponent)
      // A hidden form field next to the part: its value is the element's form value.
      if (el.parentNode)
        containers.get(el.parentNode)?.scheduleFormSync()
    },
    createElement(type, namespace, isCustomizedBuiltIn, vnodeProps) {
      if (type === HOST_TAG)
        return (vnodeProps![HOST_PROP] as HostBinding).el
      return nodeOps.createElement(type, namespace, isCustomizedBuiltIn, vnodeProps)
    },
    insert(child, parent, anchor) {
      const binding = bindings.get(child)
      if (binding) {
        // Its own root container is its home position.
        if (containers.get(parent) === binding)
          binding.goHome()
        else
          binding.moveTo(parent, anchor ?? null)
        return
      }
      const owner = containers.get(parent)
      if (owner)
        owner.insertRootNode(child, anchor ?? null)
      else
        parent.insertBefore(child, anchor && anchor.parentNode === parent ? anchor : null)
    },
    remove(child) {
      const binding = bindings.get(child)
      if (binding) {
        binding.goHome()
        return
      }
      // A wrapper the part rendered around the host: bring the host back first.
      for (const away of awayBindings) {
        if (child.contains(away.el))
          away.goHome()
      }
      relocatedOwners.get(child)?.released(child as Element)
      const parent = child.parentNode
      if (parent) {
        parent.removeChild(child)
        containers.get(parent)?.scheduleFormSync()
      }
    },
    parentNode(node) {
      const binding = bindings.get(node)
      if (binding && !binding.away)
        return binding.container
      return nodeOps.parentNode(node)
    },
    nextSibling(node) {
      const binding = bindings.get(node)
      if (binding && !binding.away)
        return null
      return nodeOps.nextSibling(node)
    },
  })
}
