<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CarouselIndicatorProps extends PrimitiveProps {
  /** The index of the snap this indicator goes to. */
  index: number
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectCarouselRootContext } from './CarouselRoot.vue'
import { getCarouselIndicatorSurface } from './useCarousel'

const props = withDefaults(defineProps<CarouselIndicatorProps>(), { as: 'button' })

defineSlots<{
  default?: (props: {
    /** Whether this indicator's snap is the current one */
    active: boolean
  }) => any
}>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectCarouselRootContext()

// aria-label, aria-disabled on the current snap, data-active and the click handler.
const surface = getCarouselIndicatorSurface(rootContext, () => props.index)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot :active="surface.state.value.active" />
  </component>
</template>
