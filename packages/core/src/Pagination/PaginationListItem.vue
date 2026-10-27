<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface PaginationListItemProps extends PrimitiveProps {
  /** Value for the page */
  value: number
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectPaginationRootContext } from './PaginationRoot.vue'
import { getPaginationListItemSurface } from './usePagination'

const props = withDefaults(defineProps<PaginationListItemProps>(), { as: 'button' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const rootContext = injectPaginationRootContext()
// aria-current/data-selected/disabled and the click handler come from the
// shared surface builder (single source with `usePagination().getListItemSurface`).
const surface = getPaginationListItemSurface(rootContext, () => props.value)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot>{{ value }}</slot>
  </Primitive>
</template>
