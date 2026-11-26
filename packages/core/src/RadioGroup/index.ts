import type { SelectEvent } from './utils'

export {
  default as RadioGroupIndicator,
  type RadioGroupIndicatorProps,
} from './RadioGroupIndicator.vue'
export {
  injectRadioGroupItemContext,
  default as RadioGroupItem,
  type RadioGroupItemEmits,
  type RadioGroupItemProps,
} from './RadioGroupItem.vue'
export {
  injectRadioGroupRootContext,
  default as RadioGroupRoot,
  type RadioGroupRootEmits,
  type RadioGroupRootProps,
} from './RadioGroupRoot.vue'
export {
  type RadioGroupChangeReason,
  type RadioGroupItemState,
  type RadioGroupState,
  useRadioGroup,
  type UseRadioGroupProps,
  type UseRadioGroupReturn,
} from './useRadioGroup'
// A local alias rather than a renamed re-export, which compiler-sfc cannot resolve.
export type RadioGroupItemSelectEvent = SelectEvent
