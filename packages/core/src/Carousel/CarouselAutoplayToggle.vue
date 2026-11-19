<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CarouselAutoplayToggleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectCarouselRootContext } from './CarouselRoot.vue'
import { getCarouselAutoplayToggleSurface } from './useCarousel'

withDefaults(defineProps<CarouselAutoplayToggleProps>(), { as: 'button' })

defineSlots<{
  default?: (props: {
    /** Whether `autoplay` or `autoScroll` is rotating */
    playing: boolean
  }) => any
}>()

const { forwardRef } = useForwardExpose()
const rootContext = injectCarouselRootContext()

// APG rotation control: its label names the action it takes next, so it has no pressed state.
const surface = getCarouselAutoplayToggleSurface(rootContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot :playing="surface.state.value.state === 'playing'" />
  </Primitive>
</template>
