import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { TabsRootContext } from './TabsRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface, SelectionState } from '@/shared'
import type { DataOrientation, Direction, StringOrNumber } from '@/shared/types'
import { computed, ref, shallowRef, toValue } from 'vue'
import { createPartSurface, selectionState, useControllableState } from '@/shared'
import { makeContentId, makeTriggerId } from './utils'

// `PartSurface` is the shared contract in `@/shared` and is already published via
// `@/Switch`; NOT re-exported here to avoid an ambiguous duplicate in the barrel.

/** Why the selected tab changed; carried as `details.reason` on every change (#2828). */
export type TabsChangeReason = 'trigger-press' | 'trigger-focus' | 'trigger-keydown'

export type TabsTriggerState = {
  state: SelectionState
  disabled: boolean
  orientation: DataOrientation
}
export type TabsContentState = { state: SelectionState, orientation: DataOrientation }

/** Standalone `useTabs()` calls without a `baseId` draw `reka-tabs-<n>` from here. */
let tabsCount = 0

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
  const isSelected = computed(() => toValue(value) === context.modelValue.value)
  const isDisabled = computed(() => toValue(disabled) ?? false)
  const contentId = computed(() => context.contentIds.value.has(toValue(value)) ? makeContentId(context.baseId, toValue(value)) : undefined)

  return createPartSurface<TabsTriggerState>(
    () => ({
      'id': makeTriggerId(context.baseId, toValue(value)),
      'role': 'tab',
      'aria-selected': isSelected.value ? 'true' : 'false',
      'aria-controls': contentId.value,
      'disabled': isDisabled.value,
      // Ported verbatim from TabsTrigger.vue's `@mousedown.left`: the `.left`
      // modifier is the `button !== 0` guard; Ctrl+click is ignored (avoids the
      // MacOS right-click), and a blocked click prevents focus so it can't
      // accidentally activate.
      'onMousedown': (event: MouseEvent) => {
        if (event.button !== 0)
          return
        if (isDisabled.value || event.ctrlKey !== false) {
          event.preventDefault()
          return
        }
        // A `beforeUpdate` cancel of the press must also block the browser's
        // follow-up focus, or automatic activation would re-attempt the change
        // as `trigger-focus`. An already-selected trigger attempts nothing
        // (`setState` returns `false` for an unchanged value), so it keeps focus.
        const changed = context.changeModelValue(toValue(value), 'trigger-press', event)
        if (!isSelected.value && !changed)
          event.preventDefault()
      },
      // `@keydown.enter.space` — no preventDefault today; keep it that way.
      'onKeydown': (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ')
          context.changeModelValue(toValue(value), 'trigger-keydown', event)
      },
      // Automatic activation follows focus; manual mode needs a click/key.
      'onFocus': (event?: FocusEvent) => {
        const isAutomaticActivation = context.activationMode !== 'manual'
        if (!isSelected.value && !isDisabled.value && isAutomaticActivation)
          context.changeModelValue(toValue(value), 'trigger-focus', event)
      },
    }),
    () => ({
      state: selectionState(isSelected.value),
      disabled: isDisabled.value,
      orientation: context.orientation.value,
    }),
  )
}

/** The per-item content surface, derived purely from `(context, value)`. */
export function getTabsContentSurface(context: TabsRootContext, value: MaybeRefOrGetter<StringOrNumber>): PartSurface<TabsContentState> {
  const isSelected = computed(() => toValue(value) === context.modelValue.value)
  return createPartSurface<TabsContentState>(
    () => ({
      'id': makeContentId(context.baseId, toValue(value)),
      'role': 'tabpanel',
      'aria-labelledby': makeTriggerId(context.baseId, toValue(value)),
      'tabindex': 0,
    }),
    () => ({
      state: selectionState(isSelected.value),
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
  modelValue?: MaybeRefOrGetter<StringOrNumber | undefined>
  /** Initial value when uncontrolled. */
  defaultValue?: StringOrNumber
  /** Component `emit`; fires `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Runs before a change is applied; `details.cancel()` keeps the current tab. */
  onBeforeUpdate?: (value: StringOrNumber | undefined, details: ChangeEventDetails<TabsChangeReason>) => void
  /** Runs after a change is applied. */
  onUpdate?: (value: StringOrNumber | undefined, details: ChangeEventDetails<TabsChangeReason>) => void
  /** @defaultValue `'horizontal'` */
  orientation?: MaybeRefOrGetter<DataOrientation | undefined>
  /** @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** @defaultValue `true` */
  unmountOnHide?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `'automatic'` */
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
  modelValue: ComputedRef<StringOrNumber | undefined>
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
  const activationMode = props.activationMode ?? 'automatic'

  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<StringOrNumber | undefined, TabsChangeReason>({
    prop: props.modelValue,
    defaultValue: props.defaultValue,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const orientation = computed<DataOrientation>(() => toValue(props.orientation) ?? 'horizontal')
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
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
    changeModelValue: selectTab,
    orientation: orientation as Ref<DataOrientation>,
    dir: dir as Ref<Direction>,
    unmountOnHide: unmountOnHide as Ref<boolean>,
    activationMode,
    baseId,
    tabsList,
    contentIds,
    registerContent,
    unregisterContent,
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
