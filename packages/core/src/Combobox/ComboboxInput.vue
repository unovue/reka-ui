<script lang="ts">
import type { ListboxFilterEmits, ListboxFilterProps } from '@/Listbox'
import { useVModel } from '@vueuse/core'
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useForwardElement } from '@/shared'

export type ComboboxInputEmits = ListboxFilterEmits
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

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: '',
  passive: (props.modelValue === undefined) as false,
})

// role/aria, the open-on-type/focus/click handling, IME composition and the
// keyboard (routed through `getNavigationIntent`) come from the shared surface.
const surface = createComboboxInputSurface(rootContext, {
  modelValue,
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

function resetSearchTerm() {
  modelValue.value = getComboboxInputText(rootContext, props.displayValue)
  nextTick(() => {
    // Temporary force reassign
    // eslint-disable-next-line no-self-assign
    modelValue.value = modelValue.value
  })
}

rootContext.onResetSearchTerm(resetSearchTerm)

watch(rootContext.modelValue, () => {
  if (!rootContext.isUserInputted.value && rootContext.resetSearchTermOnSelect.value)
    resetSearchTerm()
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
