<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface SliderAreaRegionProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { convertValueToPercentage } from '../Slider/utils'
import { injectSliderAreaRootContext } from './SliderAreaRoot.vue'

withDefaults(defineProps<SliderAreaRegionProps>(), { as: 'span' })
const rootContext = injectSliderAreaRootContext()

useForwardExpose()

const percentagesX = computed(() => rootContext.currentModelValue.value.map(v =>
  convertValueToPercentage(v.x, rootContext.minX.value, rootContext.maxX.value),
))

const percentagesY = computed(() => rootContext.currentModelValue.value.map(v =>
  convertValueToPercentage(v.y, rootContext.minY.value, rootContext.maxY.value),
))

const regionBounds = computed(() => {
  const pctX = percentagesX.value
  const pctY = percentagesY.value

  if (pctX.length === 0)
    return { startX: 0, startY: 0, endX: 0, endY: 0 }

  // Single thumb: region from top-left (0,0) to thumb
  if (pctX.length === 1)
    return { startX: 0, startY: 0, endX: pctX[0], endY: pctY[0] }

  // Multiple thumbs: region spans from min to max across all thumbs
  return {
    startX: Math.min(...pctX),
    startY: Math.min(...pctY),
    endX: Math.max(...pctX),
    endY: Math.max(...pctY),
  }
})

const startEdgeX = computed(() => rootContext.isSlidingFromLeft.value ? 'left' : 'right')
const endEdgeX = computed(() => rootContext.isSlidingFromLeft.value ? 'right' : 'left')
const startEdgeY = computed(() => rootContext.isSlidingFromTop.value ? 'top' : 'bottom')
const endEdgeY = computed(() => rootContext.isSlidingFromTop.value ? 'bottom' : 'top')
</script>

<template>
  <Primitive
    :data-disabled="rootContext.disabled.value ? '' : undefined"
    :as-child="asChild"
    :as="as"
    :style="{
      position: 'absolute',
      [startEdgeX]: `${regionBounds.startX}%`,
      [endEdgeX]: `${100 - regionBounds.endX}%`,
      [startEdgeY]: `${regionBounds.startY}%`,
      [endEdgeY]: `${100 - regionBounds.endY}%`,
    }"
  >
    <slot />
  </Primitive>
</template>
