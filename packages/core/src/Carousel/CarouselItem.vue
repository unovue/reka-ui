<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CarouselItemProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectCarouselRootContext } from './CarouselRoot.vue'
import { getCarouselItemSurface } from './useCarousel'

withDefaults(defineProps<CarouselItemProps>(), { as: 'div' })

defineSlots<{
  default?: (props: {
    /** Whether the current snap brings this item into place */
    active: boolean
    /** Whether the item is visible in the viewport */
    inView: boolean
  }) => any
}>()

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectCarouselRootContext()

// Registered in DOM order once mounted: the index, `aria-label` and snap styles derive from it.
let registered: HTMLElement | undefined
watch(currentElement, (el) => {
  if (registered && registered !== el)
    rootContext.unregisterItem(registered)
  registered = el ?? undefined
  if (registered)
    rootContext.registerItem(registered)
}, { immediate: true, flush: 'post' })
onBeforeUnmount(() => {
  if (registered)
    rootContext.unregisterItem(registered)
  registered = undefined
})

// role/aria-roledescription/aria-label, `inert` out of view, data-index/active/in-view and the snap styles.
const surface = getCarouselItemSurface(rootContext, currentElement)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="surface.attrs.value"
  >
    <slot
      :active="surface.state.value.active"
      :in-view="surface.state.value.inView !== false"
    />
  </Primitive>
</template>
