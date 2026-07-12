import type { MaybeRefOrGetter, Ref } from 'vue'
import type { TabsRootContext } from './TabsRoot.vue'
import type { PartSurface } from '@/shared'
import type { DataOrientation, Direction, StringOrNumber } from '@/shared/types'
import { computed, ref, shallowRef, toValue } from 'vue'
import { makeContentId, makeTriggerId } from './utils'

export type { PartSurface }

export type TabsTriggerState = {
  state: 'active' | 'inactive'
  disabled: boolean
  orientation: DataOrientation
}
export type TabsContentState = { state: 'active' | 'inactive', orientation: DataOrientation }

/**
 * The per-item trigger surface, derived purely from `(context, value)`. Exported
 * so the `TabsTrigger` SFC (which injects the context) and a standalone
 * `useTabs()` consumer share ONE derivation — no drift between the two.
 */
export function getTabsTriggerSurface(
  context: TabsRootContext,
  value: MaybeRefOrGetter<StringOrNumber>,
  disabled?: MaybeRefOrGetter<boolean | undefined>,
): PartSurface<TabsTriggerState> {
  const isSelected = computed(() => toValue(value) === context.modelValue.value)
  const isDisabled = computed(() => toValue(disabled) ?? false)
  const contentId = computed(() => context.contentIds.value.has(toValue(value)) ? makeContentId(context.baseId, toValue(value)) : undefined)

  return {
    props: computed(() => ({
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
        if (!isDisabled.value && event.ctrlKey === false)
          context.changeModelValue(toValue(value))
        else
          event.preventDefault()
      },
      // `@keydown.enter.space` — no preventDefault today; keep it that way.
      'onKeydown': (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ')
          context.changeModelValue(toValue(value))
      },
      // Automatic activation follows focus; manual mode needs a click/key.
      'onFocus': () => {
        const isAutomaticActivation = context.activationMode !== 'manual'
        if (!isSelected.value && !isDisabled.value && isAutomaticActivation)
          context.changeModelValue(toValue(value))
      },
    })),
    state: computed(() => ({
      state: isSelected.value ? 'active' : 'inactive',
      disabled: isDisabled.value,
      orientation: context.orientation.value,
    })),
  }
}

/** The per-item content surface, derived purely from `(context, value)`. */
export function getTabsContentSurface(context: TabsRootContext, value: MaybeRefOrGetter<StringOrNumber>): PartSurface<TabsContentState> {
  const isSelected = computed(() => toValue(value) === context.modelValue.value)
  return {
    props: computed(() => ({
      'id': makeContentId(context.baseId, toValue(value)),
      'role': 'tabpanel',
      'aria-labelledby': makeTriggerId(context.baseId, toValue(value)),
      'tabindex': 0,
    })),
    state: computed(() => ({
      state: isSelected.value ? 'active' : 'inactive',
      orientation: context.orientation.value,
    })),
  }
}

export interface UseTabsProps {
  /** Externally-owned selected value (the SFC hands its `useVModel` ref). */
  modelValue?: Ref<StringOrNumber | undefined>
  /** Initial value when uncontrolled. */
  defaultValue?: StringOrNumber
  /** @defaultValue `'horizontal'` */
  orientation?: MaybeRefOrGetter<DataOrientation | undefined>
  /** @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** @defaultValue `true` */
  unmountOnHide?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `'automatic'` */
  activationMode?: 'automatic' | 'manual'
  /**
   * Base id the trigger/content ids derive from. The SFC hands its
   * `useId(undefined, 'reka-tabs')` so SSR ids stay stable; defaults to
   * `'reka-tabs'` for standalone use.
   */
  baseId?: string
}

export interface UseTabsReturn {
  modelValue: Ref<StringOrNumber | undefined>
  /** Activate a tab by value. The caller gates disabled/roving concerns. */
  selectTab: (value: StringOrNumber) => void
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
 */
export function useTabs(props: UseTabsProps = {}): UseTabsReturn {
  const baseId = props.baseId ?? 'reka-tabs'
  const activationMode = props.activationMode ?? 'automatic'

  const modelValue = (props.modelValue ?? ref<StringOrNumber | undefined>(props.defaultValue)) as Ref<StringOrNumber | undefined>
  const orientation = computed<DataOrientation>(() => toValue(props.orientation) ?? 'horizontal')
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const unmountOnHide = computed<boolean>(() => toValue(props.unmountOnHide) ?? true)

  const tabsList = ref<HTMLElement>()
  const contentIds = shallowRef<Set<StringOrNumber>>(new Set())

  function selectTab(value: StringOrNumber) {
    modelValue.value = value
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

  const root: PartSurface<{ orientation: DataOrientation }> = {
    props: computed(() => ({ dir: dir.value })),
    state: computed(() => ({ orientation: orientation.value })),
  }
  const list: PartSurface<Record<string, never>> = {
    props: computed(() => ({ 'role': 'tablist', 'aria-orientation': orientation.value })),
    state: computed(() => ({})),
  }

  return {
    modelValue,
    selectTab,
    registerContent,
    unregisterContent,
    root,
    list,
    getTriggerSurface: (value, disabled) => getTabsTriggerSurface(context, value, disabled),
    getContentSurface: value => getTabsContentSurface(context, value),
    context,
  }
}
