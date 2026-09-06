import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { SelectEvent } from './ListboxItem.vue'
import type { ListboxRootContext } from './ListboxRoot.vue'
import type { BaseChangeReason, By, ChangeEventDetails, PartSurface, SelectionState } from '@/shared'
import type { AcceptableValue, DataOrientation, Direction } from '@/shared/types'
import { createEventHook } from '@vueuse/core'
import { isClient, refAutoReset } from '@vueuse/shared'
import { computed, nextTick, ref, shallowRef, toValue, watch } from 'vue'
import { getFocusIntent } from '@/RovingFocus/utils'
import { compare, createPartSurface, findValuesBetween, handleAndDispatchCustomEvent, selectionState, useKbd, useListSelection, useTypeahead, valueComparator } from '@/shared'

/**
 * Why the selection changed; carried as `details.reason` on every change (#2828).
 *
 * - `'item-press'`: an item was clicked. Enter on the listbox synthesizes a
 *   `.click()` on the highlighted item, so an Enter selection ALSO arrives as
 *   `'item-press'` (with the synthesized `MouseEvent` as `details.event`).
 * - `'item-keydown'`: Space on a focused item.
 * - `'select-all'`: Meta/Ctrl+A in a `multiple` listbox.
 * - `'range-select'`: Shift+arrow/Home/End extending a `multiple` + `'replace'` selection.
 */
export type ListboxChangeReason = 'item-press' | 'item-keydown' | 'select-all' | 'range-select'

/**
 * What a keydown means for navigation: the four roving-focus moves plus
 * `'select'`, which runs the Enter path (select the highlighted item).
 */
export type ListboxNavigationIntent = 'first' | 'last' | 'prev' | 'next' | 'select'

/** Semantic state of one item (`data-state` / `data-disabled` / `data-highlighted`). */
export type ListboxItemState = { state: SelectionState, disabled: boolean, highlighted: boolean }
/** Semantic state of the content part (`data-orientation`). */
export type ListboxContentState = { orientation: DataOrientation }
/** Semantic state of the root (`data-disabled`). */
export type ListboxState = { disabled: boolean }

/** One collection entry, as `useCollection().getItems()` returns them. */
export interface ListboxCollectionItem<T = AcceptableValue> {
  ref: HTMLElement
  value: T
}

/**
 * The sticky label registry on the root context (#2824): items register the
 * text they render so a value can be displayed after its item unmounted
 * (filtered out, virtualized away). Entries are matched with `by`, the last
 * write for a value wins, and nothing is ever removed automatically.
 */
export interface ListboxLabelRegistry<T = AcceptableValue> {
  register: (value: T, label: string, disabled?: boolean) => void
  get: (value: T) => string | undefined
  entries: () => Array<{ value: T, label: string, disabled: boolean }>
}

const LISTBOX_SELECT = 'listbox.select'

export interface ListboxItemSurfaceOptions<T = AcceptableValue> {
  /**
   * The item's own element (the SFC hands its `useForwardExpose`
   * `currentElement`). Needed for the highlight identity check, the hover
   * highlight and the post-select highlight; without it the item never reads
   * as highlighted.
   */
  element?: MaybeRefOrGetter<HTMLElement | undefined>
  /** The item's DOM id. Omitted from `props` when not given. */
  id?: MaybeRefOrGetter<string | undefined>
  /**
   * The cancellable `listbox.select` custom event — a callback channel, never
   * a merged DOM listener. The SFC passes `e => emits('select', e)`; calling
   * `event.preventDefault()` inside blocks the selection.
   */
  onSelect?: (event: SelectEvent<T>) => void
}

/**
 * The per-item surface, derived purely from `(context, value)`: `role="option"`,
 * the roving `tabindex`, `aria-selected`, the `'' | undefined` `disabled`
 * shape, the click/Space select protocol and the hover highlight — ported
 * verbatim from `ListboxItem.vue`. The SFC (which injects the context) and a
 * standalone `useListboxRoot().getItemSurface()` share ONE derivation.
 */
export function getListboxItemSurface<T extends AcceptableValue = AcceptableValue>(
  context: ListboxRootContext<T>,
  value: MaybeRefOrGetter<T>,
  disabled?: MaybeRefOrGetter<boolean | undefined>,
  options: ListboxItemSurfaceOptions<T> = {},
): PartSurface<ListboxItemState> {
  const isHighlighted = computed(() => {
    const element = toValue(options.element)
    return element != null && element === context.highlightedElement.value
  })
  const isSelected = computed(() => valueComparator(context.modelValue.value, toValue(value), context.by))
  // `rootContext.disabled.value || props.disabled` as in ListboxItem.vue, normalised to a boolean.
  const isDisabled = computed(() => (context.disabled.value || toValue(disabled)) ?? false)
  // `rootContext.focusable.value ? isHighlighted ? '0' : '-1' : -1` — the string/number mix is intentional.
  const tabindex = computed(() => {
    if (!context.focusable.value)
      return -1
    return isHighlighted.value ? '0' : '-1'
  })

  function handleSelect(ev: SelectEvent<T>, reason: ListboxChangeReason) {
    options.onSelect?.(ev)
    if (ev?.defaultPrevented)
      return

    if (!isDisabled.value && ev) {
      context.onValueChange(toValue(value), reason, ev.detail.originalEvent)
      context.changeHighlight(toValue(options.element)!)
    }
  }

  function dispatchSelect(event: Event, reason: ListboxChangeReason) {
    const eventDetail = { originalEvent: event as PointerEvent, value: toValue(value) }
    handleAndDispatchCustomEvent<SelectEvent<T>, PointerEvent>(LISTBOX_SELECT, ev => handleSelect(ev, reason), eventDetail)
  }

  return createPartSurface<ListboxItemState>(
    () => {
      const id = toValue(options.id)
      return {
        // Only when given: an `id: undefined` entry would clobber a consumer id under `mergeProps`.
        ...(id !== undefined && { id }),
        'role': 'option',
        'tabindex': tabindex.value,
        'aria-selected': isSelected.value,
        'disabled': isDisabled.value ? '' : undefined,
        'onClick': (event: PointerEvent) => dispatchSelect(event, 'item-press'),
        // `@keydown.space.prevent`
        'onKeydown': (event: KeyboardEvent) => {
          if (event.key !== ' ')
            return
          event.preventDefault()
          dispatchSelect(event, 'item-keydown')
        },
        'onPointermove': () => {
          const element = toValue(options.element)
          if (context.highlightedElement.value === element)
            return

          if (context.highlightOnHover.value)
            context.changeHighlight(element!, false, false)
        },
      }
    },
    () => ({
      state: selectionState(isSelected.value),
      disabled: isDisabled.value,
      highlighted: isHighlighted.value,
    }),
  )
}

export interface ListboxContentSurfaceOptions {
  /**
   * `true` right after a left mousedown, so the focus that follows a click
   * does not run the keyboard entry highlight (the SFC's `refAutoReset(false, 10)`).
   */
  isClickFocus: Ref<boolean>
}

/**
 * The `role="listbox"` surface, derived purely from the context: the roving
 * `tabindex`, `aria-orientation`, `aria-multiselectable`, the click-vs-keyboard
 * entry focus and ONE keydown handler in today's order of effects — navigation
 * (`preventDefault` only when a navigation key was handled), Enter, typeahead.
 */
export function getListboxContentSurface<T extends AcceptableValue = AcceptableValue>(
  context: ListboxRootContext<T>,
  options: ListboxContentSurfaceOptions,
): PartSurface<ListboxContentState> {
  // `rootContext.focusable.value ? highlightedElement ? '-1' : '0' : '-1'`
  const tabindex = computed(() => {
    if (!context.focusable.value)
      return '-1'
    return context.highlightedElement.value ? '-1' : '0'
  })
  return createPartSurface<ListboxContentState>(
    () => ({
      'role': 'listbox',
      'tabindex': tabindex.value,
      'aria-orientation': context.orientation.value,
      'aria-multiselectable': !!context.multiple.value,
      // `@mousedown.left`
      'onMousedown': (event: MouseEvent) => {
        if (event.button !== 0)
          return
        options.isClickFocus.value = true
      },
      'onFocus': (event: FocusEvent) => {
        if (options.isClickFocus.value)
          return
        context.onEnter(event)
      },
      'onKeydown': (event: KeyboardEvent) => {
        // Was `@keydown.down.up.left.right.home.end` + `@keydown.enter` +
        // `@keydown`, in that order. The key list (and the orientation
        // filtering) now live in the navigation-intent resolution; the default
        // is prevented only for a key that was handled, and a key that already
        // ran the Enter path as a `'select'` intent skips the Enter branch.
        const navigated = context.focusable.value ? context.onKeydownNavigation(event) : false
        if (navigated)
          event.preventDefault()
        else if (event.key === 'Enter')
          context.onKeydownEnter(event)
        context.onKeydownTypeAhead(event)
      },
    }),
    () => ({ orientation: context.orientation.value }),
  )
}

export interface UseListboxRootProps<T = AcceptableValue> {
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<T | T[] | undefined>
  /** Initial value when uncontrolled. Defaults to `[]` when `multiple`, else `undefined`. */
  defaultValue?: T | T[]
  /** Whether multiple options can be selected. @defaultValue `false` */
  multiple?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `'vertical'` */
  orientation?: MaybeRefOrGetter<DataOrientation | undefined>
  /** Resolved reading direction (the SFC hands its `useDirection` ref). @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** @defaultValue `false` */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `'toggle'` */
  selectionBehavior?: MaybeRefOrGetter<'toggle' | 'replace' | undefined>
  /** When `true`, hovering an item highlights it. @defaultValue `false` */
  highlightOnHover?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Identity strategy for object values (a key or an equality function).
   * A plain value, NOT a getter — a comparison function would otherwise be
   * mistaken for a getter.
   */
  by?: By<T>
  /**
   * The single keyboard hook (#2824): resolves what a keydown means. Return
   * `undefined` to fall through to the default `getFocusIntent` mapping
   * (arrows/Home/End/PageUp/PageDown, orientation and direction aware), `null`
   * to say "not a navigation key", or `'select'` to run the Enter path.
   */
  getNavigationIntent?: (event: KeyboardEvent) => ListboxNavigationIntent | null | undefined
  /**
   * The rendered items in DOM order (the SFC injects `useCollection({
   * isProvider: true }).getItems`) — the seam a composable cannot own itself.
   * Defaults to an empty collection.
   */
  getItems?: () => ListboxCollectionItem<T>[]
  /**
   * The root element (the SFC hands its `usePrimitiveElement` `currentElement`);
   * the root `onFocusout` leaves the highlight only when focus moved outside it.
   */
  element?: MaybeRefOrGetter<HTMLElement | null | undefined>
  /** Component `emit`; receives `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: T | T[] | undefined, details: ChangeEventDetails<ListboxChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: T | T[] | undefined, details: ChangeEventDetails<ListboxChangeReason>) => void
  /** Fires when the highlighted item changes (the SFC's `highlight` emit). */
  onHighlight?: (payload: ListboxCollectionItem<T> | undefined) => void
  /** Fires with the cancellable `listbox.entryFocus` event when the content receives focus (the SFC's `entryFocus` emit). */
  onEntryFocus?: (event: CustomEvent) => void
  /** Fires when the highlight leaves the listbox (the SFC's `leave` emit). */
  onLeave?: (event: Event) => void
}

export interface UseListboxRootReturn<T = AcceptableValue> {
  modelValue: ComputedRef<T | T[] | undefined>
  /**
   * Select a value following `multiple` / `selectionBehavior`; returns `false`
   * when unchanged or cancelled. This is what the items call.
   */
  select: (value: T, reason?: ListboxChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Whether `value` is (part of) the current selection, matched with `by`. */
  isSelected: (value: T) => boolean
  highlightedElement: Ref<HTMLElement | null>
  /** Highlight the item holding `value`. */
  highlightItem: (value: T) => void
  /** Highlight the first enabled item on the next tick. */
  highlightFirstItem: () => void
  /** Highlight the selected item (or the first one); `scroll: false` only sets the roving target. */
  highlightSelected: (event?: Event, scroll?: boolean) => Promise<void>
  changeHighlight: (el: HTMLElement, scrollIntoView?: boolean, focus?: boolean) => void
  /** The sticky label registry. */
  labels: ListboxLabelRegistry<T>
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<ListboxChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** The root surface: `dir` + the pointer-leave / focus-out highlight release. */
  root: PartSurface<ListboxState>
  /** The `role="listbox"` surface. */
  content: PartSurface<ListboxContentState>
  /** Per-item surface built from `(context, value)`. */
  getItemSurface: (value: MaybeRefOrGetter<T>, disabled?: MaybeRefOrGetter<boolean | undefined>, options?: ListboxItemSurfaceOptions<T>) => PartSurface<ListboxItemState>
  context: ListboxRootContext<T>
}

/**
 * Headless Listbox root — the selection model (`useListSelection`), the
 * highlight/keyboard/typeahead brain and the context the `.vue` shells provide.
 * A standalone consumer gets selection, `role`/`aria`/`data-*` per part and
 * the keyboard model, but must hand in `getItems` (the rendered items in DOM
 * order) and each item's element — the `Collection` family is a component
 * wrapper a composable cannot absorb.
 *
 * Owns the `modelValue` watcher (mount highlight) and DOM highlight effects,
 * so call it inside `setup()`; SSR-safe (`document`/`window` are never touched
 * at call scope and `highlightSelected` is client-guarded).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup
 */
export function useListboxRoot<T extends AcceptableValue = AcceptableValue>(props: UseListboxRootProps<T> = {}): UseListboxRootReturn<T> {
  const getItems: () => ListboxCollectionItem<T>[] = props.getItems ?? (() => [])
  const { handleTypeaheadSearch } = useTypeahead()
  const kbd = useKbd()

  const multiple = computed(() => toValue(props.multiple) ?? false)
  const orientation = computed<DataOrientation>(() => toValue(props.orientation) ?? 'vertical')
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const selectionBehavior = computed<'toggle' | 'replace'>(() => toValue(props.selectionBehavior) ?? 'toggle')
  const highlightOnHover = computed(() => toValue(props.highlightOnHover) ?? false)

  const isUserAction = ref(false)
  const focusable = ref(true)

  const selection = useListSelection<T, ListboxChangeReason>({
    modelValue: props.modelValue,
    defaultValue: props.defaultValue,
    multiple,
    by: props.by,
    selectionBehavior,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const { modelValue, setModelValue, isSelected, firstValue, lastChangeDetails, isControlled } = selection

  function onValueChange(val: T, reason: ListboxChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    isUserAction.value = true
    const changed = selection.select(val, reason, event)
    setTimeout(() => {
      isUserAction.value = false
    }, 1)
    return changed
  }

  const highlightedElement = ref<HTMLElement | null>(null)
  const previousElement = ref<HTMLElement | null>(null)
  const isVirtual = ref(false)
  const isComposing = ref(false)
  const virtualFocusHook = createEventHook<{ event?: Event, scroll: boolean }>()
  const virtualKeydownHook = createEventHook<KeyboardEvent>()
  const virtualHighlightHook = createEventHook<T>()

  // `ListboxVirtualizer` still assigns `context.modelValue.value` directly for
  // its select-all and shift-range writes, so the context exposes a writable
  // computed whose setter routes through `useListSelection`. Those writes run
  // synchronously inside `virtualKeydownHook.trigger(event)`, so the keyboard
  // event in flight supplies the reason and the event.
  let virtualKeydownEvent: KeyboardEvent | undefined
  function virtualWriteReason(event?: KeyboardEvent): ListboxChangeReason | BaseChangeReason {
    if (!event)
      return 'imperative-action'
    const isMetaKey = event.altKey || event.ctrlKey || event.metaKey
    if (isMetaKey && event.key === 'a')
      return 'select-all'
    if (event.shiftKey)
      return 'range-select'
    return 'imperative-action'
  }
  const contextModelValue = computed<T | T[] | undefined>({
    get: () => modelValue.value,
    set: value => setModelValue(value, virtualWriteReason(virtualKeydownEvent), virtualKeydownEvent),
  })
  function triggerVirtualKeydown(event: KeyboardEvent) {
    virtualKeydownEvent = event
    try {
      return virtualKeydownHook.trigger(event)
    }
    finally {
      virtualKeydownEvent = undefined
    }
  }

  function getCollectionItem() {
    return getItems().map(i => i.ref).filter(i => i.dataset.disabled !== '')
  }

  function changeHighlight(el: HTMLElement, scrollIntoView = true, focus?: boolean) {
    if (!el)
      return

    highlightedElement.value = el
    if (focus ?? focusable.value)
      highlightedElement.value.focus()
    if (scrollIntoView)
      highlightedElement.value.scrollIntoView({ block: 'nearest' })

    const highlightedItem = getItems().find(i => i.ref === el)
    props.onHighlight?.(highlightedItem)
  }

  function highlightItem(value: T) {
    if (isVirtual.value) {
      // @ts-expect-error known type issue https://github.com/vueuse/vueuse/issues/4610
      virtualHighlightHook.trigger(value)
    }
    else {
      const item = getItems().find(i => compare(i.value, value, props.by))
      if (item) {
        highlightedElement.value = item.ref
        changeHighlight(item.ref)
      }
    }
  }

  function onKeydownEnter(event: KeyboardEvent): boolean {
    if (highlightedElement.value && highlightedElement.value.isConnected) {
      // Modifier combos (e.g. Ctrl+Enter) are not handled here —
      // let them bubble so parent listeners can react (e.g. submit a form).
      if (event.ctrlKey || event.metaKey || event.altKey)
        return false

      event.preventDefault()
      event.stopPropagation()

      if (!isComposing.value) {
        highlightedElement.value.click()
      }
      return true
    }
    return false
  }

  function onKeydownTypeAhead(event: KeyboardEvent) {
    if (!focusable.value)
      return
    isUserAction.value = true
    if (isVirtual.value) {
      triggerVirtualKeydown(event)
    }
    else {
      const isMetaKey = event.altKey || event.ctrlKey || event.metaKey

      if (isMetaKey && event.key === 'a' && multiple.value) {
        const collection = getItems()
        const values = collection.map(i => i.value)
        setModelValue([...values], 'select-all', event)
        event.preventDefault()
        const lastItem = collection.at(-1)
        if (lastItem)
          changeHighlight(lastItem.ref)
      }
      else if (!isMetaKey) {
        const el = handleTypeaheadSearch(event.key, getItems())
        if (el)
          changeHighlight(el)
      }
    }
    setTimeout(() => {
      isUserAction.value = false
    }, 1)
  }

  function onCompositionStart() {
    isComposing.value = true
  }
  function onCompositionEnd() {
    nextTick(() => {
      isComposing.value = false
    })
  }

  function highlightFirstItem() {
    nextTick(() => {
      const event = new KeyboardEvent('keydown', { key: 'PageUp' })
      onKeydownNavigation(event)
    })
  }

  function onLeave(event: Event) {
    const el = highlightedElement.value

    if ((el as Node)?.isConnected) {
      previousElement.value = el
    }

    highlightedElement.value = null
    props.onLeave?.(event)
  }

  function onEnter(event: Event) {
    const entryFocusEvent = new CustomEvent('listbox.entryFocus', { bubbles: false, cancelable: true })
    event.currentTarget?.dispatchEvent(entryFocusEvent)
    props.onEntryFocus?.(entryFocusEvent)

    if (entryFocusEvent.defaultPrevented)
      return

    if (previousElement.value) {
      changeHighlight(previousElement.value)
    }
    else {
      const el = getCollectionItem()?.[0]
      changeHighlight(el)
    }
  }

  /** The override first; `undefined` falls through to `getFocusIntent`, `null` means "not a navigation key". */
  function getNavigationIntent(event: KeyboardEvent): ListboxNavigationIntent | undefined {
    const intent = props.getNavigationIntent?.(event)
    if (intent === undefined)
      return getFocusIntent(event, orientation.value, dir.value)
    return intent ?? undefined
  }

  /** Returns `true` when the key was handled, so a shell prevents the default only then. */
  function onKeydownNavigation(event: KeyboardEvent): boolean {
    const intent = getNavigationIntent(event)
    if (!intent)
      return false
    if (intent === 'select')
      return onKeydownEnter(event)

    let collection = getCollectionItem()
    if (highlightedElement.value) {
      if (intent === 'last') {
        collection.reverse()
      }
      else if (intent === 'prev' || intent === 'next') {
        if (intent === 'prev')
          collection.reverse()

        const currentIndex = collection.indexOf(highlightedElement.value)
        collection = collection.slice(currentIndex + 1)
      }
      handleMultipleReplace(event, collection[0])
    }

    if (collection.length) {
      const index = !highlightedElement.value && intent === 'prev' ? collection.length - 1 : 0
      changeHighlight(collection[index])
    }

    if (isVirtual.value)
      triggerVirtualKeydown(event)
    return true
  }

  function handleMultipleReplace(event: KeyboardEvent, targetEl: HTMLElement) {
    if (isVirtual.value || selectionBehavior.value !== 'replace' || !multiple.value || !Array.isArray(modelValue.value))
      return
    const isMetaKey = event.altKey || event.ctrlKey || event.metaKey
    if (isMetaKey && !event.shiftKey)
      return

    if (event.shiftKey) {
      const collection = getItems().filter(i => i.ref.dataset.disabled !== '')
      let lastValue = collection.find(i => i.ref === targetEl)?.value

      if (event.key === kbd.END)
        lastValue = collection.at(-1)?.value
      else if (event.key === kbd.HOME)
        lastValue = collection[0]?.value

      if (!lastValue || !firstValue.value)
        return

      const values = findValuesBetween(collection.map(i => i.value), firstValue.value, lastValue)
      setModelValue(values, 'range-select', event)
    }
  }

  async function highlightSelected(event?: Event, scroll = true) {
    // highlightSelected is called inside a watch with immediate set to true.
    // This results in code execution during SSR.
    // Ensure this code only runs in a browser environment, since it performs
    // DOM-only side effects (focus, scrollIntoView, synthetic KeyboardEvent).
    if (!isClient)
      return
    await nextTick()
    if (isVirtual.value) {
      // Trigger on nextTick for Virtualizer to be mounted.
      // `scroll` is `false` on the initial mount highlight, so the virtualizer sets
      // its roving-tabindex target without focusing/scrolling — otherwise a
      // virtualized Listbox below the fold would pull the page to it on load.
      virtualFocusHook.trigger({ event, scroll })
    }
    else {
      const collection = getCollectionItem()
      const item = collection.find(i => i.dataset.state === 'checked')
      // On the initial (mount) highlight we only set the roving-tabindex target.
      // Focusing/scrolling here would scroll the page to a Listbox the user never
      // interacted with (e.g. one below the fold). Later highlights scroll as before.
      const focus = scroll ? undefined : false
      if (item)
        changeHighlight(item, scroll, focus)
      else if (collection.length)
        changeHighlight(collection[0], scroll, focus)
    }
  }

  // `false` until the initial (mount) modelValue highlight has been queued.
  // Flipped synchronously in the watcher so the "is this the mount highlight?"
  // decision never depends on nextTick ordering, which differs between a client
  // mount and SSR hydration. The intent travels with the call as an argument
  // rather than via a shared flag released on a later tick.
  let hasHighlightedOnMount = false

  // watch for only programmatic changes
  watch(modelValue, () => {
    if (!isUserAction.value) {
      const scroll = hasHighlightedOnMount
      hasHighlightedOnMount = true
      nextTick(() => {
        highlightSelected(undefined, scroll)
      })
    }
  }, { immediate: true, deep: true })

  // Sticky label registry: by-aware, last write wins, never auto-removed.
  const labelEntries = shallowRef<Array<{ value: T, label: string, disabled: boolean }>>([])
  const labels: ListboxLabelRegistry<T> = {
    register: (value, label, disabled = false) => {
      const entry = { value, label, disabled }
      const index = labelEntries.value.findIndex(i => compare(i.value, value, props.by))
      const next = [...labelEntries.value]
      index === -1 ? next.push(entry) : next.splice(index, 1, entry)
      labelEntries.value = next
    },
    get: value => labelEntries.value.find(i => compare(i.value, value, props.by))?.label,
    entries: () => [...labelEntries.value],
  }

  const context: ListboxRootContext<T> = {
    modelValue: contextModelValue,
    onValueChange,
    multiple: multiple as Ref<boolean>,
    orientation: orientation as Ref<DataOrientation>,
    dir: dir as Ref<Direction>,
    disabled: disabled as Ref<boolean>,
    highlightOnHover: highlightOnHover as Ref<boolean>,
    highlightedElement,
    isVirtual,
    virtualFocusHook,
    virtualKeydownHook,
    virtualHighlightHook,
    by: props.by,
    firstValue,
    selectionBehavior: selectionBehavior as Ref<'toggle' | 'replace'>,

    focusable,
    onLeave,
    onEnter,
    changeHighlight,
    onKeydownEnter,
    onKeydownNavigation,
    onKeydownTypeAhead,
    onCompositionStart,
    onCompositionEnd,
    highlightFirstItem,

    labels,
    highlightItem,
    highlightSelected,
    getNavigationIntent,
  }

  const root = createPartSurface<ListboxState>(
    () => ({
      dir: dir.value,
      onPointerleave: onLeave,
      onFocusout: async (event: FocusEvent) => {
        const target = (event.relatedTarget || event.target) as HTMLElement | null
        await nextTick()
        const element = toValue(props.element)
        if (highlightedElement.value && element && !element.contains(target)) {
          onLeave(event)
        }
      },
    }),
    () => ({ disabled: disabled.value }),
  )

  const content = getListboxContentSurface(context, { isClickFocus: refAutoReset(false, 10) })

  return {
    modelValue,
    select: onValueChange,
    isSelected,
    highlightedElement,
    highlightItem,
    highlightFirstItem,
    highlightSelected,
    changeHighlight,
    labels,
    lastChangeDetails,
    isControlled,
    root,
    content,
    getItemSurface: (value, disabled, options) => getListboxItemSurface(context, value, disabled, options),
    context,
  }
}
