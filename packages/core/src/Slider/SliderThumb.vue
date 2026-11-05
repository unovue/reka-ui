<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SliderThumbProps extends PrimitiveProps {}

// Inside a Field: how many thumbs of each field's slider are set up, so a
// thumb knows its place before it's mounted (on the server, and the first
// render), when its collection position isn't known yet.
const fieldThumbCounts = new WeakMap<object, number>()
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
// The thumb's place in setup order, only inside a Field.
const setupOrder = field ? (fieldThumbCounts.get(field) ?? 0) : 0
if (field) {
  fieldThumbCounts.set(field, setupOrder + 1)
  onUnmounted(() => fieldThumbCounts.set(field, (fieldThumbCounts.get(field) ?? 1) - 1))
}

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

// Keep the mounted element: the template ref is already null by the time `onUnmounted` runs.
let mountedThumb: HTMLElement | undefined
onMounted(() => {
  // An `asChild` thumb that rendered no element has nothing to register.
  if (!(thumbElement.value instanceof Element))
    return
  mountedThumb = thumbElement.value as HTMLElement
  const thumbs = rootContext.thumbElements.value
  const active = rootContext.valueIndexToChangeRef
  const activeThumb = thumbs[active.value]
  // Insert in DOM order: thumb indexes come from the collection, so a reinserted thumb must not land at the end.
  const next = thumbs.findIndex(thumb => mountedThumb!.compareDocumentPosition(thumb) & Node.DOCUMENT_POSITION_FOLLOWING)
  thumbs.splice(next === -1 ? thumbs.length : next, 0, mountedThumb)
  // Keep the active index on the same thumb when this one lands before it.
  if (activeThumb)
    active.value = thumbs.indexOf(activeThumb)
})
onUnmounted(() => {
  if (!mountedThumb)
    return
  const thumbs = rootContext.thumbElements.value
  const i = thumbs.indexOf(mountedThumb)
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
  // Once mounted, a thumb's place is its collection position whenever more
  // than one value or thumb renders (two thumbs over a one-value model must
  // not share the field's id). Before that (on the server and the first
  // render), it's the setup order.
  const several = (rootContext.modelValue?.value?.length ?? 0) > 1 || rootContext.thumbElements.value.length > 1
  const index = consumerIndex.value ?? (!isMounted.value ? setupOrder : several ? position.value : 0)
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
