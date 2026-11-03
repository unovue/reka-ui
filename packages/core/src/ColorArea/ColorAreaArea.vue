<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ColorAreaAreaProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { usePrimitiveElement } from '@/Primitive'
import { renderAs } from '@/Primitive/renderAs'
import { injectColorAreaRootContext } from './ColorAreaRoot.vue'
import { createColorAreaAreaSurface } from './useColorArea'

const props = withDefaults(defineProps<ColorAreaAreaProps>(), {
  as: 'div',
})

const rootContext = injectColorAreaRootContext()
const { primitiveElement, currentElement: areaElement, expose } = usePrimitiveElement()
defineExpose(expose)
const area = createColorAreaAreaSurface(rootContext, areaElement)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    ref="primitiveElement"
    v-bind="area.attrs.value"
  >
    <slot />
  </component>
</template>
