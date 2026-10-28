import type { EventHook } from '@vueuse/core'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { SelectEvent, ToggleEvent } from './TreeItem.vue'
import type { FlattenedItem, TreeRootContext } from './TreeRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { Direction } from '@/shared/types'
import { createEventHook } from '@vueuse/core'
import { computed, getCurrentScope, nextTick, ref, toRaw, toValue } from 'vue'
import { MAP_KEY_TO_FOCUS_INTENT } from '@/RovingFocus/utils'
import { createPartSurface, findValuesBetween, getActiveElement, handleAndDispatchCustomEvent, useControllableState, useTypeahead } from '@/shared'
import { createKeyedSetSelector, useSelectorKey } from '@/shared/createKeyedSelector'
import { isDisabledItem } from '@/shared/isDisabledItem'
import { flatten } from './utils'

/**
 * Why the selection changed; carried as `details.reason` on every change (#2828).
 *
 * - `'item-press'`: an item was clicked.
 * - `'item-keydown'`: Enter or Space on a focused item.
 * - `'range-select'`: Shift+ArrowUp/ArrowDown extending a `multiple` +
 *   `'replace'` selection. Inside a `TreeVirtualizer` also Shift+Home/End,
 *   Shift+PageUp/PageDown and Shift+ArrowLeft/ArrowRight.
 *
 * `propagateSelect` / `bubbleSelect` fold the descendants and ancestors into
 * the same change, which carries the item's reason.
 */
export type TreeChangeReason = 'item-press' | 'item-keydown' | 'range-select'

/**
 * Why the expanded keys changed; carried as `details.reason` on every change.
 *
 * - `'item-press'`: an item with children was clicked.
 * - `'item-keydown'`: ArrowRight / ArrowLeft expanded or collapsed an item.
 */
export type TreeExpandedChangeReason = 'item-press' | 'item-keydown'

/** A shift-range move, as `RovingFocus` maps the key. */
export type TreeNavigationIntent = 'first' | 'last' | 'prev' | 'next'

/** Semantic state of an item (`data-selected`, `data-expanded`, `data-disabled`). */
export type TreeItemState = { selected: boolean, expanded: boolean, disabled: boolean }

/** One entry of a collection the keyboard handlers walk (`useCollection().getItems()` / `RovingFocusGroup.getItems()`). */
export interface TreeCollectionItem {
  ref: HTMLElement
  value?: any
}

/** The per-item state shared by the `TreeItem` SFC (slot props, expose) and its surface. */
export interface TreeItemStatus {
  hasChildren: ComputedRef<boolean>
  isExpanded: ComputedRef<boolean>
  isSelected: ComputedRef<boolean>
  isIndeterminate: ComputedRef<boolean | undefined>
  isDisabled: ComputedRef<boolean>
}

/** The per-item state, derived purely from `(context, value)`. */
export function getTreeItemStatus<T extends Record<string, any>>(
  context: TreeRootContext<T>,
  value: MaybeRefOrGetter<T>,
  disabled?: MaybeRefOrGetter<boolean | undefined>,
): TreeItemStatus {
  const hasChildren = computed(() => !!context.getChildren(toValue(value)))

  // Keyed selector cells (when the root made them): toggling or selecting one
  // item re-evaluates only the items whose key entered or left the set, not
  // an `includes` scan in every item.
  const key = () => context.getKey(toValue(value))
  const inExpanded = context.expandedSelector && getCurrentScope()
    ? useSelectorKey(context.expandedSelector, key)
    : () => context.expanded.value.includes(key())
  const inSelected = context.selectedSelector && getCurrentScope()
    ? useSelectorKey(context.selectedSelector, key)
    : () => context.selectedKeys.value.includes(key())

  const isExpanded = computed(inExpanded)

  const isSelected = computed(inSelected)

  const isIndeterminate = computed(() => {
    const model = context.modelValue.value
    if (context.bubbleSelect.value && hasChildren.value && Array.isArray(model)) {
      const children = flatten(context.getChildren(toValue(value)) ?? [], context.getChildren)
      const isInModel = (child: T) => model.some(v => context.getKey(v) === context.getKey(child))

      return children.some(isInModel) && !children.every(isInModel)
    }
    else if (context.propagateSelect.value && isSelected.value && hasChildren.value && Array.isArray(model)) {
      const children = flatten(context.getChildren(toValue(value)) ?? [], context.getChildren)

      return !children.every(child => model.some(v => context.getKey(v) === context.getKey(child)))
    }
    else {
      return undefined
    }
  })

  const isDisabled = computed(() => context.disabled.value || (toValue(disabled) ?? false))

  return { hasChildren, isExpanded, isSelected, isIndeterminate, isDisabled }
}

const TREE_SELECT = 'tree.select'
const TREE_TOGGLE = 'tree.toggle'

/** Pointer/keyboard origin of an item event → the reason it reports. */
function itemReason(event: Event): 'item-press' | 'item-keydown' {
  return event.type.startsWith('key') ? 'item-keydown' : 'item-press'
}

export interface TreeItemSurfaceOptions<T> {
  value: MaybeRefOrGetter<T>
  /** Level of depth (`aria-level`, `data-indent`). */
  level: MaybeRefOrGetter<number>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** The status from `getTreeItemStatus`; built here when omitted. */
  status?: TreeItemStatus
  /**
   * The rendered items in DOM order (the SFC injects `useCollection().getItems`),
   * walked by ArrowRight/ArrowLeft to focus the first child / the parent.
   * Defaults to an empty collection.
   */
  getItems?: () => TreeCollectionItem[]
  /**
   * The cancellable `tree.select` custom event — a callback channel, never a
   * merged DOM listener. The SFC passes `e => emits('select', e)`; calling
   * `event.preventDefault()` inside blocks the selection.
   */
  onSelect?: (event: SelectEvent<T>) => void
  /** The cancellable `tree.toggle` custom event; `event.preventDefault()` blocks the expand/collapse. */
  onToggle?: (event: ToggleEvent<T>) => void
}

/**
 * The per-item surface: `role="treeitem"`, `aria-selected` / `aria-expanded` /
 * `aria-level` / `aria-disabled`, the `data-indent` selector the arrow keys
 * walk, and the click / Enter / Space / ArrowLeft / ArrowRight handlers —
 * ported verbatim from `TreeItem.vue`. The SFC (which injects the context) and
 * `useTree().getItemSurface()` share ONE derivation.
 */
export function getTreeItemSurface<T extends Record<string, any>>(
  context: TreeRootContext<T>,
  options: TreeItemSurfaceOptions<T>,
): PartSurface<TreeItemState> {
  const { value, level } = options
  const getItems = options.getItems ?? (() => [])
  const { hasChildren, isExpanded, isSelected, isDisabled } = options.status ?? getTreeItemStatus(context, value, options.disabled)

  function handleKeydownRight(ev: KeyboardEvent) {
    if (isDisabled.value)
      return
    if (!hasChildren.value)
      return

    if (isExpanded.value) {
      // go to first child
      const collection = getItems().map(i => i.ref)
      const currentElement = getActiveElement() as HTMLElement
      const currentIndex = collection.indexOf(currentElement)
      const list = [...collection].slice(currentIndex)
      const nextElement = list.find(el => Number(el.getAttribute('data-indent')) === (toValue(level) + 1))

      if (nextElement)
        nextElement.focus()
    }
    else {
      //  open expanded
      handleToggleCustomEvent(ev)
    }
  }

  function handleKeydownLeft(ev: KeyboardEvent) {
    if (isDisabled.value)
      return
    if (isExpanded.value) {
      //  close expanded
      handleToggleCustomEvent(ev)
    }
    else {
      // go back to parent
      const collection = getItems().map(i => i.ref)
      const currentElement = getActiveElement() as HTMLElement
      const currentIndex = collection.indexOf(currentElement)
      const list = [...collection].slice(0, currentIndex).reverse()
      const parentElement = list.find(el => Number(el.getAttribute('data-indent')) === (toValue(level) - 1))

      if (parentElement)
        parentElement.focus()
    }
  }

  function handleSelect(ev: SelectEvent<T>) {
    if (isDisabled.value)
      return
    options.onSelect?.(ev)
    if (ev?.defaultPrevented)
      return

    const originalEvent = ev.detail.originalEvent
    context.onSelect(toValue(value), itemReason(originalEvent), originalEvent)
  }

  function handleToggle(ev: ToggleEvent<T>) {
    if (isDisabled.value)
      return
    options.onToggle?.(ev)
    if (ev?.defaultPrevented)
      return

    const originalEvent = ev.detail.originalEvent
    context.onToggle(toValue(value), itemReason(originalEvent), originalEvent)
  }

  function handleSelectCustomEvent(ev?: PointerEvent | KeyboardEvent) {
    if (!ev)
      return

    const eventDetail = { originalEvent: ev, value: toValue(value), isExpanded: isExpanded.value, isSelected: isSelected.value }
    handleAndDispatchCustomEvent(TREE_SELECT, handleSelect, eventDetail)
  }

  function handleToggleCustomEvent(ev?: PointerEvent | KeyboardEvent) {
    if (!ev)
      return

    const eventDetail = { originalEvent: ev, value: toValue(value), isExpanded: isExpanded.value, isSelected: isSelected.value }
    handleAndDispatchCustomEvent(TREE_TOGGLE, handleToggle, eventDetail)
  }

  // `@keydown.enter.space.self.prevent`, `@keydown.right.self.prevent`,
  // `@keydown.left.self.prevent`: the key check, then `.self`, then `.prevent`.
  function onKeydown(ev: KeyboardEvent) {
    const isSelectKey = ev.key === 'Enter' || ev.key === ' '
    const isArrow = ev.key === 'ArrowRight' || ev.key === 'ArrowLeft'
    if (!isSelectKey && !isArrow)
      return
    if (ev.target !== ev.currentTarget)
      return
    ev.preventDefault()

    if (isSelectKey)
      handleSelectCustomEvent(ev)
    else if ((ev.key === 'ArrowRight') === (context.dir.value === 'ltr'))
      handleKeydownRight(ev)
    else
      handleKeydownLeft(ev)
  }

  // `@click.stop`
  function onClick(ev: PointerEvent) {
    ev.stopPropagation()
    handleSelectCustomEvent(ev)
    handleToggleCustomEvent(ev)
  }

  return createPartSurface<TreeItemState>(
    () => ({
      'role': 'treeitem',
      'aria-selected': isSelected.value,
      'aria-expanded': hasChildren.value ? isExpanded.value : undefined,
      'aria-level': toValue(level),
      'aria-disabled': isDisabled.value ? true : undefined,
      // A functional selector: ArrowLeft/ArrowRight and the virtualizer walk
      // the levels through it (same exemption as `data-reka-collection-item`).
      'data-indent': toValue(level),
      onKeydown,
      onClick,
    }),
    () => ({ selected: isSelected.value, expanded: isExpanded.value, disabled: isDisabled.value }),
  )
}

/**
 * A form control rendered inside a tree item — an inline rename, a per-row
 * filter or picker — owns its own keys. Without this, typing into it drives
 * tree typeahead and selection, moving focus to another row mid-edit. `select`
 * counts too: it consumes character keys for its own option typeahead and
 * Shift+Arrow to extend a multiple selection.
 *
 * Same idea as the guard in `MenuContentImpl`, widened past `input`/`textarea`.
 */
const KEY_OWNING_TAGS = ['input', 'textarea', 'select']

function isKeyDownInFormField(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (!target)
    return false
  return KEY_OWNING_TAGS.includes(target.tagName.toLowerCase()) || target.isContentEditable
}

/** Key identity of two selections: single values by `getKey`, arrays entry by entry. */
function isSameSelection<T>(getKey: (val: T) => string) {
  const keyOf = (val: T | undefined) => val == null ? val : getKey(val)
  return (a: T | T[] | undefined, b: T | T[] | undefined) => {
    if (Array.isArray(a) && Array.isArray(b))
      return a.length === b.length && a.every((value, index) => keyOf(value) === keyOf(b[index]))
    if (Array.isArray(a) || Array.isArray(b))
      return false
    if (a == null || b == null)
      return a === b
    return keyOf(a) === keyOf(b)
  }
}

function isSameKeys(a: string[], b: string[]) {
  return a.length === b.length && a.every((key, index) => key === b[index])
}

export interface UseTreeProps<T extends Record<string, any> = Record<string, any>> {
  /** List of items. */
  items?: MaybeRefOrGetter<T[] | undefined>
  /**
   * Returns a unique key for an item. Identity for selection and expansion.
   * A plain function (wrap a prop as `v => props.getKey(v)` to keep it live).
   */
  getKey: (val: T) => string
  /**
   * Returns an item's children. `undefined` marks a leaf; an array, even an
   * empty one, marks an expandable branch (children loaded on expand).
   * @defaultValue `val => val.children`
   */
  getChildren?: (val: T) => T[] | undefined
  /**
   * Controlled selection. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<T | T[] | undefined>
  /** Initial selection when uncontrolled. Defaults to `[]` when `multiple`, else `undefined`. */
  defaultValue?: T | T[]
  /** Controlled expanded keys, same modes as `modelValue`. */
  expanded?: MaybeRefOrGetter<string[] | undefined>
  /** Initial expanded keys when uncontrolled. @defaultValue `[]` */
  defaultExpanded?: string[]
  /** @defaultValue `false` */
  multiple?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `'toggle'` */
  selectionBehavior?: MaybeRefOrGetter<'toggle' | 'replace' | undefined>
  /** @defaultValue `false` */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** Resolved reading direction (the SFC hands its `useDirection` ref). @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** Selecting a parent selects its descendants (requires `multiple`). @defaultValue `false` */
  propagateSelect?: MaybeRefOrGetter<boolean | undefined>
  /** Selecting children updates the parent (requires `multiple`). @defaultValue `false` */
  bubbleSelect?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `false` */
  loop?: MaybeRefOrGetter<boolean | undefined>
  /**
   * The roving-focus items in DOM order (the SFC hands
   * `RovingFocusGroup.getItems()`), for typeahead and Shift range selection —
   * the seam a composable cannot own itself. Defaults to an empty collection.
   */
  getItems?: () => TreeCollectionItem[]
  /** Component `emit`; receives `beforeUpdate:modelValue` / `update:modelValue` and `beforeUpdate:expanded` / `update:expanded`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a selection change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: T | T[] | undefined, details: ChangeEventDetails<TreeChangeReason>) => void
  /** Called after a selection change commits. */
  onUpdate?: (value: T | T[] | undefined, details: ChangeEventDetails<TreeChangeReason>) => void
  /** Called before an expanded-keys change commits; `details.cancel()` vetoes it. */
  onBeforeUpdateExpanded?: (value: string[], details: ChangeEventDetails<TreeExpandedChangeReason>) => void
  /** Called after an expanded-keys change commits. */
  onUpdateExpanded?: (value: string[], details: ChangeEventDetails<TreeExpandedChangeReason>) => void
}

export interface UseTreeReturn<T extends Record<string, any> = Record<string, any>> {
  modelValue: ComputedRef<T | T[] | undefined>
  expanded: ComputedRef<string[]>
  selectedKeys: ComputedRef<string[]>
  /** The visible items (expanded branches flattened), in render order. */
  flattenItems: ComputedRef<FlattenedItem<T>[]>
  /**
   * Select an item following `multiple` / `selectionBehavior`, folding in
   * `propagateSelect` / `bubbleSelect`. Returns `false` when unchanged or cancelled.
   */
  select: (value: T, reason?: TreeChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Write the whole selection (no toggle rules). Returns `false` when unchanged or cancelled. */
  setModelValue: (value: T | T[] | undefined, reason?: TreeChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Expand or collapse an item that has children. Returns `false` when it has none, or when cancelled. */
  toggle: (value: T, reason?: TreeExpandedChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Write the expanded keys. Returns `false` when unchanged or cancelled. */
  setExpanded: (value: string[], reason?: TreeExpandedChangeReason | BaseChangeReason, event?: Event) => boolean
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<TreeChangeReason>>>
  lastExpandedChangeDetails: Readonly<Ref<ChangeEventDetails<TreeExpandedChangeReason>>>
  isControlled: ComputedRef<boolean>
  isExpandedControlled: ComputedRef<boolean>
  /** The `role="tree"` surface, with the typeahead and Shift-range keydown. */
  root: PartSurface<Record<string, never>>
  /** Per-item surface built from `(context, options)`. */
  getItemSurface: (options: TreeItemSurfaceOptions<T>) => PartSurface<TreeItemState>
  /** Per-item state (`isSelected`, `isExpanded`, `isIndeterminate`, …). */
  getItemStatus: (value: MaybeRefOrGetter<T>, disabled?: MaybeRefOrGetter<boolean | undefined>) => TreeItemStatus
  context: TreeRootContext<T>
}

/**
 * Headless Tree logic: the selection model (single/multiple, `toggle` /
 * `replace`, `propagateSelect`, `bubbleSelect`, Shift range), the expanded
 * keys, the flattened visible items, typeahead and the item keyboard model.
 * The `.vue` shells compose this; a standalone consumer gets all of the above
 * but must wrap items in `RovingFocusGroup` / `RovingFocusItem` for arrow-key
 * focus and hand in `getItems` (the rendered items in DOM order) — component
 * wrappers a composable cannot absorb. `TreeVirtualizer` stays a component.
 *
 * SSR-safe (the DOM is only touched inside event handlers) and callable
 * outside `setup()` (computed-only).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useTree<T extends Record<string, any> = Record<string, any>>(props: UseTreeProps<T>): UseTreeReturn<T> {
  const getKey = (val: T) => props.getKey(val)
  const getChildren = (val: T): T[] | undefined => props.getChildren ? props.getChildren(val) : val.children
  const getItems = props.getItems ?? (() => [])
  const { handleTypeaheadSearch } = useTypeahead()

  const items = computed<T[] | undefined>(() => toValue(props.items))
  const multiple = computed(() => toValue(props.multiple) ?? false)
  const selectionBehavior = computed(() => toValue(props.selectionBehavior) ?? 'toggle')
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const propagateSelect = computed(() => toValue(props.propagateSelect) ?? false)
  const bubbleSelect = computed(() => toValue(props.bubbleSelect) ?? false)
  const loop = computed(() => toValue(props.loop) ?? false)

  // `propagateSelect` / `bubbleSelect` only act on a `multiple` selection;
  // warn once, at the first press where the flag is ignored.
  let hasWarnedSelectWithoutMultiple = false
  function warnSelectWithoutMultiple() {
    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV === 'production' || hasWarnedSelectWithoutMultiple || multiple.value)
      return
    const flags = [propagateSelect.value && '`propagateSelect`', bubbleSelect.value && '`bubbleSelect`'].filter(Boolean)
    if (!flags.length)
      return
    hasWarnedSelectWithoutMultiple = true
    console.warn(`[reka-ui] TreeRoot: ${flags.join(' and ')} require \`multiple\`; ignored for a single selection.`)
  }

  const {
    state: modelValue,
    setState: setModelState,
    lastChangeDetails,
    isControlled,
  } = useControllableState<T | T[] | undefined, TreeChangeReason>({
    prop: props.modelValue,
    defaultValue: () => props.defaultValue ?? (multiple.value ? [] : undefined),
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
    isEqual: isSameSelection(getKey),
  })

  const {
    state: expandedState,
    setState: setExpandedState,
    lastChangeDetails: lastExpandedChangeDetails,
    isControlled: isExpandedControlled,
  } = useControllableState<string[], TreeExpandedChangeReason>({
    prop: props.expanded,
    defaultValue: () => props.defaultExpanded ?? [],
    name: 'expanded',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdateExpanded,
    onUpdate: props.onUpdateExpanded,
    isEqual: (a, b) => isSameKeys(a ?? [], b ?? []),
  })
  // A controlled `expanded` cleared to `undefined` reads as nothing expanded.
  const expanded = computed<string[]>(() => expandedState.value ?? [])

  // Virtualizer
  const isVirtual = ref(false)
  const virtualKeydownHook = createEventHook<KeyboardEvent>()

  const selectedKeys = computed(() => {
    const value = modelValue.value
    if (Array.isArray(value))
      return multiple.value ? value.map(i => getKey(i)) : []
    // v2 passed an empty object to `getKey` for an empty single selection.
    return [getKey(value ?? ({} as T))]
  })

  function flattenItems(items: T[], level: number = 1, parentItem?: T): FlattenedItem<T>[] {
    return items.reduce((acc: FlattenedItem<T>[], item: T, index: number) => {
      const key = getKey(item)
      const children = getChildren(item)
      const isExpanded = expanded.value.includes(key)

      const flattenedItem: FlattenedItem<T> = {
        _id: key,
        value: item,
        index,
        level,
        parentItem,
        hasChildren: !!children,
        bind: {
          'value': item,
          level,
          'aria-setsize': items.length,
          'aria-posinset': index + 1,
        },
      }
      acc.push(flattenedItem)

      if (children && isExpanded)
        acc.push(...flattenItems(children, level + 1, item))

      return acc
    }, [])
  }

  const expandedItems = computed(() => flattenItems(items.value ?? []))

  // The anchor of a `multiple` + `'replace'` selection; Shift ranges start here.
  const firstValue = ref<T>() as Ref<T | undefined>

  function setModelValue(value: T | T[] | undefined, reason: TreeChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setModelState(value, reason, event)
  }

  function setExpanded(value: string[], reason: TreeExpandedChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setExpandedState(value, reason, event)
  }

  /** The `useSelectionBehavior` rules, computed into a new value instead of written. */
  function nextSelection(current: T | T[] | undefined, val: T, condition: (existing: T | undefined) => boolean): { value: T | T[] | undefined, anchor: boolean } {
    // multiple select
    if (multiple.value && Array.isArray(current)) {
      if (selectionBehavior.value === 'replace')
        return { value: [val], anchor: true }
      const index = current.findIndex(v => condition(v))
      if (index !== -1)
        return { value: current.filter((_, i) => i !== index), anchor: false }
      return { value: [...current, val], anchor: false }
    }
    // single select
    if (selectionBehavior.value === 'replace')
      return { value: { ...val }, anchor: false }
    if (!Array.isArray(current) && condition(current))
      return { value: undefined, anchor: false }
    return { value: { ...val }, anchor: false }
  }

  function bubble(model: T[], item: FlattenedItem<T>): T[] {
    if (item.parentItem == null)
      return model
    const parentItem = expandedItems.value.find((i) => {
      return item.parentItem != null && getKey(i.value) === getKey(item.parentItem)
    })
    if (parentItem == null)
      return model

    const parentKey = getKey(parentItem.value)
    const areAllChildrenOfParentSelected = getChildren(parentItem.value)?.every(i => model.find(v => getKey(v) === getKey(i)))
    const isParentSelected = model.some(v => getKey(v) === parentKey)
    // A parent that is already selected is not added a second time (v2 did,
    // which left a duplicate entry the next press only removed once).
    const next = areAllChildrenOfParentSelected
      ? (isParentSelected ? model : [...model, parentItem.value])
      : model.filter(v => getKey(v) !== parentKey)

    return bubble(next, parentItem)
  }

  /**
   * One selection, with `bubbleSelect` and `propagateSelect` folded in, so a
   * single cancellable `beforeUpdate` / `update` pair reports the whole change.
   * Keys already in the selection are never added twice.
   */
  function select(val: T, reason: TreeChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    warnSelectWithoutMultiple()
    const current = toRaw(modelValue.value)
    const condition = (baseValue: T | undefined) => getKey(baseValue ?? ({} as T)) === getKey(val)
    const exist = multiple.value && Array.isArray(current) ? current.findIndex(condition) !== -1 : undefined
    const { value, anchor } = nextSelection(current, val, condition)
    let next = value

    if (bubbleSelect.value && multiple.value && Array.isArray(next)) {
      const item = expandedItems.value.find(i => getKey(i.value) === getKey(val))
      if (item != null)
        next = bubble(next, item)
    }

    if (propagateSelect.value && multiple.value && Array.isArray(next)) {
      const children = flatten(getChildren(val) ?? [], getChildren)
      const selected = next
      next = exist
        // remove all child
        ? selected.filter(i => !children.some(child => getKey(i) === getKey(child)))
        // select all child, skipping the ones already selected
        : [...selected, ...children.filter(child => !selected.some(i => getKey(i) === getKey(child)))]
    }

    // The anchor follows every press that is not cancelled: a committed
    // replace, and a re-press of the current selection (a no-op write).
    const detailsBefore = lastChangeDetails.value
    const changed = setModelValue(next, reason, event)
    if (anchor && (changed || lastChangeDetails.value === detailsBefore))
      firstValue.value = val
    return changed
  }

  function toggle(val: T, reason: TreeExpandedChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const children = val ? getChildren(val) : undefined
    if (!children)
      return false

    const key = getKey(val) ?? val
    if (expanded.value.includes(key))
      return setExpanded(expanded.value.filter(val => val !== key), reason, event)
    else
      return setExpanded([...expanded.value, key], reason, event)
  }

  function handleMultipleReplace(intent: TreeNavigationIntent, currentElement: HTMLElement | Element | null, getCollection: () => TreeCollectionItem[], options: T[], event?: Event) {
    const anchor = firstValue.value
    if (!anchor || !multiple.value || !Array.isArray(modelValue.value))
      return false

    const collection = getCollection().filter(i => !isDisabledItem(i.ref))
    const lastValue = collection.find(i => i.ref === currentElement)?.value
    if (!lastValue)
      return false

    let value: T[] | null = null
    switch (intent) {
      case 'prev':
      case 'next': {
        value = findValuesBetween(options, anchor, lastValue)
        break
      }
      case 'first': {
        value = findValuesBetween(options, anchor, options[0])
        break
      }
      case 'last': {
        value = findValuesBetween(options, anchor, options.at(-1) as T)
        break
      }
    }
    if (value == null)
      return false

    return setModelValue(value, 'range-select', event)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (isKeyDownInFormField(event))
      return

    if (isVirtual.value) {
      virtualKeydownHook.trigger(event)
    }
    else {
      const collections = getItems()
      handleTypeaheadSearch(event.key, collections)
    }
  }

  // `@keydown.up.down.shift`
  function handleKeydownNavigation(event: KeyboardEvent) {
    if (!(event.key === 'ArrowUp' || event.key === 'ArrowDown') || !event.shiftKey)
      return
    if (isVirtual.value || isKeyDownInFormField(event))
      return

    const intent = MAP_KEY_TO_FOCUS_INTENT[event.key] as TreeNavigationIntent
    nextTick(() => {
      handleMultipleReplace(
        intent,
        getActiveElement(),
        getItems,
        expandedItems.value.map(i => i.value),
        event,
      )
    })
  }

  const context: TreeRootContext<T> = {
    modelValue,
    selectedKeys,
    onSelect: select,
    setModelValue,
    expanded,
    onToggle: toggle,
    setExpanded,
    getKey,
    getChildren,
    items,
    expandedItems,
    disabled,
    multiple,
    dir,
    propagateSelect,
    bubbleSelect,
    loop,

    isVirtual,
    virtualKeydownHook: virtualKeydownHook as EventHook<KeyboardEvent>,
    handleMultipleReplace,
  }
  // Only inside a scope (each owns a watcher); outside one, items fall back
  // to scanning the key arrays.
  if (getCurrentScope()) {
    context.expandedSelector = createKeyedSetSelector(() => new Set(expanded.value))
    context.selectedSelector = createKeyedSetSelector(() => new Set(selectedKeys.value))
  }

  const root = createPartSurface<Record<string, never>>(
    () => ({
      'role': 'tree',
      'aria-multiselectable': multiple.value ? true : undefined,
      'onKeydown': (event: KeyboardEvent) => {
        handleKeydown(event)
        handleKeydownNavigation(event)
      },
    }),
    () => ({}),
  )

  return {
    modelValue,
    expanded,
    selectedKeys,
    flattenItems: expandedItems,
    select,
    setModelValue,
    toggle,
    setExpanded,
    lastChangeDetails,
    lastExpandedChangeDetails,
    isControlled,
    isExpandedControlled,
    root,
    getItemSurface: options => getTreeItemSurface(context, options),
    getItemStatus: (value, disabled) => getTreeItemStatus(context, value, disabled),
    context,
  }
}
