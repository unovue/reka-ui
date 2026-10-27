<script lang="ts">
import type { Ref } from 'vue'
import type { Sizes } from './types'
import { createContext, useForwardElement } from '@/shared'

export interface ScrollAreaScrollbarVisibleContext {
  sizes: Ref<Sizes>
  hasThumb: Ref<boolean>
  handleWheelScroll: (event: WheelEvent, payload: number) => void
  handleThumbDown: (
    event: MouseEvent,
    payload: { x: number, y: number },
  ) => void
  handleThumbUp: (event: MouseEvent) => void
  handleSizeChange: (payload: Sizes) => void
  onThumbPositionChange: () => void
  onDragScroll: (payload: number) => void
  onThumbChange: (element: HTMLElement) => void
}

export const [injectScrollAreaScrollbarVisibleContext, provideScrollAreaScrollbarVisibleContext]
  = createContext<ScrollAreaScrollbarVisibleContext>('ScrollAreaScrollbarVisible')
</script>

<script setup lang="ts">
import { injectScrollAreaRootContext } from './ScrollAreaRoot.vue'
import { injectScrollAreaScrollbarContext } from './ScrollAreaScrollbar.vue'
import ScrollAreaScrollbarX from './ScrollAreaScrollbarX.vue'
import ScrollAreaScrollbarY from './ScrollAreaScrollbarY.vue'
import { createScrollAreaScrollbarVisibleContext } from './useScrollArea'

const rootContext = injectScrollAreaRootContext()
const scrollbarContext = injectScrollAreaScrollbarContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

provideScrollAreaScrollbarVisibleContext(createScrollAreaScrollbarVisibleContext(rootContext, scrollbarContext))
</script>

<template>
  <ScrollAreaScrollbarX
    v-if="scrollbarContext.isHorizontal.value"
    v-bind="$attrs"
    :ref="forwardRef"
  >
    <slot />
  </ScrollAreaScrollbarX>
  <ScrollAreaScrollbarY
    v-else
    v-bind="$attrs"
    :ref="forwardRef"
  >
    <slot />
  </ScrollAreaScrollbarY>
</template>
