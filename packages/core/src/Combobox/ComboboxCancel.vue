<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ComboboxCancelProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

const props = withDefaults(defineProps<ComboboxCancelProps>(), {
  as: 'button',
})

useForwardExpose()
const rootContext = injectComboboxRootContext()

function handleClick() {
  if (rootContext.inputElement.value) {
    rootContext.inputElement.value.value = ''
    rootContext.inputElement.value.focus()
  }

  if (rootContext.resetModelValueOnClear?.value) {
    rootContext.modelValue.value = rootContext.multiple.value ? [] : null
  }

  // Reset the search to show all options.
  // Done last: focusing can re-open the popup (`openOnFocus`), which may restore the filter from the previous value.
  rootContext.filterSearch.value = ''
}
</script>

<template>
  <Primitive
    :type="as === 'button' ? 'button' : undefined"
    v-bind="props"
    tabindex="-1"
    @click="handleClick"
  >
    <slot />
  </Primitive>
</template>
