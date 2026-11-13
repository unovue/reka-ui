<script lang="ts">
import type { ComboboxInputChangeReason, ComboboxOpenChangeReason } from './useCombobox'
import type { ListboxFilterProps } from '@/Listbox'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { getCurrentScope, mergeProps, nextTick, onMounted, onUnmounted, toValue, watch } from 'vue'
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
    const previous = modelValue.value ?? ''
    // A cancelled text change keeps the text and the selection.
    if (!setText(value, 'input-change', event))
      return false
    // Base UI: emptying the input (outside the popup) clears a single value.
    // Decided by the accepted text, not a reread of a controlled text prop
    // (still the old text here). A cancelled clear keeps the selection, so its
    // text comes back and the surface restores the element.
    if (!value && !rootContext.multiple.value && rootContext.modelValue.value != null
      && !getElementByIdFrom(rootContext.parentElement.value, rootContext.contentId)?.contains(currentElement.value as Element)
      && !rootContext.clearModelValue(event, 'input-clear')) {
      setText(previous, 'none', event)
      return false
    }
    return true
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

// The selection the text was last reset to, and the text it had.
let shownValue: unknown
let shownText: string | undefined

function resetSearchTerm(reason: ComboboxInputChangeReason | BaseChangeReason) {
  shownValue = rootContext.modelValue.value
  shownText = getComboboxInputText(rootContext, props.displayValue)
  setText(shownText, reason)
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

// `items` on the root as last read by the watcher below, and as last handled by
// it; and whether the watcher of the selection text was created.
const scope = getCurrentScope()
let itemsSeen: unknown
let lastItems: unknown
let isWatchingSelectionText = false

watch(() => {
  // Only whether `items` is set and which object it is. Its content is read by
  // the watcher created below.
  itemsSeen = toValue(rootContext.items)
  return rootContext.modelValue.value
}, (value, oldValue) => {
  if (itemsSeen !== lastItems) {
    lastItems = itemsSeen
    if (itemsSeen !== undefined && !isWatchingSelectionText) {
      isWatchingSelectionText = true
      // With `items`, a label that arrives or changes later (items loaded after
      // the value, a language switch) updates the text, but only where the
      // input still shows the text of the same selection: typed text is left
      // alone, also text a close retained (`resetSearchTermOnBlur` off). It
      // runs when the text changes, so `items` replaced or extended with the
      // same label does nothing. Created with the first `items`, so that a
      // root without `items` has no watcher for it.
      scope?.run(() => watch(() => getComboboxInputText(rootContext, props.displayValue), (text) => {
        if (rootContext.resetSearchTermOnSelect.value && !rootContext.isUserInputted.value
          && shownText !== undefined && shownText !== text
          && shownValue === rootContext.modelValue.value && shownText === (modelValue.value ?? '')) {
          resetSearchTerm('none')
        }
      }, { immediate: true }))
    }
    // `items` was set or replaced under the same selection: there is no
    // selection change to handle. Not on the first run, which has no text yet.
    if (value === oldValue && shownText !== undefined)
      return
  }
  if (!rootContext.resetSearchTermOnSelect.value)
    return
  const reason = rootContext.lastChangeDetails.value.reason
  if (rootContext.isUserInputted.value && rootContext.multiple.value && (reason === 'item-press' || reason === 'item-keydown')) {
    // Base UI: picking an item while filtering a multiple combobox clears the
    // text and the filter; the popup stays open. A cancelled clear keeps both.
    // A text that is already empty (a controlled one the parent reset) still
    // clears the filter. When the element still shows typed text over it, the
    // clear runs anyway (`force`), so the parent can cancel it.
    const input = currentElement.value as HTMLInputElement | undefined
    const isEmpty = (modelValue.value ?? '') === ''
    const shown = isEmpty && !!input?.value
    if (setText('', 'input-clear', undefined, { force: shown }) || (isEmpty && !shown)) {
      rootContext.filterSearch.value = ''
      if (shown)
        input!.value = ''
    }
    return
  }
  if (!rootContext.isUserInputted.value) {
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
