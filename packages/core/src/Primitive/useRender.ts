import type { Component, ComponentPublicInstance, ComputedRef, MaybeRefOrGetter } from 'vue'
import type { PartState, StateAttributesMapping } from '../shared/stateToDataAttrs'
import type { ElementExpose } from '../shared/useForwardElement'
import type { MergeableRef } from '../shared/useMergedRefs'
import type { AsTag } from './Primitive'
import { computed, getCurrentInstance, mergeProps, toValue } from 'vue'
// Direct relative import (not the `@/shared` barrel) to avoid a Primitive ↔ shared cycle.
import { stateToDataAttrs } from '../shared/stateToDataAttrs'
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
  const tag = computed<AsTag | Component>(() => {
    const as = toValue(options.as)
    if (toValue(options.asChild) || as === Slot || as === 'template')
      return Slot
    return as ?? options.defaultTagName ?? 'div'
  })

  const renderless = computed(() => tag.value === Slot)

  // Dev-only: `#render` slot takes precedence over `asChild`/`as="template"`.
  // Warn when both are provided so the ignored `asChild` isn't a silent surprise.
  // Uses process.env.NODE_ENV (not import.meta.env.DEV, which is neutered in dist).
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production') {
    const instance = getCurrentInstance()
    if (instance?.slots?.render && renderless.value) {
      console.warn(
        '[reka-ui] `useRender`: both a `#render` slot and `asChild`/`as="template"` were provided. '
        + 'The `#render` slot takes precedence; `asChild` is ignored.',
      )
    }
  }

  const selfClosing = computed(() => {
    const t = tag.value
    return typeof t === 'string' && SELF_CLOSING_TAGS.includes(t)
  })

  const state = computed(() => toValue(options.state))

  const stateAttrs = computed(() => stateToDataAttrs(toValue(options.state), options.stateAttributesMapping))
  const renderProps = computed<Record<string, any>>(() => mergeProps(stateAttrs.value, toValue(options.props) ?? {}))

  const { forwardRef: elementRef, element: currentElement, expose } = useForwardElement<HTMLElement>(options.ref)

  return { tag, renderProps, renderless, selfClosing, elementRef, currentElement, state, expose }
}
