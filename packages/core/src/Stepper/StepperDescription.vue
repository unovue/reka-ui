<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { onBeforeUnmount, onMounted } from 'vue'
import { useForwardExpose, useReferencedId } from '@/shared'
import { injectStepperItemContext } from './StepperItem.vue'
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

export interface StepperDescriptionProps extends PrimitiveProps { }

const props = withDefaults(defineProps<StepperDescriptionProps>(), { as: 'p' })

const { forwardRef, currentElement } = useForwardExpose()
const itemContext = injectStepperItemContext()
useReferencedId(itemContext, 'descriptionId', currentElement)

onMounted(() => {
  itemContext.hasDescription.value = true
})
onBeforeUnmount(() => {
  itemContext.hasDescription.value = false
})
</script>

<template>
  <Primitive
    v-bind="props"
    :id="itemContext.descriptionId"
    :ref="forwardRef"
  >
    <slot />
  </Primitive>
</template>
