<script setup lang="ts">
import SliderImpl from './SliderImpl.vue'
import { computed, ref, toRefs } from 'vue'
import type { SliderOrientationPrivateEmits, SliderOrientationPrivateProps } from './utils'
import { BACK_KEYS, linearScale, provideSliderOrientationContext } from './utils'
import { useForwardExpose } from '@/shared'
import { injectSliderRootContext } from './SliderRoot.vue'

interface SliderVerticalProps extends SliderOrientationPrivateProps {}
const props = defineProps<SliderVerticalProps>()
const emits = defineEmits<SliderOrientationPrivateEmits>()
const { max, min, inverted } = toRefs(props)

const rootContext = injectSliderRootContext()
const { forwardRef, currentElement: sliderElement } = useForwardExpose()

const offsetPosition = ref<number>()
const rectRef = ref<ClientRect>()
const isSlidingFromBottom = computed(() => !inverted.value)

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

provideSliderOrientationContext({
  startEdge: isSlidingFromBottom.value ? 'bottom' : 'top',
  endEdge: isSlidingFromBottom.value ? 'top' : 'bottom',
  size: 'height',
  direction: isSlidingFromBottom.value ? 1 : -1,
})
</script>

<template>
  <SliderImpl
    :ref="forwardRef"
    data-orientation="vertical"
    :style="{
      ['--reka-slider-thumb-transform' as any]:
        !isSlidingFromBottom && rootContext.thumbAlignment.value === 'overflow' ? 'translateY(-50%)' : 'translateY(50%)',
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
      const slideDirection = isSlidingFromBottom ? 'from-bottom' : 'from-top';
      const isBackKey = BACK_KEYS[slideDirection].includes(event.key);
      emits('stepKeyDown', event, isBackKey ? -1 : 1)
    }"
    @end-key-down="emits('endKeyDown', $event)"
    @home-key-down="emits('homeKeyDown', $event)"
  >
    <slot />
  </SliderImpl>
</template>
