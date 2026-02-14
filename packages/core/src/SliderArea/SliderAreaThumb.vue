<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SliderAreaThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { useMounted } from '@vueuse/core'
import { computed } from 'vue'
import { useCollection } from '@/Collection'
import { Primitive } from '@/Primitive'
import { useForwardExpose, useSize } from '@/shared'
import { convertValueToPercentage, getLabel, getThumbInBoundsOffset } from '../Slider/utils'
import { injectSliderAreaRootContext } from './SliderAreaRoot.vue'
import { provideSliderAreaThumbContext } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SliderAreaThumbProps>(), {
  as: 'span',
})

const rootContext = injectSliderAreaRootContext()
const { forwardRef, currentElement: groupElement } = useForwardExpose()
const { CollectionItem, getItems } = useCollection()

const index = computed(() => groupElement.value ? getItems(true).findIndex(i => i.ref === groupElement.value) : -1)

const value = computed(() => rootContext.modelValue?.value?.[index.value])
const percentX = computed(() => value.value === undefined ? 0 : convertValueToPercentage(value.value[0], rootContext.minX.value ?? 0, rootContext.maxX.value ?? 100))
const percentY = computed(() => value.value === undefined ? 0 : convertValueToPercentage(value.value[1], rootContext.minY.value ?? 0, rootContext.maxY.value ?? 100))
const label = computed(() => getLabel(index.value, rootContext.modelValue?.value?.length ?? 0))

const size = useSize(groupElement)
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

provideSliderAreaThumbContext({
  index,
})
</script>

<template>
  <CollectionItem>
    <Primitive
      v-bind="$attrs"
      :ref="forwardRef"
      :aria-label="($attrs['aria-label'] as string) || label"
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
    >
      <slot />
    </Primitive>
  </CollectionItem>
</template>
