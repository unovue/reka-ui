export { type AsTag, Primitive, type PrimitiveProps } from './Primitive'
export { Slot } from './Slot'
export { usePrimitiveElement } from './usePrimitiveElement'
// `PrimitiveState` (= shared `PartState`) and `StateAttributesMapping` now live in
// `shared/stateToDataAttrs`; re-exported here so existing imports keep working.
export {
  type PrimitiveState,
  type StateAttributesMapping,
  useRender,
  type UseRenderOptions,
  type UseRenderReturn,
} from './useRender'
