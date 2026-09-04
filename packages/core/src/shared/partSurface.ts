import type { ComputedRef } from 'vue'
import type { PartState, StateAttributesMapping } from './stateToDataAttrs'
import { computed, mergeProps } from 'vue'
import { stateToDataAttrs } from './stateToDataAttrs'

/**
 * A rendered part's headless surface, shared by every `useX()` composable
 * (#2723). `props` holds the aria/role/value/id/handlers to spread onto the
 * element (NO `data-*`); `state` is the semantic state object; `attrs` is the
 * ready-made merge of both, which is what SFCs and consumers bind.
 *
 * Handlers live in `props` (e.g. `onClick`) so binding via `mergeProps` chains
 * them with any consumer listener instead of clobbering it.
 */
export interface PartSurface<S extends PartState = PartState> {
  /** aria/role/id/value/handlers — NO `data-*`. */
  props: ComputedRef<Record<string, any>>
  /** Semantic state; `data-*` derive from it. */
  state: ComputedRef<S>
  /** `mergeProps(props, stateToDataAttrs(state))` — bind this and never touch the vocabulary. */
  attrs: ComputedRef<Record<string, any>>
}

/**
 * Builds a `PartSurface` from a `props` and a `state` source (computed or
 * getter), deriving `attrs` through the shared `stateToDataAttrs`.
 *
 * @internal — family composables call this; it is not part of the package root.
 */
export function createPartSurface<S extends PartState>(
  props: ComputedRef<Record<string, any>> | (() => Record<string, any>),
  state: ComputedRef<S> | (() => S),
  mapping?: StateAttributesMapping<S>,
): PartSurface<S> {
  const propsRef = typeof props === 'function' ? computed(props) : props
  const stateRef = typeof state === 'function' ? computed(state) : state
  const attrs = computed(() => mergeProps(propsRef.value, stateToDataAttrs(stateRef.value, mapping)))
  return { props: propsRef, state: stateRef, attrs }
}
