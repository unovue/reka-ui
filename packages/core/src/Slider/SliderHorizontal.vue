<script setup lang="ts">
import type { Direction, SliderOrientationPrivateEmits, SliderOrientationPrivateProps } from './utils'
import { computed, ref, toRef } from 'vue'
import { useForwardElement } from '@/shared'
import SliderImpl from './SliderImpl.vue'
import { injectSliderRootContext } from './SliderRoot.vue'
import { injectSliderOrientationContext, linearScale } from './utils'

interface SliderHorizontalProps extends SliderOrientationPrivateProps {
  dir?: Direction
}

const props = defineProps<SliderHorizontalProps>()
const emits = defineEmits<SliderOrientationPrivateEmits>()
const max = toRef(props, 'max')
const min = toRef(props, 'min')
const dir = toRef(props, 'dir')

const { forwardRef, currentElement: sliderElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectSliderRootContext()
// Provided by SliderRoot from `useSlider()`: the one orientation geometry derivation.
const orientation = injectSliderOrientationContext()

const offsetPosition = ref<number>()
const rectRef = ref<DOMRect>()
const isSlidingFromLeft = computed(() => orientation.direction.value === 1)

function getValueFromPointerEvent(event: PointerEvent, slideStart?: boolean) {
  const rect = rectRef.value || sliderElement.value!.getBoundingClientRect()

  // Get the currently active thumb element
  const thumb = [...rootContext.thumbElements.value][rootContext.valueIndexToChangeRef.value]
  const thumbWidth = rootContext.thumbAlignment.value === 'contain' ? thumb.clientWidth : 0

  // Calculate offset for dragging, but only when needed
  if (!offsetPosition.value && !slideStart && rootContext.thumbAlignment.value === 'contain') {
    offsetPosition.value = event.clientX - thumb.getBoundingClientRect().left
  }

  // Define the input range (slider track width minus thumb width)
  const input: [number, number] = [0, rect.width - thumbWidth]
  const output: [number, number] = isSlidingFromLeft.value ? [min.value, max.value] : [max.value, min.value]
  const value = linearScale(input, output)

  rectRef.value = rect
  const position = slideStart
    ? event.clientX - rect.left - thumbWidth / 2
    : event.clientX - rect.left - (offsetPosition.value ?? 0)

  return value(position)
}
</script>

<template>
  <SliderImpl
    :ref="forwardRef"
    :dir="dir"
    data-orientation="horizontal"
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
