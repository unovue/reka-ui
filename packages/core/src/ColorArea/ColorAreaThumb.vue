<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ColorAreaThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { injectColorAreaRootContext } from './ColorAreaRoot.vue'
import { getColorAreaThumbSurface } from './useColorArea'

const props = withDefaults(defineProps<ColorAreaThumbProps>(), {
  as: 'span',
})

const rootContext = injectColorAreaRootContext()
const { primitiveElement, currentElement } = usePrimitiveElement()
onMounted(() => {
  rootContext.thumbRef.value = currentElement.value
})
const thumb = getColorAreaThumbSurface(rootContext)
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as-child="asChild"
    :as="as"
    v-bind="thumb.attrs.value"
  >
    <slot />
  </Primitive>
</template>
