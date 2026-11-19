import type { ComputedRef } from 'vue'
import { computed } from 'vue'

export type CarouselPartState = Record<string, string | number | boolean | null | undefined>

/** A rendered part: the attributes to bind, and the state its `data-*` attributes come from. */
export interface CarouselSurface<S extends CarouselPartState> {
  attrs: ComputedRef<Record<string, any>>
  state: ComputedRef<S>
}

function toDataAttrs(state: CarouselPartState): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key in state) {
    const value = state[key]
    if (value === false || value == null)
      continue
    out[`data-${key.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase()}`] = value === true ? '' : String(value)
  }
  return out
}

/**
 * Builds a part from its attributes (aria, role, style, handlers) and its state:
 * `true` renders `data-<key>=""`, `false` and `undefined` render nothing, other
 * values render as text. The attributes win over a `data-*` of the same name.
 */
export function createSurface<S extends CarouselPartState>(props: () => Record<string, any>, state: () => S): CarouselSurface<S> {
  const stateRef = computed(state)
  return {
    state: stateRef,
    attrs: computed(() => ({ ...toDataAttrs(stateRef.value), ...props() })),
  }
}
