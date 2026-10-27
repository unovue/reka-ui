<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onUnmounted, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { getDrawerTriggerSurface } from './useDrawer'

const props = withDefaults(defineProps<DrawerTriggerProps>(), { as: 'button' })
const rootContext = injectDrawerRootContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// aria-haspopup/aria-expanded/aria-controls/data-state + the click handler come
// from the shared surface builder (single source with `useDrawer()`); the
// tag-dependent `type` stays here. Consumer listeners fall through as `$attrs`
// and chain with the surface's handler.
const trigger = getDrawerTriggerSurface(rootContext)

// Keep triggerElement in sync with the rendered element — useForwardElement's
// currentElement is a reactive computed ref, and v-if / conditional rendering
// can swap the underlying DOM node, so a one-shot onMounted assignment would
// go stale and break finalFocus restoration in DrawerContent.
watch(currentElement, (el) => {
  rootContext.triggerElement.value = el
}, { immediate: true })

onUnmounted(() => {
  if (rootContext.triggerElement.value === currentElement.value)
    rootContext.triggerElement.value = undefined
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="trigger.attrs.value"
  >
    <slot />
  </Primitive>
</template>
