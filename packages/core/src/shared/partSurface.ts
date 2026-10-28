import type { ComputedRef } from 'vue'
import type { PartState, StateAttributesMapping } from './stateToDataAttrs'
import { mergeProps } from 'vue'
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
  /** `mergeProps(stateToDataAttrs(state), props)` — bind this and never touch the vocabulary. */
  attrs: ComputedRef<Record<string, any>>
}

/**
 * Builds a `PartSurface` from a `props` and a `state` source (computed or
 * getter), deriving `attrs` through the shared `stateToDataAttrs`.
 *
 * Getter sources become readonly getter refs (`toRef(getter)`), not computeds:
 * every rendered part binds its surface, so a computed here (an effect, a dep
 * and a link per source, three per surface) was multiplied by every part on
 * the page. A getter ref is one small object; its dependencies are tracked by
 * whoever reads `.value` (the render), which re-runs on the same changes a
 * computed would have. Each read evaluates the getter, as a computed returning
 * a fresh object already did on every change.
 *
 * @internal
 */
export function createPartSurface<S extends PartState>(
  props: ComputedRef<Record<string, any>> | (() => Record<string, any>),
  state: ComputedRef<S> | (() => S),
  mapping?: StateAttributesMapping<S>,
): PartSurface<S> {
  const readProps = typeof props === 'function' ? props : () => props.value
  const readState = typeof state === 'function' ? state : () => state.value
  return {
    props: typeof props === 'function' ? getterRef(props) : props,
    state: typeof state === 'function' ? getterRef(state) : state,
    // State attrs first, explicit props last — same precedence as `useRender`, so a mapping that emits `aria-*` never overrides a prop.
    attrs: getterRef(() => mergeProps(stateToDataAttrs(readState(), mapping), readProps())),
  }
}

/**
 * Vue's `toRef(getter)` without the `_value` slot: the last value is not kept
 * alive between reads (a surface's `attrs` object would otherwise be retained
 * twice, here and in the rendered vnode).
 */
class GetterRef<T> {
  // Ref markers as prototype getters: no per-instance slots.
  get __v_isRef(): true { return true }
  get __v_isReadonly(): true { return true }
  constructor(readonly getter: () => T) {}
  get value(): T {
    return this.getter()
  }
}

/**
 * A readonly ref over a getter, typed as the `ComputedRef` the surface contract names.
 *
 * @internal
 */
export function getterRef<T>(getter: () => T): ComputedRef<T> {
  return new GetterRef(getter) as unknown as ComputedRef<T>
}
