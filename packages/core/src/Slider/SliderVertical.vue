<script setup lang="ts">
import type { SliderOrientationPrivateEmits, SliderOrientationPrivateProps } from './utils'
import { computed, ref, toRef } from 'vue'
import { useForwardElement } from '@/shared'
import SliderImpl from './SliderImpl.vue'
import { injectSliderRootContext } from './SliderRoot.vue'
import { injectSliderOrientationContext, linearScale } from './utils'

interface SliderVerticalProps extends SliderOrientationPrivateProps {}
const props = defineProps<SliderVerticalProps>()
const emits = defineEmits<SliderOrientationPrivateEmits>()
const max = toRef(props, 'max')
const min = toRef(props, 'min')

const rootContext = injectSliderRootContext()
// Provided by SliderRoot from `useSlider()`: the one orientation geometry derivation.
const orientation = injectSliderOrientationContext()
const { forwardRef, currentElement: sliderElement, expose } = useForwardElement()
defineExpose(expose)

const offsetPosition = ref<number>()
const rectRef = ref<DOMRect>()
const isSlidingFromBottom = computed(() => orientation.direction.value === 1)

function getValueFromPointerEvent(event: PointerEvent, slideStart?: boolean) {
  const rect = rectRef.value || sliderElement.value!.getBoundingClientRect()

  // Get the currently active thumb element
  const thumb = [...rootContext.thumbElements.value][rootContext.valueIndexToChangeRef.value]
  const thumbHeight = rootContext.thumbAlignment.value === 'contain' ? thumb.clientHeight : 0

  // Calculate offset for dragging, but only when needed
  if (!offsetPosition.value && !slideStart && rootContext.thumbAlignment.value === 'contain') {
    offsetPosition.value = event.clientY - thumb.getBoundingClientRect().top
  }

  // Define the input range (slider track width minus thumb width)
  const input: [number, number] = [0, rect.height - thumbHeight]
  const output: [number, number] = isSlidingFromBottom.value ? [max.value, min.value] : [min.value, max.value]
  const value = linearScale(input, output)

  const position = slideStart
    ? event.clientY - rect.top - thumbHeight / 2
    : event.clientY - rect.top - (offsetPosition.value ?? 0)

  rectRef.value = rect
  return value(position)
}
</script>

<template>
  <SliderImpl
    :ref="forwardRef"
    data-orientation="vertical"
    @slide-start="(event) => {
      const value = getValueFromPointerEvent(event, true);
      emits('slideStart', value, event)
    }"
    @slide-move="(event) => {
      const value = getValueFromPointerEvent(event);
      emits('slideMove', value, event)
    }"
    @slide-end="(event) => {
      rectRef = undefined;
      offsetPosition = undefined
      emits('slideEnd', event)
    }"
  >
    <slot />
  </SliderImpl>
</template>
