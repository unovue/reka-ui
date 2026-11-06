<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CarouselNextProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectCarouselRootContext } from './CarouselRoot.vue'
import { getCarouselNavigationSurface } from './useCarousel'

withDefaults(defineProps<CarouselNextProps>(), { as: 'button' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectCarouselRootContext()

// aria-label, aria-controls, disabled at an end and the click handler come from the shared surface builder.
const surface = getCarouselNavigationSurface(rootContext, 'next')
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot />
  </component>
</template>
