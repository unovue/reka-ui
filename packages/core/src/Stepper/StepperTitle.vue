<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { claimReferencedId, useForwardElement } from '@/shared'
import { injectStepperItemContext } from './StepperItem.vue'
import { getStepperTitleSurface, STEPPER_PARTS, useStepperPart } from './useStepper'
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

export interface StepperTitleProps extends PrimitiveProps { }

const props = withDefaults(defineProps<StepperTitleProps>(), { as: 'h4' })
const itemContext = injectStepperItemContext()
// A consumer `id` on the part is followed by the trigger's reference (#3377).
claimReferencedId(itemContext, 'titleId')
const surface = getStepperTitleSurface(itemContext)

useStepperPart(itemContext, STEPPER_PARTS.TITLE)
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
