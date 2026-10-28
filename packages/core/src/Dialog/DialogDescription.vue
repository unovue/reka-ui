<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement, usePartId } from '@/shared'

export interface DialogDescriptionProps extends PrimitiveProps {
  /**
   * Id of the element, which the content's `aria-describedby` points at.
   * Auto-generated when not provided.
   */
  id?: string
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { injectDialogRootContext } from './DialogRoot.vue'
import { getDialogDescriptionSurface } from './useDialog'

const props = withDefaults(defineProps<DialogDescriptionProps>(), { as: 'p' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectDialogRootContext()
// Rendered on the element; mirrored into the context for the content's `aria-*`.
const id = usePartId(() => props.id, rootContext, 'descriptionId')
// The `id` the content's `aria-describedby` points at, from the shared surface builder.
const description = getDialogDescriptionSurface(rootContext)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="{ ...description.attrs.value, id }"
  >
    <slot />
  </component>
</template>
