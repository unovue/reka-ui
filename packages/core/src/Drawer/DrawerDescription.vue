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
import { Primitive } from '@/Primitive'
import { useForwardElement, usePartId } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { getDrawerDescriptionSurface } from './useDrawer'

const props = withDefaults(defineProps<DrawerDescriptionProps>(), { as: 'p' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectDrawerRootContext()
usePartId(() => props.id, rootContext.descriptionId, (id) => { rootContext.descriptionId = id })
const description = getDrawerDescriptionSurface(rootContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    v-bind="description.attrs.value"
  >
    <slot />
  </Primitive>
</template>
