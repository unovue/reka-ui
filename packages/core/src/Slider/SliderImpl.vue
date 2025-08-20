<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { onBeforeUnmount, shallowRef } from 'vue'

export type SliderImplEmits = {
  slideStart: [event: PointerEvent]
  slideMove: [event: PointerEvent]
  slideEnd: [event: PointerEvent]
  homeKeyDown: [event: KeyboardEvent]
  endKeyDown: [event: KeyboardEvent]
  stepKeyDown: [event: KeyboardEvent]
}

export interface SliderImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { getHTMLElement } from '@/shared/elementUtils'
import { injectSliderRootContext } from './SliderRoot.vue'
import { ARROW_KEYS, PAGE_KEYS } from './utils'

const props = withDefaults(defineProps<SliderImplProps>(), {
  as: 'span',
})
const emits = defineEmits<SliderImplEmits>()
const rootContext = injectSliderRootContext()
const targetCaptureEl = shallowRef<HTMLElement>()

onBeforeUnmount(() => targetCaptureEl.value = undefined)
</script>

<template>
  <Primitive
    data-slider-impl
    v-bind="props"
    @keydown="(event: KeyboardEvent) => {
      if (event.key === 'Home') {
        emits('homeKeyDown', event)
        // Prevent scrolling to page start
        event.preventDefault();
      }
      else if (event.key === 'End') {
        emits('endKeyDown', event)
        // Prevent scrolling to page end
        event.preventDefault();
      }
      else if (PAGE_KEYS.concat(ARROW_KEYS).includes(event.key)) {
        emits('stepKeyDown', event)
        // Prevent scrolling for directional key presses
        event.preventDefault();
      }
    }"
    @pointerdown="(event: PointerEvent) => {
      targetCaptureEl = getHTMLElement(event.target)
      targetCaptureEl?.setPointerCapture(event.pointerId);
      // Prevent browser focus behaviour because we focus a thumb manually when values change.
      event.preventDefault();
      // Touch devices have a delay before focusing so won't focus if touch immediately moves
      // away from target (sliding). We want thumb to focus regardless.
      if (targetCaptureEl && rootContext.thumbElements.value.includes(targetCaptureEl)) {
        targetCaptureEl.focus();
      }
      else {
        emits('slideStart', event)
      }
    }"
    @pointermove="(event: PointerEvent) => {
      if (targetCaptureEl?.hasPointerCapture(event.pointerId)) emits('slideMove', event);
    }"
    @pointerup="(event: PointerEvent) => {
      if (targetCaptureEl?.hasPointerCapture(event.pointerId)) {
        targetCaptureEl.releasePointerCapture(event.pointerId);
        emits('slideEnd', event)
      }
      targetCaptureEl = undefined
    }"
  >
    <slot />
  </Primitive>
</template>
