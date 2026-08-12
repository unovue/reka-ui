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
  // Reset the search to show all options.
  rootContext.filterSearch.value = ''

  if (rootContext.inputElement.value) {
    rootContext.inputElement.value.value = ''
    rootContext.inputElement.value.focus()
  }

  if (rootContext.resetModelValueOnClear?.value) {
    if (rootContext.multiple.value) {
      rootContext.modelValue.value = []
    }
    else {
      rootContext.modelValue.value = rootContext.clearValue?.value !== undefined ? rootContext.clearValue.value : null
    }
  }
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
