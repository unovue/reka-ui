<script lang="ts">
import type { Ref } from 'vue'
import type { PaginationChangeReason } from './usePagination'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails, Translate } from '@/shared'
import { clamp, createRekaContext, useForwardElement, useTranslations } from '@/shared'

export type PaginationRootContext = {
  /** Read-only: call `onPageChange` to change the page. */
  page: Readonly<Ref<number>>
  /** Returns `false` when the page is unchanged or the change was cancelled. */
  onPageChange: (value: number, reason?: PaginationChangeReason | BaseChangeReason, event?: Event) => boolean
  pageCount: Ref<number>
  siblingCount: Ref<number>
  disabled: Ref<boolean>
  showEdges: Ref<boolean>
  /** Looks up the built-in labels, which `ConfigProvider` can translate. */
  t: Translate
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
   * `0` resets the page to `1`, so keep the previous `total` while new data loads. Set to `false`
   * to keep the page as it is while navigation still stays within the page count.
   * @defaultValue true
   */
  clampPage?: boolean
}

export type PaginationRootEmits = {
  /** Event handler called before the page changes; call `details.cancel()` to keep the current page. */
  'beforeUpdate:page': [value: number, details: ChangeEventDetails<PaginationChangeReason>]
  /** Event handler called when the page value changes */
  'update:page': [value: number, details: ChangeEventDetails<PaginationChangeReason>]
}

export const [injectPaginationRootContext, providePaginationRootContext]
  = createRekaContext<PaginationRootContext>('PaginationRoot')
</script>

<script setup lang="ts">
import { watch } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useUntrackedAttrs } from '@/shared/splitWrapperAttrs'
import { usePagination } from './usePagination'

const props = withDefaults(defineProps<PaginationRootProps>(), {
  as: 'nav',
  total: 0,
  siblingCount: 2,
  defaultPage: 1,
  showEdges: false,
  clampPage: true,
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
const t = useTranslations()
const { page, modelPage, pageCount, setPage, context } = usePagination({
  page: () => props.page,
  defaultPage: props.defaultPage,
  itemsPerPage: () => props.itemsPerPage,
  total: () => props.total,
  siblingCount: () => props.siblingCount,
  disabled: () => props.disabled,
  showEdges: () => props.showEdges,
  clampPage: () => props.clampPage,
  translate: t,
  emit: emits,
})

// With `clampPage` (the default), move a model page past the page count back into range (on mount
// too). The watcher starts once `clampPage` is on: at setup, or from a watcher on `clampPage` alone
// that stops once it has started it. A watcher rather than `onBeforeUpdate`: a Vapor component's
// props change without an update. With `:clamp-page="false"` a pagination pays one small watcher.
function watchClampPage() {
  watch(() => props.clampPage && modelPage.value !== clamp(modelPage.value, 1, pageCount.value), (outOfRange) => {
    if (outOfRange)
      setPage(modelPage.value)
  }, { immediate: true })
}
if (props.clampPage) {
  watchClampPage()
}
else {
  const stop = watch(() => props.clampPage, (on) => {
    if (!on)
      return
    stop()
    watchClampPage()
  })
}

// A `<nav>` is a landmark, and landmarks need a name to be told apart. The default steps aside for a
// consumer `aria-label` (it falls through and wins) or `aria-labelledby`, and is only set on the `<nav>` itself.
// Read in render, not a computed: a change of the attrs re-renders this component.
const attrs = useUntrackedAttrs()
const ariaLabel = () => (props.as === 'nav' && !props.asChild && !attrs['aria-labelledby']) ? t('paginationLabel') : undefined

providePaginationRootContext(context)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    :aria-label="ariaLabel()"
  >
    <slot
      :page="page"
      :page-count="pageCount"
    />
  </component>
</template>
