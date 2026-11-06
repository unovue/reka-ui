<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CarouselViewportProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { mergeProps, watch } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectCarouselRootContext } from './CarouselRoot.vue'
import { useCarouselViewport } from './useCarouselViewport'

defineOptions({
  // `$attrs` are merged under the viewport bindings so consumer listeners chain with them.
  inheritAttrs: false,
})

withDefaults(defineProps<CarouselViewportProps>(), { as: 'div' })

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectCarouselRootContext()

watch(currentElement, (el) => {
  rootContext.viewportElement.value = el ?? undefined
}, { immediate: true })

// Measuring, scroll sync, drag, wheel, keys, loop, auto height and auto scroll.
const viewport = useCarouselViewport(rootContext, currentElement)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="mergeProps($attrs, viewport.attrs.value)"
    :data-orientation="rootContext.orientation.value"
    :data-dragging="rootContext.dragging.value ? '' : undefined"
  >
    <slot />
  </component>
</template>
