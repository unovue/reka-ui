<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { DataOrientation, Direction, StringOrNumber } from '../shared/types'
import type { TabsChangeReason } from './useTabs'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { createContext, useDirection, useForwardExpose, useId } from '@/shared'

export interface TabsRootContext {
  modelValue: ComputedRef<StringOrNumber | undefined>
  changeModelValue: (value: StringOrNumber, reason?: TabsChangeReason | BaseChangeReason, event?: Event) => void
  orientation: Ref<DataOrientation>
  dir: Ref<Direction>
  unmountOnHide: Ref<boolean>
  activationMode: 'automatic' | 'manual'
  baseId: string
  tabsList: Ref<HTMLElement | undefined>
  contentIds: Ref<Set<StringOrNumber>>
  registerContent: (value: StringOrNumber) => void
  unregisterContent: (value: StringOrNumber) => void
}

export interface TabsRootProps<T extends StringOrNumber = StringOrNumber> extends PrimitiveProps {
  /**
   * The value of the tab that should be active when initially rendered. Use when you do not need to control the state of the tabs
   */
  defaultValue?: T
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
   * Whether a tab is activated automatically (on focus) or manually (on click).
   * @defaultValue automatic
   */
  activationMode?: 'automatic' | 'manual'
  /** The controlled value of the tab to activate. Can be bind as `v-model`. */
  modelValue?: T
  /**
   * When `true`, the element will be unmounted on closed state.
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
import { toRefs } from 'vue'
import { Primitive } from '@/Primitive'
import { useTabs } from './useTabs'

const props = withDefaults(defineProps<TabsRootProps<T>>(), {
  orientation: 'horizontal',
  activationMode: 'automatic',
  unmountOnHide: true,
})
const emits = defineEmits<TabsRootEmits<T>>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: T | undefined
  }) => any
}>()

// `dir` resolution (ConfigProvider-aware) stays in the shell; the composable
// owns the controlled/uncontrolled model (`useControllableState`) and emits.
const { dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
useForwardExpose()

const { root, context, modelValue } = useTabs({
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

provideTabsRootContext(context)
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="root.attrs.value"
  >
    <slot :model-value="modelValue as T | undefined" />
  </Primitive>
</template>
