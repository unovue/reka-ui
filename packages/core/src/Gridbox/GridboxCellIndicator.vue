<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface GridboxCellIndicatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectGridboxCellContext } from './GridboxCell.vue'

const props = withDefaults(defineProps<GridboxCellIndicatorProps>(), {
  as: 'span',
})

useForwardExpose()
const cellContext = injectGridboxCellContext()
</script>

<template>
  <Primitive
    v-if="cellContext.isSelected.value"
    aria-hidden="true"
    v-bind="props"
  >
    <slot />
  </Primitive>
</template>
