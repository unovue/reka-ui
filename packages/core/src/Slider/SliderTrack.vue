<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface SliderTrackProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { injectSliderRootContext } from './SliderRoot.vue'
import { getSliderTrackSurface } from './useSlider'

withDefaults(defineProps<SliderTrackProps>(), { as: 'span' })

const rootContext = injectSliderRootContext()
// Same derivation as `useSlider().track`.
const track = getSliderTrackSurface(rootContext)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="track.attrs.value"
  >
    <slot />
  </component>
</template>
