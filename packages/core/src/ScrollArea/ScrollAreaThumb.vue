<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface ScrollAreaThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { watchOnce } from '@vueuse/core'
import { computed, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { injectScrollAreaRootContext } from './ScrollAreaRoot.vue'
import { injectScrollAreaScrollbarVisibleContext } from './ScrollAreaScrollbarVisible.vue'
import { addUnlinkedScrollListener } from './utils'

const props = defineProps<ScrollAreaThumbProps>()

const rootContext = injectScrollAreaRootContext()
const scrollbarContextVisible = injectScrollAreaScrollbarVisibleContext()

function handlePointerDown(event: MouseEvent) {
  const thumb = event.target as HTMLElement
  const thumbRect = thumb.getBoundingClientRect()
  const x = event.clientX - thumbRect.left
  const y = event.clientY - thumbRect.top
  scrollbarContextVisible.handleThumbDown(event, { x, y })
}

function handlePointerUp(event: MouseEvent) {
  scrollbarContextVisible.handleThumbUp(event)
}

const { forwardRef, currentElement: thumbElement } = useForwardExpose()
const viewport = computed(() => rootContext.viewport.value)

watch(viewport, (element, _, onCleanup) => {
  if (!element)
    return

  // Native events start the loop; position changes keep it alive during momentum scrolling.
  const cleanup = addUnlinkedScrollListener(element, scrollbarContextVisible.onThumbPositionChange)
  scrollbarContextVisible.onThumbPositionChange()
  onCleanup(cleanup)
}, { immediate: true, flush: 'post' })

const sizes = computed(() => scrollbarContextVisible.sizes.value)

watchOnce(sizes, () => {
  scrollbarContextVisible.onThumbChange(thumbElement.value!)
  scrollbarContextVisible.onThumbPositionChange()
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :data-state="scrollbarContextVisible.hasThumb.value ? 'visible' : 'hidden'"
    :style="{
      width: 'var(--reka-scroll-area-thumb-width)',
      height: 'var(--reka-scroll-area-thumb-height)',
    }"
    :as-child="props.asChild"
    :as="as"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
  >
    <slot />
  </Primitive>
</template>
