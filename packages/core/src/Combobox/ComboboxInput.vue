<script lang="ts">
import type { ListboxFilterEmits, ListboxFilterProps } from '@/Listbox'
import { usePrimitiveElement } from '@/Primitive'
import { useVModel } from '@vueuse/core'
import { nextTick, onMounted, watch } from 'vue'

export type ComboboxInputEmits = ListboxFilterEmits
export interface ComboboxInputProps extends ListboxFilterProps {
  /** The display value of input for selected item. Does not work with `multiple`. */
  displayValue?: (val: any) => string
}
</script>

<script setup lang="ts">
import { ListboxFilter } from '@/Listbox'
import { injectListboxRootContext } from '@/Listbox/ListboxRoot.vue'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

const props = withDefaults(defineProps<ComboboxInputProps>(), {
  as: 'input',
})
const emits = defineEmits<ComboboxInputEmits>()

const rootContext = injectComboboxRootContext()
const listboxContext = injectListboxRootContext()
const { primitiveElement, currentElement } = usePrimitiveElement()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: (props.modelValue === undefined) as false,
})

onMounted(() => {
  if (currentElement.value)
    rootContext.onInputElementChange(currentElement.value as HTMLInputElement)
})

function handleKeyDown(ev: KeyboardEvent) {
  if (!rootContext.open.value)
    rootContext.onOpenChange(true)
}

function handleInput(event: InputEvent) {
  const target = event.target as HTMLInputElement
  if (!rootContext.open.value) {
    rootContext.onOpenChange(true)
    nextTick(() => {
      if (target.value) {
        rootContext.filterState.search = target.value
        listboxContext.highlightFirstItem(event)
      }
    })
  }
  else {
    rootContext.filterState.search = target.value
  }
}

function resetSearchTerm() {
  const rootModelValue = rootContext.modelValue.value

  if (props.displayValue) {
    modelValue.value = props.displayValue(rootModelValue)
  }
  else if (!rootContext.multiple.value && rootModelValue && !Array.isArray(rootModelValue)) {
    if (typeof rootModelValue !== 'object')
      modelValue.value = rootModelValue.toString()
    else modelValue.value = ''
  }
  else {
    modelValue.value = ''
  }

  nextTick(() => {
    // Temporary force reassign
    // eslint-disable-next-line no-self-assign
    modelValue.value = modelValue.value
  })
}

rootContext.onResetSearchTerm(() => {
  resetSearchTerm()
})

watch(rootContext.modelValue, async () => {
  if (!rootContext.isUserInputted.value && rootContext.resetSearchTermOnSelect.value)
    resetSearchTerm()
}, { immediate: true, deep: true })

watch(
  () => props.modelValue,
  () => {
    if (props.modelValue !== undefined) {
      rootContext.filterState.search = props.modelValue
    }
  },
)
</script>

<template>
  <ListboxFilter
    ref="primitiveElement"
    v-model="modelValue"
    :as="as"
    :as-child="asChild"
    :auto-focus="autoFocus"
    :aria-expanded="rootContext.open.value"
    :aria-controls="rootContext.contentId"
    aria-autocomplete="list"
    role="combobox"
    autocomplete="false"
    @input="handleInput"
    @keydown.down.up.prevent="handleKeyDown"
  >
    <slot />
  </ListboxFilter>
</template>
