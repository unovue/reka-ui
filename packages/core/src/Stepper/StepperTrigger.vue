<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { onMounted, ref, useAttrs, watchPostEffect } from 'vue'
import { useForwardElement } from '@/shared'

export interface StepperTriggerProps extends PrimitiveProps {
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectStepperItemContext } from './StepperItem.vue'
import { injectStepperRootContext } from './StepperRoot.vue'
import { getStepperTriggerSurface } from './useStepper'

withDefaults(defineProps<StepperTriggerProps>(), {
  as: 'button',
})

const rootContext = injectStepperRootContext()
const itemContext = injectStepperItemContext()

// data-state/tabindex/aria and the mousedown/keydown handlers come from the
// shared surface builder (single source with `useStepper().getItem`); the
// tag-dependent `type` and the trigger registration stay in the SFC.
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})
const surface = getStepperTriggerSurface(rootContext, itemContext, { attrs: useAttrs(), isMounted })

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// Follows the element: an `asChild` trigger can swap its element without unmounting.
watchPostEffect((cleanup) => {
  const element = currentElement.value
  if (!element)
    return
  rootContext.itemDisabled.set(element, () => itemContext.disabled.value)
  rootContext.stepperItemValues.set(element, () => itemContext.step.value)
  rootContext.totalStepperItems.value.add(element)
  cleanup(() => {
    rootContext.itemDisabled.delete(element)
    rootContext.stepperItemValues.delete(element)
    rootContext.totalStepperItems.value.delete(element)
  })
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    :as="as"
    :as-child="asChild"
    v-bind="surface.attrs.value"
  >
    <slot />
  </Primitive>
</template>
