<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectStepperItemContext } from './StepperItem.vue'
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

export interface StepperTitleProps extends PrimitiveProps { }

const props = withDefaults(defineProps<StepperTitleProps>(), { as: 'h4' })
const itemContext = injectStepperItemContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    v-bind="props"
    :id="itemContext.titleId"
    :ref="forwardRef"
  >
    <slot />
  </Primitive>
</template>
