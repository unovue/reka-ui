<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SliderThumbImplProps extends PrimitiveProps {
  index: number
}
</script>

<script setup lang="ts">
import { useMounted } from '@vueuse/core'
import { mergeProps, onMounted, onUnmounted } from 'vue'
import { useCollection } from '@/Collection'
import { Primitive } from '@/Primitive'
import { useForwardElement, useSize } from '@/shared'
import { injectSliderRootContext } from './SliderRoot.vue'
import { getSliderThumbSurface } from './useSlider'
import { injectSliderOrientationContext } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<SliderThumbImplProps>()

const rootContext = injectSliderRootContext()
const orientation = injectSliderOrientationContext()

const { forwardRef, currentElement: thumbElement, expose } = useForwardElement()
defineExpose(expose)
const { CollectionItem } = useCollection()

const size = useSize(thumbElement)
const isMounted = useMounted()
// Same derivation as `useSlider().getThumbSurface` — one source for the thumb's aria, position and `data-*`.
const thumb = getSliderThumbSurface(rootContext, orientation, {
  index: () => props.index,
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
// Template binding keeps the v2 order: consumer attributes first, so the thumb's
// own attributes win and a consumer `@focus` runs before the thumb's; a consumer
// `aria-label` wins over the generated one. `$attrs` is read in the template
// (not a computed) so attribute changes re-render.
</script>

<template>
  <CollectionItem>
    <Primitive
      v-bind="mergeProps($attrs, thumb.attrs.value)"
      :ref="forwardRef"
      :aria-label="$attrs['aria-label'] || thumb.props.value['aria-label']"
      :as-child="asChild"
      :as="as"
    >
      <slot />
    </Primitive>
  </CollectionItem>
</template>
