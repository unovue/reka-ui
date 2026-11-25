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
import { ariaDisabledAttr, isPlainTag } from '@/shared/disabledAttr'
import { createDynamicComponent, createSlot, defineVaporComponent, findElement, renderEffect } from './shared/internals'

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
const BOOLEAN_PROPS = new Set(['disabled', 'checked', 'selected', 'multiple', 'readOnly', 'required'])
const OPTION_SUFFIX_RE = /(?:Once|Passive|Capture)$/

function safeTag(as: unknown) {
  return typeof as === 'string' && (!TAG_NAME.test(as) || BLOCKED_TAG.test(as)) ? 'div' : as
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

/**
 * Patches `attrs` onto an element the slot owns. Keys the element already rendered when it was
 * adopted belong to the child and are skipped (child precedence, like v2's `mergeProps(attrs, child)`).
 */
export function adopt(el: Element, getProps: () => Record<string, any>, { override = false } = {}) {
  // `override`: fallthrough semantics (the incoming attrs win), used by `Presence`
  const childOwned = new Set(override ? [] : el.getAttributeNames())
  const listeners = new Map<string, { handler: any, invoker: EventListener }>()
  let prevKeys = new Set<string>()
  let prevClasses: string[] = []
  let prevStyleKeys: string[] = []

  renderEffect(() => {
    const props = getProps()
    const keys = new Set<string>()
    for (const key in props) {
      const value = props[key]
      if (ON_RE.test(key)) {
        let name = key.slice(2)
        const options: AddEventListenerOptions = {}
        let m: RegExpMatchArray | null
        // eslint-disable-next-line no-cond-assign
        while ((m = name.match(OPTION_SUFFIX_RE))) {
          name = name.slice(0, name.length - m[0].length);
          (options as any)[m[0].toLowerCase()] = true
        }
        const type = name[0].toLowerCase() + name.slice(1)
        const id = `${type}|${options.capture ? 1 : 0}`
        const existing = listeners.get(id)
        if (existing) {
          existing.handler = value
        }
        else if (value) {
          const entry = {
            handler: value,
            invoker: (e: Event) => {
              const h = entry.handler
              if (Array.isArray(h))
                h.forEach(fn => fn?.(e))
              else h?.(e)
            },
          }
          listeners.set(id, entry)
          el.addEventListener(type, entry.invoker, options)
        }
        continue
      }
      if (key === 'class') {
        const next = normalizeClass(value)
        prevClasses.forEach(c => !next.includes(c) && el.classList.remove(c))
        next.forEach(c => el.classList.add(c))
        prevClasses = next
        continue
      }
      if (key === 'style') {
        const style = (el as HTMLElement).style
        const next = value && typeof value === 'object' ? value : {}
        prevStyleKeys.forEach(k => !(k in next) && style.removeProperty(k.startsWith('--') ? k : hyphenate(k)))
        for (const k in next) {
          const prop = k.startsWith('--') ? k : hyphenate(k)
          if (override || !style.getPropertyValue(prop) || prevStyleKeys.includes(k))
            style.setProperty(prop, next[k] == null ? '' : String(next[k]))
        }
        prevStyleKeys = Object.keys(next)
        continue
      }
      const attr = key.startsWith('aria') || key.startsWith('data') ? hyphenate(key) : key
      if (childOwned.has(attr))
        continue
      keys.add(attr)
      // Drop `disabled: false` on plain tags, as v2's `Slot` does
      if (attr === 'disabled' && value === false && isPlainTag(el.tagName.toLowerCase()))
        el.removeAttribute('disabled')
      else if (value == null || (value === false && !attr.startsWith('aria-')))
        el.removeAttribute(attr)
      else if (BOOLEAN_PROPS.has(attr) && attr in el)
        (el as any)[attr] = !!value || value === ''
      else
        el.setAttribute(attr, value === true ? (attr.startsWith('aria-') ? 'true' : '') : String(value))
    }
    prevKeys.forEach(k => !keys.has(k) && el.removeAttribute(k))
    prevKeys = keys
  })
}

/**
 * The `asChild` render: the default slot gets `props` (a lazy view of `getProps()`); when the slot
 * doesn't read it, the props are adopted onto the first element it rendered.
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
  const element = findElement(block)
  if (!consumed && element) {
    const el = element
    adopt(el, adoptProps ? () => adoptProps(el) : getProps)
  }
  return { block, element, consumed }
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
    let element: Element | null = null
    expose({
      get $el() {
        return element ?? findElement(block)
      },
    })

    if (props.asChild || props.as === 'template') {
      const r = renderAsChildSlot(() => ({ ...attrs }), el => withAriaDisabled(el.tagName.toLowerCase(), attrs))
      block = r.block
      element = r.element
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
