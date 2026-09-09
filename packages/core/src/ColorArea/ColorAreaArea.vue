<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ColorAreaAreaProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { injectColorAreaRootContext } from './ColorAreaRoot.vue'
import { createColorAreaAreaSurface } from './useColorArea'

const props = withDefaults(defineProps<ColorAreaAreaProps>(), {
  as: 'div',
})

const rootContext = injectColorAreaRootContext()
const { primitiveElement, currentElement: areaElement } = usePrimitiveElement()
const area = createColorAreaAreaSurface(rootContext, areaElement)
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as-child="asChild"
    :as="as"
    v-bind="area.attrs.value"
  >
    <slot />
  </Primitive>
</template>
