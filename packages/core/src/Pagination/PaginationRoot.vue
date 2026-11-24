<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { clamp, createRekaContext, useForwardExpose } from '@/shared'

type PaginationRootContext = {
  page: Ref<number>
  onPageChange: (value: number) => void
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
  /**
   * When `true`, keeps the page within the page count. If `total` or `itemsPerPage` drops below
   * the current page, the page moves to the last page and `update:page` is emitted. A `total` of
   * `0` resets the page to `1`, so keep the previous `total` while new data loads.
   */
  clampPage?: boolean
}

export type PaginationRootEmits = {
  /** Event handler called when the page value changes */
  'update:page': [value: number]
}

export const [injectPaginationRootContext, providePaginationRootContext]
  = createRekaContext<PaginationRootContext>('PaginationRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, nextTick, toRefs, watch } from 'vue'
import { Primitive } from '@/Primitive'

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
    page: typeof page.value
    /** Number of pages */
    pageCount: typeof pageCount.value
  }) => any
}>()

const { siblingCount, disabled, showEdges } = toRefs(props)

useForwardExpose()
// A clamp correction is emitted directly: in passive mode (`page` starts undefined) `useVModel`
// drops emits while it syncs a new `page` prop, so an out-of-range page set by the parent would
// never be corrected. `useVModel` then skips its own emit for that value, so it is emitted once.
let emittedCorrection: number | undefined
const modelPage = useVModel(props, 'page', emits, {
  defaultValue: props.defaultPage,
  passive: (props.page === undefined) as false,
  shouldEmit: value => value !== emittedCorrection,
}) as Ref<number>

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / (props.itemsPerPage || 1))))

// Navigation always lands within the page count. Moving an out-of-range page back into range is
// opt-in, because a `total` that drops while data loads would otherwise lose the current page.
const page = computed({
  get: () => props.clampPage ? clamp(modelPage.value, 1, pageCount.value) : modelPage.value,
  set(value: number) {
    modelPage.value = clamp(value, 1, pageCount.value)
  },
})

watch([() => props.clampPage, modelPage, pageCount], ([clampPage, value, count]) => {
  const clamped = clamp(value, 1, count)
  if (!clampPage || value === clamped)
    return
  emittedCorrection = clamped
  emits('update:page', clamped)
  modelPage.value = clamped
  nextTick(() => emittedCorrection = undefined)
}, { immediate: true })

providePaginationRootContext({
  page,
  onPageChange(value) {
    page.value = value
  },
  pageCount,
  siblingCount,
  disabled,
  showEdges,
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
  >
    <slot
      :page="page"
      :page-count="pageCount"
    />
  </Primitive>
</template>
