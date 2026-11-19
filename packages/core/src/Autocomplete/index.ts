import type {
  ComboboxAnchorProps,
  ComboboxArrowProps,
  ComboboxCancelProps,
  ComboboxContentEmits,
  ComboboxContentProps,
  ComboboxEmptyProps,
  ComboboxGroupProps,
  ComboboxItemEmits,
  ComboboxItemIndicatorProps,
  ComboboxItemProps,
  ComboboxLabelProps,
  ComboboxPortalProps,
  ComboboxSeparatorProps,
  ComboboxTriggerProps,
  ComboboxViewportProps,
  ComboboxVirtualizerProps,
} from '@/Combobox'
import type { AcceptableValue } from '@/shared/types'

export {
  default as AutocompleteInput,
  type AutocompleteInputEmits,
  type AutocompleteInputProps,
} from './AutocompleteInput.vue'
export {
  default as AutocompleteRoot,
  type AutocompleteRootEmits,
  type AutocompleteRootProps,
  injectAutocompleteRootContext,
} from './AutocompleteRoot.vue'

// Re-export Combobox sub-components as Autocomplete equivalents.
// These components inject ComboboxRootContext which AutocompleteRoot provides.
export { ComboboxAnchor as AutocompleteAnchor } from '@/Combobox'
export { ComboboxArrow as AutocompleteArrow } from '@/Combobox'
export { ComboboxCancel as AutocompleteCancel } from '@/Combobox'
export { ComboboxContent as AutocompleteContent } from '@/Combobox'
export { ComboboxEmpty as AutocompleteEmpty } from '@/Combobox'
export { ComboboxGroup as AutocompleteGroup } from '@/Combobox'
export { ComboboxItem as AutocompleteItem } from '@/Combobox'
export { ComboboxItemIndicator as AutocompleteItemIndicator } from '@/Combobox'
export { ComboboxLabel as AutocompleteLabel } from '@/Combobox'
export { ComboboxPortal as AutocompletePortal } from '@/Combobox'
export { ComboboxSeparator as AutocompleteSeparator } from '@/Combobox'
export { ComboboxTrigger as AutocompleteTrigger } from '@/Combobox'
export { ComboboxViewport as AutocompleteViewport } from '@/Combobox'
export { ComboboxVirtualizer as AutocompleteVirtualizer } from '@/Combobox'

// Prop and emit types are declared as aliases, not renamed re-exports: Vue's
// compiler-sfc cannot resolve a renamed re-export in defineProps
// (https://github.com/vuejs/core/pull/15649).
export type AutocompleteAnchorProps = ComboboxAnchorProps
export type AutocompleteArrowProps = ComboboxArrowProps
export type AutocompleteCancelProps = ComboboxCancelProps
export type AutocompleteContentEmits = ComboboxContentEmits
export type AutocompleteContentProps = ComboboxContentProps
export type AutocompleteEmptyProps = ComboboxEmptyProps
export type AutocompleteGroupProps = ComboboxGroupProps
export type AutocompleteItemEmits<T = AcceptableValue> = ComboboxItemEmits<T>
export type AutocompleteItemIndicatorProps = ComboboxItemIndicatorProps
export type AutocompleteItemProps<T = AcceptableValue> = ComboboxItemProps<T>
export type AutocompleteLabelProps = ComboboxLabelProps
export type AutocompletePortalProps = ComboboxPortalProps
export type AutocompleteSeparatorProps = ComboboxSeparatorProps
export type AutocompleteTriggerProps = ComboboxTriggerProps
export type AutocompleteViewportProps = ComboboxViewportProps
export type AutocompleteVirtualizerProps<T extends AcceptableValue = AcceptableValue> = ComboboxVirtualizerProps<T>
