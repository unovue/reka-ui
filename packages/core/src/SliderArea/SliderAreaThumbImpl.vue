<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SliderAreaThumbImplProps extends PrimitiveProps {
  index: number
}
</script>

<script setup lang="ts">
import { useMounted } from '@vueuse/core'
import { computed, onMounted, onUnmounted } from 'vue'
import { useCollection } from '@/Collection'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { convertValueToPercentage, getLabel } from '../Slider/utils'
import { injectSliderAreaRootContext } from './SliderAreaRoot.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<SliderAreaThumbImplProps>()

const rootContext = injectSliderAreaRootContext()

const { forwardRef, currentElement: thumbElement } = useForwardExpose()
const { CollectionItem } = useCollection()

const value = computed(() => rootContext.modelValue?.value?.[props.index])
const percentX = computed(() => value.value === undefined ? 0 : convertValueToPercentage(value.value.x, rootContext.minX.value ?? 0, rootContext.maxX.value ?? 100))
const percentY = computed(() => value.value === undefined ? 0 : convertValueToPercentage(value.value.y, rootContext.minY.value ?? 0, rootContext.maxY.value ?? 100))
const label = computed(() => getLabel(props.index, rootContext.modelValue?.value?.length ?? 0))

const isMounted = useMounted()
onMounted(() => {
  rootContext.thumbElements.value.push(thumbElement.value)
})
onUnmounted(() => {
  const i = rootContext.thumbElements.value.findIndex(i => i === thumbElement.value) ?? -1
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
      :data-disabled="rootContext.disabled.value ? '' : undefined"
      aria-roledescription="2D slider"
      :aria-valuenow="value ? `${value.x},${value.y}` : undefined"
      :aria-valuetext="value ? `X: ${value.x}, Y: ${value.y}` : undefined"
      :as-child="asChild"
      :as="as"
      :style="{
        transform: 'var(--reka-slider-area-thumb-transform)',
        position: 'absolute',
        [rootContext.isSlidingFromLeft.value ? 'left' : 'right']: `${percentX}%`,
        [rootContext.isSlidingFromTop.value ? 'top' : 'bottom']: `${percentY}%`,
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
