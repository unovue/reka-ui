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
    rootContext.onScrollbarYChange(scrollbarElement.value)
})
// Clear the registration on unmount so consumers (e.g. ScrollAreaCorner) don't
// hold a stale reference once the scrollbar is removed (e.g. between hover cycles).
onUnmounted(() => {
  rootContext.onScrollbarYChange(null)
})
</script>

<template>
  <ScrollAreaScrollbarImpl
    :ref="forwardRef"
    :is-horizontal="false"
    data-orientation="vertical"
    :style="{
      top: 0,
      right: rootContext.dir.value === 'ltr' ? 0 : undefined,
      left: rootContext.dir.value === 'rtl' ? 0 : undefined,
      bottom: 'var(--reka-scroll-area-corner-height)',
      ...getScrollAreaThumbSizeVar(scrollbarVisibleContext, false),
    }"
    @on-drag-scroll="scrollbarVisibleContext.onDragScroll($event.y)"
  >
    <slot />
  </ScrollAreaScrollbarImpl>
</template>
