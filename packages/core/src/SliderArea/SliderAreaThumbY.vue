<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SliderAreaThumbYProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectSliderAreaRootContext } from './SliderAreaRoot.vue'
import { injectSliderAreaThumbContext } from './utils'

const props = withDefaults(defineProps<SliderAreaThumbYProps>(), {
  as: 'span',
})

const rootContext = injectSliderAreaRootContext()
const thumbContext = injectSliderAreaThumbContext()
const { forwardRef, currentElement: thumbElement } = useForwardExpose()

const value = computed(() => rootContext.modelValue?.value?.[thumbContext.index.value])

onMounted(() => {
  if (thumbElement.value)
    rootContext.thumbYElements.value.push(thumbElement.value)
})
onUnmounted(() => {
  const i = rootContext.thumbYElements.value.findIndex(el => el === thumbElement.value)
  if (i >= 0)
    rootContext.thumbYElements.value.splice(i, 1)
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    role="slider"
    :tabindex="rootContext.disabled.value ? undefined : (rootContext.activeDirection.value === 'y' ? 0 : -1)"
    :data-disabled="rootContext.disabled.value ? '' : undefined"
    aria-orientation="vertical"
    :aria-valuenow="value ? value[1] : undefined"
    :aria-valuemin="rootContext.minY.value"
    :aria-valuemax="rootContext.maxY.value"
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
      rootContext.activeDirection.value = 'y'
    }"
  >
    <slot />
  </Primitive>
</template>
