<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface ScrollAreaThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { watchOnce } from '@vueuse/core'
import { computed, onUnmounted, ref } from 'vue'
import { Primitive } from '@/Primitive'
import { injectScrollAreaRootContext } from './ScrollAreaRoot.vue'
import { injectScrollAreaScrollbarVisibleContext } from './ScrollAreaScrollbarVisible.vue'
import { getScrollAreaThumbSurface } from './useScrollArea'
import { addUnlinkedScrollListener } from './utils'

const props = defineProps<ScrollAreaThumbProps>()

const rootContext = injectScrollAreaRootContext()
const scrollbarContextVisible = injectScrollAreaScrollbarVisibleContext()

const thumb = getScrollAreaThumbSurface(scrollbarContextVisible)

const { forwardRef, currentElement: thumbElement, expose } = useForwardElement()
defineExpose(expose)
const removeUnlinkedScrollListenerRef = ref<() => void>()
const viewport = computed(() => rootContext.viewport.value)

function handleScroll() {
  if (!removeUnlinkedScrollListenerRef.value) {
    const listener = addUnlinkedScrollListener(
      viewport.value!,
      scrollbarContextVisible.onThumbPositionChange,
    )
    removeUnlinkedScrollListenerRef.value = listener
    scrollbarContextVisible.onThumbPositionChange()
  }
}

const sizes = computed(() => scrollbarContextVisible.sizes.value)

watchOnce(sizes, () => {
  scrollbarContextVisible.onThumbChange(thumbElement.value!)
  if (viewport.value) {
    /**
     * We only bind to native scroll event so we know when scroll starts and ends.
     * When scroll starts we start a requestAnimationFrame loop that checks for
     * changes to scroll position. That rAF loop triggers our thumb position change
     * when relevant to avoid scroll-linked effects. We cancel the loop when scroll ends.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Performance/Scroll-linked_effects
     */
    scrollbarContextVisible.onThumbPositionChange()
    viewport.value.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  viewport.value?.removeEventListener('scroll', handleScroll)
  removeUnlinkedScrollListenerRef.value?.()
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="thumb.attrs.value"
    :as-child="props.asChild"
    :as="as"
  >
    <slot />
  </Primitive>
</template>
