import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { SelectContentContext } from './SelectContentImpl.vue'
import type { SelectEvent, SelectItemContext } from './SelectItem.vue'
import type { SelectRootContext } from './SelectRoot.vue'
import type { ListboxNavigationIntent } from '@/Listbox/useListbox'
import type { BaseChangeReason, By, ChangeEventDetails, DisclosureState, PartSurface, SelectionState } from '@/shared'
import type { AcceptableValue, Direction } from '@/shared/types'
import { computed, isRef, nextTick, onBeforeUnmount, onMounted, ref, toValue, watch, watchEffect } from 'vue'
import { focusFirst } from '@/Menu/utils'
import {
  createLabelRegistry,
  createPartSurface,
  disclosureState,
  getActiveElement,
  getEventTarget,
  handleAndDispatchCustomEvent,
  isNullish,
  selectionState,
  useControllableState,
  useListSelection,
  useTypeahead,
  valueComparator,
} from '@/shared'
import { getNextMatch, wrapArray } from '@/shared/useTypeahead'
import { OPEN_KEYS, SELECTION_KEYS, shouldShowPlaceholder } from './utils'

// =============================================================================
// Headless composables for the Select family (#2723, #2824).
//
// Overlay contract (validated on Menu/Popover): `useSelectRoot()` is
// state-only — the value and open models, the label registry and the context
// the root SFC provides. Surfaces begin at the parts: `useSelectTrigger`,
// `useSelectValue`, `useSelectContent` (the keyboard/pointer brain of the
// content), `useSelectItem`, `useSelectItemText` and `useSelectItemIndicator`.
//
// Select shares the selection model (`useListSelection`), the `by` comparator,
// the sticky label registry and the navigation-intent hook with the Listbox
// cluster, but not the Listbox root contract: its brain is DOM focus on the
// items, not `aria-activedescendant`.
//
// What stays in the SFCs: `PopperRoot`/`PopperAnchor`/`PopperContent` and the
// item-aligned positioning (measurement), `Presence` and the closed-content
// fragment, `FocusScope`/`DismissableLayer`, the modal side effects
// (`useBodyScrollLock`, `useFocusGuards`, `useHideOthers`), `useCollection`,
// `useId`, Field wiring and the hidden native `<select>`.
// =============================================================================

/**
 * Why the value changed; carried as `details.reason` (#2828).
 *
 * - `'item-press'`: an item was released under the pointer.
 * - `'item-keydown'`: Enter or Space on the focused item (or a key that
 *   `getNavigationIntent` maps to `'select'`).
 * - `'typeahead'`: typing on the focused, closed trigger selected the next
 *   item whose text starts with the typed characters (single selection only).
 * - `'autofill'`: the browser filled the hidden native `<select>`.
 */
export type SelectChangeReason = 'item-press' | 'item-keydown' | 'typeahead' | 'autofill'

/**
 * Why the select opened or closed; carried as `details.reason` (#2828).
 *
 * - `'trigger-press'`: a press on the trigger, or Enter / Space on it.
 * - `'list-navigation'`: ArrowDown / ArrowUp on the trigger.
 * - `'item-press'` / `'item-keydown'`: selecting an item closed a single select.
 * - `'escape-key'` / `'outside-press'`: dismissed. Releasing the pointer
 *   outside the content after dragging from the trigger is also
 *   `'outside-press'`. Focus moving out does not close a select.
 */
export type SelectOpenChangeReason
  = | 'trigger-press'
    | 'list-navigation'
    | 'item-press'
    | 'item-keydown'
    | 'escape-key'
    | 'outside-press'

/**
 * What a keydown in the content means: one of the four focus moves, or
 * `'select'` (select the focused item, as Enter does).
 */
export type SelectNavigationIntent = ListboxNavigationIntent

/**
 * The value a select emits: an array when `multiple` is `true`, a single value
 * when it is absent or `false`, either while it is a plain `boolean`. No
 * interaction clears a single select, so it never emits `null` or `undefined`.
 */
export type SelectModelValue<T, M extends boolean = boolean> = boolean extends M ? T | T[] : M extends true ? T[] : T

/** Semantic state of the trigger (`data-state` / `data-disabled` / `data-placeholder`). */
export type SelectTriggerState = { state: DisclosureState, disabled: boolean, placeholder: boolean }
/** Semantic state of the value part: `data-placeholder` holds the placeholder text while nothing is selected. */
export type SelectValueState = { placeholder: string | undefined }
/** Semantic state of the content (`data-state`). */
export type SelectContentState = { state: DisclosureState }
/** Semantic state of an item (`data-state` / `data-disabled` / `data-highlighted`). */
export type SelectItemState = { state: SelectionState, disabled: boolean, highlighted: boolean }
/** Semantic state of an item indicator (`data-state`). */
export type SelectItemIndicatorState = { state: SelectionState }

/** An entry the closed trigger's typeahead can select. */
export interface SelectTypeaheadItem<T = AcceptableValue> {
  value: T
  textValue: string
  disabled?: boolean
}

const NAVIGATION_KEYS: Record<string, SelectNavigationIntent> = {
  ArrowUp: 'prev',
  ArrowDown: 'next',
  Home: 'first',
  End: 'last',
}

/** Standalone calls without a `baseId` draw `reka-select-<n>` from here. */
let selectCount = 0
/** Standalone items without a `textId` draw from here. */
let selectItemCount = 0

// -----------------------------------------------------------------------------
// Root
// -----------------------------------------------------------------------------

export interface UseSelectRootProps<T = AcceptableValue> {
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<T | T[] | undefined>
  /** Initial value when uncontrolled. Defaults to `[]` when `multiple`, else `undefined`. */
  defaultValue?: T | T[]
  /** Whether several values can be selected. @defaultValue `false` */
  multiple?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Identity strategy (a key or an equality function; a function runs for
   * every value, strings included). A plain value read once at setup, NOT a
   * getter — a comparison function would otherwise be mistaken for a getter.
   */
  by?: By<T>
  /**
   * Controlled open state. A getter/ref resolving to `undefined` is
   * uncontrolled; a writable `Ref` (with no `emit`/`onUpdateOpen`) is written back.
   */
  open?: MaybeRefOrGetter<boolean | undefined>
  /** Initial open state when uncontrolled. @defaultValue `false` */
  defaultOpen?: boolean
  /** @defaultValue `false` */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `false` */
  required?: MaybeRefOrGetter<boolean | undefined>
  /** Resolved reading direction (the SFC hands its `useDirection` ref). @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /**
   * Base id the content id derives from (`<baseId>-content`). Defaults to
   * `reka-select-<n>` from a per-call counter, which is NOT stable across
   * server and client: SSR consumers must pass a stable `baseId` (the SFC hands
   * its `useId(undefined, 'reka-select')`).
   */
  baseId?: string
  /**
   * Resolves the text shown for a selected value. Wins over the label
   * registry, so the value can be shown before its item ever rendered. Pass a
   * `Ref` to swap the resolver at runtime (a plain function is NOT treated as
   * a getter). With it set the closed content is not rendered, so the hidden
   * native `<select>` only holds the selected values (autofill can only
   * re-pick them) until the content has been opened once.
   */
  displayValue?: ((value: T) => string) | Ref<((value: T) => string) | undefined>
  /**
   * Resolves what a keydown in the content means. Return `undefined` to fall
   * back to the default mapping (ArrowUp/ArrowDown/Home/End), `null` to opt
   * the key out (for Enter and Space this also skips the selection), or
   * `'select'` to select the focused item as Enter does.
   */
  getNavigationIntent?: (event: KeyboardEvent) => SelectNavigationIntent | null | undefined
  /** Component `emit`; receives `beforeUpdate:modelValue`/`update:modelValue` and `beforeUpdate:open`/`update:open`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before the value changes; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: T | T[] | undefined, details: ChangeEventDetails<SelectChangeReason>) => void
  /** Called after the value changed. */
  onUpdate?: (value: T | T[] | undefined, details: ChangeEventDetails<SelectChangeReason>) => void
  /** Called before the open state changes; `details.cancel()` vetoes it. */
  onBeforeUpdateOpen?: (value: boolean, details: ChangeEventDetails<SelectOpenChangeReason>) => void
  /** Called after the open state changed. */
  onUpdateOpen?: (value: boolean, details: ChangeEventDetails<SelectOpenChangeReason>) => void
}

export interface UseSelectRootReturn<T = AcceptableValue> {
  modelValue: ComputedRef<T | T[] | undefined>
  /** Select an item's value: a single selection is replaced, a multiple one toggled. Returns `false` when unchanged or cancelled. */
  select: (value: T, reason?: SelectChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Write the whole model; returns `false` when unchanged or cancelled. */
  setModelValue: (value: T | T[] | undefined, reason?: SelectChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Whether `value` is (part of) the current selection, matched with `by`. */
  isSelected: (value: T) => boolean
  /** `true` while nothing is selected. */
  isEmptyModelValue: ComputedRef<boolean>
  open: ComputedRef<boolean>
  /** Returns `false` when unchanged or cancelled via `beforeUpdate:open`. */
  onOpenChange: (value: boolean, reason?: SelectOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** The sticky label registry the item texts fill. */
  labels: SelectRootContext<T>['labels']
  /** Text of each selected value: `displayValue`, then the label registry; empty labels are left out. */
  selectedLabels: ComputedRef<string[]>
  /** Details of the last value change attempt; initially `{ reason: 'none' }`. */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<SelectChangeReason>>>
  /** Details of the last open change attempt; initially `{ reason: 'none' }`. */
  lastOpenChangeDetails: Readonly<Ref<ChangeEventDetails<SelectOpenChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** The context value — the SFC provides it verbatim. */
  context: SelectRootContext<T>
}

/**
 * Headless Select root: the value model (single or `multiple`, matched with
 * `by`), the open model, both with cancellable `beforeUpdate` and `details`,
 * the sticky label registry and the context. State-only: the surfaces begin at
 * the parts (`useSelectTrigger`, `useSelectValue`, `useSelectContent`,
 * `useSelectItem`, …). A standalone consumer must still provide positioning,
 * presence and dismissal around the content (`PopperContent`, `Presence`,
 * `DismissableLayer` in the SFCs).
 *
 * SSR-safe (no `document`/`window`) and callable outside `setup()`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useSelectRoot<T extends AcceptableValue = AcceptableValue>(props: UseSelectRootProps<T> = {}): UseSelectRootReturn<T> {
  const baseId = props.baseId ?? `reka-select-${++selectCount}`
  const multiple = computed(() => toValue(props.multiple) ?? false)

  const selection = useListSelection<T, SelectChangeReason>({
    modelValue: props.modelValue,
    defaultValue: props.defaultValue,
    multiple,
    by: props.by,
    // A single select keeps the value when its item is pressed again; a multiple one toggles.
    selectionBehavior: () => multiple.value ? 'toggle' : 'replace',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const { modelValue, isSelected } = selection

  const { state: open, setState: setOpen, lastChangeDetails: lastOpenChangeDetails } = useControllableState<boolean, SelectOpenChangeReason>({
    prop: props.open,
    defaultValue: props.defaultOpen ?? false,
    name: 'open',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdateOpen,
    onUpdate: props.onUpdateOpen,
  })

  const labels = createLabelRegistry<T>(props.by)
  const displayValue = computed(() => isRef(props.displayValue) ? props.displayValue.value : props.displayValue)

  const isEmptyModelValue = computed(() => {
    const value = modelValue.value
    if (multiple.value && Array.isArray(value))
      return value.length === 0
    return isNullish(value)
  })

  function resolveLabel(value: T) {
    const resolve = displayValue.value
    const resolved = resolve && !isNullish(value) ? resolve(value) : undefined
    return resolved ?? labels.get(value)
  }

  const selectedLabels = computed(() => {
    const value = modelValue.value
    const values = (Array.isArray(value) ? value : [value]) as T[]
    return values.map(v => resolveLabel(v) ?? '').filter(Boolean)
  })

  function onOpenChange(value: boolean, reason?: SelectOpenChangeReason | BaseChangeReason, event?: Event) {
    return setOpen(value, reason, event)
  }

  function setModelValue(value: T | T[] | undefined, reason?: SelectChangeReason | BaseChangeReason, event?: Event) {
    return selection.setModelValue(value, reason, event)
  }

  function select(value: T, reason?: SelectChangeReason | BaseChangeReason, event?: Event) {
    return selection.select(value, reason, event)
  }

  // A press (or Enter / Space) on an item: select it, then close a single
  // select. A cancelled `beforeUpdate:modelValue` keeps the content open;
  // re-pressing the selected item (a no-op write) still closes it.
  function pressItem(value: T, reason: 'item-press' | 'item-keydown' = 'item-press', event?: Event) {
    const before = selection.lastChangeDetails.value
    if (!select(value, reason, event) && selection.lastChangeDetails.value !== before && selection.lastChangeDetails.value.isCanceled)
      return false
    if (!multiple.value)
      onOpenChange(false, reason, event)
    return true
  }

  function getNavigationIntent(event: KeyboardEvent): SelectNavigationIntent | null | undefined {
    const intent = props.getNavigationIntent?.(event)
    return intent === undefined ? NAVIGATION_KEYS[event.key] : intent
  }

  const triggerElement = ref<HTMLElement>()
  const valueElement = ref<HTMLElement>()

  const context: SelectRootContext<T> = {
    baseId,
    contentId: `${baseId}-content`,
    triggerElement,
    onTriggerChange: (node) => {
      triggerElement.value = node
    },
    valueElement,
    onValueElementChange: (node) => {
      valueElement.value = node
    },
    modelValue,
    onValueChange: select,
    setModelValue,
    pressItem,
    isSelected,
    open,
    onOpenChange,
    multiple,
    required: computed(() => toValue(props.required) ?? false),
    disabled: computed(() => toValue(props.disabled) ?? false),
    by: props.by,
    dir: computed(() => toValue(props.dir) ?? 'ltr'),
    triggerPointerDownPosRef: ref({ x: 0, y: 0 }),
    isEmptyModelValue,
    labels,
    selectedLabels,
    displayValue,
    getNavigationIntent,
  }

  return {
    modelValue,
    select,
    setModelValue,
    isSelected,
    isEmptyModelValue,
    open,
    onOpenChange,
    labels,
    selectedLabels,
    lastChangeDetails: selection.lastChangeDetails,
    lastOpenChangeDetails,
    isControlled: selection.isControlled,
    context,
  }
}

// -----------------------------------------------------------------------------
// Trigger
// -----------------------------------------------------------------------------

export interface UseSelectTriggerOptions<T = AcceptableValue> {
  context: SelectRootContext<T>
  /** @defaultValue `false` */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /**
   * The items the closed trigger's typeahead picks from, in order. The SFC
   * hands the mounted items; defaults to the label registry.
   */
  getItems?: () => SelectTypeaheadItem<T>[]
}

export interface UseSelectTriggerReturn {
  /** `role="combobox"`, `aria-*`, `disabled`, `dir` and the open/typeahead handlers. The tag-dependent `type` stays in the SFC. */
  trigger: PartSurface<SelectTriggerState>
  isDisabled: ComputedRef<boolean>
}

/**
 * The trigger: opens on a plain left press (`pointerdown`, or `pointerup` for
 * touch), on Enter / Space (`'trigger-press'`) and ArrowDown / ArrowUp
 * (`'list-navigation'`); typing on the closed trigger selects the next
 * matching item (`'typeahead'`, single selection only). Holds per-instance
 * pointer and typeahead state: call it once per trigger. Consumer listeners
 * bound before the surface run first and can opt out with `preventDefault()`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useSelectTrigger<T extends AcceptableValue = AcceptableValue>(options: UseSelectTriggerOptions<T>): UseSelectTriggerReturn {
  const { context } = options
  const isDisabled = computed(() => context.disabled.value || toValue(options.disabled) || false)
  const { search, handleTypeaheadSearch, resetTypeahead } = useTypeahead(() => {})

  // The mounted items, else the label registry: with `displayValue` the
  // closed content renders nothing, so only items that rendered while open
  // (and registered their text) can be typed to.
  function getTypeaheadItems(): SelectTypeaheadItem<T>[] {
    const items = options.getItems?.() ?? []
    if (items.length)
      return items
    return context.labels.entries().map(entry => ({ value: entry.value, textValue: entry.label, disabled: entry.disabled }))
  }

  function typeaheadSelect(event: KeyboardEvent) {
    if (context.multiple.value || context.open.value)
      return
    const items = getTypeaheadItems().filter(item => !item.disabled)
    const current = items.find(item => context.isSelected(item.value))
    const nextMatch = getNextMatch(items.map(item => item.textValue), search.value, current?.textValue)
    const next = items.find(item => item.textValue === nextMatch)
    if (next)
      context.setModelValue(next.value, 'typeahead', event)
  }

  function handleOpen(reason: SelectOpenChangeReason, event: Event) {
    if (isDisabled.value)
      return false
    const changed = context.onOpenChange(true, reason, event)
    // reset typeahead when we open
    resetTypeahead()
    return changed
  }

  function handlePointerOpen(event: PointerEvent) {
    const wasOpen = context.open.value
    context.triggerPointerDownPosRef.value = {
      x: Math.round(event.pageX),
      y: Math.round(event.pageY),
    }
    // A press on the trigger of an open select (reachable in `popper`
    // position, where the trigger is cut out of the backdrop) is closed by the
    // content's outside-press handling, with `'trigger-press'`.
    if (wasOpen) {
      handleOpen('trigger-press', event)
      return
    }
    // Keep the press only for an open that took: the content's pointer-release
    // guard reads it, and a stale position would swallow the next release.
    if (!handleOpen('trigger-press', event)) {
      context.triggerPointerDownPosRef.value = null
      return
    }
    // A controlled parent may ignore `update:open`: drop the press if the
    // select is still closed once the parent had its chance to re-render.
    nextTick(() => {
      if (!context.open.value)
        context.triggerPointerDownPosRef.value = null
    })
  }

  function isPlainLeftClick(event: MouseEvent) {
    return event.button === 0 && event.ctrlKey === false
  }

  // Tracks direct mouse presses handled in `pointerdown` so the Safari label
  // `click` workaround below does not re-focus the trigger after opening.
  let openedFromPointerDown = false

  function onPointerdown(event: PointerEvent) {
    if (event.defaultPrevented)
      return

    // Prevent opening on touch down.
    // https://github.com/unovue/reka-ui/issues/804
    if (event.pointerType === 'touch')
      return event.preventDefault()

    // prevent implicit pointer capture
    // https://www.w3.org/TR/pointerevents3/#implicit-pointer-capture
    const target = event.target as HTMLElement
    if (target.hasPointerCapture(event.pointerId))
      target.releasePointerCapture(event.pointerId)

    // only call handler if it's the left button (mousedown gets triggered by all mouse buttons)
    // but not when the control key is pressed (avoiding MacOS right click)
    if (isPlainLeftClick(event)) {
      handlePointerOpen(event)
      openedFromPointerDown = true
    }
  }

  function onMousedown(event: MouseEvent) {
    if (event.defaultPrevented)
      return

    // Prevent trigger from stealing focus from the active item after opening.
    // We avoid calling `preventDefault` in `pointerdown` because that suppresses
    // compatibility mouse events (`mousedown`, `mouseup`, `click`).
    if (isPlainLeftClick(event))
      event.preventDefault()
  }

  function onClick(event: MouseEvent) {
    if (event.defaultPrevented) {
      openedFromPointerDown = false
      return
    }

    // Safari: label-associated clicks may not run `pointerdown` on the trigger.
    // Direct mouse clicks open in `pointerdown` and must not re-focus the trigger
    // here — `mousedown` `preventDefault` does not suppress `click`.
    if (!openedFromPointerDown)
      (event.currentTarget as HTMLElement)?.focus()

    openedFromPointerDown = false
  }

  function onPointerup(event: PointerEvent) {
    if (event.defaultPrevented)
      return
    event.preventDefault()

    // Only open on pointer up when using touch devices
    // https://github.com/unovue/reka-ui/issues/804
    if (event.pointerType === 'touch')
      handlePointerOpen(event)
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented)
      return

    const isTypingAhead = search.value !== ''
    const isModifierKey = event.ctrlKey || event.altKey || event.metaKey
    // Only printable characters extend the search; otherwise keys like `Shift`
    // or `ArrowLeft` would be appended and swallow the next `Space`.
    if (!isModifierKey && event.key.length === 1 && !isDisabled.value) {
      handleTypeaheadSearch(event.key, [])
      if (event.key !== ' ' || isTypingAhead)
        typeaheadSelect(event)
    }
    if (isTypingAhead && event.key === ' ')
      return

    if (OPEN_KEYS.includes(event.key)) {
      handleOpen(event.key === 'ArrowUp' || event.key === 'ArrowDown' ? 'list-navigation' : 'trigger-press', event)
      event.preventDefault()
    }
  }

  const trigger = createPartSurface<SelectTriggerState>(
    () => ({
      'role': 'combobox',
      'aria-controls': context.open.value ? context.contentId : undefined,
      'aria-expanded': context.open.value || false,
      'aria-required': context.required.value,
      'aria-autocomplete': 'none',
      'disabled': isDisabled.value,
      'dir': context.dir.value,
      onClick,
      'onPointerdown': onPointerdown,
      'onMousedown': onMousedown,
      'onPointerup': onPointerup,
      'onKeydown': onKeydown,
    }),
    () => ({
      state: disclosureState(context.open.value),
      disabled: isDisabled.value,
      placeholder: shouldShowPlaceholder(context.modelValue.value as AcceptableValue | AcceptableValue[]),
    }),
  )

  return { trigger, isDisabled }
}

// -----------------------------------------------------------------------------
// Value
// -----------------------------------------------------------------------------

export interface UseSelectValueOptions<T = AcceptableValue> {
  context: SelectRootContext<T>
  /** Shown while nothing is selected. @defaultValue `''` */
  placeholder?: MaybeRefOrGetter<string | undefined>
}

export interface UseSelectValueReturn {
  /** `pointer-events: none` plus `data-placeholder` while nothing is selected. */
  value: PartSurface<SelectValueState>
  /** Text of each selected value (`displayValue`, then the label registry). */
  selectedLabels: ComputedRef<string[]>
  /** The selected labels joined with `', '`, or the placeholder. */
  text: ComputedRef<string>
}

/**
 * The displayed value. Labels resolve through the root's `displayValue`, then
 * the sticky label registry, so they survive the content closing.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useSelectValue<T extends AcceptableValue = AcceptableValue>(options: UseSelectValueOptions<T>): UseSelectValueReturn {
  const { context } = options
  const placeholder = () => toValue(options.placeholder) ?? ''
  const selectedLabels = context.selectedLabels
  const text = computed(() => selectedLabels.value.length ? selectedLabels.value.join(', ') : placeholder())
  const value = createPartSurface<SelectValueState>(
    () => ({ style: { pointerEvents: 'none' } }),
    () => ({ placeholder: selectedLabels.value.length ? undefined : placeholder() }),
  )
  return { value, selectedLabels, text }
}

// -----------------------------------------------------------------------------
// Content
// -----------------------------------------------------------------------------

/** The `role="listbox"` surface, derived from the root context. */
export function getSelectContentSurface(context: SelectRootContext<any>): PartSurface<SelectContentState> {
  return createPartSurface<SelectContentState>(
    () => ({
      id: context.contentId,
      role: 'listbox',
      dir: context.dir.value,
    }),
    () => ({ state: disclosureState(context.open.value) }),
  )
}

export interface UseSelectContentOptions<T = AcceptableValue> {
  context: SelectRootContext<T>
  /** The content element (the `role="listbox"` element, not the positioning wrapper). */
  contentElement: Ref<HTMLElement | undefined>
  /** The rendered items in DOM order (the SFC injects `useCollection().getItems`). */
  getItems: () => Array<{ ref: HTMLElement, value?: any }>
  /** @defaultValue `'item-aligned'` */
  position?: 'item-aligned' | 'popper'
  /** When `true`, keyboard navigation loops from the last item to the first, and vice versa. @defaultValue `false` */
  loop?: MaybeRefOrGetter<boolean | undefined>
}

export interface UseSelectContentReturn {
  /** `id` / `role="listbox"` / `dir` / layout style, the keyboard handler and the context-menu guard. */
  content: PartSurface<SelectContentState>
  /** The context the SFC provides via `provideSelectContentContext`. */
  contentContext: SelectContentContext
  /** Set to `true` once the content is positioned (the positioning part's `placed`). */
  isPositioned: Ref<boolean>
  focusSelectedItem: () => void
}

/**
 * The content brain: keyboard navigation (through the root's
 * `getNavigationIntent`) and typeahead over the items, focusing the selected
 * item once positioned, the item-aligned measurement targets, and the
 * pointer-release guard after opening from `pointerdown` (a release outside
 * the content after a drag closes it with `'outside-press'`). Positioning,
 * focus trapping and dismissal stay in the SFC.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — owns watchers and document listeners; call inside the mounted content's `setup()`.
 */
export function useSelectContent<T extends AcceptableValue = AcceptableValue>(options: UseSelectContentOptions<T>): UseSelectContentReturn {
  const { context, contentElement, getItems } = options
  const { search, handleTypeaheadSearch } = useTypeahead()

  const viewport = ref<HTMLElement>()
  const selectedItem = ref<HTMLElement>()
  const selectedItemText = ref<HTMLElement>()
  const isPositioned = ref(false)
  let firstValidItemFound = false
  let firstSelectedItemInArrayFound = false
  // Assigned below; read lazily by the handlers, where `SelectVirtualizer` may
  // have replaced `focusSelectedItem` / set `onVirtualKeydown` on it.
  let contentContext: SelectContentContext

  function focusSelectedItem() {
    if (selectedItem.value && contentElement.value)
      focusFirst([selectedItem.value, contentElement.value])
  }

  watch(isPositioned, () => {
    // Through the context: `SelectVirtualizer` replaces it to reach a selected
    // item whose row is not rendered.
    contentContext.focusSelectedItem?.()
  })

  // prevent selecting items on `pointerup` in some cases after opening from `pointerdown`
  // and close on `pointerup` outside.
  const { triggerPointerDownPosRef } = context
  // A press recorded while open (on the trigger of a `popper` select, which
  // then closes it) must not outlive the open state: its release never reaches
  // the guard below, and a stale position would swallow the first stationary
  // release after the next keyboard open.
  watch(() => context.open.value, (open) => {
    if (!open)
      triggerPointerDownPosRef.value = null
  })
  watchEffect((cleanupFn) => {
    // A `forceMount`ed content listens only while open.
    if (!contentElement.value || !context.open.value)
      return
    let pointerMoveDelta = { x: 0, y: 0 }

    const handlePointerMove = (event: PointerEvent) => {
      pointerMoveDelta = {
        x: Math.abs(Math.round(event.pageX) - (triggerPointerDownPosRef.value?.x ?? 0)),
        y: Math.abs(Math.round(event.pageY) - (triggerPointerDownPosRef.value?.y ?? 0)),
      }
    }
    const handlePointerUp = (event: PointerEvent) => {
      // Prevent options from being untappable on touch devices
      // https://github.com/unovue/reka-ui/issues/804
      if (event.pointerType === 'touch')
        return

      // If the pointer hasn't moved by a certain threshold then we prevent selecting item on `pointerup`.
      if (pointerMoveDelta.x <= 10 && pointerMoveDelta.y <= 10) {
        event.preventDefault()
      }
      else {
        // otherwise, if the event was outside the content, close. Document-level
        // listener → read the composed target so a shadow-mounted content isn't
        // seen as "outside" itself.
        if (!contentElement.value?.contains(getEventTarget<HTMLElement>(event)))
          context.onOpenChange(false, 'outside-press', event)
      }
      document.removeEventListener('pointermove', handlePointerMove)
      triggerPointerDownPosRef.value = null
    }

    if (triggerPointerDownPosRef.value !== null) {
      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp, { capture: true, once: true })
    }

    cleanupFn(() => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp, { capture: true })
    })
  })

  function onKeydown(event: KeyboardEvent) {
    const isModifierKey = event.ctrlKey || event.altKey || event.metaKey

    // select should not be navigated using tab key so we prevent it
    if (event.key === 'Tab')
      event.preventDefault()

    // Space selects the item when no search is in progress; otherwise it's part of the search
    if (event.code === 'Space') {
      if (search.value === '')
        return
      // SelectItem skips Space during a search, so prevent the scroll here
      event.preventDefault()
    }

    const intent = context.getNavigationIntent(event)
    if (contentContext.onVirtualKeydown?.(event, intent)) {
      event.preventDefault()
      return
    }

    if (!isModifierKey && event.key.length === 1)
      handleTypeaheadSearch(event.key, getItems())

    if (intent === 'first' || intent === 'last' || intent === 'prev' || intent === 'next') {
      let candidateNodes = getItems().map(i => i.ref)

      if (intent === 'prev' || intent === 'last')
        candidateNodes = candidateNodes.slice().reverse()

      if (intent === 'prev' || intent === 'next') {
        const currentIndex = candidateNodes.indexOf(event.target as HTMLElement)
        candidateNodes = toValue(options.loop)
          ? wrapArray(candidateNodes, currentIndex + 1)
          : candidateNodes.slice(currentIndex + 1)
      }
      setTimeout(() => focusFirst(candidateNodes))
      event.preventDefault()
    }
  }

  const base = getSelectContentSurface(context)
  const content = createPartSurface<SelectContentState>(
    () => ({
      ...base.props.value,
      style: {
        // flex layout so we can place the scroll buttons properly
        display: 'flex',
        flexDirection: 'column',
        // reset the outline by default as the content MAY get focused
        outline: 'none',
      },
      onKeydown,
      onContextmenu: (event: Event) => event.preventDefault(),
    }),
    base.state,
  )

  contentContext = {
    content: contentElement,
    viewport,
    onViewportChange: (node) => {
      viewport.value = node
    },
    itemRefCallback: (node, value, disabled) => {
      const isFirstValidItem = !firstValidItemFound && !disabled
      const isSelectedItem = valueComparator(context.modelValue.value, value as T, context.by)

      if (context.multiple.value) {
        if (firstSelectedItemInArrayFound)
          return
        if (isSelectedItem || isFirstValidItem) {
          selectedItem.value = node
          // make sure to keep the first item highlighted when `multiple`
          if (isSelectedItem)
            firstSelectedItemInArrayFound = true
        }
      }
      else if (isSelectedItem || isFirstValidItem) {
        selectedItem.value = node
      }

      if (isFirstValidItem)
        firstValidItemFound = true
    },
    selectedItem,
    selectedItemText,
    onItemLeave: () => {
      contentElement.value?.focus()
    },
    itemTextRefCallback: (node, value, disabled) => {
      const isFirstValidItem = !firstValidItemFound && !disabled
      const isSelectedItem = valueComparator(context.modelValue.value, value as T, context.by)
      if (isSelectedItem || isFirstValidItem)
        selectedItemText.value = node
    },
    focusSelectedItem,
    position: options.position ?? 'item-aligned',
    isPositioned,
    searchRef: search,
    loop: () => !!toValue(options.loop),
  }

  return { content, contentContext, isPositioned, focusSelectedItem }
}

// -----------------------------------------------------------------------------
// Item
// -----------------------------------------------------------------------------

const SELECT_SELECT = 'select.select'

export interface UseSelectItemOptions<T = AcceptableValue> {
  context: SelectRootContext<T>
  /** The enclosing content's context; omitted, the item works without content-level focus handling. */
  contentContext?: SelectContentContext
  value: MaybeRefOrGetter<T>
  /** @defaultValue `false` */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** Text for typeahead; defaults to the item text's content. */
  textValue?: MaybeRefOrGetter<string | undefined>
  /**
   * Id of the item text the option is labelled by. Defaults to a per-call
   * counter, which is NOT SSR-stable (the SFC hands its `useId`).
   */
  textId?: string
  /**
   * Called with the cancellable `select` event before the value changes;
   * `event.preventDefault()` keeps the value and the content open.
   */
  onSelect?: (event: SelectEvent<T>) => void
}

export interface UseSelectItemReturn<T = AcceptableValue> {
  /** `role="option"`, `aria-*`, `tabindex` and the pointer/keyboard handlers. */
  item: PartSurface<SelectItemState>
  isSelected: ComputedRef<boolean>
  isFocused: Ref<boolean>
  /** The text typeahead matches (`textValue`, else the item text once it mounted). */
  textValue: Ref<string>
  /** The context the SFC provides via `provideSelectItemContext`. */
  itemContext: SelectItemContext<T>
}

/**
 * An option: selection on pointer release (`'item-press'`) or Enter / Space
 * (`'item-keydown'`, through the root's `getNavigationIntent`), focus follows
 * the pointer, and a single select closes after selecting. Holds per-instance
 * focus state: call it once per item.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useSelectItem<T extends AcceptableValue = AcceptableValue>(options: UseSelectItemOptions<T>): UseSelectItemReturn<T> {
  const { context } = options
  const contentContext = options.contentContext
  const getValue = () => toValue(options.value)
  const disabled = computed(() => toValue(options.disabled) ?? false)
  const isSelected = computed(() => valueComparator(context.modelValue.value, getValue(), context.by))
  const isFocused = ref(false)
  const textValue = ref(toValue(options.textValue) ?? '')
  const textId = options.textId ?? `${context.baseId}-item-text-${++selectItemCount}`

  function handleSelectCustomEvent(ev: PointerEvent | KeyboardEvent, reason: 'item-press' | 'item-keydown') {
    if (ev.defaultPrevented)
      return
    handleAndDispatchCustomEvent(
      SELECT_SELECT,
      (event: SelectEvent<T>) => handleSelect(event, reason),
      { originalEvent: ev, value: getValue() },
    )
  }

  async function handleSelect(ev: SelectEvent<T>, reason: 'item-press' | 'item-keydown') {
    await nextTick()
    options.onSelect?.(ev)
    if (ev.defaultPrevented)
      return
    if (!disabled.value)
      context.pressItem(getValue(), reason, ev.detail.originalEvent)
  }

  async function onPointermove(event: PointerEvent) {
    await nextTick()
    if (event.defaultPrevented)
      return
    if (disabled.value) {
      contentContext?.onItemLeave?.()
    }
    else {
      // even though safari doesn't support this option, it's acceptable
      // as it only means it might scroll a few pixels when using the pointer.
      (event.currentTarget as HTMLElement | null)?.focus({ preventScroll: true })
    }
  }

  async function onPointerleave(event: PointerEvent) {
    await nextTick()
    if (event.defaultPrevented)
      return
    if (event.currentTarget === getActiveElement())
      contentContext?.onItemLeave?.()
  }

  async function onKeydown(event: KeyboardEvent) {
    await nextTick()
    if (event.defaultPrevented)
      return
    const isTypingAhead = !!contentContext?.searchRef?.value
    if (isTypingAhead && event.key === ' ')
      return
    const intent = context.getNavigationIntent(event)
    if (SELECTION_KEYS.includes(event.key) ? intent !== null : intent === 'select')
      handleSelectCustomEvent(event, 'item-keydown')
    // prevent page scroll if using the space key to select an item
    if (event.key === ' ')
      event.preventDefault()
  }

  const item = createPartSurface<SelectItemState>(
    () => ({
      'role': 'option',
      'aria-labelledby': textId,
      'aria-selected': isSelected.value,
      'aria-disabled': disabled.value || undefined,
      'tabindex': disabled.value ? undefined : -1,
      'onFocus': () => {
        isFocused.value = true
      },
      'onBlur': () => {
        isFocused.value = false
      },
      'onPointerup': (event: PointerEvent) => handleSelectCustomEvent(event, 'item-press'),
      'onPointerdown': (event: PointerEvent) => {
        (event.currentTarget as HTMLElement).focus({ preventScroll: true })
      },
      'onTouchend': (event: TouchEvent) => {
        event.preventDefault()
        event.stopPropagation()
      },
      'onPointermove': onPointermove,
      'onPointerleave': onPointerleave,
      'onKeydown': onKeydown,
    }),
    () => ({ state: selectionState(isSelected.value), disabled: disabled.value, highlighted: isFocused.value }),
  )

  const itemContext: SelectItemContext<T> = {
    get value() {
      return getValue()
    },
    textId,
    disabled,
    isSelected,
    onItemTextChange: (node) => {
      textValue.value = ((textValue.value || node?.textContent) ?? '').trim()
    },
  }

  return { item, isSelected, isFocused, textValue, itemContext }
}

// -----------------------------------------------------------------------------
// Item text / indicator
// -----------------------------------------------------------------------------

export interface UseSelectItemTextOptions<T = AcceptableValue> {
  context: SelectRootContext<T>
  itemContext: SelectItemContext<T>
  contentContext?: SelectContentContext
  /** The item text element. */
  element: Ref<HTMLElement | null | undefined>
}

/**
 * The item text: the `id` the option is labelled by. Once mounted (and
 * whenever its text, value or `disabled` changes) it registers its text in
 * the root's sticky label registry —
 * which is what `SelectValue` and the hidden native `<select>` read — and
 * reports itself to the content for item-aligned positioning.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — registers on mount and observes its text; call inside the item text's `setup()`.
 */
export function useSelectItemText<T extends AcceptableValue = AcceptableValue>(options: UseSelectItemTextOptions<T>): { itemText: PartSurface<Record<string, never>> } {
  const { context, itemContext } = options

  function register() {
    const el = options.element.value
    if (!el)
      return
    const value = itemContext.value
    context.labels.register(value, el.textContent ?? String(value ?? ''), itemContext.disabled.value)
  }

  // Text-only changes (a translated label, a slot that re-renders on its own)
  // do not update this component, so watch the text node itself.
  let observer: MutationObserver | undefined

  onMounted(() => {
    const el = options.element.value
    if (!el)
      return
    itemContext.onItemTextChange(el)
    options.contentContext?.itemTextRefCallback(el, itemContext.value, itemContext.disabled.value)
    register()
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(register)
      observer.observe(el, { characterData: true, childList: true, subtree: true })
    }
  })
  onBeforeUnmount(() => observer?.disconnect())
  watch([() => itemContext.value, () => itemContext.disabled.value], register, { flush: 'post' })

  const itemText = createPartSurface<Record<string, never>>(
    () => ({ id: itemContext.textId }),
    () => ({}),
  )
  return { itemText }
}

/**
 * The selected-item indicator: `aria-hidden` and `data-state`; `present` is
 * whether it should render (the SFC wraps it in `Presence`).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useSelectItemIndicator(itemContext: SelectItemContext<any>): { indicator: PartSurface<SelectItemIndicatorState>, present: ComputedRef<boolean> } {
  const indicator = createPartSurface<SelectItemIndicatorState>(
    () => ({ 'aria-hidden': 'true' }),
    () => ({ state: selectionState(itemContext.isSelected.value) }),
  )
  return { indicator, present: computed(() => itemContext.isSelected.value) }
}
