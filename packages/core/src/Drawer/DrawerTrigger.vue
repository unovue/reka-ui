<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onUnmounted, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = withDefaults(defineProps<DrawerTriggerProps>(), { as: 'button' })
const rootContext = injectDrawerRootContext()
const { forwardRef, currentElement } = useForwardExpose()

// Keep triggerElement in sync with the rendered element — useForwardExpose's
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
    v-bind="props"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    aria-haspopup="dialog"
    :aria-expanded="rootContext.open.value"
    :aria-controls="rootContext.open.value ? rootContext.contentId : undefined"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    @click="rootContext.onOpenChange(true, 'trigger-press')"
  >
    <slot />
  </Primitive>
</template>
