<script lang="ts">
import type { Ref } from 'vue'
import type { PaginationChangeReason } from './usePagination'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { createContext, useForwardElement } from '@/shared'

export type PaginationRootContext = {
  /** Read-only: call `onPageChange` to change the page. */
  page: Readonly<Ref<number>>
  /** Returns `false` when the page is unchanged or the change was cancelled. */
  onPageChange: (value: number, reason?: PaginationChangeReason | BaseChangeReason, event?: Event) => boolean
  pageCount: Ref<number>
  siblingCount: Ref<number>
  disabled: Ref<boolean>
  showEdges: Ref<boolean>
}

export interface PaginationRootProps extends PrimitiveProps {
  /** The controlled value of the current page. Can be binded as `v-model:page`. */
  page?: number
  /**
   * The value of the page that should be active when initially rendered.
   *
   * Use when you do not need to control the value state.
   */
  defaultPage?: number
  /** Number of items per page */
  itemsPerPage: number
  /** Number of items in your list */
  total?: number
  /** Number of sibling should be shown around the current page */
  siblingCount?: number
  /** When `true`, prevents the user from interacting with item */
  disabled?: boolean
  /** When `true`, always show first page, last page, and ellipsis */
  showEdges?: boolean
}

export type PaginationRootEmits = {
  /** Event handler called before the page changes; call `details.cancel()` to keep the current page. */
  'beforeUpdate:page': [value: number, details: ChangeEventDetails<PaginationChangeReason>]
  /** Event handler called when the page value changes */
  'update:page': [value: number, details: ChangeEventDetails<PaginationChangeReason>]
}

export const [injectPaginationRootContext, providePaginationRootContext]
  = createContext<PaginationRootContext>('PaginationRoot')
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { usePagination } from './usePagination'

const props = withDefaults(defineProps<PaginationRootProps>(), {
  as: 'nav',
  total: 0,
  siblingCount: 2,
  defaultPage: 1,
  showEdges: false,
})
const emits = defineEmits<PaginationRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current page state */
    page: number
    /** Number of pages */
    pageCount: number
  }) => any
}>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// The composable owns the page model (`useControllableState`) and its emits.
const { page, pageCount, context } = usePagination({
  page: () => props.page,
  defaultPage: props.defaultPage,
  itemsPerPage: () => props.itemsPerPage,
  total: () => props.total,
  siblingCount: () => props.siblingCount,
  disabled: () => props.disabled,
  showEdges: () => props.showEdges,
  emit: emits,
})

providePaginationRootContext(context)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
  >
    <slot
      :page="page"
      :page-count="pageCount"
    />
  </Primitive>
</template>
