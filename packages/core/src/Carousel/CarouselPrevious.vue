<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CarouselPreviousProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectCarouselRootContext } from './CarouselRoot.vue'
import { getCarouselNavigationSurface } from './useCarousel'

withDefaults(defineProps<CarouselPreviousProps>(), { as: 'button' })

const { forwardRef } = useForwardExpose()
const rootContext = injectCarouselRootContext()

// aria-label, aria-controls, disabled at an end and the click handler come from the shared surface builder.
const surface = getCarouselNavigationSurface(rootContext, 'previous')
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot />
  </Primitive>
</template>
