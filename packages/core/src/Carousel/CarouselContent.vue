<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CarouselContentProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectCarouselRootContext } from './CarouselRoot.vue'
import { getCarouselContentSurface } from './useCarousel'

withDefaults(defineProps<CarouselContentProps>(), { as: 'div' })

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectCarouselRootContext()

watch(currentElement, (el) => {
  rootContext.contentElement.value = el ?? undefined
}, { immediate: true })

// id, the live region and the track layout come from the shared surface builder.
const surface = getCarouselContentSurface(rootContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="surface.attrs.value"
  >
    <slot />
  </Primitive>
</template>
