<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerDescriptionProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose, useReferencedId } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = withDefaults(defineProps<DrawerDescriptionProps>(), { as: 'p' })
const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectDrawerRootContext()
useReferencedId(rootContext, 'descriptionId', currentElement)
</script>

<template>
  <Primitive
    v-bind="props"
    :id="rootContext.descriptionId"
    :ref="forwardRef"
  >
    <slot />
  </Primitive>
</template>
