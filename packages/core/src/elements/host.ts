import type { ComponentInternalInstance, ElementNamespace, Renderer } from 'vue'
import { createRenderer, nodeOps, normalizeClass, normalizeStyle, patchProp } from 'vue'
import { containsComposed } from '@/shared/getRootNode'

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
/**
 * Marks the nodes a part's tree rendered into the host (an `inside` part, see
 * {@link HostSemantics.inside}, or `siblings: 'inside'`) or next to it (`siblings`),
 * so a `cloneNode()` copy of a mounted element can drop them. A wrapper the part
 * renders around the host has the value `wrapper`: a copy takes itself out of it.
 */
export const RELOCATED_ATTR = 'data-reka-relocated'
/** Data of the comment that ends a `siblings` part's nodes next to its host. */
const SIBLINGS_END = 'reka-siblings-end'
/**
 * Marks an element the binding created inside the consumer's tree (the `<input>`
 * of a `target: 'input'` part that had none): not the consumer's content.
 */
export const CREATED_ATTR = 'data-reka-created'

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
/**
 * Props of a native `<input>` target that are DOM state, not attributes. (`disabled`
 * reflects its attribute: it is owned like any attribute, so a consumer write while
 * the part renders is what remains, and a `cloneNode()` copy drops it.)
 */
const NATIVE_PROPS = new Set(['value', 'checked', 'indeterminate'])

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
  /**
   * Link behaviour, while the host has an `href`: `role="link"`, focusable,
   * activates with Enter, and a click the page does not prevent follows the
   * `href` (and `target`), as an `<a href>` would.
   */
  link?: boolean
  /**
   * The part renders its own element inside the host instead of onto it. An SVG
   * part (an arrow) needs a real `<svg>`, which a custom element cannot stand in
   * for: the host holds it, and is positioned and styled as its box (`fill`,
   * `color` and `stroke` inherit).
   */
  inside?: boolean
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
  a: { link: true },
  svg: { inside: true },
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
/** Nodes a `siblings` part rendered next to its host, by binding. */
const siblingOwners = new WeakMap<Node, HostBinding>()
/** Nodes a live part rendered into (`inside`) or next to (`siblings`) its host. */
const liveRelocated = new WeakSet<Node>()
/** Wrappers a part rendered around its host, by binding. */
const wrapperOwners = new WeakMap<Node, HostBinding>()
/** Bindings whose element currently sits away from its home position (teleported or wrapped). */
const awayBindings = new Set<HostBinding>()

/** Hosts a Teleport moved away whose home position is inside `node`. */
export function hostsAwayFrom(node: Node): HTMLElement[] {
  const hosts: HTMLElement[] = []
  for (const binding of awayBindings) {
    if (containsComposed(node, binding.homeNode))
      hosts.push(binding.host)
  }
  return hosts
}

let attributeObserver: MutationObserver | undefined

/** Consumer writes to attributes the part owns but the element does not observe (`id`, `role`, …). */
function observeAttributes(el: HTMLElement) {
  attributeObserver ??= new MutationObserver((records) => {
    for (const record of records) {
      const binding = bindings.get(record.target)
      // (The host of a part rendered onto its `<input>` child owns nothing itself.)
      if (binding?.el === record.target)
        binding.onAttributeMutation(record.attributeName!)
    }
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
  /**
   * Root-level elements the part renders next to itself go in the document, after
   * the host or inside it, instead of staying detached (see `RekaElementPartDefinition.siblings`).
   */
  siblings: false | 'after' | 'inside' = false

  private homeMarker: Comment | null = null
  private readonly owned = new Map<string, OwnedAttribute>()
  private readonly vueClasses = new Set<string>()
  private readonly styleOriginals = new Map<string, [string, string]>()
  /** The consumer's `style` attribute before the part first styled the host. */
  private styleAttribute: string | null | undefined
  private readonly events = new Map<string, unknown>()
  /** Nodes the part's tree rendered into the host (an `inside` part). */
  private readonly content = new Set<Node>()
  /** Nodes the part's tree rendered next to the host (a `siblings` part). */
  private readonly siblingNodes = new Set<Node>()
  /** Marks where the host's siblings end, so they keep their order. */
  private siblingEnd: Comment | null = null
  /**
   * Wrappers the part rendered around the host, in the consumer's tree. Vue removes
   * a fragment's nodes by walking between its anchors in the detached container,
   * so it never reaches one next to a `<style>` (`ScrollAreaViewport`).
   */
  private readonly wrappers = new Set<Node>()
  private spaceArmed = false
  private markerQueued = false
  private formQueued = false
  private warned = false

  /**
   * The element the part renders onto: the host itself, or the native `<input>`
   * child of a part that renders an input (see {@link retarget}).
   */
  el: HTMLElement
  /** The host was teleported into a detached `DocumentFragment`: it stays home, unrendered. */
  offscreen = false
  /** The text node holding the part's fallback content, while the host has no children of its own. */
  private textNode: Text | null = null
  /** DOM properties set on a native target (`value`), with the values they had before: restored when the part lets go. */
  private readonly nativeProps = new Map<string, unknown>()
  /**
   * The part's root-level `<style>`s, placed in the shadow root or the head. Vue
   * removes a fragment's nodes by walking between its anchors, which stay in the
   * detached container: these are removed by the binding.
   */
  private readonly styles = new Set<Node>()

  constructor(
    /** The custom element. */
    readonly host: HTMLElement,
    private readonly semantics: HostSemantics | undefined,
    readonly lifecycle: HostLifecycle,
    private readonly internals?: ElementInternals,
  ) {
    const el = host
    this.el = el
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
    if (semantics?.link) {
      el.addEventListener('click', this.onLinkClick)
      this.addKeyboardShims()
    }
  }

  /**
   * Drops what a mounted element's tree had added to `el` before it was copied with
   * `cloneNode()`: a copy starts from the consumer's attributes only.
   */
  static cleanCopiedState(el: HTMLElement) {
    // Copies of nodes a part rendered into or next to a host, anywhere in the copy
    // (a toast's announcement sits where the toast was declared, not next to it).
    // (Not copied wrappers: they hold the copies of the elements they wrapped.)
    for (const node of el.querySelectorAll(`[${RELOCATED_ATTR}]:not([${RELOCATED_ATTR}="wrapper"])`)) {
      if (!liveRelocated.has(node))
        node.remove()
    }
    // The end marker of the nodes a `siblings: 'inside'` part rendered into it.
    for (const node of [...el.childNodes]) {
      if (node.nodeType === Node.COMMENT_NODE && (node as Comment).data === SIBLINGS_END)
        node.remove()
    }
    HostBinding.removeCopiedSiblings(el)
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

  /** The part renders its own element inside the host (see {@link HostSemantics.inside}). */
  get inside() {
    return !!this.semantics?.inside
  }

  /**
   * A `cloneNode()` copy inside its own wrapper: takes it out, as the copy's part
   * renders another one. The nearest marked wrapper above it, short of another
   * element, is its own. Moving the element connects it again (synchronously).
   */
  static unwrapCopy(el: HTMLElement) {
    for (let node = el.parentElement; node && !node.localName.includes('-'); node = node.parentElement) {
      if (node.getAttribute(RELOCATED_ATTR) === 'wrapper') {
        node.replaceWith(el)
        return true
      }
    }
    return false
  }

  get away() {
    return this.homeMarker !== null
  }

  /**
   * Renders the part onto `target`, a native `<input>` inside the host, instead of
   * onto the host. Its DOM properties (`value`, `disabled`) are set as Vue sets
   * them on an input; its attributes are owned like the host's.
   */
  retarget(target: HTMLElement) {
    if (target === this.el)
      return
    if (this.el !== this.host)
      bindings.delete(this.el)
    HostBinding.cleanCopiedState(target)
    this.el = target
    bindings.set(target, this)
    observeAttributes(target)
  }

  /**
   * Whether the part's fallback text may go in the host: it has no children of the
   * consumer's (what the binding created or a part rendered into it does not count).
   */
  canWriteText() {
    for (const child of this.host.childNodes) {
      if (child !== this.textNode && child !== this.siblingEnd && !this.siblingNodes.has(child) && !(child as Element).hasAttribute?.(CREATED_ATTR) && !(child as Element).hasAttribute?.(RELOCATED_ATTR))
        return false
    }
    return true
  }

  /**
   * The part's fallback text, in a text node of its own while the host has no
   * other children. Only that node is ever changed or removed: children the
   * consumer adds take its place.
   */
  setText(text: string) {
    if (!text || !this.canWriteText()) {
      this.removeText()
      return
    }
    if (this.textNode?.parentNode === this.host) {
      if (this.textNode.data !== text)
        this.textNode.data = text
      return
    }
    this.textNode = this.host.ownerDocument.createTextNode(text)
    this.write(() => this.host.append(this.textNode!))
  }

  /** Removes the fallback text node, if it is still the host's. */
  removeText() {
    const node = this.textNode
    this.textNode = null
    if (node?.parentNode === this.host)
      this.write(() => node.remove())
  }

  /** Where the host sits in the consumer's tree: itself, or its marker while moved away. */
  get homeNode(): Node {
    return this.homeMarker ?? this.host
  }

  /** Puts the host back at its home position. */
  goHome() {
    this.offscreen = false
    const marker = this.homeMarker
    if (!marker)
      return
    this.homeMarker = null
    awayBindings.delete(this)
    this.moving = true
    try {
      if (marker.parentNode)
        marker.parentNode.replaceChild(this.host, marker)
      else
        this.host.remove()
    }
    finally {
      this.moving = false
    }
  }

  moveTo(parent: Node, anchor: Node | null) {
    // A Teleport into a detached fragment (`SelectContent` renders its closed items
    // there so they register their labels). Moved there, the host would disconnect
    // and its elements could not render: it stays home, unrendered, and the
    // elements inside render as they would in the fragment.
    if (parent.nodeType === Node.DOCUMENT_FRAGMENT_NODE && !(parent as ShadowRoot).host && !parent.isConnected) {
      this.offscreen = true
      return
    }
    this.moving = true
    try {
      if (!this.homeMarker) {
        this.homeMarker = this.host.ownerDocument.createComment('')
        this.host.parentNode?.insertBefore(this.homeMarker, this.host)
        awayBindings.add(this)
      }
      parent.insertBefore(this.host, anchor && anchor.parentNode === parent ? anchor : null)
    }
    finally {
      this.moving = false
    }
  }

  /** A root-level node of the part's tree: wrappers take the host's place, the rest stays detached. */
  insertRootNode(child: Node, anchor: Node | null) {
    if (child.nodeType === Node.ELEMENT_NODE && this.homeMarker && child.contains(this.host)) {
      this.write(() => (child as Element).setAttribute(RELOCATED_ATTR, 'wrapper'))
      this.wrappers.add(child)
      wrapperOwners.set(child, this)
      this.homeMarker.parentNode?.insertBefore(child, this.homeMarker)
      return
    }
    // A part's own `<style>` (a viewport's scrollbar rules) applies from the shadow
    // root the host's home is in, or the document's head, until the part lets go.
    if ((child as Element).tagName === 'STYLE') {
      const root = this.homeNode.getRootNode() as Document | ShadowRoot
      const parent = (root as ShadowRoot).host ? root : this.host.ownerDocument.head
      parent.insertBefore(child, null)
      this.styles.add(child)
      return
    }
    // Every root-level node (fragment anchors too, so Vue's own removal of a
    // fragment walks only these), but form fields: they submit through internals.
    if (this.siblings && !FORM_FIELD.test((child as Element).tagName ?? '') && this.insertSibling(child, anchor))
      return
    // (An element with nothing in it, like the one holding a Teleport's anchors,
    // loses nothing by staying detached.)
    if (child.nodeType === Node.ELEMENT_NODE && !FORM_FIELD.test((child as Element).tagName) && !this.warned
      && ((child as Element).childElementCount || child.textContent)) {
      this.warned = true
      warn(`<${this.host.localName}> renders a <${(child as Element).localName}> next to its part. A custom element has nowhere to put it, so it is not in the document.`)
    }
    this.container.insertBefore(child, anchor && anchor.parentNode === this.container ? anchor : null)
    this.scheduleFormSync()
  }

  /**
   * Puts a root-level node right after the host (and its earlier siblings).
   * @internal
   */
  insertSibling(child: Node, anchor: Node | null): boolean {
    const home = this.homeNode
    const inside = this.siblings === 'inside'
    const parent = inside ? this.host : home.parentNode
    if (!parent)
      return false
    if (anchor && anchor.parentNode === parent && this.siblingNodes.has(anchor)) {
      parent.insertBefore(child, anchor)
    }
    else {
      const end = this.siblingEnd ??= this.host.ownerDocument.createComment(SIBLINGS_END)
      if (end.parentNode !== parent)
        parent.insertBefore(end, inside ? null : home.nextSibling)
      parent.insertBefore(child, end)
    }
    if (child.nodeType === Node.ELEMENT_NODE)
      this.write(() => (child as Element).setAttribute(RELOCATED_ATTR, ''))
    this.siblingNodes.add(child)
    siblingOwners.set(child, this)
    liveRelocated.add(child)
    return true
  }

  /**
   * Drops the copies of a `siblings` part's nodes that follow a `cloneNode()` copy
   * of its element: marked nodes up to the end marker that no live part owns.
   */
  private static removeCopiedSiblings(el: HTMLElement) {
    const copies: Node[] = []
    let node = el.nextSibling
    while (node && !siblingOwners.has(node)) {
      const isEnd = node.nodeType === Node.COMMENT_NODE && (node as Comment).data === SIBLINGS_END
      // Marked elements, and the empty text nodes Vue anchors fragments with.
      if (!isEnd && !(node as Element).hasAttribute?.(RELOCATED_ATTR) && !(node.nodeType === Node.TEXT_NODE && !node.textContent))
        break
      copies.push(node)
      if (isEnd) {
        for (const copy of copies)
          copy.parentNode?.removeChild(copy)
        return
      }
      node = node.nextSibling
    }
  }

  /**
   * Puts the nodes rendered next to the host back after it, in order: the page
   * moved the element without remounting it (same parent part).
   */
  placeSiblings() {
    const home = this.homeNode
    const parent = home.parentNode
    const end = this.siblingEnd
    // (Inside the host, they moved with it.)
    if (this.siblings === 'inside' || !parent || !end || !this.siblingNodes.size || this.isPlaced(home))
      return
    const nodes = [...this.siblingNodes].sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
    let after = home
    for (const node of [...nodes, end]) {
      parent.insertBefore(node, after.nextSibling)
      after = node
    }
  }

  /** Whether the nodes next to the host directly follow it, up to the end marker. */
  private isPlaced(home: Node): boolean {
    let node = home.nextSibling
    for (let count = 0; count < this.siblingNodes.size; count++) {
      if (!node || !this.siblingNodes.has(node))
        return false
      node = node.nextSibling
    }
    return node === this.siblingEnd
  }

  /** The part's tree removed a node it rendered next to the host. */
  static siblingRemoved(child: Node) {
    siblingOwners.get(child)?.siblingNodes.delete(child)
    siblingOwners.delete(child)
    liveRelocated.delete(child)
  }

  /** A node of the part's tree rendered into the host (an `inside` part). */
  insertContent(child: Node, anchor: Node | null) {
    this.content.add(child)
    liveRelocated.add(child)
    if (child.nodeType === Node.ELEMENT_NODE)
      this.write(() => (child as Element).setAttribute(RELOCATED_ATTR, ''))
    this.host.insertBefore(child, anchor && anchor.parentNode === this.host ? anchor : null)
  }

  /** The part's tree removed a node it rendered into the host. */
  contentRemoved(child: Node) {
    this.content.delete(child)
    liveRelocated.delete(child)
  }

  /**
   * Takes out what the part's tree rendered into the host. Vue only detaches the
   * root of an unmounted tree; the host stays in the document, so its rendered
   * children have to go explicitly.
   */
  removeContent() {
    for (const child of this.content) {
      if (child.parentNode === this.host)
        this.host.removeChild(child)
      liveRelocated.delete(child)
    }
    this.content.clear()
  }

  /** Removes everything the binding added to the document. */
  dispose() {
    this.strip()
    this.removeContent()
    // Vue removes a root fragment's nodes by walking the detached container, which
    // does not reach the ones next to the host.
    for (const child of this.siblingNodes) {
      child.parentNode?.removeChild(child)
      siblingOwners.delete(child)
      liveRelocated.delete(child)
    }
    this.siblingNodes.clear()
    this.siblingEnd?.remove()
    // Taken out of its wrapper or portal target by the consumer: it stays out.
    if (this.homeMarker && !this.host.parentNode) {
      this.homeMarker.remove()
      this.homeMarker = null
      awayBindings.delete(this)
    }
    this.goHome()
    this.removeWrappers()
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
    if (this.el !== this.host && NATIVE_PROPS.has(key)) {
      // A native input's state is its DOM properties, set as Vue sets them.
      // Keep the consumer's value from before the part's first write.
      if (!this.nativeProps.has(key))
        this.nativeProps.set(key, (this.el as unknown as Record<string, unknown>)[key])
      patchProp(this.el, key, prev, next, namespace, parentComponent)
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
        if (this.semantics?.button || this.semantics?.link)
          this.addKeyboardShims()
      }
      else if (key === 'disabled' && this.el === this.host) {
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
    // (Never moved into the fragment, the host is not removed from it either.)
    this.offscreen = false
    this.strip()
    // Once Vue is done unmounting: the wrapper it could not reach (see `wrappers`).
    queueMicrotask(() => {
      if (this.active)
        return
      this.goHome()
      this.removeWrappers()
    })
    this.lifecycle.onPartUnmount()
  }

  /** The part's tree removed a wrapper it rendered around the host. */
  static wrapperRemoved(child: Node) {
    wrapperOwners.get(child)?.wrappers.delete(child)
    wrapperOwners.delete(child)
  }

  private removeWrappers() {
    for (const wrapper of this.wrappers) {
      wrapperOwners.delete(wrapper)
      wrapper.parentNode?.removeChild(wrapper)
    }
    this.wrappers.clear()
  }

  /**
   * Sets an attribute the element itself manages (`inert` / `hidden` while the part
   * is not rendered). Like the semantics shim, a value the consumer set wins.
   */
  setStateAttribute(name: string, on: boolean): boolean {
    if (on) {
      if (this.host.hasAttribute(name))
        return false
      this.write(() => this.host.setAttribute(name, ''))
      return true
    }
    this.write(() => this.host.removeAttribute(name))
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
    // A link host is a link (role, tab stop) only while it has an `href`.
    if (name === 'href' && this.semantics?.link && this.active)
      this.syncSemantics()
    const entry = this.owned.get(name)
    // Our own writes, and consumer writes already handled synchronously, leave the
    // part's value in place.
    if (!entry || this.el.getAttribute(name) === entry.value)
      return
    this.consumerWrote(name, this.el.getAttribute(name))
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
      for (const [key, value] of this.nativeProps)
        (this.el as unknown as Record<string, unknown>)[key] = value
      this.nativeProps.clear()
      this.removeText()
      for (const style of this.styles)
        style.parentNode?.removeChild(style)
      this.styles.clear()
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
      if (semantics.link) {
        // Like `<a>`: a link (and a tab stop) only with an `href`.
        const href = this.el.hasAttribute('href')
        this.shimAttribute('role', href ? 'link' : null)
        this.shimAttribute('tabindex', href ? '0' : null)
      }
    })
  }

  /** The href a click on a link host follows, if any. */
  private linkTarget(event: MouseEvent): string | null {
    const href = this.el.getAttribute('href')
    if (!this.active || href === null || event.button !== 0)
      return null
    // A real link the consumer put inside navigates by itself.
    const inner = (event.target as Element | null)?.closest?.('a[href], area[href]')
    if (inner && this.el.contains(inner))
      return null
    return href
  }

  /**
   * Follows the `href` once the click has been dispatched: a listener anywhere
   * (the part's own, the page's) may prevent it, as it would an `<a>`'s.
   */
  private onLinkClick = (event: MouseEvent) => {
    const href = this.linkTarget(event)
    if (href === null)
      return
    setTimeout(() => {
      if (event.defaultPrevented)
        return
      const view = this.el.ownerDocument.defaultView
      const target = this.el.getAttribute('target')
      if (event.ctrlKey || event.metaKey || event.shiftKey || (target && target !== '_self'))
        view?.open(href, target && target !== '_self' ? target : '_blank', 'noopener')
      else
        view?.location.assign(new URL(href, this.el.baseURI).href)
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

  // Native `<button>` activation: Enter clicks on keydown, Space on keyup. A link
  // activates with Enter only.
  private onKeydown = (event: KeyboardEvent) => {
    if (!this.active || event.target !== this.el || event.defaultPrevented || this.isDisabled())
      return
    if (this.semantics?.link && !this.el.hasAttribute('href'))
      return
    if (event.key === 'Enter') {
      event.preventDefault()
      // A click with the key's modifiers, as a native control's: Ctrl/Meta+Enter on
      // a link opens a new tab.
      const { ctrlKey, metaKey, shiftKey, altKey } = event
      this.el.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: this.el.ownerDocument.defaultView,
        detail: 0,
        ctrlKey,
        metaKey,
        shiftKey,
        altKey,
      }))
    }
    else if (event.key === ' ' && this.semantics?.button) {
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
    setElementText(el, text) {
      // The part's fallback text (`SelectValue`): see `RekaElementPartDefinition.text`.
      const binding = bindings.get(el)
      if (binding?.host === el)
        binding.setText(text)
      else
        nodeOps.setElementText(el, text)
    },
    createElement(type, namespace, isCustomizedBuiltIn, vnodeProps) {
      if (type === HOST_TAG)
        return (vnodeProps![HOST_PROP] as HostBinding).el
      return nodeOps.createElement(type, namespace, isCustomizedBuiltIn, vnodeProps)
    },
    insert(child, parent, anchor) {
      const binding = bindings.get(child)
      // Rendered into an `inside` part's host (not a host teleported into another one).
      const host = binding ? undefined : bindings.get(parent)
      if (host?.inside) {
        host.insertContent(child, anchor ?? null)
        return
      }
      if (binding) {
        // Its own root container is its home position.
        if (containers.get(parent) === binding)
          binding.goHome()
        else
          binding.moveTo(parent, anchor ?? null)
        return
      }
      // Inserted before a node rendered next to a host (a fragment's end anchor,
      // once in the document): it goes next to the host too, tracked.
      const siblingOwner = anchor ? siblingOwners.get(anchor) : undefined
      if (siblingOwner?.insertSibling(child, anchor!))
        return
      const owner = containers.get(parent)
      if (owner)
        owner.insertRootNode(child, anchor ?? null)
      else
        parent.insertBefore(child, anchor && anchor.parentNode === parent ? anchor : null)
    },
    remove(child) {
      const binding = bindings.get(child)
      if (binding) {
        binding.removeContent()
        binding.goHome()
        return
      }
      // A wrapper the part rendered around the host: bring the host back first.
      for (const away of awayBindings) {
        if (child.contains(away.host))
          away.goHome()
      }
      const parent = child.parentNode
      if (parent) {
        parent.removeChild(child)
        containers.get(parent)?.scheduleFormSync()
        bindings.get(parent)?.contentRemoved(child)
        HostBinding.siblingRemoved(child)
        HostBinding.wrapperRemoved(child)
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
