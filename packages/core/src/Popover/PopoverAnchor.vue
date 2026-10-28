<script lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { useForwardElement } from '@/shared'

export interface PopoverAnchorProps extends PopperAnchorProps {}
</script>

<script setup lang="ts">
import { onBeforeMount, onUnmounted } from 'vue'
import { usePopperAnchor } from '@/Popper/usePopperAnchor'
import { renderAs } from '@/Primitive/renderAs'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = defineProps<PopoverAnchorProps>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
usePopperAnchor({ element: currentElement, reference: () => props.reference })
const rootContext = injectPopoverRootContext()

onBeforeMount(() => {
  rootContext.hasCustomAnchor.value = true
})
onUnmounted(() => {
  rootContext.hasCustomAnchor.value = false
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
