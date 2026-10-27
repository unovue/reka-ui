<script lang="ts">
import type { ListboxFilterEmits, ListboxFilterProps } from '@/Listbox'

export type AutocompleteInputEmits = ListboxFilterEmits
export interface AutocompleteInputProps extends ListboxFilterProps {}
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { onMounted, onUnmounted, watch } from 'vue'
import { injectComboboxRootContext } from '@/Combobox/ComboboxRoot.vue'
import { createComboboxInputSurface } from '@/Combobox/useCombobox'
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
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

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: '',
  passive: (props.modelValue === undefined) as false,
})

if (autocompleteContext.modelValue.value)
  modelValue.value = autocompleteContext.modelValue.value

// The Combobox input surface; the typed text is also the Autocomplete value.
const surface = createComboboxInputSurface(rootContext, {
  modelValue,
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
  if (modelValue.value !== text)
    modelValue.value = text
})

// Restore the input text when the root resets it (closing with `resetSearchTermOnBlur`).
rootContext.onResetSearchTerm(() => {
  modelValue.value = autocompleteContext.modelValue.value ?? ''
})

watch(rootContext.filterState, (_newValue, oldValue) => {
  if (!rootContext.isVirtual.value && oldValue.count === 0)
    rootContext.highlightFirstItem()
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="surface.attrs.value"
  >
    <slot :model-value="modelValue" />
  </Primitive>
</template>
