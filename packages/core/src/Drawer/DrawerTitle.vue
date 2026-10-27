<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerTitleProps extends PrimitiveProps {
  /**
   * Id of the element, which the popup's `aria-labelledby` points at.
   * Auto-generated when not provided.
   */
  id?: string
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement, usePartId } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { getDrawerTitleSurface } from './useDrawer'

const props = withDefaults(defineProps<DrawerTitleProps>(), { as: 'h2' })
const rootContext = injectDrawerRootContext()
// Rendered on the element; mirrored into the context for the content's `aria-*`.
const id = usePartId(() => props.id, rootContext, 'titleId')
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const title = getDrawerTitleSurface(rootContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    v-bind="{ ...title.attrs.value, id }"
  >
    <slot />
  </Primitive>
</template>
