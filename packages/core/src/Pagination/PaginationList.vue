<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface PaginationListProps extends PrimitiveProps { }
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { injectPaginationRootContext } from './PaginationRoot.vue'
import { getPaginationItems } from './usePagination'

const props = defineProps<PaginationListProps>()

defineSlots<{
  default?: (props: {
    /** Pages item */
    // Spelled out (not the `PaginationItem` alias) so the generated docs keep the union.
    items: Array<{ type: 'ellipsis' } | { type: 'page', value: number }>
  }) => any
}>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectPaginationRootContext()

// The visible range comes from the same derivation as `usePagination().items`.
const transformedRange = getPaginationItems(rootContext)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
  >
    <slot :items="transformedRange" />
  </component>
</template>
