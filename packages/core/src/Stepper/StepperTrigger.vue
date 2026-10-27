<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { onMounted, onUnmounted } from 'vue'
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
const surface = getStepperTriggerSurface(rootContext, itemContext)

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

let registeredElement: HTMLElement | null = null

onMounted(() => {
  registeredElement = currentElement.value
  if (registeredElement)
    rootContext.totalStepperItems.value.add(registeredElement)
})

onUnmounted(() => {
  if (registeredElement) {
    rootContext.totalStepperItems.value.delete(registeredElement)
    registeredElement = null
  }
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
