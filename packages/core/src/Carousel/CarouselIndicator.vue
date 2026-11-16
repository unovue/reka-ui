<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CarouselIndicatorProps extends PrimitiveProps {
  /** The index of the snap this indicator goes to. */
  index: number
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectCarouselIndicatorGroupContext } from './CarouselIndicatorGroup.vue'
import { injectCarouselRootContext } from './CarouselRoot.vue'
import { getCarouselIndicatorSurface } from './useCarousel'

const props = withDefaults(defineProps<CarouselIndicatorProps>(), { as: 'button' })

defineSlots<{
  default?: (props: {
    /** Whether this indicator's snap is the current one */
    active: boolean
  }) => any
}>()

const { forwardRef } = useForwardExpose()
const rootContext = injectCarouselRootContext()
// In a `CarouselIndicatorGroup`, a tab of its tablist; on its own, a plain button.
const tabs = !!injectCarouselIndicatorGroupContext(null)

// aria-label, the current snap's state, data-active and the click handler.
const surface = getCarouselIndicatorSurface(rootContext, () => props.index, tabs)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot :active="surface.state.value.active" />
  </Primitive>
</template>
