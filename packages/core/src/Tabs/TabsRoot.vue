<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { DataOrientation, Direction, StringOrNumber } from '../shared/types'
import type { TabsChangeReason, TabsTriggerEntry } from './useTabs'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { KeyedSelector } from '@/shared/createKeyedSelector'
import { createContext, useDirection, useForwardElement, useId } from '@/shared'

export interface TabsRootContext {
  modelValue: ComputedRef<StringOrNumber | null | undefined>
  /** `modelValue` as a keyed selector: triggers and contents read their own cell. */
  selected?: KeyedSelector<StringOrNumber>
  /** Returns `false` when the value is unchanged or the change was cancelled. */
  changeModelValue: (value: StringOrNumber, reason?: TabsChangeReason | BaseChangeReason, event?: Event) => boolean
  orientation: Ref<DataOrientation>
  dir: Ref<Direction>
  unmountOnHide: Ref<boolean>
  activationMode: 'automatic' | 'manual'
  baseId: string
  tabsList: Ref<HTMLElement | undefined>
  contentIds: Ref<Set<StringOrNumber>>
  /** `TabsTrigger` `id` props by value; a value without one uses `makeTriggerId`. */
  customTriggerIds: Ref<Map<StringOrNumber, string>>
  /** `TabsContent` `id` props by value; a value without one uses `makeContentId`. */
  customContentIds: Ref<Map<StringOrNumber, string>>
  registerContent: (value: StringOrNumber) => void
  unregisterContent: (value: StringOrNumber) => void
  /** The mounted triggers (reactive), for the automatic first-tab selection. */
  triggers: Set<TabsTriggerEntry>
}

export interface TabsRootProps<T extends StringOrNumber = StringOrNumber> extends PrimitiveProps {
  /**
   * The value of the tab that should be active when initially rendered. Use when you do not need to control the state of the tabs.
   * Without it, the first enabled tab is selected; `null` selects no tab.
   */
  defaultValue?: T | null
  /**
   * The orientation the tabs are laid out.
   * Mainly so arrow navigation is done accordingly (left & right vs. up & down)
   * @defaultValue horizontal
   */
  orientation?: DataOrientation
  /**
   * The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode.
   */
  dir?: Direction
  /**
   * Whether a tab is activated automatically (on focus, so arrow keys select tabs as they move) or
   * manually (on click, or Enter/Space; arrow keys only move focus).
   * @defaultValue manual
   */
  activationMode?: 'automatic' | 'manual'
  /**
   * The controlled value of the tab to activate. Can be bind as `v-model`. `null` selects no tab. While it has been
   * `undefined` since mount the tabs are uncontrolled: they start on `defaultValue` (not emitted), or on the first
   * enabled tab without one (emitted). Once defined, it stays controlled, also when cleared to `undefined`.
   */
  modelValue?: T | null
  /**
   * When `true`, an inactive `TabsContent` is removed from the DOM, element and all. When `false`, it
   * stays mounted with the `hidden` attribute (any `display` style you give it overrides `hidden`).
   *
   * @defaultValue `true`
   */
  unmountOnHide?: boolean
}
export type TabsRootEmits<T extends StringOrNumber = StringOrNumber> = {
  /** Event handler called before the value changes; call `details.cancel()` to keep the current value */
  'beforeUpdate:modelValue': [payload: T, details: ChangeEventDetails<TabsChangeReason>]
  /** Event handler called when the value changes */
  'update:modelValue': [payload: T, details: ChangeEventDetails<TabsChangeReason>]
}

export const [injectTabsRootContext, provideTabsRootContext]
  = createContext<TabsRootContext>('TabsRoot')
</script>

<script setup lang="ts" generic="T extends StringOrNumber = StringOrNumber">
import { renderAs } from '@/Primitive/renderAs'
import { useTabs, useTabsAutoSelect } from './useTabs'

const props = withDefaults(defineProps<TabsRootProps<T>>(), {
  orientation: 'horizontal',
  activationMode: 'manual',
  unmountOnHide: true,
})
const emits = defineEmits<TabsRootEmits<T>>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: T | null | undefined
  }) => any
}>()

// `dir` resolution (ConfigProvider-aware) stays in the shell; the composable
// owns the controlled/uncontrolled model (`useControllableState`) and emits.
const dir = useDirection(() => props.dir)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const tabs = useTabs({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  emit: emits,
  orientation: () => props.orientation,
  dir,
  unmountOnHide: () => props.unmountOnHide,
  activationMode: props.activationMode,
  // `useId` (SSR-stable id) stays in the shell — the composable derives ids from it.
  baseId: useId(undefined, 'reka-tabs'),
})

const { root, context, modelValue } = tabs
// An uncontrolled root selects the first enabled tab by itself.
useTabsAutoSelect(tabs, props.defaultValue)

provideTabsRootContext(context)

// The composable is untyped over `T`; narrow once here for the slot payload
// (a `T | undefined` cast in the template reads as a deprecated filter to eslint).
const slotModelValue = modelValue as ComputedRef<T | null | undefined>
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="root.attrs.value"
  >
    <slot :model-value="slotModelValue" />
  </component>
</template>
