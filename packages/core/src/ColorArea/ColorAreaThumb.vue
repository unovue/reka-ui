<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ColorAreaThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { injectColorAreaRootContext } from './ColorAreaRoot.vue'
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

function setXInput(el: unknown) {
  rootContext.xInputRef.value = (el as HTMLInputElement | null) ?? undefined
}
function setYInput(el: unknown) {
  rootContext.yInputRef.value = (el as HTMLInputElement | null) ?? undefined
}
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as-child="asChild"
    :as="as"
    v-bind="thumb.attrs.value"
  >
    <slot />
    <!-- One visually hidden range input per channel: they hold focus and expose each channel. -->
    <input
      :ref="setXInput"
      v-bind="xInput.attrs.value"
    >
    <input
      :ref="setYInput"
      v-bind="yInput.attrs.value"
    >
  </Primitive>
</template>
