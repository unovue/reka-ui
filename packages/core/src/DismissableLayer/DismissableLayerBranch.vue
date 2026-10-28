<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DismissableLayerBranchProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRender } from '@/Primitive'
import { renderAs } from '@/Primitive/renderAs'
import { registerBranch } from './layerStack'

const props = defineProps<DismissableLayerBranchProps>()

const { currentElement, elementRef, expose } = useRender({
  as: () => props.as,
  asChild: () => props.asChild,
})
defineExpose(expose)
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
    :is="renderAs(as, asChild)"
    :ref="elementRef"
  >
    <slot />
  </component>
</template>
