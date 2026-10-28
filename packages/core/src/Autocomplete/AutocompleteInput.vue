<script lang="ts">
import type { ComboboxInputChangeReason, ComboboxOpenChangeReason } from '@/Combobox/useCombobox'
import type { ListboxFilterProps } from '@/Listbox'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'

export type AutocompleteInputEmits = {
  /**
   * Event handler called when the input text changes. The text is the Autocomplete value: veto typing with
   * `beforeUpdate:modelValue` on `AutocompleteRoot`.
   */
  'update:modelValue': [value: string, details: ChangeEventDetails<ComboboxInputChangeReason>]
}
export interface AutocompleteInputProps extends ListboxFilterProps {}
</script>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { injectComboboxRootContext } from '@/Combobox/ComboboxRoot.vue'
import { createComboboxInputSurface } from '@/Combobox/useCombobox'
import { renderAsEmpty, rendersChildren } from '@/Primitive/renderAs'
import { useControllableState, useForwardElement } from '@/shared'
import { injectAutocompleteRootContext } from './AutocompleteRoot.vue'

const props = withDefaults(defineProps<AutocompleteInputProps>(), {
  as: 'input',
})
const emits = defineEmits<AutocompleteInputEmits>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const rootContext = injectComboboxRootContext()
const autocompleteContext = injectAutocompleteRootContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// The input text, with change details (#2828). It has no `beforeUpdate` of its
// own: the text is the Autocomplete value, which `AutocompleteRoot` vetoes.
const { state: modelValue, setState: setText } = useControllableState<string, ComboboxInputChangeReason>({
  prop: () => props.modelValue,
  defaultValue: '',
  name: 'modelValue',
  emit: (event: string, value: string, details: ChangeEventDetails<ComboboxInputChangeReason>) => {
    if (event === 'update:modelValue')
      emits('update:modelValue', value, details)
  },
})

if (autocompleteContext.modelValue.value)
  setText(autocompleteContext.modelValue.value, 'none')

// The Combobox input surface; the typed text is also the Autocomplete value.
const surface = createComboboxInputSurface(rootContext, {
  modelValue,
  setText: (value, event) => {
    setText(value, 'input-change', event)
    return true
  },
  disabled: () => props.disabled,
  // `false` (a cancelled `beforeUpdate:modelValue`) restores the input; an
  // unchanged value is not a veto.
  onTextChange: (value, event) => autocompleteContext.onModelValueChange(value, 'input-change', event)
    || value === (autocompleteContext.modelValue.value ?? ''),
})

onMounted(() => {
  // The input owns the keyboard: the items are highlighted, never focused.
  rootContext.focusable.value = false
  if (currentElement.value)
    rootContext.onInputElementChange(currentElement.value as HTMLInputElement)
  setTimeout(() => {
    if (props.autoFocus)
      currentElement.value?.focus()
  }, 1)
})

onUnmounted(() => {
  rootContext.focusable.value = true
})

// When the value changes elsewhere (an item press, a clear, the parent), show it in the input.
watch(autocompleteContext.modelValue, (newVal) => {
  const text = newVal ?? ''
  if (modelValue.value !== text) {
    const reason = rootContext.lastChangeDetails.value.reason
    setText(text, reason === 'item-press' || reason === 'clear-press' ? reason : 'none')
  }
})

rootContext.onClearInput((event?: Event) => {
  setText('', 'clear-press', event)
})

// Restore the input text when the root resets it (closing with `resetSearchTermOnBlur`).
rootContext.onResetSearchTerm((closeReason?: ComboboxOpenChangeReason | BaseChangeReason) => {
  const text = autocompleteContext.modelValue.value ?? ''
  setText(text, closeReason === 'escape-key' ? 'escape-key' : text === '' ? 'input-clear' : 'none')
})

watch(rootContext.filterState, (_newValue, oldValue) => {
  if (!rootContext.isVirtual.value && oldValue.count === 0)
    rootContext.highlightFirstItem()
})
</script>

<template>
  <component
    :is="renderAsEmpty(as, asChild)"
    :ref="forwardRef"
    v-bind="surface.attrs.value"
  >
    <template
      v-if="rendersChildren(as, asChild)"
      #default
    >
      <slot :model-value="modelValue" />
    </template>
  </component>
</template>
