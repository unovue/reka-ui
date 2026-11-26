<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { claimReferencedId, useForwardElement } from '@/shared'
import { injectStepperItemContext } from './StepperItem.vue'
import { getStepperDescriptionSurface, STEPPER_PARTS, useStepperPart } from './useStepper'
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

export interface StepperDescriptionProps extends PrimitiveProps { }

const props = withDefaults(defineProps<StepperDescriptionProps>(), { as: 'p' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const itemContext = injectStepperItemContext()
// A consumer `id` on the part is followed by the trigger's reference (#3377).
claimReferencedId(itemContext, 'descriptionId')
const surface = getStepperDescriptionSurface(itemContext)

useStepperPart(itemContext, STEPPER_PARTS.DESCRIPTION)
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
