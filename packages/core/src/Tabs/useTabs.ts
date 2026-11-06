import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { TabsRootContext } from './TabsRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface, SelectionState } from '@/shared'
import type { DataOrientation, Direction, StringOrNumber } from '@/shared/types'
import { computed, ref, shallowReactive, shallowRef, toValue, watchEffect } from 'vue'
import { createPartSurface, selectionState, useControllableState } from '@/shared'
import { createKeyedSelector, useSelectorKey } from '@/shared/createKeyedSelector'
import { resolveDirection } from '@/shared/useDirection'
import { makeContentId, makeTriggerId } from './utils'

// `PartSurface` is the shared contract in `@/shared` and is already published via
// `@/Switch`; NOT re-exported here to avoid an ambiguous duplicate in the barrel.

/**
 * Why the selected tab changed; carried as `details.reason` on every change (#2828).
 * An uncontrolled root also selects a tab by itself: `'initial'`
 * for the first enabled tab when there is no `defaultValue`, `'missing'` when the
 * selected tab is gone, `'disabled'` when it became disabled.
 */
export type TabsChangeReason = 'trigger-press' | 'trigger-focus' | 'trigger-keydown' | 'initial' | 'missing' | 'disabled'

/** A mounted `TabsTrigger`, registered so an uncontrolled root can fall back to the first enabled tab. */
export interface TabsTriggerEntry {
  element: Ref<HTMLElement | undefined>
  props: { value: StringOrNumber, disabled?: boolean }
}

export type TabsTriggerState = {
  state: SelectionState
  disabled: boolean
  orientation: DataOrientation
}
export type TabsContentState = { state: SelectionState, orientation: DataOrientation }

/** Standalone `useTabs()` calls without a `baseId` draw `reka-tabs-<n>` from here. */
let tabsCount = 0

/** The id of the trigger for `value`: its `TabsTrigger` `id`, else `makeTriggerId(baseId, value)`. */
export function getTabsTriggerId(context: TabsRootContext, value: StringOrNumber): string {
  return context.customTriggerIds.value.get(value) ?? makeTriggerId(context.baseId, value)
}

/** The id of the content for `value`: its `TabsContent` `id`, else `makeContentId(baseId, value)`. */
export function getTabsContentId(context: TabsRootContext, value: StringOrNumber): string {
  return context.customContentIds.value.get(value) ?? makeContentId(context.baseId, value)
}

/**
 * The per-item trigger surface, derived purely from `(context, value)`. The
 * `TabsTrigger` SFC (which injects the context) and a standalone `useTabs()`
 * consumer share ONE derivation — no drift between the two.
 */
export function getTabsTriggerSurface(
  context: TabsRootContext,
  value: MaybeRefOrGetter<StringOrNumber>,
  disabled?: MaybeRefOrGetter<boolean | undefined>,
): PartSurface<TabsTriggerState> {
  const isSelected = isTabSelected(context, value)
  const isDisabled = () => toValue(disabled) ?? false

  // A tab is selected on click, once the press is released over it (#842).
  // Automatic activation also selects on the focus a press gives, so that
  // mode alone selects on mousedown. Only a plain
  // left press focuses: Ctrl+click is ignored (avoids the MacOS right-click),
  // and any other press (right/middle button, Ctrl, a disabled trigger)
  // prevents the default so the browser doesn't focus the trigger, which
  // automatic activation would turn into a selection (#3027).
  // Handlers are created once, not on every render.
  const isAutomatic = () => context.activationMode === 'automatic'
  // An Enter/Space keydown already attempted the change that its keyboard
  // click repeats: a cancelled change must not be asked for twice.
  let keyActivated = false
  const onMousedown = (event: MouseEvent) => {
    keyActivated = false
    // A consumer listener that prevented the event opts out of activation.
    if (event.defaultPrevented)
      return
    if (isDisabled() || event.button !== 0 || event.ctrlKey !== false) {
      event.preventDefault()
      return
    }
    if (!isAutomatic())
      return
    // A `beforeUpdate` cancel of the press must also block the browser's
    // follow-up focus, or automatic activation would re-attempt the change
    // as `trigger-focus`. An already-selected trigger attempts nothing
    // (`setState` returns `false` for an unchanged value), so it keeps focus.
    const changed = context.changeModelValue(toValue(value), 'trigger-press', event)
    if (!isSelected() && !changed)
      event.preventDefault()
  }
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || isDisabled())
      return
    // In automatic mode a pointer click (`detail` > 0) was handled by its
    // mousedown; a keyboard click (`detail` 0) by its keydown.
    if (event.detail > 0 ? isAutomatic() : keyActivated) {
      keyActivated = false
      return
    }
    context.changeModelValue(toValue(value), 'trigger-press', event)
  }
  // `@keydown.enter.space` — no preventDefault today; keep it that way.
  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented)
      return
    if (event.key === 'Enter' || event.key === ' ') {
      keyActivated = true
      context.changeModelValue(toValue(value), 'trigger-keydown', event)
    }
  }
  // The keyboard click comes during the keydown (Enter) or keyup (Space)
  // default action. When none follows (a prevented default, a non-button
  // trigger), the flag must not swallow a later `element.click()`.
  const onKeyup = () => {
    if (keyActivated)
      setTimeout(() => keyActivated = false)
  }
  // Automatic activation follows focus; manual mode needs a click/key.
  const onFocus = (event?: FocusEvent) => {
    if (!isSelected() && !isDisabled() && isAutomatic())
      context.changeModelValue(toValue(value), 'trigger-focus', event)
  }

  return createPartSurface<TabsTriggerState>(
    () => {
      const tab = toValue(value)
      return {
        'id': getTabsTriggerId(context, tab),
        'role': 'tab',
        'aria-selected': isSelected() ? 'true' : 'false',
        'aria-controls': context.contentIds.value.has(tab) ? getTabsContentId(context, tab) : undefined,
        'disabled': isDisabled(),
        'onMousedown': onMousedown,
        'onClick': onClick,
        'onKeydown': onKeydown,
        'onKeyup': onKeyup,
        'onFocus': onFocus,
      }
    },
    () => ({
      state: selectionState(isSelected()),
      disabled: isDisabled(),
      orientation: context.orientation.value,
    }),
  )
}

/**
 * Tracked "is this tab the selected one": a keyed selector cell, so a tab
 * change re-renders only the old and the new trigger and content.
 */
function isTabSelected(context: TabsRootContext, value: MaybeRefOrGetter<StringOrNumber>): () => boolean {
  return context.selected
    ? useSelectorKey(context.selected, () => toValue(value))
    : () => toValue(value) === context.modelValue.value
}

/** The per-item content surface, derived purely from `(context, value)`. */
export function getTabsContentSurface(context: TabsRootContext, value: MaybeRefOrGetter<StringOrNumber>): PartSurface<TabsContentState> {
  const isSelected = isTabSelected(context, value)
  return createPartSurface<TabsContentState>(
    () => ({
      'id': getTabsContentId(context, toValue(value)),
      'role': 'tabpanel',
      'aria-labelledby': getTabsTriggerId(context, toValue(value)),
      'tabindex': 0,
    }),
    () => ({
      state: selectionState(isSelected()),
      orientation: context.orientation.value,
    }),
  )
}

/** The list surface (`role="tablist"` + `aria-orientation`), derived purely from the context. */
export function getTabsListSurface(context: TabsRootContext): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(
    () => ({ 'role': 'tablist', 'aria-orientation': context.orientation.value }),
    () => ({}),
  )
}

export interface UseTabsProps {
  /**
   * Controlled selected value. A getter/ref resolving to `undefined` means
   * uncontrolled; a writable `Ref` with neither `emit` nor `onUpdate` is written
   * back on change ("ref-owned" mode).
   */
  modelValue?: MaybeRefOrGetter<StringOrNumber | null | undefined>
  /** Initial value when uncontrolled. `null` selects no tab. */
  defaultValue?: StringOrNumber | null
  /** Component `emit`; fires `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Runs before a change is applied; `details.cancel()` keeps the current tab. */
  onBeforeUpdate?: (value: StringOrNumber | undefined, details: ChangeEventDetails<TabsChangeReason>) => void
  /** Runs after a change is applied. */
  onUpdate?: (value: StringOrNumber | undefined, details: ChangeEventDetails<TabsChangeReason>) => void
  /** @defaultValue `'horizontal'` */
  orientation?: MaybeRefOrGetter<DataOrientation | undefined>
  /** Reading direction. Falls back to the nearest `ConfigProvider`, then `'ltr'`. */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** @defaultValue `true` */
  unmountOnHide?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `'manual'` */
  activationMode?: 'automatic' | 'manual'
  /**
   * Base id the trigger/content ids derive from. Defaults to `reka-tabs-<n>`
   * from a per-call counter, which is NOT stable across server and client:
   * SSR consumers must pass a stable `baseId` (the SFC hands its
   * `useId(undefined, 'reka-tabs')`).
   */
  baseId?: string
}

export interface UseTabsReturn {
  modelValue: ComputedRef<StringOrNumber | null | undefined>
  /**
   * Activate a tab by value; returns `false` when unchanged or cancelled.
   * The caller gates disabled/roving concerns.
   */
  selectTab: (value: StringOrNumber, reason?: TabsChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Details of the last change attempt; initially `{ reason: 'none' }`. */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<TabsChangeReason>>>
  isControlled: ComputedRef<boolean>
  registerContent: (value: StringOrNumber) => void
  unregisterContent: (value: StringOrNumber) => void
  root: PartSurface<{ orientation: DataOrientation }>
  list: PartSurface<Record<string, never>>
  /** Per-item trigger surface built from `(context, value)`. */
  getTriggerSurface: (value: MaybeRefOrGetter<StringOrNumber>, disabled?: MaybeRefOrGetter<boolean | undefined>) => PartSurface<TabsTriggerState>
  /** Per-item content surface built from `(context, value)`. */
  getContentSurface: (value: MaybeRefOrGetter<StringOrNumber>) => PartSurface<TabsContentState>
  context: TabsRootContext
}

/**
 * Headless Tabs logic. The `.vue` shells compose this; a standalone consumer
 * gets ids/aria/selection for free but must still wrap triggers in
 * `RovingFocusGroup`/`RovingFocusItem` for arrow-key navigation and `Presence`
 * for content mount/unmount — those are component families a pure composable
 * cannot absorb (see the #2723 recipe's "component-wrapper boundary").
 *
 * SSR-safe (no `document`/`window` at call scope) and callable outside `setup()`
 * (computed-only — registration + Presence stay in the SFCs).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useTabs(props: UseTabsProps = {}): UseTabsReturn {
  const baseId = props.baseId ?? `reka-tabs-${++tabsCount}`
  const activationMode = props.activationMode ?? 'manual'

  // `null` (no tab) only comes in through the props: changes always carry a
  // tab value, so the change callbacks keep their `StringOrNumber` type.
  const { state, setState, lastChangeDetails, isControlled } = useControllableState<StringOrNumber | undefined, TabsChangeReason>({
    prop: props.modelValue as MaybeRefOrGetter<StringOrNumber | undefined>,
    defaultValue: props.defaultValue as StringOrNumber | undefined,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const modelValue = state as ComputedRef<StringOrNumber | null | undefined>
  const orientation = computed<DataOrientation>(() => toValue(props.orientation) ?? 'horizontal')
  const dir = resolveDirection(props.dir)
  const unmountOnHide = computed<boolean>(() => toValue(props.unmountOnHide) ?? true)

  const tabsList = ref<HTMLElement>()
  const contentIds = shallowRef<Set<StringOrNumber>>(new Set())

  function selectTab(value: StringOrNumber, reason: TabsChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setState(value, reason, event)
  }
  function registerContent(value: StringOrNumber) {
    contentIds.value = new Set([...contentIds.value, value])
  }
  function unregisterContent(value: StringOrNumber) {
    const next = new Set(contentIds.value)
    next.delete(value)
    contentIds.value = next
  }

  const context: TabsRootContext = {
    modelValue,
    selected: createKeyedSelector(() => modelValue.value),
    changeModelValue: selectTab,
    orientation: orientation as Ref<DataOrientation>,
    dir: dir as Ref<Direction>,
    unmountOnHide: unmountOnHide as Ref<boolean>,
    activationMode,
    baseId,
    tabsList,
    contentIds,
    customTriggerIds: shallowRef(new Map()),
    customContentIds: shallowRef(new Map()),
    registerContent,
    unregisterContent,
    triggers: shallowReactive(new Set()),
  }

  const root = createPartSurface<{ orientation: DataOrientation }>(
    () => ({ dir: dir.value }),
    () => ({ orientation: orientation.value }),
  )

  return {
    modelValue,
    selectTab,
    lastChangeDetails,
    isControlled,
    registerContent,
    unregisterContent,
    root,
    list: getTabsListSurface(context),
    getTriggerSurface: (value, disabled) => getTabsTriggerSurface(context, value, disabled),
    getContentSurface: value => getTabsContentSurface(context, value),
    context,
  }
}

/** `a` comes before `b` in the document. */
function precedes(a: HTMLElement, b: HTMLElement) {
  return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
}

/**
 * Automatic selection for an uncontrolled root: with no tab selected
 * (no `defaultValue`), or with the selected tab removed or disabled, select the
 * first enabled trigger in document order. An explicit `defaultValue` pointing
 * at a disabled tab is honoured until it is selected while enabled (the
 * exemption clears on selection, not on the trigger); `null`
 * selects nothing. A controlled root keeps the value its parent gives.
 *
 * @lifecycle setup
 */
export function useTabsAutoSelect(tabs: Pick<UseTabsReturn, 'context' | 'isControlled' | 'selectTab'>, defaultValue: StringOrNumber | null | undefined) {
  const { context, isControlled, selectTab } = tabs
  const hasExplicitDefault = defaultValue !== undefined
  // The first automatic selection without a `defaultValue` reports `'initial'`.
  let notifyInitial = !hasExplicitDefault
  let honorDisabledDefault = hasExplicitDefault

  watchEffect(() => {
    if (isControlled.value || !context.triggers.size)
      return
    const value = context.modelValue.value
    let selected: TabsTriggerEntry | undefined
    let firstEnabled: HTMLElement | undefined
    let fallback: StringOrNumber | undefined
    for (const entry of context.triggers) {
      const element = entry.element.value
      if (!element)
        continue
      if (entry.props.value === value)
        selected = entry
      if (!entry.props.disabled && (!firstEnabled || precedes(element, firstEnabled))) {
        firstEnabled = element
        fallback = entry.props.value
      }
    }
    const isDisabled = !!selected?.props.disabled
    if (!isDisabled && value === defaultValue)
      honorDisabledDefault = false
    if (honorDisabledDefault && isDisabled && value === defaultValue)
      return
    // A selectable tab (or `null`, no tab) stays; with no enabled tab nothing changes.
    if ((!isDisabled && (selected || value === null)) || fallback === undefined)
      return
    if (value === fallback) {
      notifyInitial = false
      return
    }
    const reason = notifyInitial ? 'initial' : isDisabled ? 'disabled' : 'missing'
    notifyInitial = false
    selectTab(fallback, reason)
  }, { flush: 'post' })
}
