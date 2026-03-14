<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SliderAreaThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { useMounted } from '@vueuse/core'
import { computed, onMounted, onUnmounted } from 'vue'
import { useCollection } from '@/Collection'
import { Primitive } from '@/Primitive'
import { useForwardExpose, useSize } from '@/shared'
import { convertValueToPercentage, getLabel, getThumbInBoundsOffset } from '../Slider/utils'
import { injectSliderAreaRootContext } from './SliderAreaRoot.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SliderAreaThumbProps>(), {
  as: 'div',
})

const rootContext = injectSliderAreaRootContext()
const { forwardRef, currentElement } = useForwardExpose()
const { CollectionItem, getItems } = useCollection()

const index = computed(() => currentElement.value ? getItems(true).findIndex(i => i.ref === currentElement.value) : -1)

const value = computed(() => rootContext.modelValue?.value?.[index.value])
const percentX = computed(() => value.value === undefined ? 0 : convertValueToPercentage(value.value[0], rootContext.minX.value ?? 0, rootContext.maxX.value ?? 100))
const percentY = computed(() => value.value === undefined ? 0 : convertValueToPercentage(value.value[1], rootContext.minY.value ?? 0, rootContext.maxY.value ?? 100))
const label = computed(() => getLabel(index.value, rootContext.modelValue?.value?.length ?? 0))

const size = useSize(currentElement)
const thumbInBoundsOffsetX = computed(() => {
  if (rootContext.thumbAlignment.value === 'overflow' || !size.width.value)
    return 0
  return getThumbInBoundsOffset(size.width.value, percentX.value, rootContext.isSlidingFromLeft.value ? 1 : -1)
})
const thumbInBoundsOffsetY = computed(() => {
  if (rootContext.thumbAlignment.value === 'overflow' || !size.height.value)
    return 0
  return getThumbInBoundsOffset(size.height.value, percentY.value, rootContext.isSlidingFromTop.value ? 1 : -1)
})

const isMounted = useMounted()

onMounted(() => {
  if (currentElement.value)
    rootContext.thumbElements.value.push(currentElement.value)
})
onUnmounted(() => {
  const i = rootContext.thumbElements.value.findIndex(el => el === currentElement.value)
  if (i >= 0)
    rootContext.thumbElements.value.splice(i, 1)
})
</script>

<template>
  <CollectionItem>
    <Primitive
      v-bind="$attrs"
      :ref="forwardRef"
      role="slider"
      :tabindex="rootContext.disabled.value ? undefined : 0"
      :aria-label="($attrs['aria-label'] as string) || label"
      :aria-valuenow="value ? value[0] : undefined"
      :aria-valuetext="value ? `${value[0]}, ${value[1]}` : undefined"
      :aria-valuemin="rootContext.minX.value"
      :aria-valuemax="rootContext.maxX.value"
      :data-disabled="rootContext.disabled.value ? '' : undefined"
      aria-roledescription="2D slider"
      :as-child="asChild"
      :as="as"
      :style="{
        transform: 'var(--reka-slider-area-thumb-transform)',
        position: 'absolute',
        [rootContext.isSlidingFromLeft.value ? 'left' : 'right']: `calc(${percentX}% + ${thumbInBoundsOffsetX}px)`,
        [rootContext.isSlidingFromTop.value ? 'top' : 'bottom']: `calc(${percentY}% + ${thumbInBoundsOffsetY}px)`,
        display: !isMounted && value === undefined ? 'none' : undefined,
      }"
      @focus="() => {
        rootContext.valueIndexToChangeRef.value = index
      }"
    >
      <slot />
    </Primitive>
  </CollectionItem>
</template>
