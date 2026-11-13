<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CarouselViewportProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { mergeProps, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectCarouselRootContext } from './CarouselRoot.vue'
import { useCarouselViewport } from './useCarouselViewport'

defineOptions({
  // `$attrs` are merged under the viewport bindings so consumer listeners chain with them.
  inheritAttrs: false,
})

withDefaults(defineProps<CarouselViewportProps>(), { as: 'div' })

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectCarouselRootContext()

watch(currentElement, (el) => {
  rootContext.viewportElement.value = el ?? undefined
}, { immediate: true })

// Measuring, scroll sync, drag, wheel, keys, loop, auto height and auto scroll.
const viewport = useCarouselViewport(rootContext, currentElement)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="mergeProps($attrs, viewport.attrs.value)"
    :data-orientation="rootContext.orientation.value"
    :data-dragging="rootContext.dragging.value ? '' : undefined"
  >
    <slot />
  </Primitive>
</template>
