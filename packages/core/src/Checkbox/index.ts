import type { CheckedState } from './utils'

export {
  default as CheckboxGroupRoot,
  type CheckboxGroupRootEmits,
  type CheckboxGroupRootProps,
  injectCheckboxGroupRootContext,
} from './CheckboxGroupRoot.vue'
export {
  default as CheckboxIndicator,
  type CheckboxIndicatorProps,
} from './CheckboxIndicator.vue'
export {
  default as CheckboxRoot,
  type CheckboxRootEmits,
  type CheckboxRootProps,
  injectCheckboxRootContext,
} from './CheckboxRoot.vue'
export {
  type CheckboxChangeReason,
  type CheckboxState,
  useCheckbox,
  type UseCheckboxProps,
  type UseCheckboxReturn,
} from './useCheckbox'
export {
  type CheckboxGroupChangeReason,
  useCheckboxGroup,
  type UseCheckboxGroupProps,
  type UseCheckboxGroupReturn,
} from './useCheckboxGroup'
// A local alias rather than a renamed re-export, which compiler-sfc cannot resolve.
export type CheckboxCheckedState = CheckedState
