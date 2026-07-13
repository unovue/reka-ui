import type { ComputedRef } from 'vue'

/**
 * A rendered part's headless surface, shared by every `useX()` composable
 * (#2723). `props` holds the aria/role/value/id/handlers to spread onto the
 * element (NO `data-*`); `state` is the semantic state object that
 * `stateToDataAttrs` (and later #2722's `useRender`) maps to `data-*`.
 *
 * Handlers live in `props` (e.g. `onClick`) so binding via `mergeProps` chains
 * them with any consumer listener instead of clobbering it.
 */
export interface PartSurface<S extends Record<string, any> = Record<string, any>> {
  props: ComputedRef<Record<string, any>>
  state: ComputedRef<S>
}
