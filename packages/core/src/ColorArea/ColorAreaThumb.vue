<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ColorAreaThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { mergeProps, onMounted } from 'vue'
import { usePrimitiveElement } from '@/Primitive'
import { renderAs } from '@/Primitive/renderAs'
import { injectColorAreaFieldContext, injectColorAreaRootContext } from './ColorAreaRoot.vue'
import { getColorAreaInputSurface, getColorAreaThumbSurface } from './useColorArea'

const props = withDefaults(defineProps<ColorAreaThumbProps>(), {
  as: 'span',
})

const rootContext = injectColorAreaRootContext()
const { primitiveElement, currentElement, expose } = usePrimitiveElement()
defineExpose(expose)
onMounted(() => {
  rootContext.thumbRef.value = currentElement.value
})
const thumb = getColorAreaThumbSurface(rootContext)
// An `asChild` thumb renders the inputs next to the user's element, not inside it, so they
// are placed at the thumb's position in the area instead of the thumb's center.
const anchor = () => props.asChild ? 'area' : 'thumb'
const xInput = getColorAreaInputSurface(rootContext, 'x', anchor)
const yInput = getColorAreaInputSurface(rootContext, 'y', anchor)

// Inside a Field, the x input takes the field's id and the y input one
// derived from it. Both are labelled and described by the field, keeping
// their channel name after the field's label (they reference themselves).
const field = injectColorAreaFieldContext(null)
function inputAttrs(own: Record<string, unknown>, axis: 'x' | 'y') {
  if (!field)
    return own
  const fieldId = field.context.fieldId.value
  const id = axis === 'x' ? fieldId : `${fieldId}-y`
  const aria = field.ariaAttrs({}, rootContext.disabled.value)
  if (field.context.labelId.value)
    aria['aria-labelledby'] = `${aria['aria-labelledby']} ${id}`
  return mergeProps(own, { id, ...aria })
}

function setXInput(el: unknown) {
  rootContext.xInputRef.value = (el as HTMLInputElement | null) ?? undefined
}
function setYInput(el: unknown) {
  rootContext.yInputRef.value = (el as HTMLInputElement | null) ?? undefined
}
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    ref="primitiveElement"
    v-bind="thumb.attrs.value"
  >
    <slot />
    <!-- One visually hidden range input per channel: they hold focus and expose each channel. -->
    <input
      :ref="setXInput"
      v-bind="inputAttrs(xInput.attrs.value, 'x')"
    >
    <input
      :ref="setYInput"
      v-bind="inputAttrs(yInput.attrs.value, 'y')"
    >
  </component>
</template>
