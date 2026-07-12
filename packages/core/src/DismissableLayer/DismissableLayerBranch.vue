<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DismissableLayerBranchProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRender } from '@/Primitive'
import { registerBranch } from './layerStack'

const props = defineProps<DismissableLayerBranchProps>()

const { tag, currentElement, elementRef } = useRender({
  as: () => props.as,
  asChild: () => props.asChild,
})
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
  <component
    :is="tag"
    :ref="elementRef"
  >
    <slot />
  </component>
</template>
