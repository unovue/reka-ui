import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { PaginationRootContext } from './PaginationRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { Translate, TranslationKey } from '@/shared/translations'
import { computed, toValue } from 'vue'
import { clamp, createPartSurface, useControllableState } from '@/shared'
import { messagesTranslate, paginationMessages } from '@/shared/translations'
import { getRange, transform } from './utils'

/**
 * Why the page changed; carried as `details.reason` on every change (#2828).
 *
 * - `'first-press'` / `'prev-press'` / `'next-press'` / `'last-press'`: the
 *   `PaginationFirst` / `PaginationPrev` / `PaginationNext` / `PaginationLast` buttons.
 * - `'item-press'`: a `PaginationListItem`.
 */
export type PaginationChangeReason = 'next-press' | 'prev-press' | 'first-press' | 'last-press' | 'item-press'

/** Which navigation button a surface belongs to. */
export type PaginationNavigation = 'first' | 'prev' | 'next' | 'last'

/** Semantic state of a navigation button (no `data-*`: v2 rendered none). */
export type PaginationNavigationState = { disabled: boolean }
/** Semantic state of a page item (`data-type="page"`, and `data-selected="true"`, the v2 value). */
export type PaginationListItemState = { type: 'page', selected: boolean, disabled: boolean }
/** Semantic state of the ellipsis (`data-type="ellipsis"`). */
export type PaginationEllipsisState = { type: 'ellipsis' }

/** One entry of the visible page range. */
export type PaginationItem = { type: 'ellipsis' } | { type: 'page', value: number }

const NAVIGATION: Record<PaginationNavigation, { label: TranslationKey, reason: PaginationChangeReason }> = {
  first: { label: 'paginationFirst', reason: 'first-press' },
  prev: { label: 'paginationPrev', reason: 'prev-press' },
  next: { label: 'paginationNext', reason: 'next-press' },
  last: { label: 'paginationLast', reason: 'last-press' },
}

function navigationTarget(context: PaginationRootContext, kind: PaginationNavigation) {
  switch (kind) {
    case 'first': return 1
    case 'prev': return context.page.value - 1
    case 'next': return context.page.value + 1
    case 'last': return context.pageCount.value
  }
}

function isNavigationDisabled(context: PaginationRootContext, kind: PaginationNavigation) {
  // `<=` / `>=`: without `clampPage` the page may sit past a page count that shrank.
  const atEdge = kind === 'first' || kind === 'prev'
    ? context.page.value <= 1
    : context.page.value >= context.pageCount.value
  return atEdge || context.disabled.value
}

/**
 * The First/Prev/Next/Last button surface, derived purely from the context.
 * `type` is tag-dependent and stays in the shells.
 */
export function getPaginationNavigationSurface(context: PaginationRootContext, kind: PaginationNavigation): PartSurface<PaginationNavigationState> {
  const disabled = computed(() => isNavigationDisabled(context, kind))
  return createPartSurface<PaginationNavigationState>(
    () => ({
      'aria-label': context.t(NAVIGATION[kind].label),
      'disabled': disabled.value,
      'onClick': (event: MouseEvent) => {
        if (disabled.value)
          return
        context.onPageChange(navigationTarget(context, kind), NAVIGATION[kind].reason, event)
      },
    }),
    () => ({ disabled: disabled.value }),
    // v2 rendered only the native `disabled` attribute on these buttons.
    { disabled: () => undefined },
  )
}

/** The per-page item surface, derived purely from `(context, value)`. */
export function getPaginationListItemSurface(context: PaginationRootContext, value: MaybeRefOrGetter<number>): PartSurface<PaginationListItemState> {
  const isSelected = computed(() => context.page.value === toValue(value))
  const disabled = computed(() => context.disabled.value)
  return createPartSurface<PaginationListItemState>(
    () => ({
      'aria-label': context.t('paginationPage', { page: toValue(value) }),
      'aria-current': isSelected.value ? 'page' : undefined,
      'disabled': disabled.value,
      'onClick': (event: MouseEvent) => {
        if (disabled.value)
          return
        context.onPageChange(toValue(value), 'item-press', event)
      },
    }),
    () => ({ type: 'page', selected: isSelected.value, disabled: disabled.value }),
    {
      // v2 rendered `data-selected="true"` (not `""`) and no `data-disabled`.
      selected: selected => ({ 'data-selected': selected ? 'true' : undefined }),
      disabled: () => undefined,
    },
  )
}

/** The ellipsis surface. */
export function getPaginationEllipsisSurface(): PartSurface<PaginationEllipsisState> {
  return createPartSurface<PaginationEllipsisState>(
    () => ({}),
    () => ({ type: 'ellipsis' }),
  )
}

/** The visible page range (pages and ellipses), derived purely from the context. */
export function getPaginationItems(context: PaginationRootContext): ComputedRef<PaginationItem[]> {
  return computed(() => transform(getRange(
    context.page.value,
    context.pageCount.value,
    context.siblingCount.value,
    context.showEdges.value,
  )))
}

export interface UsePaginationProps {
  /**
   * Controlled page. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  page?: MaybeRefOrGetter<number | undefined>
  /** Initial page when uncontrolled. @defaultValue `1` */
  defaultPage?: number
  /** Number of items per page. */
  itemsPerPage: MaybeRefOrGetter<number>
  /** Number of items in the list. @defaultValue `0` */
  total?: MaybeRefOrGetter<number | undefined>
  /** Number of siblings shown around the current page. @defaultValue `2` */
  siblingCount?: MaybeRefOrGetter<number | undefined>
  /** @defaultValue `false` */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** When `true`, always show the first page, the last page and the ellipses. @defaultValue `false` */
  showEdges?: MaybeRefOrGetter<boolean | undefined>
  /**
   * When `true`, `page` reads within the page count. Moving the model back into range is the
   * caller's job (`PaginationRoot` does it with `setPage`). @defaultValue `true`
   */
  clampPage?: MaybeRefOrGetter<boolean | undefined>
  /** Looks up the built-in labels; `PaginationRoot` passes the `ConfigProvider` one. @defaultValue the English labels */
  translate?: Translate
  /** Component `emit`; receives `beforeUpdate:page` then `update:page`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: number, details: ChangeEventDetails<PaginationChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: number, details: ChangeEventDetails<PaginationChangeReason>) => void
}

export interface UsePaginationReturn {
  page: ComputedRef<number>
  /** The page the model holds, which may be past the page count when `clampPage` is `false`. */
  modelPage: ComputedRef<number>
  pageCount: ComputedRef<number>
  /** The visible page range (pages and ellipses). */
  items: ComputedRef<PaginationItem[]>
  /** Go to a page; returns `false` when unchanged or cancelled. */
  setPage: (value: number, reason?: PaginationChangeReason | BaseChangeReason, event?: Event) => boolean
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<PaginationChangeReason>>>
  isControlled: ComputedRef<boolean>
  first: PartSurface<PaginationNavigationState>
  prev: PartSurface<PaginationNavigationState>
  next: PartSurface<PaginationNavigationState>
  last: PartSurface<PaginationNavigationState>
  ellipsis: PartSurface<PaginationEllipsisState>
  /** Per-page item surface built from `(context, value)`. */
  getListItemSurface: (value: MaybeRefOrGetter<number>) => PartSurface<PaginationListItemState>
  context: PaginationRootContext
}

/**
 * Headless Pagination logic. The `.vue` shells compose this; a standalone
 * consumer gets the page model, the visible range and every button's
 * `aria-*`, `disabled` and click handler. The root and list render no
 * attributes, so there is no root surface.
 *
 * SSR-safe and callable outside `setup()` (computed-only).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function usePagination(props: UsePaginationProps): UsePaginationReturn {
  const { state: modelPage, setState, lastChangeDetails, isControlled } = useControllableState<number, PaginationChangeReason>({
    prop: props.page,
    defaultValue: props.defaultPage ?? 1,
    name: 'page',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })

  const pageCount = computed(() => Math.max(1, Math.ceil((toValue(props.total) ?? 0) / (toValue(props.itemsPerPage) || 1))))
  const siblingCount = computed(() => toValue(props.siblingCount) ?? 2)
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const showEdges = computed(() => toValue(props.showEdges) ?? false)
  // Navigation always lands within the page count. Reading an out-of-range page back into range
  // is the default; `clampPage: false` keeps it for a `total` that drops while data loads.
  const page = computed(() => (toValue(props.clampPage) ?? true) ? clamp(modelPage.value, 1, pageCount.value) : modelPage.value)

  function setPage(value: number, reason: PaginationChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setState(clamp(value, 1, pageCount.value), reason, event)
  }

  const context: PaginationRootContext = {
    page,
    onPageChange: setPage,
    pageCount,
    siblingCount,
    disabled,
    showEdges,
    t: props.translate ?? messagesTranslate(paginationMessages),
  }

  return {
    page,
    modelPage,
    pageCount,
    items: getPaginationItems(context),
    setPage,
    lastChangeDetails,
    isControlled,
    first: getPaginationNavigationSurface(context, 'first'),
    prev: getPaginationNavigationSurface(context, 'prev'),
    next: getPaginationNavigationSurface(context, 'next'),
    last: getPaginationNavigationSurface(context, 'last'),
    ellipsis: getPaginationEllipsisSurface(),
    getListItemSurface: value => getPaginationListItemSurface(context, value),
    context,
  }
}
