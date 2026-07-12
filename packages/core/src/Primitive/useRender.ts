import type { Component, ComponentPublicInstance, ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { AsTag } from './Primitive'
import { computed, toValue } from 'vue'
import { SELF_CLOSING_TAGS } from './Primitive'
import { Slot } from './Slot'

export type PrimitiveState = Record<string, string | boolean | number | null | undefined>

export type StateAttributesMapping<S extends PrimitiveState>
  = { [K in keyof S]?: (value: S[K]) => Record<string, string | undefined> | undefined }

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
  /** Optional external ref to keep in sync with the rendered element. */
  ref?: Ref<HTMLElement | null | undefined> | ((el: Element | ComponentPublicInstance | null) => void)
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
  /** Callback ref: bind `:ref="elementRef"`. Wires useForwardExpose.forwardRef + options.ref. */
  elementRef: (el: Element | ComponentPublicInstance | null) => void
  /** Resolved DOM element (text/comment-root aware). */
  currentElement: ComputedRef<HTMLElement | undefined>
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

  const selfClosing = computed(() => {
    const t = tag.value
    return typeof t === 'string' && SELF_CLOSING_TAGS.includes(t)
  })

  const state = computed(() => toValue(options.state))

  // Task 2: state → data-* + prop merging
  const renderProps = computed<Record<string, any>>(() => ({}))

  // Task 3: ref forwarding
  const elementRef = (_el: Element | ComponentPublicInstance | null) => {}
  const currentElement = computed<HTMLElement | undefined>(() => undefined)

  return { tag, renderProps, renderless, selfClosing, elementRef, currentElement, state }
}
