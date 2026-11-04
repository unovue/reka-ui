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
import { injectSliderFieldContext, injectSliderOrientationContext } from './utils'

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

const field = injectSliderFieldContext(null)

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
  // A camel `ariaLabel` is folded into the one `aria-label` rather than bound as
  // the DOM property, which writes the same attribute: removing it would leave
  // `aria-label=""` behind, as Vue clears the property but not the attribute.
  const { index: _, ariaLabel, ...rest } = consumerAttrs
  const label = consumerAttrs['aria-label'] || ariaLabel || thumb.props.value['aria-label']
  const attrs = mergeProps(
    COLLECTION_ITEM_ATTRS,
    rest,
    thumb.attrs.value,
    { 'aria-label': label },
  )
  return field ? mergeProps(attrs, fieldAttrs(consumerAttrs, label as string | undefined)) : attrs
}

// Inside a Field: the first thumb takes the field's id (others derive theirs
// from it), unless the consumer set one. Every thumb is labelled and
// described by the field; a thumb with an `aria-label` of its own ("Minimum",
// a color channel) also references itself, so its name is the field's label
// followed by its own.
function fieldAttrs(consumerAttrs: Record<string, unknown>, label: string | undefined) {
  // A thumb's place is only known once mounted (`-1` on the server and the
  // first render), so a thumb of a range slider has no derived id until then.
  const index = consumerIndex.value ?? ((rootContext.modelValue?.value?.length ?? 0) > 1 ? position.value : 0)
  const fieldId = field!.context.fieldId.value
  const id = (consumerAttrs.id as string | undefined) ?? (index === 0 ? fieldId : index > 0 ? `${fieldId}-${index}` : undefined)
  const aria = field!.ariaAttrs(consumerAttrs, rootContext.disabled.value)
  if (label && id && field!.context.labelId.value)
    aria['aria-labelledby'] = `${aria['aria-labelledby']} ${id}`
  return { id, ...aria }
}
// Template binding keeps the v2 order: consumer attributes first, so the thumb's
// own attributes win and a consumer `@focus` runs before the thumb's; a consumer
// `aria-label` (then `ariaLabel`) wins over the generated one. `$attrs` is read in
// the template (not a computed) so attribute changes re-render.
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
