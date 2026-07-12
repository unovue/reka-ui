<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface DismissableLayerBranchProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Primitive } from '@/Primitive'
import { registerBranch } from './layerStack'

const props = defineProps<DismissableLayerBranchProps>()

const { forwardRef, currentElement } = useForwardExpose()
let unregisterBranch: (() => void) | undefined
onMounted(() => {
  if (currentElement.value)
    unregisterBranch = registerBranch(currentElement.value)
})
onUnmounted(() => {
  unregisterBranch?.()
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </Primitive>
</template>
