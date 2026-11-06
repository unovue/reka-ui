<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CarouselAutoplayToggleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectCarouselRootContext } from './CarouselRoot.vue'
import { getCarouselAutoplayToggleSurface } from './useCarousel'

withDefaults(defineProps<CarouselAutoplayToggleProps>(), { as: 'button' })

defineSlots<{
  default?: (props: {
    /** Whether `autoplay` or `autoScroll` is rotating */
    playing: boolean
  }) => any
}>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectCarouselRootContext()

// APG rotation control: its label names the action it takes next, so it has no pressed state.
const surface = getCarouselAutoplayToggleSurface(rootContext)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot :playing="surface.state.value.state === 'playing'" />
  </component>
</template>
