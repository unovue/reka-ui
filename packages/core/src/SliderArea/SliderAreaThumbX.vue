<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SliderAreaThumbXProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectSliderAreaRootContext } from './SliderAreaRoot.vue'
import { injectSliderAreaThumbContext } from './utils'

const props = withDefaults(defineProps<SliderAreaThumbXProps>(), {
  as: 'span',
})

const rootContext = injectSliderAreaRootContext()
const thumbContext = injectSliderAreaThumbContext()
const { forwardRef, currentElement: thumbElement } = useForwardExpose()

const value = computed(() => rootContext.modelValue?.value?.[thumbContext.index.value])

onMounted(() => {
  if (thumbElement.value)
    rootContext.thumbXElements.value.push(thumbElement.value)
})
onUnmounted(() => {
  const i = rootContext.thumbXElements.value.findIndex(el => el === thumbElement.value)
  if (i >= 0)
    rootContext.thumbXElements.value.splice(i, 1)
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    role="slider"
    :tabindex="rootContext.disabled.value ? undefined : (rootContext.activeDirection.value === 'x' ? 0 : -1)"
    :data-disabled="rootContext.disabled.value ? '' : undefined"
    aria-orientation="horizontal"
    :aria-valuenow="value ? value[0] : undefined"
    :aria-valuemin="rootContext.minX.value"
    :aria-valuemax="rootContext.maxX.value"
    :as-child="asChild"
    :as="as"
    :style="{
      position: 'absolute',
      display: 'block',
      width: '100%',
      height: '100%',
    }"
    @focus="() => {
      rootContext.valueIndexToChangeRef.value = thumbContext.index.value
      rootContext.activeDirection.value = 'x'
    }"
  >
    <slot />
  </Primitive>
</template>
