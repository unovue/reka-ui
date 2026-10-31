<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SliderThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { useMounted } from '@vueuse/core'
import { computed, mergeProps, onBeforeUpdate, onMounted, onUnmounted, shallowRef, useAttrs } from 'vue'
import { useCollection } from '@/Collection'
import { COLLECTION_ITEM_ATTRS, useCollectionItem } from '@/Collection/Collection'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement, useSize } from '@/shared'
import { injectSliderRootContext } from './SliderRoot.vue'
import { getSliderThumbSurface } from './useSlider'
import { injectSliderOrientationContext } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SliderThumbProps>(), {
  as: 'span',
})

const rootContext = injectSliderRootContext()
const orientation = injectSliderOrientationContext()
const { getItems } = useCollection()

const { forwardRef, currentElement: thumbElement, expose } = useForwardElement()
defineExpose(expose)
useCollectionItem(thumbElement)

const position = computed(() => thumbElement.value ? getItems(true).findIndex(i => i.ref === thumbElement.value) : -1)

// An `index` attribute names the thumb's position instead of its place in the
// collection, and stays off the element.
const attrs = useAttrs()
const consumerIndex = shallowRef(attrs.index as number | undefined)
onBeforeUpdate(() => {
  consumerIndex.value = attrs.index as number | undefined
})

const size = useSize(thumbElement)
const isMounted = useMounted()
// Same derivation as `useSlider().getThumbSurface` — one source for the thumb's aria, position and `data-*`.
const thumb = getSliderThumbSurface(rootContext, orientation, {
  index: () => consumerIndex.value ?? position.value,
  size: () => size[orientation.size].value,
  isMounted,
})

onMounted(() => {
  rootContext.thumbElements.value.push(thumbElement.value)
})
onUnmounted(() => {
  const i = rootContext.thumbElements.value.findIndex(i => i === thumbElement.value) ?? -1
  rootContext.thumbElements.value.splice(i, 1)
})

function elementAttrs(consumerAttrs: Record<string, unknown>) {
  const { index: _, ariaLabel, ...rest } = consumerAttrs
  return mergeProps(
    COLLECTION_ITEM_ATTRS,
    rest,
    thumb.attrs.value,
    { 'aria-label': consumerAttrs['aria-label'] || thumb.props.value['aria-label'] },
    // Last: the property sets the same attribute, and a fallthrough attr came after the thumb's.
    ariaLabel === undefined ? {} : { ariaLabel },
  )
}
// Template binding keeps the v2 order: consumer attributes first, so the thumb's
// own attributes win and a consumer `@focus` runs before the thumb's; a consumer
// `aria-label` wins over the generated one. `$attrs` is read in the template
// (not a computed) so attribute changes re-render.
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="elementAttrs($attrs)"
  >
    <slot />
  </component>
</template>
