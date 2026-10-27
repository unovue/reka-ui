<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ColorSliderTrackProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { SliderTrack } from '@/Slider'
import { injectColorSliderRootContext } from './ColorSliderRoot.vue'
import { getColorSliderTrackSurface } from './useColorSlider'

const props = withDefaults(defineProps<ColorSliderTrackProps>(), {
  as: 'span',
})

const rootContext = injectColorSliderRootContext()
const track = getColorSliderTrackSurface(rootContext)
</script>

<template>
  <SliderTrack
    :as="as"
    :as-child="asChild"
    v-bind="track.attrs.value"
  >
    <slot />
  </SliderTrack>
</template>
