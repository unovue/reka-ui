<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ColorSliderThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'
import { SliderThumb } from '@/Slider'
import { injectColorSliderRootContext } from './ColorSliderRoot.vue'
import { getColorSliderThumbSurface } from './useColorSlider'

const props = withDefaults(defineProps<ColorSliderThumbProps>(), {
  as: 'span',
})

defineSlots<{
  default?: (props: {
    /** The display name of the current channel */
    channelName: string
    /** The current numeric value of the channel */
    channelValue: number
  }) => any
}>()

const rootContext = injectColorSliderRootContext()
const thumb = getColorSliderThumbSurface(rootContext)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <SliderThumb
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="thumb.attrs.value"
  >
    <slot
      :channel-name="thumb.props.value['aria-label']"
      :channel-value="rootContext.channelValue.value"
    />
  </SliderThumb>
</template>
