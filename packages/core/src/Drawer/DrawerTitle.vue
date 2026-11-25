<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerTitleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose, useReferencedId } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = withDefaults(defineProps<DrawerTitleProps>(), { as: 'h2' })
const rootContext = injectDrawerRootContext()
const { forwardRef, currentElement } = useForwardExpose()
useReferencedId(rootContext, 'titleId', currentElement)
</script>

<template>
  <Primitive
    v-bind="props"
    :id="rootContext.titleId"
    :ref="forwardRef"
  >
    <slot />
  </Primitive>
</template>
