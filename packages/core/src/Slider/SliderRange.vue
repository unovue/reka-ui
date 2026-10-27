<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface SliderRangeProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectSliderRootContext } from './SliderRoot.vue'
import { getSliderRangeSurface } from './useSlider'
import { injectSliderOrientationContext } from './utils'

withDefaults(defineProps<SliderRangeProps>(), { as: 'span' })
const rootContext = injectSliderRootContext()
const orientation = injectSliderOrientationContext()
// Same derivation as `useSlider().range`.
const range = getSliderRangeSurface(rootContext, orientation)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
    v-bind="range.attrs.value"
  >
    <slot />
  </Primitive>
</template>
