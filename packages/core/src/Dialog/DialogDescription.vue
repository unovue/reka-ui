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
import { Primitive } from '@/Primitive'
import { injectDialogRootContext } from './DialogRoot.vue'
import { getDialogDescriptionSurface } from './useDialog'

const props = withDefaults(defineProps<DialogDescriptionProps>(), { as: 'p' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectDialogRootContext()
usePartId(() => props.id, rootContext.descriptionId, (id) => { rootContext.descriptionId = id })
// The `id` the content's `aria-describedby` points at, from the shared surface builder.
const description = getDialogDescriptionSurface(rootContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="description.attrs.value"
  >
    <slot />
  </Primitive>
</template>
