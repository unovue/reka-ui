<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { onBeforeUnmount, onMounted } from 'vue'
import { claimReferencedId, useForwardElement } from '@/shared'
import { injectStepperItemContext } from './StepperItem.vue'
import { getStepperTitleSurface } from './useStepper'
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

export interface StepperTitleProps extends PrimitiveProps { }

const props = withDefaults(defineProps<StepperTitleProps>(), { as: 'h4' })
const itemContext = injectStepperItemContext()
// A consumer `id` on the part is followed by the trigger's reference (#3377).
claimReferencedId(itemContext, 'titleId')
const surface = getStepperTitleSurface(itemContext)

onMounted(() => {
  itemContext.hasTitle.value = true
})
onBeforeUnmount(() => {
  itemContext.hasTitle.value = false
})
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
