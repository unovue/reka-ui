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
import { Primitive } from '@/Primitive'
import { injectDialogRootContext } from './DialogRoot.vue'
import { getDialogTitleSurface } from './useDialog'

const props = withDefaults(defineProps<DialogTitleProps>(), { as: 'h2' })
const rootContext = injectDialogRootContext()
// Rendered on the element; mirrored into the context for the content's `aria-*`.
const id = usePartId(() => props.id, rootContext, 'titleId')
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
// The `id` the content's `aria-labelledby` points at, from the shared surface builder.
const title = getDialogTitleSurface(rootContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="{ ...title.attrs.value, id }"
  >
    <slot />
  </Primitive>
</template>
