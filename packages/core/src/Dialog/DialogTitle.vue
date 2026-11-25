<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose, useReferencedId } from '@/shared'

export interface DialogTitleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectDialogRootContext } from './DialogRoot.vue'

const props = withDefaults(defineProps<DialogTitleProps>(), { as: 'h2' })
const rootContext = injectDialogRootContext()
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
