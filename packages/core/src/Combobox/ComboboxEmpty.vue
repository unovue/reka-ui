<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ComboboxEmptyProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

defineProps<ComboboxEmptyProps>()
const rootContext = injectComboboxRootContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-if="rootContext.filterState.value.count === 0"
    :ref="forwardRef"
  >
    <slot>No options</slot>
  </component>
</template>
