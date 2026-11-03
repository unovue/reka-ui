<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerDescriptionProps extends PrimitiveProps {
  /**
   * Id of the element, which the popup's `aria-describedby` points at.
   * Auto-generated when not provided.
   */
  id?: string
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement, usePartId } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { getDrawerDescriptionSurface } from './useDrawer'

const props = withDefaults(defineProps<DrawerDescriptionProps>(), { as: 'p' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectDrawerRootContext()
// Rendered on the element; mirrored into the context for the content's `aria-*`.
const id = usePartId(() => props.id, rootContext, 'descriptionId')
const description = getDrawerDescriptionSurface(rootContext)
</script>

<template>
  <component
    :is="renderAs(props.as, props.asChild)"
    :ref="forwardRef"
    v-bind="{ ...description.attrs.value, id }"
  >
    <slot />
  </component>
</template>
