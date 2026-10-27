import type { ComponentInternalInstance, ElementNamespace, Renderer } from 'vue'
import { createRenderer, nodeOps, normalizeClass, normalizeStyle, patchProp } from 'vue'

/**
 * Vnode type of the placeholder each element's Vue tree renders in place of the
 * part's own element. The renderer below resolves it to the custom element itself,
 * so the host IS the rendered part: Reka's `asChild` merges the part's attributes,
 * listeners and ref onto it, exactly as it would onto a consumer's child element.
 */
export const HOST_TAG = 'reka-element-host'
/** Vnode prop carrying the {@link HostBinding} of the placeholder. */
export const HOST_PROP = '__rekaHost'

const HYPHENATE = /\B([A-Z])/g
const WHITESPACE = /\s+/
const STYLE_DECLARATIONS = /;(?![^(]*\))/g
const STYLE_PROPERTY = /:([\s\S]+)/
const IMPORTANT = /\s*!important$/
const EVENT_KEY = /^on[^a-z]/

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
  /** Button behaviour: focusable, activates with Enter / Space, inert while `disabled`. */
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
}

const bindings = new WeakMap<Node, HostBinding>()
const containers = new WeakMap<object, HostBinding>()
/** Bindings whose element currently sits away from its home position (teleported or wrapped). */
const awayBindings = new Set<HostBinding>()

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

/**
 * Owns everything the part's Vue tree does to the host element and undoes it when
 * the part unmounts, so the element returns to the attributes, classes, styles and
 * listeners the consumer gave it.
 *
 * - Attributes are written as attributes (never as DOM properties: the element's
 *   own properties are its public prop API). The consumer's original value is
 *   restored when the part stops rendering it.
 * - `class` and `style` are merged into the consumer's, not replaced.
 * - Vue nodes rendered at the root of the part's tree next to the part (hidden form
 *   inputs, positioning wrappers, `v-if` anchors) go into a `display: contents`
 *   fragment placed just before the host.
 * - When the part's tree moves the placeholder (a `Teleport`, a positioning wrapper),
 *   the host itself moves; a comment keeps its home position for the way back.
 */
export class HostBinding {
  /** Root container handed to `app.mount()`; see the renderer below. */
  readonly container: Record<string, unknown> = {}
  /** Provides visible at the placeholder: what a nested element inherits. */
  provides: Record<string | symbol, unknown> | null = null
  /** `true` while the part's tree writes to the host (attribute changes are not consumer input). */
  writing = false
  /** `true` while the placeholder is mounted. */
  active = false

  private homeMarker: Comment | null = null
  private fragment: HTMLElement | null = null
  private readonly originals = new Map<string, string | null>()
  private readonly vueAttrs = new Set<string>()
  private readonly shimAttrs = new Set<string>()
  private readonly vueClasses = new Set<string>()
  private readonly styleOriginals = new Map<string, [string, string]>()
  /** The consumer's `style` attribute before the part first styled the host. */
  private styleAttribute: string | null | undefined
  private readonly events = new Map<string, unknown>()
  private spaceArmed = false

  constructor(
    readonly el: HTMLElement,
    private readonly semantics: HostSemantics | undefined,
    readonly lifecycle: HostLifecycle,
  ) {
    bindings.set(el, this)
    containers.set(this.container, this)
    if (semantics?.button) {
      // Capture runs before the part's own listeners: a disabled button-like host
      // swallows the click, like a native disabled `<button>` that never fires one.
      el.addEventListener('click', this.onClickCapture, true)
      this.addKeyboardShims()
    }
  }

  get away() {
    return this.homeMarker !== null
  }

  /** Puts the host back at its home position. */
  goHome() {
    const marker = this.homeMarker
    if (!marker)
      return
    this.homeMarker = null
    awayBindings.delete(this)
    if (marker.parentNode)
      marker.parentNode.replaceChild(this.el, marker)
    else
      this.el.remove()
  }

  moveTo(parent: Node, anchor: Node | null) {
    if (!this.homeMarker) {
      this.homeMarker = document.createComment('')
      this.el.parentNode?.insertBefore(this.homeMarker, this.el)
      awayBindings.add(this)
    }
    parent.insertBefore(this.el, anchor && anchor.parentNode === parent ? anchor : null)
  }

  isFragment(node: Node) {
    return node === this.fragment
  }

  ensureFragment(): HTMLElement {
    if (!this.fragment) {
      const fragment = document.createElement('div')
      fragment.setAttribute('data-reka-fragment', '')
      fragment.style.display = 'contents'
      const reference = this.homeMarker ?? this.el
      reference.parentNode?.insertBefore(fragment, reference)
      this.fragment = fragment
    }
    return this.fragment
  }

  /** Removes everything the binding added to the document. */
  dispose() {
    this.strip()
    this.goHome()
    this.fragment?.remove()
    this.fragment = null
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
    this.writing = true
    try {
      if (key === 'class' || key === 'className') {
        this.patchClass(prev, next)
      }
      else if (key === 'style') {
        this.patchStyle(prev, next)
      }
      else if (EVENT_KEY.test(key)) {
        patchProp(this.el, key, prev, next, namespace, parentComponent)
        if (next == null)
          this.events.delete(key)
        else
          this.events.set(key, next)
        // The keyboard shim has to see whether the part handled the key itself,
        // so it must stay the last listener on the host.
        if (this.semantics?.button)
          this.addKeyboardShims()
      }
      else if (!(key === 'type' && this.semantics?.button)) {
        // (`type="button"` only means something on a native `<button>`.)
        this.patchAttribute(ATTR_ALIASES[key] ?? key, next)
      }
    }
    finally {
      this.writing = false
    }
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
    this.lifecycle.onPartUnmount()
  }

  /** Undoes every change the part's tree (and the semantics shim) made to the host. */
  strip() {
    this.writing = true
    try {
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
      const owned = new Set([...this.vueAttrs, ...this.shimAttrs])
      this.vueAttrs.clear()
      this.shimAttrs.clear()
      for (const name of owned)
        this.release(name)
    }
    finally {
      this.writing = false
    }
  }

  private snapshot(name: string) {
    if (!this.originals.has(name))
      this.originals.set(name, this.el.getAttribute(name))
  }

  private release(name: string) {
    if (this.vueAttrs.has(name) || this.shimAttrs.has(name) || !this.originals.has(name))
      return
    const original = this.originals.get(name)!
    this.originals.delete(name)
    if (original === null)
      this.el.removeAttribute(name)
    else
      this.el.setAttribute(name, original)
  }

  private patchAttribute(name: string, value: unknown) {
    const next = toAttributeValue(name, value)
    if (next === null) {
      if (this.vueAttrs.delete(name))
        this.release(name)
      return
    }
    this.snapshot(name)
    this.vueAttrs.add(name)
    this.shimAttrs.delete(name)
    this.el.setAttribute(name, next)
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
  }

  private restoreStyle(property: string, value: string, priority: string) {
    if (value)
      this.el.style.setProperty(property, value, priority)
    else
      this.el.style.removeProperty(property)
  }

  /** Sets (or, with `null`, gives back) an attribute the native element would have implied. */
  private shimAttribute(name: string, value: string | null) {
    if (this.vueAttrs.has(name))
      return
    if (value === null) {
      if (this.shimAttrs.delete(name))
        this.release(name)
      return
    }
    // The consumer set it: theirs wins.
    if (!this.shimAttrs.has(name) && this.el.hasAttribute(name))
      return
    this.snapshot(name)
    this.shimAttrs.add(name)
    if (this.el.getAttribute(name) !== value)
      this.el.setAttribute(name, value)
  }

  private syncSemantics() {
    const semantics = this.semantics
    if (!semantics || !this.active)
      return
    this.writing = true
    try {
      if (semantics.role)
        this.shimAttribute('role', semantics.role)
      if (semantics.level)
        this.shimAttribute('aria-level', String(semantics.level))
      if (semantics.button) {
        const disabled = this.isDisabled()
        this.shimAttribute('tabindex', disabled ? null : '0')
        this.shimAttribute('aria-disabled', disabled ? 'true' : null)
      }
    }
    finally {
      this.writing = false
    }
  }

  private isDisabled() {
    return this.el.hasAttribute('disabled')
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
 * - other root-level nodes land in a `display: contents` fragment before the host.
 *
 * Every element app shares this one renderer.
 */
export function getRenderer(): Renderer<Element> {
  return renderer ??= createRenderer<Node, Element>({
    ...nodeOps,
    patchProp(el, key, prev, next, namespace, parentComponent) {
      const binding = bindings.get(el)
      if (binding)
        binding.patch(key, prev, next, namespace, parentComponent)
      else
        patchProp(el, key, prev, next, namespace, parentComponent)
    },
    createElement(type, namespace, isCustomizedBuiltIn, vnodeProps) {
      if (type === HOST_TAG)
        return (vnodeProps![HOST_PROP] as HostBinding).el
      return nodeOps.createElement(type, namespace, isCustomizedBuiltIn, vnodeProps)
    },
    insert(child, parent, anchor) {
      const binding = bindings.get(child)
      if (binding) {
        // Its own root container or root fragment both sit at its home position.
        if (containers.get(parent) === binding || binding.isFragment(parent))
          binding.goHome()
        else
          binding.moveTo(parent, anchor ?? null)
        return
      }
      const owner = containers.get(parent)
      const target = owner ? owner.ensureFragment() : parent
      target.insertBefore(child, anchor && anchor.parentNode === target ? anchor : null)
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
      const parent = child.parentNode
      if (parent)
        parent.removeChild(child)
    },
    parentNode(node) {
      const binding = bindings.get(node)
      if (binding && !binding.away)
        return binding.container as unknown as Element
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
