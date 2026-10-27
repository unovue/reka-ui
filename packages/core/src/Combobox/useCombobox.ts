import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { ComboboxRootContext } from './ComboboxRoot.vue'
import type { ListboxChangeReason, ListboxFilterFunction, ListboxItemState, ListboxState, UseListboxRootProps, UseListboxRootReturn } from '@/Listbox/useListbox'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import type { AcceptableValue } from '@/shared/types'
import { createEventHook } from '@vueuse/core'
import { computed, isRef, nextTick, ref, toValue } from 'vue'
import { useListboxRoot } from '@/Listbox/useListbox'
import { createPartSurface, disclosureState, getActiveElement, getElementByIdFrom, useComposing, useControllableState, useFilter } from '@/shared'
import { useComboboxContentPositioning } from './useComboboxContentPositioning'

// =============================================================================
// Headless composable for the Combobox family (#2723, #2824).
//
// `useComboboxRoot()` runs `useListboxRoot()` for the selection model, the
// highlight/keyboard brain, the label registry and the shared `filter`, and
// adds the combobox layer on top: the `open` model, the search term, the input
// and the ids. The SFC provides ONE context object as both the Listbox and the
// Combobox root context (the shared root contract of #2824 item 6), so there is
// no nested `ListboxRoot` component any more.
//
// What stays in the SFCs: `PopperRoot`/`PopperContent` (positioning),
// `Presence` (mount/unmount), `FocusScope`/`DismissableLayer` (focus and
// dismissal), `useCollection` (the item registry), `useId` (SSR ids) and the
// input/trigger mount registration.
// =============================================================================

/**
 * Why the selection changed; carried as `details.reason` (#2828).
 *
 * - `'item-press'`: an item was clicked, or Enter selected the highlighted item
 *   (Enter clicks it).
 * - `'clear-press'`: `ComboboxCancel` reset the value (`resetModelValueOnClear`).
 */
export type ComboboxChangeReason = 'item-press' | 'clear-press'

/**
 * Why the combobox opened or closed; carried as `details.reason` (#2828).
 *
 * - `'trigger-press'`: `ComboboxTrigger` was clicked.
 * - `'input-change'`: typing in the input opened it.
 * - `'input-press'` / `'input-focus'`: `openOnClick` / `openOnFocus`.
 * - `'list-navigation'`: ArrowDown/ArrowUp (or a `getNavigationIntent`
 *   mapping to `'next'`/`'prev'`) in the input opened it.
 * - `'item-press'`: selecting an item closed a single-value combobox.
 * - `'escape-key'` / `'outside-press'` / `'focus-outside'`: dismissed; focus
 *   leaving the input for an element outside the combobox is also `'focus-outside'`.
 */
export type ComboboxOpenChangeReason
  = | 'trigger-press'
    | 'input-change'
    | 'input-press'
    | 'input-focus'
    | 'list-navigation'
    | 'item-press'
    | 'escape-key'
    | 'outside-press'
    | 'focus-outside'

/** Semantic state of the trigger (`data-state` / `data-disabled`). */
export type ComboboxTriggerState = { state: DisclosureState, disabled: boolean }
/** Semantic state of the input (`data-disabled`). */
export type ComboboxInputState = { disabled: boolean }
/** Semantic state of the content (`data-state` / `data-empty`). */
export type ComboboxContentState = { state: DisclosureState, empty: boolean }
/** Semantic state of an item; the same as a Listbox item. */
export type ComboboxItemState = ListboxItemState
/** Semantic state of the root (`data-disabled`). */
export type ComboboxState = ListboxState

/** Standalone `useComboboxRoot()` calls without a `baseId` draw `reka-combobox-<n>` from here. */
let comboboxCount = 0

/**
 * The trigger surface (`aria-haspopup`/`aria-expanded`/`aria-controls` +
 * `onClick` → toggle with `'trigger-press'`), derived from the context. The
 * tag-dependent `type` stays in the SFC.
 */
export function getComboboxTriggerSurface(
  context: ComboboxRootContext<any>,
  disabled?: MaybeRefOrGetter<boolean | undefined>,
): PartSurface<ComboboxTriggerState> {
  const isDisabled = computed(() => toValue(disabled) || context.disabled.value || false)
  return createPartSurface<ComboboxTriggerState>(
    () => ({
      'tabindex': '-1',
      'aria-label': 'Show popup',
      'aria-haspopup': 'listbox',
      'aria-expanded': context.open.value,
      'aria-controls': context.contentId,
      'disabled': isDisabled.value,
      'aria-disabled': isDisabled.value,
      'onClick': (event: MouseEvent) => context.onOpenChange(!context.open.value, 'trigger-press', event),
    }),
    () => ({ state: disclosureState(context.open.value), disabled: isDisabled.value }),
  )
}

/**
 * The cancel surface: clears the input (and, with `resetModelValueOnClear`,
 * the value with `'clear-press'`), then the search term.
 */
export function getComboboxCancelSurface(context: ComboboxRootContext<any>): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(
    () => ({
      tabindex: '-1',
      onClick: (event: MouseEvent) => {
        const input = context.inputElement.value
        if (input) {
          input.value = ''
          input.focus()
        }
        if (context.resetModelValueOnClear.value)
          context.clearModelValue(event)
        // Done last: focusing can re-open the popup (`openOnFocus`), which may restore the filter from the previous value.
        context.filterSearch.value = ''
      },
    }),
    () => ({}),
  )
}

/** The content surface: the `id` the input and trigger point at, plus `data-state` and `data-empty`. */
export function getComboboxContentSurface(context: ComboboxRootContext<any>): PartSurface<ComboboxContentState> {
  return createPartSurface<ComboboxContentState>(
    () => ({ id: context.contentId }),
    () => ({ state: disclosureState(context.open.value), empty: context.filterState.value.count === 0 }),
  )
}

export interface ComboboxInputSurfaceOptions {
  /** The text in the input (the SFC's `v-model`); typing writes it. */
  modelValue: Ref<string | undefined>
  /** @defaultValue `false` */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** Called with every committed text change after the search term was updated (Autocomplete writes its model here). */
  onTextChange?: (value: string, event?: Event) => void
  /**
   * Close when focus moves from the input to an element outside the combobox
   * and its content. Autocomplete leaves it to the dismissable layer.
   * @defaultValue `false`
   */
  closeOnBlur?: boolean
}

/**
 * The `role="combobox"` input: `aria-*`, the search-term and open-on-type
 * handling, IME composition, and ONE keydown handler routed through the
 * navigation intent (`getNavigationIntent`) — ArrowDown/ArrowUp (or any key
 * mapped to `'next'`/`'prev'`) also open a closed combobox, Enter selects the
 * highlighted item. Holds per-instance composition state, so create it once
 * per input. The mount registration, `autoFocus` and the reset of the text on
 * selection stay in the SFC.
 */
export function createComboboxInputSurface(
  context: ComboboxRootContext<any>,
  options: ComboboxInputSurfaceOptions,
): PartSurface<ComboboxInputState> {
  const isDisabled = computed(() => toValue(options.disabled) || context.disabled.value || false)

  function onTextChange(value: string, event?: Event) {
    options.modelValue.value = value
    context.highlightFirstItem()
    if (!context.open.value) {
      context.onOpenChange(true, 'input-change', event)
      nextTick(() => {
        if (value) {
          context.filterSearch.value = value
          context.highlightFirstItem()
        }
      })
    }
    else {
      context.filterSearch.value = value
    }
    options.onTextChange?.(value, event)
  }

  const { isComposing, shouldDeferInput, handleCompositionStart, handleCompositionUpdate, handleCompositionEnd } = useComposing((event) => {
    const el = event.target as HTMLInputElement | null
    context.onCompositionEnd()
    if (el)
      onTextChange(el.value, event)
  })

  function onKeydown(event: KeyboardEvent) {
    // Keys mid-composition belong to the IME (candidate navigation, commit).
    if (isComposing.value)
      return
    if (event.key === 'Enter') {
      // A `getNavigationIntent` override returning `null` opts Enter out too.
      if (context.getNavigationIntent(event) !== null)
        context.onKeydownEnter(event)
      return
    }
    // A text input: left/right keep moving the caret, and an unmodified
    // printable key (Space included) is text, never handed to the override.
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey))
      return
    const intent = context.getNavigationIntent(event)
    if (context.onKeydownNavigation(event, intent))
      event.preventDefault()
    if (intent === 'next' || intent === 'prev') {
      event.preventDefault()
      if (!context.open.value)
        context.onOpenChange(true, 'list-navigation', event)
    }
  }

  function onBlur(event: FocusEvent) {
    const nextFocus = event.relatedTarget as Element | null
    // Focus moving to nothing (a click on a non-focusable area) is the dismissable layer's call.
    if (!options.closeOnBlur || !context.open.value || !nextFocus)
      return
    const isInside = (el: Element | null) => !!context.parentElement.value?.contains(el)
      || !!getElementByIdFrom(context.parentElement.value, context.contentId)?.contains(el)
    if (isInside(nextFocus))
      return
    // Deferred so FocusScope's focus restoration (handleFocusOut) runs first;
    // closing right away would close a second combobox the user switches to.
    requestAnimationFrame(() => {
      if (context.open.value && !isInside(getActiveElement(context.parentElement.value)))
        context.onOpenChange(false, 'focus-outside', event)
    })
  }

  return createPartSurface<ComboboxInputState>(
    () => ({
      'type': 'text',
      'role': 'combobox',
      'autocomplete': 'off',
      'aria-autocomplete': 'list',
      'aria-expanded': context.open.value,
      'aria-controls': context.contentId,
      'aria-activedescendant': context.highlightedElement.value?.id,
      'aria-disabled': isDisabled.value,
      'value': options.modelValue.value,
      'disabled': isDisabled.value ? '' : undefined,
      'onInput': (event: InputEvent) => {
        if (!shouldDeferInput.value)
          onTextChange((event.target as HTMLInputElement).value, event)
      },
      'onKeydown': onKeydown,
      'onFocus': (event: FocusEvent) => {
        if (context.openOnFocus.value && !context.open.value)
          context.onOpenChange(true, 'input-focus', event)
      },
      'onClick': (event: MouseEvent) => {
        if (context.openOnClick.value && !context.open.value)
          context.onOpenChange(true, 'input-press', event)
      },
      'onBlur': onBlur,
      'onCompositionstart': () => {
        context.onCompositionStart()
        handleCompositionStart()
      },
      'onCompositionupdate': handleCompositionUpdate,
      'onCompositionend': handleCompositionEnd,
    }),
    () => ({ disabled: isDisabled.value }),
  )
}

/**
 * The text a combobox input shows for its value after a selection: the input's
 * own `displayValue`, then the root's, then a single primitive value's string
 * form; empty for an object value without a resolver and for `multiple`.
 */
export function getComboboxInputText(
  context: ComboboxRootContext<any>,
  displayValue?: (value: any) => string,
): string {
  const value = context.modelValue.value
  if (displayValue)
    return displayValue(value)
  if (context.multiple.value || !value || Array.isArray(value))
    return ''
  if (context.displayValue)
    return context.displayValue(value)
  return typeof value === 'object' ? '' : String(value)
}

export interface UseComboboxRootProps<T = AcceptableValue> extends Omit<UseListboxRootProps<T>, 'orientation' | 'selectionBehavior' | 'filter' | 'filterSearch' | 'highlightScroll'> {
  /**
   * Controlled open state. A getter/ref resolving to `undefined` is
   * uncontrolled; a writable `Ref` (with no `emit`/`onUpdateOpen`) is written back.
   */
  open?: MaybeRefOrGetter<boolean | undefined>
  /** Initial open state when uncontrolled. @defaultValue `false` */
  defaultOpen?: boolean
  /**
   * Base id the content id derives from (`<baseId>-content`). Defaults to
   * `reka-combobox-<n>` from a per-call counter, which is NOT stable across
   * server and client: SSR consumers must pass a stable `baseId` (the SFC hands
   * its `useId(undefined, 'reka-combobox')`).
   */
  baseId?: string
  /**
   * Whether an item matches the search term: called as `filter(text, search,
   * value)`. Omitted, items are matched with `useFilter`'s `contains` (base
   * sensitivity); `null` turns client filtering off (filter the items yourself,
   * or on a server). A function, `null`, or a `Ref` holding one — NOT a getter,
   * which would be mistaken for the filter itself.
   */
  filter?: ListboxFilterFunction<T> | null | Ref<ListboxFilterFunction<T> | null | undefined>
  /** @deprecated Use `filter: null`. When `true`, client filtering is off whatever `filter` says. */
  ignoreFilter?: MaybeRefOrGetter<boolean | undefined>
  /** Reset the input text when the combobox closes. @defaultValue `true` */
  resetSearchTermOnBlur?: MaybeRefOrGetter<boolean | undefined>
  /** Reset the input text when a value is selected. @defaultValue `true` */
  resetSearchTermOnSelect?: MaybeRefOrGetter<boolean | undefined>
  /** Open when the input is focused. @defaultValue `false` */
  openOnFocus?: MaybeRefOrGetter<boolean | undefined>
  /** Open when the input is clicked. @defaultValue `false` */
  openOnClick?: MaybeRefOrGetter<boolean | undefined>
  /** `ComboboxCancel` also clears the value. @defaultValue `false` */
  resetModelValueOnClear?: MaybeRefOrGetter<boolean | undefined>
  /** Unmount the content when closed. @defaultValue `true` */
  unmountOnHide?: MaybeRefOrGetter<boolean | undefined>
  /** The value a cleared single selection takes. @defaultValue `null` */
  emptyValue?: T | null
  /** Resolves the text the input shows for a selected value (single selection). */
  displayValue?: (value: T) => string
  /**
   * What a selected item writes into the model (single selection). Defaults to
   * the item's value; Autocomplete, whose model is the input text, maps it
   * through `displayValue`.
   */
  toModelValue?: (value: T) => T
  /** The search term the content opens with. @defaultValue `''` (every item shows) */
  openSearchTerm?: () => string
  /** Called before the open state changes; `details.cancel()` vetoes it. */
  onBeforeUpdateOpen?: (value: boolean, details: ChangeEventDetails<ComboboxOpenChangeReason>) => void
  /** Called after the open state changed. */
  onUpdateOpen?: (value: boolean, details: ChangeEventDetails<ComboboxOpenChangeReason>) => void
}

export interface UseComboboxRootReturn<T = AcceptableValue> extends Pick<UseListboxRootReturn<T>, 'modelValue' | 'isSelected' | 'highlightedElement' | 'highlightItem' | 'highlightFirstItem' | 'highlightSelected' | 'labels' | 'filterState' | 'isControlled' | 'lastChangeDetails' | 'getItemSurface'> {
  /** Select an item's value: a single selection is replaced, a multiple one toggled. Returns `false` when unchanged or cancelled. */
  select: (value: T, reason?: ComboboxChangeReason | ListboxChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Write the whole model; returns `false` when unchanged or cancelled. */
  setModelValue: (value: T | T[] | undefined, reason?: ComboboxChangeReason | BaseChangeReason, event?: Event) => boolean
  open: ComputedRef<boolean>
  /** Returns `false` when the change was cancelled via `beforeUpdate:open`. */
  onOpenChange: (value: boolean, reason?: ComboboxOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Details of the last open change attempt; initially `{ reason: 'none' }`. */
  lastOpenChangeDetails: Readonly<Ref<ChangeEventDetails<ComboboxOpenChangeReason>>>
  /** The search term the filter runs against (writable). */
  filterSearch: Ref<string>
  /** The root surface: `dir`, the highlight release on pointer leave / focus out, and `pointer-events` while open. */
  root: PartSurface<ComboboxState>
  /** The `role="listbox"` surface. */
  listbox: UseListboxRootReturn<T>['content']
  trigger: PartSurface<ComboboxTriggerState>
  cancel: PartSurface<Record<string, never>>
  content: PartSurface<ComboboxContentState>
  /** Creates an input surface; call once per input (it holds IME composition state). */
  createInputSurface: (options: ComboboxInputSurfaceOptions) => PartSurface<ComboboxInputState>
  /** The context value — the SFC provides it as both the Combobox and the Listbox root context. */
  context: ComboboxRootContext<T>
}

/**
 * Headless Combobox root: the selection model, the `open` model, the search
 * term and the shared Listbox `filter`, the highlight/keyboard brain and the
 * context. A standalone consumer gets the models (with `beforeUpdate`/`update`
 * details), the ids and the `role`/`aria`/`data-*` surfaces, but must hand in
 * the rendered items (`getItems`) and still wrap the content in its own
 * presence, positioning and dismissal (`Presence`, `PopperContent`,
 * `DismissableLayer` in the SFCs).
 *
 * Mount-bound (the Listbox highlight watcher), so call it inside `setup()`.
 * SSR-safe: no `document`/`window` at call scope.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup
 */
export function useComboboxRoot<T extends AcceptableValue = AcceptableValue>(props: UseComboboxRootProps<T> = {}): UseComboboxRootReturn<T> {
  const baseId = props.baseId ?? `reka-combobox-${++comboboxCount}`
  const { contains } = useFilter({ sensitivity: 'base' })
  const filter = computed(() => {
    if (toValue(props.ignoreFilter))
      return null
    const value = isRef(props.filter) ? props.filter.value : props.filter
    return value === undefined ? contains : value
  })
  const filterSearch = ref('')

  const { state: open, setState: setOpen, lastChangeDetails: lastOpenChangeDetails } = useControllableState<boolean, ComboboxOpenChangeReason>({
    prop: props.open,
    defaultValue: props.defaultOpen ?? false,
    name: 'open',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdateOpen,
    onUpdate: props.onUpdateOpen,
  })
  const { highlightScroll, ...positioning } = useComboboxContentPositioning(open)

  const listbox = useListboxRoot<T>({
    ...props,
    filter,
    filterSearch,
    highlightScroll,
  })

  const resetSearchTerm = createEventHook()
  const isUserInputted = ref(false)
  const inputElement = ref<HTMLInputElement>()
  const triggerElement = ref<HTMLElement>()
  const bool = (source: MaybeRefOrGetter<boolean | undefined>, fallback = false) => computed(() => toValue(source) ?? fallback) as Ref<boolean>

  function onOpenChange(value: boolean, reason?: ComboboxOpenChangeReason | BaseChangeReason, event?: Event) {
    // v2 ran the open/close side effects even for a no-op write (a controlled
    // `open` the parent keeps); only a cancelled change skips them.
    if (value !== open.value && !setOpen(value, reason, event))
      return false
    filterSearch.value = value ? (props.openSearchTerm?.() ?? '') : ''
    if (value) {
      // make sure the DOM is ready, then highlight the selected item
      nextTick(() => {
        listbox.highlightSelected()
        isUserInputted.value = true
        inputElement.value?.focus()
      })
    }
    else {
      isUserInputted.value = false
      setTimeout(() => {
        if (toValue(props.resetSearchTermOnBlur) ?? true)
          resetSearchTerm.trigger()
      }, 1)
    }
    return true
  }

  function setModelValue(value: T | T[] | undefined, reason?: ComboboxChangeReason | BaseChangeReason, event?: Event) {
    return listbox.setModelValue(value, reason as ListboxChangeReason, event)
  }

  function select(value: T, reason: ComboboxChangeReason | ListboxChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    // A single selection is replaced (re-selecting keeps it); a multiple one toggles through the Listbox model.
    return listbox.context.multiple.value
      ? listbox.select(value, reason as ListboxChangeReason, event)
      : setModelValue(props.toModelValue ? props.toModelValue(value) : value, reason as ComboboxChangeReason, event)
  }

  const context: ComboboxRootContext<T> = {
    ...listbox.context,
    baseId,
    contentId: `${baseId}-content`,
    open,
    onOpenChange,
    setModelValue,
    selectItem: select,
    clearModelValue: event => setModelValue((listbox.context.multiple.value ? [] : props.emptyValue ?? null) as T, 'clear-press', event),
    ...positioning,
    isUserInputted,
    inputElement,
    onInputElementChange: el => inputElement.value = el,
    triggerElement,
    onTriggerElementChange: el => triggerElement.value = el,
    parentElement: computed(() => toValue(props.element) ?? undefined),
    resetSearchTermOnSelect: bool(props.resetSearchTermOnSelect, true),
    onResetSearchTerm: resetSearchTerm.on,
    filter,
    filterSearch,
    filterState: listbox.filterState,
    openOnFocus: bool(props.openOnFocus),
    openOnClick: bool(props.openOnClick),
    resetModelValueOnClear: bool(props.resetModelValueOnClear),
    unmountOnHide: bool(props.unmountOnHide, true),
    displayValue: props.displayValue,
  }

  const root = createPartSurface<ComboboxState>(
    () => ({ ...listbox.root.props.value, style: { pointerEvents: open.value ? 'auto' : undefined } }),
    listbox.root.state,
  )

  return {
    modelValue: listbox.modelValue,
    select,
    setModelValue,
    isSelected: listbox.isSelected,
    highlightedElement: listbox.highlightedElement,
    highlightItem: listbox.highlightItem,
    highlightFirstItem: listbox.highlightFirstItem,
    highlightSelected: listbox.highlightSelected,
    labels: listbox.labels,
    filterSearch,
    filterState: listbox.filterState,
    isControlled: listbox.isControlled,
    lastChangeDetails: listbox.lastChangeDetails,
    open,
    onOpenChange,
    lastOpenChangeDetails,
    root,
    listbox: listbox.content,
    trigger: getComboboxTriggerSurface(context),
    cancel: getComboboxCancelSurface(context),
    content: getComboboxContentSurface(context),
    createInputSurface: options => createComboboxInputSurface(context, options),
    getItemSurface: listbox.getItemSurface,
    context,
  }
}
