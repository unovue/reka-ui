<script lang="ts">
import type { ComboboxInputChangeReason, ComboboxOpenChangeReason } from './useCombobox'
import type { ListboxFilterProps } from '@/Listbox'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useControllableState, useForwardElement } from '@/shared'

export type ComboboxInputEmits = {
  /** Called before the input text changes; `details.cancel()` keeps the current text. */
  'beforeUpdate:modelValue': [value: string, details: ChangeEventDetails<ComboboxInputChangeReason>]
  /** Event handler called when the input text changes. */
  'update:modelValue': [value: string, details: ChangeEventDetails<ComboboxInputChangeReason>]
}
export interface ComboboxInputProps extends ListboxFilterProps {
  /** The display value of input for selected item. Does not work with `multiple`. */
  displayValue?: (val: any) => string
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectComboboxRootContext } from './ComboboxRoot.vue'
import { createComboboxInputSurface, getComboboxInputText } from './useCombobox'

const props = withDefaults(defineProps<ComboboxInputProps>(), {
  as: 'input',
})
const emits = defineEmits<ComboboxInputEmits>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const rootContext = injectComboboxRootContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// The input text, with change details (#2828): typing is `'input-change'` and
// cancellable through `beforeUpdate:modelValue`.
const { state: modelValue, setState: setText } = useControllableState<string, ComboboxInputChangeReason>({
  prop: () => props.modelValue,
  defaultValue: '',
  name: 'modelValue',
  emit: emits,
})

// role/aria, the open-on-type/focus/click handling, IME composition and the
// keyboard (routed through `getNavigationIntent`) come from the shared surface.
const surface = createComboboxInputSurface(rootContext, {
  modelValue,
  setText: (value, event) => setText(value, 'input-change', event),
  disabled: () => props.disabled,
  closeOnBlur: true,
})

onMounted(() => {
  // The input owns the keyboard: the items are highlighted, never focused.
  rootContext.focusable.value = false
  if (currentElement.value)
    rootContext.onInputElementChange(currentElement.value as HTMLInputElement)
  setTimeout(() => {
    // make sure all DOM was flushed, then capture the focus
    if (props.autoFocus)
      currentElement.value?.focus()
  }, 1)
})

onUnmounted(() => {
  rootContext.focusable.value = true
})

function resetSearchTerm(reason: ComboboxInputChangeReason | BaseChangeReason) {
  setText(getComboboxInputText(rootContext, props.displayValue), reason)
  nextTick(() => {
    // The text can be unchanged while the DOM still shows typed text (a
    // controlled text the parent kept): patch the element back.
    const input = currentElement.value as HTMLInputElement | undefined
    if (input && input.value !== (modelValue.value ?? ''))
      input.value = modelValue.value ?? ''
  })
}

// Closing resets the text: `'escape-key'` for Escape, `'input-clear'` when
// there is no selection to show, else `'none'`.
rootContext.onResetSearchTerm((closeReason?: ComboboxOpenChangeReason | BaseChangeReason) => {
  resetSearchTerm(closeReason === 'escape-key'
    ? 'escape-key'
    : getComboboxInputText(rootContext, props.displayValue) === '' ? 'input-clear' : 'none')
})

rootContext.onClearInput((event?: Event) => {
  // `false` (a cancelled `beforeUpdate:modelValue`) keeps the text, and `ComboboxCancel` stops.
  return setText('', 'clear-press', event) || (modelValue.value ?? '') === ''
})

watch(rootContext.modelValue, () => {
  if (!rootContext.isUserInputted.value && rootContext.resetSearchTermOnSelect.value) {
    // A selection writes the selected text; a parent's value is `'none'`.
    const changeReason = rootContext.lastChangeDetails.value.reason
    resetSearchTerm(changeReason === 'clear-press'
      ? 'clear-press'
      : changeReason === 'item-press' || changeReason === 'item-keydown' || changeReason === 'select-all' || changeReason === 'range-select'
        ? 'item-press'
        : 'none')
  }
}, { immediate: true, deep: true })

watch(rootContext.filterState, (_newValue, oldValue) => {
  // A virtualized list updates its state constantly; otherwise only re-highlight
  // when there were no items to show before.
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
