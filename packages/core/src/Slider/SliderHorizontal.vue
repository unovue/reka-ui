<script setup lang="ts">
import SliderImpl from './SliderImpl.vue'
import { computed, ref, toRefs } from 'vue'
import type { Direction, SliderOrientationPrivateEmits, SliderOrientationPrivateProps } from './utils'
import { BACK_KEYS, linearScale, provideSliderOrientationContext } from './utils'
import { useForwardExpose } from '@/shared'
import { injectSliderRootContext } from './SliderRoot.vue'

interface SliderHorizontalProps extends SliderOrientationPrivateProps {
  dir?: Direction
}

const props = defineProps<SliderHorizontalProps>()
const emits = defineEmits<SliderOrientationPrivateEmits>()
const { max, min, dir, inverted } = toRefs(props)

const { forwardRef, currentElement: sliderElement } = useForwardExpose()
const rootContext = injectSliderRootContext()

const offsetPosition = ref<number>()
const rectRef = ref<ClientRect>()
const isSlidingFromLeft = computed(() => (dir?.value === 'ltr' && !inverted.value) || (dir?.value !== 'ltr' && inverted.value))

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

provideSliderOrientationContext({
  startEdge: isSlidingFromLeft.value ? 'left' : 'right',
  endEdge: isSlidingFromLeft.value ? 'right' : 'left',
  direction: isSlidingFromLeft.value ? 1 : -1,
  size: 'width',
})
</script>

<template>
  <SliderImpl
    :ref="forwardRef"
    :dir="dir"
    data-orientation="horizontal"
    :style="{
      ['--reka-slider-thumb-transform' as any]:
        !isSlidingFromLeft && rootContext.thumbAlignment.value === 'overflow' ? 'translateX(50%)' : 'translateX(-50%)',
    }"
    @slide-start="(event) => {
      const value = getValueFromPointerEvent(event, true);
      emits('slideStart', value)
    }"
    @slide-move="(event) => {
      const value = getValueFromPointerEvent(event);
      emits('slideMove', value)
    }"
    @slide-end="() => {
      rectRef = undefined;
      offsetPosition = undefined
      emits('slideEnd')
    }"
    @step-key-down="(event) => {
      const slideDirection = isSlidingFromLeft ? 'from-left' : 'from-right';
      const isBackKey = BACK_KEYS[slideDirection].includes(event.key);
      emits('stepKeyDown', event, isBackKey ? -1 : 1)
    }"
    @end-key-down="emits('endKeyDown', $event)"
    @home-key-down="emits('homeKeyDown', $event)"
  >
    <slot />
  </SliderImpl>
</template>
