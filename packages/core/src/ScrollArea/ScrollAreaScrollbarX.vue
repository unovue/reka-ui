<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useForwardElement } from '@/shared'
import { injectScrollAreaRootContext } from './ScrollAreaRoot.vue'
import ScrollAreaScrollbarImpl from './ScrollAreaScrollbarImpl.vue'
import { injectScrollAreaScrollbarVisibleContext } from './ScrollAreaScrollbarVisible.vue'
import { getScrollAreaThumbSizeVar } from './useScrollArea'

const rootContext = injectScrollAreaRootContext()
const scrollbarVisibleContext = injectScrollAreaScrollbarVisibleContext()

const { forwardRef, currentElement: scrollbarElement, expose } = useForwardElement()
defineExpose(expose)

onMounted(() => {
  if (scrollbarElement.value)
    rootContext.onScrollbarXChange(scrollbarElement.value)
})
// Clear the registration on unmount so consumers (e.g. ScrollAreaCorner) don't
// hold a stale reference once the scrollbar is removed (e.g. between hover cycles).
onUnmounted(() => {
  rootContext.onScrollbarXChange(null)
})
</script>

<template>
  <ScrollAreaScrollbarImpl
    :ref="forwardRef"
    :is-horizontal="true"
    data-orientation="horizontal"
    :style="{
      bottom: 0,
      left: rootContext.dir.value === 'rtl' ? 'var(--reka-scroll-area-corner-width)' : 0,
      right: rootContext.dir.value === 'ltr' ? 'var(--reka-scroll-area-corner-width)' : 0,
      ...getScrollAreaThumbSizeVar(scrollbarVisibleContext, true),
    }"
    @on-drag-scroll="scrollbarVisibleContext.onDragScroll($event.x)"
  >
    <slot />
  </ScrollAreaScrollbarImpl>
</template>
