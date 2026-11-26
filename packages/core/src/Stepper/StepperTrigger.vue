<script lang="ts">
import type { VNode } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { vnodeElement } from '@/shared/SharedMutationObserver'
import { useUntrackedAttrs } from '@/shared/splitWrapperAttrs'

export interface StepperTriggerProps extends PrimitiveProps {
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectStepperItemContext } from './StepperItem.vue'
import { injectStepperRootContext } from './StepperRoot.vue'
import { getStepperTriggerSurface, STEPPER_PARTS } from './useStepper'

withDefaults(defineProps<StepperTriggerProps>(), {
  as: 'button',
})

const rootContext = injectStepperRootContext()
const itemContext = injectStepperItemContext()

// data-state/tabindex/aria and the mousedown/keydown handlers come from the
// shared surface builder (single source with `useStepper().getItem`); the
// tag-dependent `type` and the trigger registration stay in the SFC.
// The attrs are read in render, and a change of them re-renders the trigger: no tracking needed.
const surface = getStepperTriggerSurface(rootContext, itemContext, { attrs: useUntrackedAttrs() })

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// Registered from the element's vnode hooks (mounted, updated, unmounted) rather than from
// lifecycle hooks or a watcher, so it follows the element: an `asChild` trigger can swap its
// element without unmounting.
let registered: HTMLElement | undefined
// `null` (unmounted) unregisters. Vapor calls the hooks without a vnode: the element is then
// read from the forwarded ref.
function sync(vnode: VNode | null | undefined) {
  const element = vnode === null ? undefined : ((vnode && vnodeElement(vnode)) ?? currentElement.value ?? undefined)
  if (element === registered)
    return
  if (registered) {
    rootContext.itemDisabled.delete(registered)
    rootContext.stepperItemValues.delete(registered)
    rootContext.totalStepperItems.value.delete(registered)
  }
  registered = element
  if (element) {
    rootContext.itemDisabled.set(element, () => itemContext.disabled.value)
    rootContext.stepperItemValues.set(element, itemContext.step)
    rootContext.totalStepperItems.value.add(element)
    itemContext.parts.value |= STEPPER_PARTS.TRIGGER_MOUNTED
  }
}
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    :as="as"
    :as-child="asChild"
    v-bind="surface.attrs.value"
    @vue:mounted="sync"
    @vue:updated="sync"
    @vue:unmounted="sync(null)"
  >
    <slot />
  </Primitive>
</template>
