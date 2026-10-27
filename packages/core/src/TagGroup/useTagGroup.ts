import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { TagGroupItemContext } from './TagGroupItem.vue'
import type { TagGroupItemRegistration, TagGroupRootContext, TagGroupSelectionMode } from './TagGroupRoot.vue'
import type { BaseChangeReason, By, ChangeEventDetails, PartSurface, SelectionState } from '@/shared'
import type { AcceptableValue, Direction } from '@/shared/types'
import { computed, nextTick, ref, shallowReactive, toValue } from 'vue'
import { compare, createPartSurface, getActiveElement, selectionState, useControllableState, useTypeahead, valueComparator } from '@/shared'

/**
 * Why the selection changed; carried as `details.reason` on every change (#2828).
 * - `item-press`: a tag was clicked.
 * - `item-keydown`: <kbd>Enter</kbd> / <kbd>Space</kbd> on a tag.
 * - `escape-key`: <kbd>Escape</kbd> cleared the selection.
 * - `delete-press`: a tag's delete button removed a selected tag.
 * - `delete-key`: <kbd>Backspace</kbd> / <kbd>Delete</kbd> removed selected tags.
 */
export type TagGroupChangeReason = 'item-press' | 'item-keydown' | 'escape-key' | 'delete-press' | 'delete-key'

export type TagGroupRootState = { disabled: boolean, empty: boolean }
/** `state` is `undefined` (no `data-state`) when `selectionMode` is `'none'`. */
export type TagGroupItemState = { state: SelectionState | undefined, disabled: boolean }
export type TagGroupItemDeleteState = { disabled: boolean }

type TagGroupValue<T> = T | Array<T> | undefined

let count = 0

export interface UseTagGroupProps<T = AcceptableValue> {
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled; a
   * writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<TagGroupValue<T>>
  /** Initial value when uncontrolled. Defaults to `[]` in `multiple` mode, else `undefined`. */
  defaultValue?: TagGroupValue<T>
  /** @defaultValue `'none'` */
  selectionMode?: MaybeRefOrGetter<TagGroupSelectionMode | undefined>
  disallowEmptySelection?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `'clearSelection'` */
  escapeKeyBehavior?: MaybeRefOrGetter<'clearSelection' | 'none' | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  by?: MaybeRefOrGetter<By<T> | undefined>
  /** Whether tags can be removed. Defaults to whether `onRemove` is given. The SFC passes "has a `remove` listener". */
  allowsRemoving?: () => boolean
  /**
   * Whether the group has mounted. Items register during their setup, so the
   * group reads "empty" only once mounted. Defaults to `true`.
   */
  mounted?: MaybeRefOrGetter<boolean>
  /** The group element, focused once the last focused tag is removed. */
  rootElement?: MaybeRefOrGetter<HTMLElement | undefined>
  /**
   * Base for the standalone item ids: `createItem` derives `${baseId}-item-${n}` from a per-call
   * counter, so the ids are SSR-stable when `baseId` is. Without it, ids come from a module
   * counter that is not. The SFCs allocate ids with `useId`.
   */
  baseId?: string
  /** Component `emit`; receives `beforeUpdate:modelValue`, `update:modelValue` and `remove`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a selection change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: TagGroupValue<T>, details: ChangeEventDetails<TagGroupChangeReason>) => void
  /** Called after a selection change commits. */
  onUpdate?: (value: TagGroupValue<T>, details: ChangeEventDetails<TagGroupChangeReason>) => void
  /** Called with the values the user removes. Remove them from your own list. */
  onRemove?: (values: T[]) => void
}

export interface CreateTagGroupItemOptions<T = AcceptableValue> {
  value: MaybeRefOrGetter<T>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** Accessible name and typeahead text; defaults to the text element's, then the row's text. */
  textValue?: MaybeRefOrGetter<string | undefined>
  /** The row element, used for ordering, typeahead and focus restore. */
  element: MaybeRefOrGetter<HTMLElement | undefined>
  /** Row id; the SFC passes a `useId` id. */
  id?: string
}

export interface TagGroupItemInstance {
  row: PartSurface<TagGroupItemState>
  isSelected: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  /** The context `TagGroupItemDelete` / `TagGroupItemText` inject. */
  context: TagGroupItemContext
  /** Call when the item unmounts; moves focus off the row if it held it. */
  unregister: () => void
}

export interface UseTagGroupReturn<T = AcceptableValue> {
  modelValue: ComputedRef<TagGroupValue<T>>
  selectedValues: ComputedRef<T[]>
  disabled: ComputedRef<boolean>
  isEmpty: ComputedRef<boolean>
  isSelected: (value: T) => boolean
  /** Select or deselect a tag. Returns `false` when unchanged or cancelled. */
  toggleSelection: (value: T, reason?: TagGroupChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Replace the selection. Returns `false` when unchanged or cancelled. */
  setSelection: (values: T[], reason?: TagGroupChangeReason | BaseChangeReason, event?: Event) => boolean
  /** The tag to focus when a `FieldLabel` is pressed. */
  getFocusTarget: () => HTMLElement | undefined
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<TagGroupChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** The `role="grid"` surface (`role="group"` while empty). */
  root: PartSurface<TagGroupRootState>
  /**
   * Creates and registers one tag. Call exactly once per tag instance and call
   * `unregister()` when it is removed.
   */
  createItem: (options: CreateTagGroupItemOptions<T>) => TagGroupItemInstance
  /** Delete-button surface for a tag created with `createItem`. */
  getItemDeleteSurface: (item: TagGroupItemInstance, options?: { id?: string, disabled?: MaybeRefOrGetter<boolean | undefined> }) => PartSurface<TagGroupItemDeleteState>
  context: TagGroupRootContext<T>
}

/**
 * Per-tag factory shared by `TagGroupItem.vue` and `useTagGroup().createItem`.
 * Creates per-instance state and registers the tag on the group, so call it
 * exactly once per instance.
 * @internal
 */
export function createTagGroupItem<T = AcceptableValue>(
  rootContext: TagGroupRootContext<T>,
  options: CreateTagGroupItemOptions<T>,
): TagGroupItemInstance {
  const id = options.id ?? `reka-tag-group-item-${++count}`
  const textElement = ref<HTMLElement>()
  const element = () => toValue(options.element)
  const value = () => toValue(options.value)

  const disabled = computed(() => Boolean(rootContext.disabled.value || toValue(options.disabled)))
  const isSelected = computed(() => rootContext.isSelected(value()))
  const isTabStop = computed(() => rootContext.currentTabStopId.value === id)
  const selectable = () => rootContext.selectionMode.value !== 'none'

  function getTextValue() {
    return toValue(options.textValue) ?? textElement.value?.textContent?.trim() ?? element()?.textContent?.trim() ?? ''
  }

  function remove(event?: Event) {
    if (!disabled.value)
      rootContext.removeTags(value(), false, 'delete-press', event)
  }

  function onKeydown(event: KeyboardEvent) {
    // Keys pressed on the tag's children (e.g. its delete button) are theirs.
    if (event.target !== event.currentTarget || disabled.value)
      return

    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (!rootContext.allowsRemoving())
          return
        event.preventDefault()
        rootContext.removeTags(value(), true, 'delete-key', event)
        return
      case 'Enter':
      case ' ':
        if (!selectable())
          return
        event.preventDefault()
        rootContext.toggleSelection(value(), 'item-keydown', event)
        return
    }

    if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey)
      rootContext.handleTypeahead(event.key)
  }

  const row = createPartSurface<TagGroupItemState>(
    () => ({
      'id': id,
      'role': 'row',
      'aria-label': toValue(options.textValue),
      'aria-selected': selectable() ? isSelected.value : undefined,
      'aria-disabled': disabled.value || undefined,
      'onClick': (event: MouseEvent) => {
        if (!disabled.value)
          rootContext.toggleSelection(value(), 'item-press', event)
      },
      'onKeydown': onKeydown,
    }),
    () => ({
      state: selectable() ? selectionState(isSelected.value) : undefined,
      disabled: disabled.value,
    }),
  )

  // Registered on creation (the SFC creates it during setup) so the group
  // knows it has tags on its first render.
  const unregisterItem = rootContext.registerItem({
    value: value as () => AcceptableValue,
    element,
    disabled: () => disabled.value,
    textValue: getTextValue,
  })

  function unregister() {
    const el = element()
    if (el?.contains(getActiveElement()))
      rootContext.onFocusedItemUnmount(el)
    unregisterItem()
  }

  const context: TagGroupItemContext = { id, disabled, isTabStop, textElement, remove }

  return { row, isSelected, disabled, context, unregister }
}

/**
 * Delete-button surface, derived from the item context. Shared by
 * `TagGroupItemDelete.vue` and `useTagGroup().getItemDeleteSurface`. The
 * tag-dependent `type` / `disabled` attributes stay with the caller.
 * @internal
 */
export function getTagGroupItemDeleteSurface(
  itemContext: TagGroupItemContext,
  options: { id?: string, disabled?: MaybeRefOrGetter<boolean | undefined> } = {},
): PartSurface<TagGroupItemDeleteState> {
  const id = options.id ?? `${itemContext.id}-delete`
  const disabled = computed(() => Boolean(itemContext.disabled.value || toValue(options.disabled)))

  return createPartSurface<TagGroupItemDeleteState>(
    () => ({
      'id': id,
      'aria-label': 'Remove',
      'aria-labelledby': `${id} ${itemContext.id}`,
      // Only the focused tag's button is tabbable, so Tab moves from a tag to
      // its delete button and then out of the group, like React Aria.
      'tabindex': itemContext.isTabStop.value ? 0 : -1,
      'onClick': (event: MouseEvent) => {
        // The tag itself toggles selection on click.
        event.stopPropagation()
        if (disabled.value) {
          event.preventDefault()
          return
        }
        itemContext.remove(event)
      },
    }),
    () => ({ disabled: disabled.value }),
  )
}

/**
 * Headless TagGroup logic: the selection model, removal, item registration,
 * typeahead and the group / tag / delete-button surfaces. Standalone consumers
 * get ids, aria, selection and removal, but must compose `RovingFocusGroup` /
 * `RovingFocusItem` themselves for arrow-key navigation and the tab stop
 * (`context.currentTabStopId`), as the SFCs do.
 *
 * SSR-safe (no `document` at call scope) and callable outside `setup()`: no
 * lifecycle hooks. Without `baseId` (or an `id` per `createItem`), item ids come
 * from a module counter, which is not SSR-stable; pass one when rendering on the server.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useTagGroup<T extends AcceptableValue = AcceptableValue>(props: UseTagGroupProps<T> = {}): UseTagGroupReturn<T> {
  // Per-call: ids derived from `baseId` depend only on the base and creation order, so a
  // server render and its hydration agree (a module counter keeps growing across requests).
  let itemCount = 0
  const selectionMode = computed<TagGroupSelectionMode>(() => toValue(props.selectionMode) ?? 'none')
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const by = () => toValue(props.by)

  function toArray(value: TagGroupValue<T>): T[] {
    if (value === undefined || value === null)
      return []
    return Array.isArray(value) ? value : [value]
  }

  // Equal when both hold the same entries in the same order (or the same single value).
  function isEqualValue(a: TagGroupValue<T>, b: TagGroupValue<T>) {
    if (Array.isArray(a) !== Array.isArray(b))
      return false
    if (!Array.isArray(a))
      return a === b || (a != null && b != null && compare(a as T, b as T, by()))
    const bArray = b as T[]
    return a.length === bArray.length && a.every((item, index) => compare(item, bArray[index], by()))
  }

  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<TagGroupValue<T>, TagGroupChangeReason>({
    prop: props.modelValue,
    defaultValue: () => props.defaultValue ?? (toValue(props.selectionMode) === 'multiple' ? [] : undefined),
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
    isEqual: isEqualValue,
  })

  const selectedValues = computed<T[]>(() => toArray(modelValue.value))

  function isSelected(value: T) {
    return selectionMode.value !== 'none' && valueComparator(selectedValues.value, value, by())
  }

  function setSelection(values: T[], reason: TagGroupChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setState(selectionMode.value === 'multiple' ? values : values[0], reason, event)
  }

  function toggleSelection(value: T, reason: TagGroupChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    if (selectionMode.value === 'none' || disabled.value)
      return false

    if (isSelected(value)) {
      const next = selectedValues.value.filter(item => !compare(item, value, by()))
      if (toValue(props.disallowEmptySelection) && next.length === 0)
        return false
      return setSelection(next, reason, event)
    }
    return setSelection(selectionMode.value === 'multiple' ? [...selectedValues.value, value] : [value], reason, event)
  }

  function allowsRemoving() {
    return props.allowsRemoving ? props.allowsRemoving() : Boolean(props.onRemove)
  }

  const items = shallowReactive(new Set<TagGroupItemRegistration>())

  function getOrderedItems() {
    return Array.from(items, item => ({ ...item, el: item.element() }))
      .filter((item): item is TagGroupItemRegistration & { el: HTMLElement } => !!item.el)
      .sort((a, b) => a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
  }

  function isDisabledValue(value: T) {
    return [...items].some(item => item.disabled() && compare(item.value() as T, value, by()))
  }

  function removeTags(value: T, withSelection: boolean, reason: TagGroupChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    if (!allowsRemoving() || disabled.value)
      return

    // Removing a selected tag with the keyboard removes the whole selection,
    // except for disabled tags, which the user cannot interact with.
    const values = withSelection && isSelected(value)
      ? selectedValues.value.filter(selected => !isDisabledValue(selected))
      : [value]
    if (values.some(item => isSelected(item))) {
      const next = selectedValues.value.filter(item => !valueComparator(values, item, by()))
      const previousDetails = lastChangeDetails.value
      const changed = setSelection(next, reason, event)
      // A deselect cancelled in `beforeUpdate:modelValue` cancels the removal
      // too: the tags stay selected, so they must not be reported as removed.
      // (`false` without new cancelled details means "unchanged" — still remove.)
      if (!changed && lastChangeDetails.value !== previousDetails && lastChangeDetails.value.isCanceled)
        return
    }
    // Order: `beforeUpdate:modelValue` → `update:modelValue` → `remove`.
    props.onRemove?.(values)
    props.emit?.('remove', values)
  }

  function registerItem(item: TagGroupItemRegistration) {
    items.add(item)
    return () => items.delete(item)
  }

  const isEmpty = computed(() => (toValue(props.mounted) ?? true) && items.size === 0)

  // When the focused tag is removed, move focus to the next remaining tag, or
  // the previous one if it was the last, or the group itself once it is empty.
  let pendingFocusRestore = false
  function onFocusedItemUnmount(element: HTMLElement) {
    if (pendingFocusRestore)
      return
    pendingFocusRestore = true

    const snapshot = getOrderedItems()
    const index = snapshot.findIndex(item => item.el === element)
    const isCandidate = (item: typeof snapshot[number]) => item.el.isConnected && !item.disabled()

    nextTick(() => {
      pendingFocusRestore = false
      const active = getActiveElement()
      if (active && active !== active.ownerDocument.body)
        return

      const next = snapshot.slice(index + 1).find(isCandidate)
        ?? snapshot.slice(0, Math.max(index, 0)).reverse().find(isCandidate)
      const target = next?.el ?? toValue(props.rootElement)
      target?.focus()
    })
  }

  const { handleTypeaheadSearch } = useTypeahead()
  function handleTypeahead(key: string) {
    const candidates = getOrderedItems()
      .filter(item => !item.disabled())
      .map(item => ({ ref: item.el, value: { textValue: item.textValue() } }))
    handleTypeaheadSearch(key, candidates)
  }

  function getFocusTarget() {
    const focusable = getOrderedItems().filter(item => !item.disabled())
    return focusable.find(item => item.el.tabIndex === 0)?.el ?? focusable[0]?.el ?? toValue(props.rootElement)
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || (toValue(props.escapeKeyBehavior) ?? 'clearSelection') !== 'clearSelection' || toValue(props.disallowEmptySelection))
      return
    if (selectionMode.value === 'none' || selectedValues.value.length === 0)
      return
    event.preventDefault()
    event.stopPropagation()
    setSelection([], 'escape-key', event)
  }

  // While focus is inside, additions are announced (e.g. a tag added from an
  // adjacent input), matching React Aria.
  const isFocusWithin = ref(false)

  const context: TagGroupRootContext<T> = {
    modelValue,
    selectionMode,
    disabled,
    currentTabStopId: ref<string | null>(),
    allowsRemoving,
    isSelected,
    toggleSelection,
    removeTags,
    registerItem,
    onFocusedItemUnmount,
    handleTypeahead,
  }

  const root = createPartSurface<TagGroupRootState>(
    () => ({
      'role': isEmpty.value ? 'group' : 'grid',
      // Only set while empty: an explicit `undefined` would override the
      // `tabindex` RovingFocusGroup puts on the group to forward focus to a tag.
      ...(isEmpty.value ? { tabindex: 0 } : {}),
      'aria-multiselectable': !isEmpty.value && selectionMode.value === 'multiple' ? true : undefined,
      'aria-atomic': 'false',
      'aria-relevant': 'additions',
      'aria-live': isFocusWithin.value ? 'polite' : 'off',
      'dir': dir.value,
      'onKeydown': onKeydown,
      'onFocusin': () => {
        isFocusWithin.value = true
      },
      'onFocusout': (event: FocusEvent) => {
        if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node))
          isFocusWithin.value = false
      },
    }),
    () => ({ disabled: disabled.value, empty: isEmpty.value }),
  )

  return {
    modelValue,
    selectedValues,
    disabled,
    isEmpty,
    isSelected,
    toggleSelection,
    setSelection,
    getFocusTarget,
    lastChangeDetails,
    isControlled,
    root,
    createItem: options => createTagGroupItem(context, {
      ...options,
      id: options.id ?? (props.baseId ? `${props.baseId}-item-${++itemCount}` : undefined),
    }),
    getItemDeleteSurface: (item, options) => getTagGroupItemDeleteSurface(item.context, options),
    context,
  }
}
