<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface ScrollAreaThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { watchOnce } from '@vueuse/core'
import { computed, watch } from 'vue'
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
    v-bind="thumb.attrs.value"
    :as-child="props.asChild"
    :as="as"
  >
    <slot />
  </Primitive>
</template>
