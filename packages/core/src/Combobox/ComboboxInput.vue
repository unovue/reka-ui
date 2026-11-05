<script lang="ts">
import type { ComboboxInputChangeReason, ComboboxOpenChangeReason } from './useCombobox'
import type { ListboxFilterProps } from '@/Listbox'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { mergeProps, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { getElementByIdFrom, useControllableState, useForwardElement } from '@/shared'

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
import { renderAsEmpty, rendersChildren } from '@/Primitive/renderAs'
import { injectComboboxRootContext } from './ComboboxRoot.vue'
import { createComboboxInputSurface, getComboboxInputText, hasComboboxValue } from './useCombobox'
import { getComboboxInputFieldAttrs, injectComboboxFieldContext } from './useComboboxField'

// `$attrs` are merged in the render (as the fall-through did) so the Field's
// aria ids can be merged with the consumer's.
defineOptions({ inheritAttrs: false })

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
const fieldContext = injectComboboxFieldContext(null)
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
  setText: (value, event) => {
    const changed = setText(value, 'input-change', event)
    // Base UI: emptying the input (outside the popup) clears a single value.
    if (!value && !modelValue.value && !rootContext.multiple.value && rootContext.modelValue.value != null
      && !getElementByIdFrom(rootContext.parentElement.value, rootContext.contentId)?.contains(currentElement.value as Element)) {
      rootContext.clearModelValue(event, 'input-clear')
    }
    return changed
  },
  disabled: () => props.disabled,
  closeOnBlur: true,
  // Base UI: Escape on a closed combobox clears the value and the text. A
  // cancelled value clear keeps both; the event stops only when something was cleared.
  onClosedEscape: (event) => {
    const filled = hasComboboxValue(rootContext.modelValue.value)
    if (filled && !rootContext.clearModelValue(event, 'escape-key'))
      return
    setText('', 'escape-key', event)
    if (filled)
      event.stopPropagation()
  },
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
  // Unless another input took its place: the field's label then follows the trigger.
  if (!rootContext.inputElement.value?.isConnected)
    rootContext.onInputElementChange(undefined)
})

// Inside a Field, followed rather than read once: an as-child swap replaces
// the element while the input stays mounted, and the field focuses (and
// labels) the connected one.
if (fieldContext) {
  watch(currentElement, (element, previous) => {
    if (element)
      rootContext.onInputElementChange(element as HTMLInputElement)
    else if (rootContext.inputElement.value === previous)
      rootContext.onInputElementChange(undefined)
  }, { flush: 'post' })
}

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
  <component
    :is="renderAsEmpty(as, asChild)"
    :ref="forwardRef"
    v-bind="fieldContext ? getComboboxInputFieldAttrs(fieldContext, surface.attrs.value, $attrs) : mergeProps(surface.attrs.value, $attrs)"
  >
    <template
      v-if="rendersChildren(as, asChild)"
      #default
    >
      <slot :model-value="modelValue" />
    </template>
  </component>
</template>
