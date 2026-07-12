import type { Component, ComponentPublicInstance, ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { AsTag } from './Primitive'
import { computed, getCurrentInstance, mergeProps, toValue } from 'vue'
import { useForwardExpose } from '../shared/useForwardExpose'
import { SELF_CLOSING_TAGS } from './Primitive'
import { Slot } from './Slot'

export type PrimitiveState = Record<string, string | boolean | number | null | undefined>

export type StateAttributesMapping<S extends PrimitiveState>
  = { [K in keyof S]?: (value: S[K]) => Record<string, string | undefined> | undefined }

function kebab(key: string): string {
  return key.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase()
}

function getStateAttributes<S extends PrimitiveState>(
  state: S | undefined,
  mapping?: StateAttributesMapping<S>,
): Record<string, string> {
  const out: Record<string, string> = {}
  if (!state)
    return out
  for (const key in state) {
    const value = state[key]
    if (mapping?.[key]) {
      Object.assign(out, mapping[key]!(value) ?? {})
      continue
    }
    if (value === false || value == null)
      continue
    out[`data-${kebab(key)}`] = value === true ? '' : String(value)
  }
  return out
}

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

  const stateAttrs = computed(() => getStateAttributes(toValue(options.state), options.stateAttributesMapping))
  const renderProps = computed<Record<string, any>>(() => mergeProps(stateAttrs.value, toValue(options.props) ?? {}))

  const { forwardRef, currentElement } = useForwardExpose()
  function elementRef(el: Element | ComponentPublicInstance | null) {
    forwardRef(el)
    if (typeof options.ref === 'function')
      options.ref(el)
    else if (options.ref)
      options.ref.value = (el && '$el' in el ? el.$el : el) as HTMLElement | null | undefined
  }

  return { tag, renderProps, renderless, selfClosing, elementRef, currentElement, state }
}
