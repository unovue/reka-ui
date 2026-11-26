// Vapor-mode `Primitive`. Replaces `src/Primitive/Primitive.ts` + `Slot.ts` in the
// `reka-ui/vapor` build (see `vapor/vite.config.mjs`). Needs Vue >= 3.6 (Vapor runtime).
//
// Non-`asChild`: renders `as` through Vapor's dynamic component, like `<component :is>`.
// `asChild`: Vapor slots return real DOM blocks, not VNodes, so there is nothing to clone. Two modes:
//   1. Scoped-slot props (opt-in, exact precedence): the slot receives `props`; the consumer writes
//      `<SwitchRoot as-child v-slot="{ props }"><button v-bind="props" /></SwitchRoot>` and decides
//      precedence by attribute order, like any `v-bind`. Detected by reading `props` during render.
//   2. DOM adoption (keeps the v2 template API): when the slot doesn't read `props`, the attrs are
//      patched onto the first element the slot rendered. Attributes the child already rendered win
//      (snapshot at mount), classes/styles merge, listeners are added next to the child's.
import type { Component, PropType } from 'vue'
import { effectScope, onScopeDispose } from 'vue'
import { ariaDisabledAttr, isPlainTag } from '@/shared/disabledAttr'
import { createDynamicComponent, createSlot, defineVaporComponent, findElement, renderEffect, trackRootElement } from './shared/internals'

export { findElement }

export type AsTag = 'a' | 'button' | 'div' | 'form' | 'h2' | 'h3' | 'img' | 'input' | 'label' | 'li' | 'nav' | 'ol' | 'p' | 'span' | 'svg' | 'ul' | 'template' | ({} & string)

export interface PrimitiveProps {
  asChild?: boolean
  as?: AsTag | Component
}

const SELF_CLOSING_TAGS = ['area', 'img', 'input']
const TAG_NAME = /^[a-z][\w.-]*$/i
const BLOCKED_TAG = /^(?:script|iframe|frame|frameset|object|embed|applet|base|link|meta|noscript)$/i
const ON_RE = /^on[A-Z]/
const WHITESPACE_RE = /\s+/
const BOOLEAN_PROPS = new Set(['disabled', 'checked', 'selected', 'multiple', 'readonly', 'readOnly', 'required', 'indeterminate'])
const OPTION_SUFFIX_RE = /(?:Once|Passive|Capture)$/
// Vue renders `true` as an empty attribute only for these (`isSpecialBooleanAttr`), and as "true"
// otherwise, e.g. `disabled="true"` on a `span`, where `disabled` is not a property.
const SPECIAL_BOOLEAN_ATTRS = new Set(['itemscope', 'allowfullscreen', 'formnovalidate', 'ismap', 'nomodule', 'novalidate', 'readonly'])

// As in `src/Primitive/Primitive.ts`: custom element names (they contain a `-`) may also use `_` and `.`,
// other tag names may not.
const CUSTOM_ELEMENT_ONLY_CHAR = /[_.]/

function isSafeTag(as: string) {
  if (!TAG_NAME.test(as) || BLOCKED_TAG.test(as))
    return false
  return as.includes('-') || !CUSTOM_ELEMENT_ONLY_CHAR.test(as)
}

// Created on first use so the production build drops it together with the warning
let warnedTags: Set<string> | undefined

function safeTag(as: unknown) {
  if (typeof as !== 'string' || isSafeTag(as))
    return as
  // Dev-only guard as in `src/` (eslint.config.mjs turns this rule off for `packages/core/src` only)
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production') {
    warnedTags ??= new Set()
    if (!warnedTags.has(as)) {
      warnedTags.add(as)
      console.warn(`[Reka UI] Primitive: ignored unsafe \`as\` value ${JSON.stringify(as)} and rendered a \`div\` instead. Use a plain tag name that doesn't run or load code (not \`script\`, \`iframe\`, \`object\`, …).`)
    }
  }
  return 'div'
}

function withAriaDisabled(tag: unknown, attrs: Record<string, any>) {
  const aria = ariaDisabledAttr(tag, attrs)
  return aria ? { ...attrs, 'aria-disabled': aria } : attrs
}

const hyphenate = (s: string) => s.replace(/\B([A-Z])/g, '-$1').toLowerCase()

function normalizeClass(value: any): string[] {
  if (!value)
    return []
  if (typeof value === 'string')
    return value.split(WHITESPACE_RE).filter(Boolean)
  if (Array.isArray(value))
    return value.flatMap(normalizeClass)
  return Object.keys(value).filter(k => value[k]).flatMap(normalizeClass)
}

const STYLE_DECLARATION_RE = /;(?![^(]*\))/g
const STYLE_PROPERTY_RE = /:([\s\S]+)/
const STYLE_COMMENT_RE = /\/\*[\s\S]*?\*\//g

/** A `style` value (object, string or array of them) as a `{ property: value }` map, as Vue normalizes it. */
function normalizeStyle(value: any): Record<string, any> {
  if (!value)
    return {}
  if (Array.isArray(value))
    return Object.assign({}, ...value.map(normalizeStyle))
  if (typeof value === 'string') {
    const out: Record<string, string> = {}
    for (const declaration of value.replace(STYLE_COMMENT_RE, '').split(STYLE_DECLARATION_RE)) {
      const [property, rest] = declaration.split(STYLE_PROPERTY_RE)
      if (property?.trim() && rest !== undefined)
        out[property.trim()] = rest.trim()
    }
    return out
  }
  return typeof value === 'object' ? value : {}
}

const cssName = (key: string) => key.startsWith('--') ? key : hyphenate(key)

/** Attributes whose live DOM property must follow the value too (setting the attribute alone doesn't). */
const LIVE_PROPS: Record<string, string> = { checked: 'checked', selected: 'selected', value: 'value', indeterminate: 'indeterminate', disabled: 'disabled', multiple: 'multiple', readonly: 'readOnly', required: 'required', readOnly: 'readOnly' }

/** The DOM event a listener prop names, as Vue's runtime parses it (`onAfterLeave` → `after-leave`). */
function eventName(key: string) {
  let name = key.slice(2)
  const options: AddEventListenerOptions = {}
  let m: RegExpMatchArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = name.match(OPTION_SUFFIX_RE))) {
    name = name.slice(0, name.length - m[0].length);
    (options as any)[m[0].toLowerCase()] = true
  }
  return { type: name[0] === ':' ? name.slice(1) : hyphenate(name), options }
}

/**
 * Patches `attrs` onto an element the slot owns. Keys, classes and styles the element already had when
 * it was adopted belong to the child and are left alone (child precedence, like v2's
 * `mergeProps(attrs, child)`). Returns a function that takes the patched listeners off again.
 */
export function adopt(el: Element, getProps: () => Record<string, any>, { override = false } = {}) {
  // `override`: fallthrough semantics (the incoming attrs win), used by `Presence`
  const childOwned = new Set(override ? [] : el.getAttributeNames())
  const childClasses = new Set(override ? [] : el.classList)
  const childStyles = new Set(override ? [] : Array.from((el as HTMLElement).style ?? []))
  const listeners = new Map<string, { handler: any, invoker: EventListener, type: string, options: AddEventListenerOptions }>()
  let prevKeys = new Set<string>()
  const addedClasses = new Set<string>()
  const ownedStyles = new Set<string>()

  const setLive = (attr: string, value: any) => {
    const prop = LIVE_PROPS[attr]
    if (!prop || !(prop in el))
      return false
    if (prop === 'value')
      (el as any).value = value == null || value === false ? '' : String(value)
    else
      (el as any)[prop] = !!value || value === ''
    return true
  }
  /** Clears a live property: `value` to empty, a boolean to `false`. */
  const clearLive = (attr: string) => setLive(attr, LIVE_PROPS[attr] === 'value' ? null : false)

  const applyClass = (value: unknown) => {
    const next = new Set(normalizeClass(value))
    for (const c of addedClasses) {
      if (!next.has(c)) {
        el.classList.remove(c)
        addedClasses.delete(c)
      }
    }
    for (const c of next) {
      if (!childClasses.has(c) && !el.classList.contains(c)) {
        el.classList.add(c)
        addedClasses.add(c)
      }
    }
  }
  const applyStyle = (value: unknown) => {
    const style = (el as HTMLElement).style
    if (!style)
      return
    const next = normalizeStyle(value)
    const names = new Set(Object.keys(next).map(cssName))
    for (const name of ownedStyles) {
      if (!names.has(name)) {
        style.removeProperty(name)
        ownedStyles.delete(name)
      }
    }
    for (const k in next) {
      const name = cssName(k)
      if (!override && childStyles.has(name))
        continue
      style.setProperty(name, next[k] == null ? '' : String(next[k]))
      ownedStyles.add(name)
    }
  }

  renderEffect(() => {
    const props = getProps()
    const keys = new Set<string>()
    const seen = new Set<string>()
    for (const key in props) {
      const value = props[key]
      if (ON_RE.test(key)) {
        if (!value)
          continue
        const { type, options } = eventName(key)
        // keyed by the prop, so `onClick` and `onClickOnce` stay two listeners with their own options
        const id = key
        seen.add(id)
        const existing = listeners.get(id)
        if (existing) {
          existing.handler = value
          continue
        }
        const entry = {
          handler: value,
          type,
          options,
          invoker: (e: Event) => {
            const h = entry.handler
            if (Array.isArray(h))
              h.forEach(fn => fn?.(e))
            else h?.(e)
          },
        }
        listeners.set(id, entry)
        el.addEventListener(type, entry.invoker, options)
        continue
      }
      // reconciled after the loop, also when the props no longer have them
      if (key === 'class' || key === 'style')
        continue
      const attr = key.startsWith('aria') || key.startsWith('data') ? hyphenate(key) : key
      if (childOwned.has(attr))
        continue
      keys.add(attr)
      // Drop `disabled: false` on plain tags, as v2's `Slot` does
      if (attr === 'disabled' && value === false && isPlainTag(el.tagName.toLowerCase())) {
        clearLive(attr)
        el.removeAttribute('disabled')
      }
      else if (value == null || (value === false && !attr.startsWith('aria-'))) {
        clearLive(attr)
        el.removeAttribute(attr)
      }
      // A boolean the element has as a property (`checked`, `disabled`, …) is set as that property
      else if (!(BOOLEAN_PROPS.has(attr) && setLive(attr, value))) {
        if (attr === 'value')
          setLive(attr, value)
        el.setAttribute(attr, value === true ? (SPECIAL_BOOLEAN_ATTRS.has(attr) ? '' : 'true') : String(value))
      }
    }
    applyClass(props.class)
    applyStyle(props.style)
    for (const [id, entry] of listeners) {
      if (!seen.has(id)) {
        el.removeEventListener(entry.type, entry.invoker, entry.options)
        listeners.delete(id)
      }
    }
    for (const k of prevKeys) {
      if (!keys.has(k)) {
        clearLive(k)
        el.removeAttribute(k)
      }
    }
    prevKeys = keys
  })

  return () => {
    for (const entry of listeners.values())
      el.removeEventListener(entry.type, entry.invoker, entry.options)
    listeners.clear()
  }
}

/**
 * Adopts `getProps()` onto the first element of `block`, and onto its replacement whenever the slot
 * swaps that element while it stays mounted (the previous one is released). Returns the current root.
 */
export function adoptRoot(block: unknown, getProps: (el: Element) => Record<string, any>, options?: { override?: boolean }, map: (el: Element | null) => Element | null = el => el) {
  let release: (() => void) | undefined
  const start = (el: Element | null) => {
    release?.()
    release = undefined
    if (!el)
      return
    const scope = effectScope()
    const stopListeners = scope.run(() => adopt(el, () => getProps(el), options))
    release = () => {
      scope.stop()
      stopListeners?.()
    }
  }
  const root = trackRootElement(block, next => start(map(next)))
  start(map(root.value))
  onScopeDispose(() => release?.())
  return root
}

/**
 * The `asChild` render: the default slot gets `props` (a lazy view of `getProps()`); when the slot
 * doesn't read it, the props are adopted onto the first element it rendered (and onto whichever
 * element replaces it). `root` follows that element.
 * Shared by `Primitive` and the Vapor `CollectionSlot` / `CollectionItem`.
 */
export function renderAsChildSlot(getProps: () => Record<string, any>, adoptProps?: (el: Element) => Record<string, any>) {
  let consumed = false
  // Components spread their slot props through `mergeProps`, which copies the `props` reference
  // without reading it, so only the consumer's `v-bind` marks it as used.
  const props = new Proxy({}, {
    get: (_, key) => {
      consumed = true
      return getProps()[key as string]
    },
    has: (_, key) => key in getProps(),
    ownKeys: () => {
      consumed = true
      return Reflect.ownKeys(getProps())
    },
    getOwnPropertyDescriptor: (_, key) => ({ enumerable: true, configurable: true, value: getProps()[key as string] }),
  })
  const slotProps = { props }
  const block = createSlot('default', { $: [() => slotProps] })
  const root = consumed
    ? trackRootElement(block)
    : adoptRoot(block, el => adoptProps ? adoptProps(el) : getProps())
  return { block, root, consumed }
}

export const Primitive = defineVaporComponent({
  name: 'Primitive',
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: false },
    as: { type: [String, Object] as PropType<AsTag | Component>, default: 'div' },
  },
  setup(props, { attrs, expose }) {
    let block: any
    let root: { value: Element | null } | undefined
    expose({
      get $el() {
        return root ? root.value : findElement(block)
      },
    })

    if (props.asChild || props.as === 'template') {
      const r = renderAsChildSlot(() => ({ ...attrs }), el => withAriaDisabled(el.tagName.toLowerCase(), attrs))
      block = r.block
      root = r.root
      return block
    }

    const tag = () => safeTag(props.as)
    const selfClosing = typeof props.as === 'string' && SELF_CLOSING_TAGS.includes(props.as)
    block = createDynamicComponent(
      tag,
      { $: [() => withAriaDisabled(tag(), attrs)] },
      selfClosing ? null : Object.assign(() => createSlot('default', null, undefined, 4 /* FORWARDED */), { _: 1 }),
      1, /* SINGLE_ROOT */
    )
    return block
  },
})
