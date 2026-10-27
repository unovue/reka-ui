<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectStepperItemContext } from './StepperItem.vue'
import { getStepperTitleSurface } from './useStepper'
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

export interface StepperTitleProps extends PrimitiveProps { }

const props = withDefaults(defineProps<StepperTitleProps>(), { as: 'h4' })
const itemContext = injectStepperItemContext()
const surface = getStepperTitleSurface(itemContext)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    v-bind="surface.attrs.value"
  >
    <slot />
  </Primitive>
</template>
