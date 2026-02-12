<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export type SliderAreaImplEmits = {
  slideStart: [event: PointerEvent]
  slideMove: [event: PointerEvent]
  slideEnd: [event: PointerEvent]
  homeKeyDown: [event: KeyboardEvent]
  endKeyDown: [event: KeyboardEvent]
  stepKeyDown: [event: KeyboardEvent]
}

export interface SliderAreaImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { ARROW_KEYS, PAGE_KEYS } from '../Slider/utils'
import { injectSliderAreaRootContext } from './SliderAreaRoot.vue'

const props = withDefaults(defineProps<SliderAreaImplProps>(), {
  as: 'span',
})
const emits = defineEmits<SliderAreaImplEmits>()
const rootContext = injectSliderAreaRootContext()
</script>

<template>
  <Primitive
    data-slider-area-impl
    v-bind="props"
    @keydown="(event: KeyboardEvent) => {
      if (event.key === 'Home') {
        emits('homeKeyDown', event)
        event.preventDefault();
      }
      else if (event.key === 'End') {
        emits('endKeyDown', event)
        event.preventDefault();
      }
      else if (PAGE_KEYS.concat(ARROW_KEYS).includes(event.key)) {
        emits('stepKeyDown', event)
        event.preventDefault();
      }
    }"
    @pointerdown="(event: PointerEvent) => {
      const target = event.target as HTMLElement;
      target.setPointerCapture(event.pointerId);
      event.preventDefault();
      if (rootContext.thumbElements.value.includes(target)) {
        target.focus();
      }
      else {
        emits('slideStart', event)
      }
    }"
    @pointermove="(event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.hasPointerCapture(event.pointerId)) emits('slideMove', event);
    }"
    @pointerup="(event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.hasPointerCapture(event.pointerId)) {
        target.releasePointerCapture(event.pointerId);
        emits('slideEnd', event)
      }
    }"
  >
    <slot />
  </Primitive>
</template>
