<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose, useReferencedId } from '@/shared'

export interface DialogDescriptionProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectDialogRootContext } from './DialogRoot.vue'

const props = withDefaults(defineProps<DialogDescriptionProps>(), { as: 'p' })

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectDialogRootContext()
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
