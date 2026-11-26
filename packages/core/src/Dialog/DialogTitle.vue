<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement, usePartId } from '@/shared'

export interface DialogTitleProps extends PrimitiveProps {
  /**
   * Id of the element, which the content's `aria-labelledby` points at.
   * Auto-generated when not provided.
   */
  id?: string
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { injectDialogRootContext } from './DialogRoot.vue'
import { getDialogTitleSurface } from './useDialog'

const props = withDefaults(defineProps<DialogTitleProps>(), { as: 'h2' })
const rootContext = injectDialogRootContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
// Rendered on the element; mirrored into the context for the content's `aria-*`.
// With `asChild`, an id on the child element wins.
const id = usePartId(() => props.id, rootContext, 'titleId', currentElement)
// The `id` the content's `aria-labelledby` points at, from the shared surface builder.
const title = getDialogTitleSurface(rootContext)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="{ ...title.attrs.value, id }"
  >
    <slot />
  </component>
</template>
