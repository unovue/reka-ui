<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CarouselContentProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { watch } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectCarouselRootContext } from './CarouselRoot.vue'
import { getCarouselContentSurface } from './useCarousel'

withDefaults(defineProps<CarouselContentProps>(), { as: 'div' })

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectCarouselRootContext()

watch(currentElement, (el) => {
  rootContext.contentElement.value = el ?? undefined
}, { immediate: true })

// id, the live region and the track layout come from the shared surface builder.
const surface = getCarouselContentSurface(rootContext)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="surface.attrs.value"
  >
    <slot />
  </component>
</template>
