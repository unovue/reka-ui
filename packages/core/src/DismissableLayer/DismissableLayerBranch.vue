<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface DismissableLayerBranchProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Primitive } from '@/Primitive'
import { context } from './context'

const props = defineProps<DismissableLayerBranchProps>()

const { forwardRef, currentElement } = useForwardExpose()

let registeredElement: HTMLElement | null = null

onMounted(() => {
  registeredElement = currentElement.value
  if (registeredElement)
    context.branches.add(registeredElement)
})
onUnmounted(() => {
  if (registeredElement) {
    context.branches.delete(registeredElement)
    registeredElement = null
  }
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
