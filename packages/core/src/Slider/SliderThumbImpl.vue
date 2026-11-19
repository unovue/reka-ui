<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SliderThumbImplProps extends PrimitiveProps {
  index: number
}
</script>

<script setup lang="ts">
import { useMounted } from '@vueuse/core'
import { computed, onMounted, onUnmounted } from 'vue'
import { useCollection } from '@/Collection'
import { Primitive } from '@/Primitive'
import { useForwardExpose, useSize } from '@/shared'
import { injectSliderRootContext } from './SliderRoot.vue'
import { convertValueToPercentage, getLabel, getThumbInBoundsOffset, injectSliderOrientationContext } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<SliderThumbImplProps>()

const rootContext = injectSliderRootContext()
const orientation = injectSliderOrientationContext()

const { forwardRef, currentElement: thumbElement } = useForwardExpose()
const { CollectionItem } = useCollection()

const value = computed(() => rootContext.modelValue?.value?.[props.index])
const percent = computed(() => value.value === undefined ? 0 : convertValueToPercentage(value.value, rootContext.min.value ?? 0, rootContext.max.value ?? 100))
const label = computed(() => getLabel(props.index, rootContext.modelValue?.value?.length ?? 0))
const size = useSize(thumbElement)
const orientationSize = computed(() => size[orientation!.size].value)
const thumbInBoundsOffset = computed(() => {
  if (rootContext.thumbAlignment.value === 'overflow' || !orientationSize.value) {
    return 0
  }
  else {
    return getThumbInBoundsOffset(orientationSize.value, percent.value, orientation!.direction.value)
  }
})

const isMounted = useMounted()
// Keep the mounted element: the template ref is already null by the time `onUnmounted` runs.
let mountedThumb: HTMLElement | undefined
onMounted(() => {
  mountedThumb = thumbElement.value
  const thumbs = rootContext.thumbElements.value
  // Insert in DOM order: thumb indexes come from the collection, so a reinserted thumb must not land at the end.
  const next = thumbs.findIndex(thumb => mountedThumb!.compareDocumentPosition(thumb) & Node.DOCUMENT_POSITION_FOLLOWING)
  thumbs.splice(next === -1 ? thumbs.length : next, 0, mountedThumb)
})
onUnmounted(() => {
  const thumbs = rootContext.thumbElements.value
  const i = thumbs.indexOf(mountedThumb!)
  mountedThumb = undefined
  if (i === -1)
    return
  thumbs.splice(i, 1)
  // Keep the active index pointing at the same thumb, or at a thumb that still exists.
  const active = rootContext.valueIndexToChangeRef
  if (i < active.value)
    active.value--
  active.value = Math.min(active.value, Math.max(thumbs.length - 1, 0))
})
</script>

<template>
  <CollectionItem>
    <Primitive
      v-bind="$attrs"
      :ref="forwardRef"
      role="slider"
      :tabindex="rootContext.disabled.value ? undefined : 0"
      :aria-label="$attrs['aria-label'] || label"
      :data-disabled="rootContext.disabled.value ? '' : undefined"
      :data-orientation="rootContext.orientation.value"
      :aria-valuenow="value"
      :aria-valuemin="rootContext.min.value"
      :aria-valuemax="rootContext.max.value"
      :aria-orientation="rootContext.orientation.value"
      :as-child="asChild"
      :as="as"
      :style="{
        transform: 'var(--reka-slider-thumb-transform)',
        position: 'absolute',
        [orientation!.startEdge.value]: `calc(${percent}% + ${thumbInBoundsOffset}px)`,
        /**
         * There will be no value on initial render while we work out the index so we hide thumbs
         * without a value, otherwise SSR will render them in the wrong position before they
         * snap into the correct position during hydration which would be visually jarring for
         * slower connections.
         */
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
