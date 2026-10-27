<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectStepperItemContext } from './StepperItem.vue'
import { getStepperDescriptionSurface } from './useStepper'
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

export interface StepperDescriptionProps extends PrimitiveProps { }

const props = withDefaults(defineProps<StepperDescriptionProps>(), { as: 'p' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const itemContext = injectStepperItemContext()
const surface = getStepperDescriptionSurface(itemContext)
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
