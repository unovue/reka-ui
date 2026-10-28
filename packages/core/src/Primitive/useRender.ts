import type { Component, ComponentPublicInstance, ComputedRef, MaybeRefOrGetter } from 'vue'
import type { PartState, StateAttributesMapping } from '../shared/stateToDataAttrs'
import type { ElementExpose } from '../shared/useForwardElement'
import type { MergeableRef } from '../shared/useMergedRefs'
import type { AsTag } from './Primitive'
import { computed, getCurrentInstance, toValue } from 'vue'
// Direct relative import (not the `@/shared` barrel) to avoid a Primitive ↔ shared cycle.
import { mergeStateAttrs } from '../shared/stateToDataAttrs'
import { useForwardElement } from '../shared/useForwardElement'
import { SELF_CLOSING_TAGS } from './Primitive'
import { Slot } from './Slot'

/** Alias of the shared `PartState`; kept so existing `useRender` imports keep working. */
export type PrimitiveState = PartState

export type { StateAttributesMapping }

export interface UseRenderOptions<S extends PrimitiveState = PrimitiveState> {
  /** Fallback tag when `as` is undefined. @default 'div' */
  defaultTagName?: AsTag
  /** `as` prop: tag / component / the `Slot` sentinel (renderless). Reactive. */
  as?: MaybeRefOrGetter<AsTag | Component | undefined>
  /** v2-compat: `asChild` implies renderless. Reactive. */
  asChild?: MaybeRefOrGetter<boolean | undefined>
  /** Internal element props (incl. `onX` handlers) to merge, lowest priority. Reactive. */
  props?: MaybeRefOrGetter<Record<string, any> | undefined>
  /** State rendered as `data-*` attributes: boolean → present/absent '', string/number → value. Reactive. */
  state?: MaybeRefOrGetter<S | undefined>
  stateAttributesMapping?: StateAttributesMapping<S>
  /**
   * Optional external ref kept in sync with the resolved element (merged via
   * `useMergedRefs`; a callback ref may return a cleanup function).
   */
  ref?: MergeableRef<HTMLElement>
}

export interface UseRenderReturn<S extends PrimitiveState = PrimitiveState> {
  /** Resolved target for `<component :is>`; the `Slot` component when renderless. */
  tag: ComputedRef<AsTag | Component>
  /** mergeProps(stateAttrs, props) — bind with `v-bind="renderProps"`. */
  renderProps: ComputedRef<Record<string, any>>
  /** true when as === Slot || asChild || as === 'template' */
  renderless: ComputedRef<boolean>
  /** true for 'area' | 'img' | 'input' — render `<component :is>` with no children. */
  selfClosing: ComputedRef<boolean>
  /** Callback ref: bind `:ref="elementRef"`. Feeds the part's element and `options.ref`. */
  elementRef: (el: Element | ComponentPublicInstance | null) => void
  /** Resolved DOM element (text/comment-root aware, reactive across root swaps). */
  currentElement: ComputedRef<HTMLElement | null>
  /** Ready-made element-first expose object: `defineExpose(expose)`. */
  expose: ElementExpose<HTMLElement>
  /** Unwrapped state for scoped-slot exposure. */
  state: ComputedRef<S | undefined>
}

export function useRender<S extends PrimitiveState = PrimitiveState>(
  options: UseRenderOptions<S> = {},
): UseRenderReturn<S> {
  const resolveTag = () => resolveRenderTag(toValue(options.as), toValue(options.asChild), options.defaultTagName)

  // Dev-only: `#render` slot takes precedence over `asChild`/`as="template"`.
  // Warn when both are provided so the ignored `asChild` isn't a silent surprise.
  // Uses process.env.NODE_ENV (not import.meta.env.DEV, which is neutered in dist).
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production')
    warnRenderSlotWithAsChild(resolveTag() === Slot)

  const forwarded = useForwardElement<HTMLElement>(options.ref)

  // Every computed is created on first read: a part destructures only what it
  // binds, so it does not pay for the rest (a computed is a few reactive
  // objects, multiplied by every part on the page).
  let tag: ComputedRef<AsTag | Component> | undefined
  let renderless: ComputedRef<boolean> | undefined
  let selfClosing: ComputedRef<boolean> | undefined
  let state: ComputedRef<S | undefined> | undefined
  let renderProps: ComputedRef<Record<string, any>> | undefined

  return {
    get tag() {
      return tag ??= computed(resolveTag)
    },
    get renderProps() {
      return renderProps ??= computed(() => mergeStateAttrs(
        toValue(options.state),
        options.stateAttributesMapping,
        toValue(options.props),
      ))
    },
    get renderless() {
      return renderless ??= computed(() => resolveTag() === Slot)
    },
    get selfClosing() {
      return selfClosing ??= computed(() => isSelfClosingTag(resolveTag()))
    },
    elementRef: forwarded.forwardRef,
    get currentElement() {
      return forwarded.element
    },
    get state() {
      return state ??= computed(() => toValue(options.state))
    },
    expose: forwarded.expose,
  }
}

/** `as` / `asChild` → the rendered target; the `Slot` component when renderless. @internal */
export function resolveRenderTag(
  as: AsTag | Component | undefined,
  asChild: boolean | undefined,
  defaultTagName: AsTag = 'div',
): AsTag | Component {
  if (asChild || as === Slot || as === 'template')
    return Slot
  return as ?? defaultTagName
}

/** 'area' | 'img' | 'input' render with no children. @internal */
export function isSelfClosingTag(tag: AsTag | Component): boolean {
  return typeof tag === 'string' && SELF_CLOSING_TAGS.includes(tag)
}

/** Dev-only warning shared by `useRender` and `Primitive`. @internal */
export function warnRenderSlotWithAsChild(renderless: boolean) {
  if (renderless && getCurrentInstance()?.slots?.render) {
    console.warn(
      '[reka-ui] `useRender`: both a `#render` slot and `asChild`/`as="template"` were provided. '
      + 'The `#render` slot takes precedence; `asChild` is ignored.',
    )
  }
}
