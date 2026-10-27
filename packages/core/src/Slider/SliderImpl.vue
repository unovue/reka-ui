<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export type SliderImplEmits = {
  slideStart: [event: PointerEvent]
  slideMove: [event: PointerEvent]
  slideEnd: [event: PointerEvent]
}

export interface SliderImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
// Pointer → slide events only. Keyboard handling is `useSlider()`'s root
// surface `onKeydown`, which SliderRoot binds onto this same element.
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectSliderRootContext } from './SliderRoot.vue'

const props = withDefaults(defineProps<SliderImplProps>(), {
  as: 'span',
})
const emits = defineEmits<SliderImplEmits>()
const rootContext = injectSliderRootContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    data-slider-impl
    v-bind="props"
    @pointerdown="(event: PointerEvent) => {
      const target = event.target as HTMLElement;
      target.setPointerCapture(event.pointerId);
      // Prevent browser focus behaviour because we focus a thumb manually when values change.
      event.preventDefault();
      // Touch devices have a delay before focusing so won't focus if touch immediately moves
      // away from target (sliding). We want thumb to focus regardless.
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
