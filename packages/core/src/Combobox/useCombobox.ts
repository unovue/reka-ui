import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { ComboboxRootContext } from './ComboboxRoot.vue'
import type { ListboxChangeReason, ListboxFilterFunction, ListboxItemState, ListboxState, UseListboxRootProps, UseListboxRootReturn } from '@/Listbox/useListbox'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import type { ListItemData, ListItemGroupData, ListItems } from '@/shared/listItems'
import type { AcceptableValue } from '@/shared/types'
import { createEventHook, tryOnScopeDispose } from '@vueuse/core'
import { computed, isRef, nextTick, ref, toValue } from 'vue'
import { useListboxRoot } from '@/Listbox/useListbox'
import { createPartSurface, disclosureState, getActiveElement, getElementByIdFrom, useComposing, useControllableState, useFilter } from '@/shared'
import { getListItemData } from '@/shared/listItems'
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
 * - `'clear-press'`: `ComboboxCancel` reset the value (the default; off with
 *   `resetModelValueOnClear: false`).
 * - `'input-clear'`: the user emptied the input of a single combobox, which
 *   clears its value to `null`.
 * - `'escape-key'`: Escape in the input of a closed combobox cleared the value
 *   (`null`, or `[]` when `multiple`) and the input text.
 * - `'item-keydown'`, `'select-all'`, `'range-select'`: the Listbox selection
 *   gestures (Space on a focused item, Ctrl/Cmd+A and Shift+click or
 *   Shift+arrow in a `multiple` combobox).
 */
export type ComboboxChangeReason = 'clear-press' | 'input-clear' | 'escape-key' | ListboxChangeReason

/**
 * Why the text of `ComboboxInput` / `AutocompleteInput` changed; carried as
 * `details.reason` of its `update:modelValue` (#2828).
 *
 * - `'input-change'`: the user typed (or an IME composition was committed).
 * - `'input-clear'`: the text was reset to `''` when the popup closed without a selection.
 * - `'clear-press'`: `ComboboxCancel` cleared the text.
 * - `'escape-key'`: the text was reset when Escape closed the popup.
 * - `'item-press'`: a selection wrote the selected item's text.
 * - `'none'` (from `BaseChangeReason`): any other reset, such as the text
 *   following a value the parent set, or the popup closing on an outside press.
 */
export type ComboboxInputChangeReason = 'input-change' | 'input-clear' | 'clear-press' | 'escape-key' | 'item-press'

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

/** Semantic state of the trigger (`data-popup-open` while open / `data-disabled`). No `data-state` (#1407), so an `asChild` control keeps its own. */
export type ComboboxTriggerState = { popupOpen: boolean, disabled: boolean }
/** Semantic state of the input (`data-disabled`). */
export type ComboboxInputState = { disabled: boolean }
/** Semantic state of the content (`data-state` / `data-empty`). */
export type ComboboxContentState = { state: DisclosureState, empty: boolean }
/** Semantic state of an item; the same as a Listbox item. */
export type ComboboxItemState = ListboxItemState
/** Semantic state of the root (`data-disabled`). */
export type ComboboxState = ListboxState

/** One option of the root's `items`: `label` is the text the input shows for the value. */
export type ComboboxItemData<T = AcceptableValue> = ListItemData<T>

/** A group of options in the root's `items`; keys besides `items` (a `label`, say) are free. */
export type ComboboxItemGroupData<T = AcceptableValue> = ListItemGroupData<T>

/**
 * The root's `items`: the options as data, in the shape `SelectRoot` takes. A
 * record maps each value (a string key; a number value finds its key) to its
 * label; an array holds `{ value, label, disabled? }` options, or groups of
 * them (`{ items }`), mixed or not.
 */
export type ComboboxItems<T = AcceptableValue> = ListItems<T>

/** Whether a combobox value holds a selection: anything but `null` (`''` included), or a non-empty array. */
export function hasComboboxValue(value: unknown) {
  return Array.isArray(value) ? value.length > 0 : value != null
}

/** Standalone `useComboboxRoot()` calls without a `baseId` draw `reka-combobox-<n>` from here. */
let comboboxCount = 0

/**
 * How the popup was opened or closed, passed to an `initialFocus` / `finalFocus`
 * function; `''` when unknown (a focus, a
 * programmatic change).
 */
export type ComboboxInteractionType = 'mouse' | 'touch' | 'pen' | 'keyboard' | ''

function getInteractionType(event?: Event): ComboboxInteractionType {
  // A dismissal passes the layer's custom event: read the press or key behind it.
  const original = (event as CustomEvent<{ originalEvent?: Event }> | undefined)?.detail?.originalEvent
  if (original)
    return getInteractionType(original)
  if (!event)
    return ''
  // By type, not `instanceof`: an event from an iframe has another realm's classes.
  if (event.type.startsWith('key') || event.type === 'input' || event.type === 'beforeinput')
    return 'keyboard'
  const pointerType = (event as PointerEvent).pointerType
  if (pointerType === 'mouse' || pointerType === 'touch' || pointerType === 'pen')
    return pointerType
  if (event.type === 'click' || event.type.startsWith('mouse') || event.type.startsWith('pointer'))
    return (event as MouseEvent).detail === 0 && event.type === 'click' ? 'keyboard' : 'mouse'
  return ''
}

/** Inputs being focused by the content on close: their focus must not reopen the popup (`openOnFocus`). */
const restoringFocus = new WeakSet<Element>()

/** Focuses an element without its focus opening the popup again. */
export function focusWithoutOpening(element: HTMLElement) {
  restoringFocus.add(element)
  try {
    element.focus()
  }
  finally {
    restoringFocus.delete(element)
  }
}

/** Whether the combobox input is rendered inside its content. */
export function isComboboxInputInsideContent(context: ComboboxRootContext<any>) {
  const input = context.inputElement.value
  return !!input && !!getElementByIdFrom(context.parentElement.value, context.contentId)?.contains(input)
}

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
  let pointerType: string | undefined
  // The open state when the press began: focusing the input on mousedown can
  // open the popup first (`openOnFocus`), and the press must not then close it.
  let openAtPress: boolean | undefined
  return createPartSurface<ComboboxTriggerState>(
    () => ({
      'tabindex': '-1',
      'aria-label': 'Show popup',
      'aria-haspopup': 'listbox',
      'aria-expanded': context.open.value,
      'aria-controls': context.contentId,
      'disabled': isDisabled.value,
      'aria-disabled': isDisabled.value,
      'onPointerdown': (event: PointerEvent) => {
        pointerType = event.pointerType
      },
      'onMousedown': (event: MouseEvent) => {
        // Only the primary button presses the trigger.
        if (event.button !== 0)
          return
        // A press moves focus to an input outside the content, and the
        // trigger does not take it. Not by touch: no virtual keyboard opens.
        // An input inside the content is focused by the content on open.
        const input = context.inputElement.value
        openAtPress = context.open.value
        if (isDisabled.value || pointerType === 'touch' || !input?.isConnected || isComboboxInputInsideContent(context))
          return
        input.focus()
        event.preventDefault()
      },
      'onClick': (event: MouseEvent) => {
        // The pointer type of the press: not every engine gives the click one. A
        // keyboard press (Enter / Space) is a click with no pointer before it.
        const keyboard = event.detail === 0
        const type = keyboard ? 'keyboard' : (pointerType as ComboboxInteractionType || 'mouse')
        const wasOpen = keyboard ? context.open.value : (openAtPress ?? context.open.value)
        pointerType = undefined
        openAtPress = undefined
        // Already toggled by its own mousedown (an `openOnFocus` open): nothing
        // to change, and the record of that open stays.
        if (context.open.value !== wasOpen)
          return
        if (context.onOpenChange(!wasOpen, 'trigger-press', event))
          context.interactionType.value = type
      },
    }),
    () => ({ popupOpen: context.open.value, disabled: isDisabled.value }),
  )
}

/**
 * The cancel surface: clears the value with `'clear-press'` (unless
 * `resetModelValueOnClear` is `false`), then the input, then the search term.
 * Inert while the combobox is disabled.
 */
export function getComboboxCancelSurface(context: ComboboxRootContext<any>): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(
    () => ({
      'tabindex': '-1',
      'disabled': context.disabled.value,
      'aria-disabled': context.disabled.value,
      'onClick': (event: MouseEvent) => {
        // `disabled` only stops a native button; guard other elements too.
        if (context.disabled.value)
          return
        // A cancelled value clear (`beforeUpdate:modelValue` on the root)
        // keeps everything: the value, the input text and the filter.
        if (context.resetModelValueOnClear.value) {
          const before = context.lastChangeDetails.value
          if (!context.clearModelValue(event) && context.lastChangeDetails.value !== before && context.lastChangeDetails.value.isCanceled)
            return
        }
        // A cancelled text clear (`beforeUpdate:modelValue` on `ComboboxInput`)
        // keeps the text and the filter.
        if (!context.clearInput(event))
          return
        const input = context.inputElement.value
        if (input) {
          input.value = ''
          input.focus()
        }
        // Done last: focusing can re-open the popup (`openOnFocus`), which may restore the filter from the previous value.
        context.filterSearch.value = ''
      },
    }),
    () => ({}),
  )
}

/** The content surface: the `id` the input and trigger point at, plus `data-state` and `data-empty`. */
export function getComboboxContentSurface(context: ComboboxRootContext<any>): PartSurface<ComboboxContentState> {
  // `filterState` is a new object on every keystroke: read it through a boolean
  // so the state (and the content attrs built from it) only change with `empty`.
  const empty = computed(() => context.filterState.value.count === 0)
  return createPartSurface<ComboboxContentState>(
    () => ({ id: context.contentId }),
    () => ({ state: disclosureState(context.open.value), empty: empty.value }),
  )
}

export interface ComboboxInputSurfaceOptions {
  /** The text in the input (the SFC's `v-model`); typing writes it unless `setText` is given. */
  modelValue: Readonly<Ref<string | undefined>>
  /**
   * Writes typed text instead of assigning `modelValue`. Returning `false` vetoes
   * the change (an unchanged value is not a veto): the input is restored to `modelValue`.
   */
  setText?: (value: string, event?: Event) => boolean
  /** @defaultValue `false` */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Called with every committed text change before the input text and the
   * search term are updated (Autocomplete writes its model here). Returning
   * `false` vetoes the change: the input is restored to `modelValue`.
   */
  onTextChange?: (value: string, event?: Event) => boolean | void
  /**
   * Close when focus moves from the input to an element outside the combobox
   * and its content. Autocomplete leaves it to the dismissable layer.
   * @defaultValue `false`
   */
  closeOnBlur?: boolean
  /** Called for an unmodified Escape while the popup is closed (an open popup's Escape belongs to its dismissable layer). */
  onClosedEscape?: (event: KeyboardEvent) => void
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

  function restoreInput(event?: Event) {
    // The DOM already shows the typed text and the bound value did not change,
    // so Vue would not patch it back.
    const input = event?.target as HTMLInputElement | null
    const text = options.modelValue.value ?? ''
    if (input && input.value !== text)
      input.value = text
  }

  function onTextChange(value: string, event?: Event) {
    // Vetoed: a cancelled Autocomplete `beforeUpdate:modelValue`.
    if (options.onTextChange?.(value, event) === false)
      return restoreInput(event)
    if (options.setText) {
      // Vetoed: a cancelled `ComboboxInput` `beforeUpdate:modelValue`.
      if (!options.setText(value, event) && value !== (options.modelValue.value ?? ''))
        return restoreInput(event)
    }
    else {
      (options.modelValue as Ref<string | undefined>).value = value
    }
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
    if (options.onClosedEscape && event.key === 'Escape' && !context.open.value && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey)
      return options.onClosedEscape(event)
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
      // Only while open: once the popup closes (Escape, Enter) the items unmount
      // and the id would dangle (#3026).
      'aria-activedescendant': context.open.value ? context.highlightedElement.value?.id : undefined,
      'aria-disabled': isDisabled.value,
      'value': options.modelValue.value,
      'disabled': isDisabled.value ? '' : undefined,
      'onInput': (event: InputEvent) => {
        if (!shouldDeferInput.value)
          onTextChange((event.target as HTMLInputElement).value, event)
      },
      'onKeydown': onKeydown,
      'onFocus': (event: FocusEvent) => {
        if (context.openOnFocus.value && !context.open.value && !restoringFocus.has(event.currentTarget as Element))
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
 * The text of one selected value: the root's `displayValue` (not called for
 * `null`), then its label in the root's `items`, then a primitive value's
 * string form; empty for `null` and for an object value neither resolves.
 */
function getComboboxValueText(context: ComboboxRootContext<any>, value: unknown): string {
  if (value != null && context.displayValue)
    return context.displayValue(value)
  return getListItemData(context, value)?.label ?? (value == null || typeof value === 'object' ? '' : String(value))
}

/**
 * The text a combobox input shows for its value after a selection: the input's
 * own `displayValue`, then the root's, then the value's label in the root's
 * `items`, then a single primitive value's string form; empty for `null` (the
 * empty value), for an object value nothing resolves and for `multiple`.
 * `''`, `0` and `false` are values: they go through the root's `displayValue`
 * and `items`.
 */
export function getComboboxInputText(
  context: ComboboxRootContext<any>,
  displayValue?: (value: any) => string,
): string {
  const value = context.modelValue.value
  if (displayValue)
    return displayValue(value)
  if (context.multiple.value || value == null || Array.isArray(value))
    return ''
  return getComboboxValueText(context, value)
}

/**
 * The text of each selected value, in the order of the value: the root's
 * `displayValue`, then the value's label in the root's `items`, then a
 * primitive value's string form (an object value nothing resolves is `''`).
 * A single combobox has one entry, or none while it is empty (`null`).
 * Reactive when read inside an effect.
 */
export function getComboboxSelectedLabels<T = AcceptableValue>(context: ComboboxRootContext<T>): string[] {
  // Only the value is read, so a root without a selection tracks nothing more than it did.
  const value = context.modelValue.value
  return (Array.isArray(value) ? value : value == null ? [] : [value]).map(entry => getComboboxValueText(context, entry))
}

export interface UseComboboxRootProps<T = AcceptableValue> extends Omit<UseListboxRootProps<T>, 'orientation' | 'selectionBehavior' | 'filter' | 'filterSearch' | 'highlightScroll' | 'modelValue' | 'defaultValue'> {
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   * `null` is an empty single selection (see `emptyValue`).
   */
  modelValue?: MaybeRefOrGetter<T | T[] | null | undefined>
  /** Initial value when uncontrolled. Defaults to `[]` when `multiple`, else `undefined`. */
  defaultValue?: T | T[] | null
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
  /** Reset the input text when the combobox closes. @defaultValue `true` */
  resetSearchTermOnBlur?: MaybeRefOrGetter<boolean | undefined>
  /** Reset the input text when a value is selected. @defaultValue `true` */
  resetSearchTermOnSelect?: MaybeRefOrGetter<boolean | undefined>
  /** Open when the input is focused. @defaultValue `false` */
  openOnFocus?: MaybeRefOrGetter<boolean | undefined>
  /** Open when the input is clicked. @defaultValue `false` */
  openOnClick?: MaybeRefOrGetter<boolean | undefined>
  /** `ComboboxCancel` also clears the value; `false` clears only the search text. @defaultValue `true` */
  resetModelValueOnClear?: MaybeRefOrGetter<boolean | undefined>
  /** Unmount the content when closed. @defaultValue `true` */
  unmountOnHide?: MaybeRefOrGetter<boolean | undefined>
  /** The value a cleared single selection takes. @defaultValue `null` */
  emptyValue?: T | null
  /** Resolves the text the input shows for a selected value (single selection). */
  displayValue?: (value: T) => string
  /**
   * The options as data (a record of value → label, or `{ value, label,
   * disabled? }` options, optionally in `{ items }` groups), in the shape
   * `useSelectRoot` takes. The input shows the label of the selected value
   * from it (after `displayValue`), so the text needs no rendered item; the
   * rendered items still make up the list and its filtering.
   */
  items?: MaybeRefOrGetter<ComboboxItems<T> | undefined>
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
  /**
   * Called once the content's open (`true`) or close (`false`) transitions and
   * animations have finished (`update:openComplete`), reported by the content's
   * `Presence` through `context.notifyOpenComplete`.
   */
  onOpenComplete?: (value: boolean) => void
}

export interface UseComboboxRootReturn<T = AcceptableValue> extends Pick<UseListboxRootReturn<T>, 'isSelected' | 'highlightedElement' | 'highlightItem' | 'highlightFirstItem' | 'highlightSelected' | 'labels' | 'filterState' | 'isControlled' | 'lastChangeDetails' | 'getItemSurface'> {
  /** Select an item's value: a single selection is replaced, a multiple one toggled. Returns `false` when unchanged or cancelled. */
  select: (value: T, reason?: ComboboxChangeReason | BaseChangeReason, event?: Event) => boolean
  /** The current value: an array when `multiple`; `null` once a single selection is cleared. */
  modelValue: ComputedRef<T | T[] | null | undefined>
  /** Write the whole model; returns `false` when unchanged or cancelled. `AutocompleteRoot` writes the typed text with `'input-change'`. */
  setModelValue: (value: T | T[] | null | undefined, reason?: ComboboxChangeReason | 'input-change' | BaseChangeReason, event?: Event) => boolean
  open: ComputedRef<boolean>
  /** Returns `false` when the change was cancelled via `beforeUpdate:open`. */
  onOpenChange: (value: boolean, reason?: ComboboxOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Details of the last open change attempt; initially `{ reason: 'none' }`. */
  lastOpenChangeDetails: Readonly<Ref<ChangeEventDetails<ComboboxOpenChangeReason>>>
  /** The search term the filter runs against (writable). */
  filterSearch: Ref<string>
  /** Puts the input's text back to the text of the current value, dropping what was typed. */
  resetSearchTerm: (reason?: ComboboxOpenChangeReason | BaseChangeReason) => void
  /** The root surface: `dir`, the highlight release on pointer leave / focus out. */
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
    // The Listbox model treats `null` like any other single value.
    modelValue: props.modelValue as MaybeRefOrGetter<T | T[] | undefined>,
    defaultValue: props.defaultValue as T | T[] | undefined,
    filter,
    filterSearch,
    highlightScroll,
  })

  const resetSearchTerm = createEventHook<ComboboxOpenChangeReason | BaseChangeReason | undefined>()
  const clearInputHandlers = new Set<(event?: Event) => boolean | void>()
  const isUserInputted = ref(false)
  const inputElement = ref<HTMLInputElement>()
  const triggerElement = ref<HTMLElement>()
  const interactionType = ref<ComboboxInteractionType>('')
  const bool = (source: MaybeRefOrGetter<boolean | undefined>, fallback = false) => computed(() => toValue(source) ?? fallback) as Ref<boolean>

  // The blur reset runs a tick after the close. A reopen inside that window
  // (typing straight after an outside press, a quick re-click) cancels it, so
  // it never wipes the text of a popup that is open again (#2789).
  let resetSearchTermTimer: ReturnType<typeof setTimeout> | undefined
  function clearResetSearchTermTimer() {
    clearTimeout(resetSearchTermTimer)
    resetSearchTermTimer = undefined
  }
  tryOnScopeDispose(clearResetSearchTermTimer)

  function onOpenChange(value: boolean, reason?: ComboboxOpenChangeReason | BaseChangeReason, event?: Event) {
    // v2 ran the open/close side effects even for a no-op write (a controlled
    // `open` the parent keeps); only a cancelled change skips them.
    // Typing drops a pending blur reset even when `beforeUpdate:open` cancels
    // the reopen it requests: the reset would wipe the text being typed. Any
    // other request drops it only once it went through, so a cancelled trigger
    // press or focus still restores the input text.
    if (reason === 'input-change')
      clearResetSearchTermTimer()
    if (value !== open.value && !setOpen(value, reason, event))
      return false
    clearResetSearchTermTimer()
    interactionType.value = getInteractionType(event)
    filterSearch.value = value ? (props.openSearchTerm?.() ?? '') : ''
    if (value) {
      // make sure the DOM is ready, then highlight the selected item
      nextTick(() => {
        listbox.highlightSelected()
        isUserInputted.value = true
      })
    }
    else {
      isUserInputted.value = false
      resetSearchTermTimer = setTimeout(() => {
        resetSearchTermTimer = undefined
        // The close reason tells the input why its text is reset. A
        // controlled parent may have reopened the popup through `open` (or
        // kept it open) without going through `onOpenChange`.
        if (!open.value && (toValue(props.resetSearchTermOnBlur) ?? true))
          resetSearchTerm.trigger(reason)
      }, 1)
    }
    return true
  }

  function setModelValue(value: T | T[] | null | undefined, reason?: ComboboxChangeReason | 'input-change' | BaseChangeReason, event?: Event) {
    // The Listbox model treats `null` like any other single value.
    return listbox.setModelValue(value as T | T[] | undefined, reason as ListboxChangeReason, event)
  }

  function select(value: T, reason: ComboboxChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    // A single selection is replaced (re-selecting keeps it); a multiple one toggles through the Listbox model.
    return listbox.context.multiple.value
      ? listbox.select(value, reason as ListboxChangeReason, event)
      : setModelValue(props.toModelValue ? props.toModelValue(value) : value, reason as ComboboxChangeReason, event)
  }

  // A press on an item of a single combobox: select, then close. A cancelled
  // `beforeUpdate:modelValue` keeps the popup open; re-pressing the selected
  // item (a no-op write) still closes it. A cancelled `beforeUpdate:open` only
  // keeps the popup open, the selection is already committed.
  function pressItem(value: T, event?: Event) {
    const before = listbox.lastChangeDetails.value
    if (!select(value, 'item-press', event) && listbox.lastChangeDetails.value !== before && listbox.lastChangeDetails.value.isCanceled)
      return false
    onOpenChange(false, 'item-press', event)
    return true
  }

  const context: ComboboxRootContext<T> = {
    ...listbox.context,
    baseId,
    contentId: `${baseId}-content`,
    open,
    onOpenChange,
    setModelValue,
    selectItem: select,
    pressItem,
    clearModelValue: (event, reason = 'clear-press') => setModelValue(listbox.context.multiple.value ? [] : props.emptyValue ?? null, reason, event),
    ...positioning,
    isUserInputted,
    inputElement,
    onInputElementChange: el => inputElement.value = el,
    triggerElement,
    onTriggerElementChange: el => triggerElement.value = el,
    interactionType,
    parentElement: computed(() => toValue(props.element) ?? undefined),
    resetSearchTermOnSelect: bool(props.resetSearchTermOnSelect, true),
    onResetSearchTerm: resetSearchTerm.on,
    clearInput: (event) => {
      let accepted = true
      clearInputHandlers.forEach((handler) => {
        if (handler(event) === false)
          accepted = false
      })
      return accepted
    },
    onClearInput: (handler) => {
      clearInputHandlers.add(handler)
      // Off when the registering input unmounts.
      tryOnScopeDispose(() => clearInputHandlers.delete(handler))
    },
    lastChangeDetails: listbox.lastChangeDetails,
    filter,
    filterSearch,
    filterState: listbox.filterState,
    openOnFocus: bool(props.openOnFocus),
    openOnClick: bool(props.openOnClick),
    resetModelValueOnClear: bool(props.resetModelValueOnClear, true),
    unmountOnHide: bool(props.unmountOnHide, true),
    displayValue: props.displayValue,
    items: props.items,
    notifyOpenComplete: value => props.onOpenComplete?.(value),
  }

  const root = createPartSurface<ComboboxState>(
    () => listbox.root.props.value,
    listbox.root.state,
  )

  return {
    modelValue: listbox.modelValue as ComputedRef<T | T[] | null | undefined>,
    select,
    setModelValue,
    isSelected: listbox.isSelected,
    highlightedElement: listbox.highlightedElement,
    highlightItem: listbox.highlightItem,
    highlightFirstItem: listbox.highlightFirstItem,
    highlightSelected: listbox.highlightSelected,
    labels: listbox.labels,
    filterSearch,
    resetSearchTerm: resetSearchTerm.trigger,
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
