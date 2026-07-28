<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectStepperItemContext } from './StepperItem.vue'
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

export interface StepperIndicatorProps extends PrimitiveProps { }

const props = withDefaults(defineProps<StepperIndicatorProps>(), { as: 'span' })

defineSlots<{
  default?: ((props: {
    /** Current step */
    step: number
  }) => any) | undefined
}>()

const itemContext = injectStepperItemContext()
useForwardExpose()
</script>

<template>
  <Primitive
    v-bind="props"
  >
    <slot :step="itemContext.step.value">
      Step {{ itemContext.step.value }}
    </slot>
  </Primitive>
</template>
