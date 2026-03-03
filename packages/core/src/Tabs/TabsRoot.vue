<script lang="ts">
import type { Ref } from 'vue'
import type { DataOrientation, Direction } from '../shared/types'
import type { PrimitiveProps } from '@/Primitive'
import { useVModel } from '@vueuse/core'
import { createContext, useDirection, useForwardExpose, useId } from '@/shared'
import type { TabValue } from './utils'

export interface TabsRootContext {
  modelValue: Ref<TabValue | undefined>
  changeModelValue: (value: TabValue) => void
  orientation: Ref<DataOrientation>
  dir: Ref<Direction>
  unmountOnHide: Ref<boolean>
  activationMode: 'automatic' | 'manual'
  baseId: string
  tabsList: Ref<HTMLElement | undefined>
  contentIds: Ref<Set<TabValue>>
  registerContent: (value: TabValue) => void
  unregisterContent: (value: TabValue) => void
}

export interface TabsRootProps<T extends TabValue = TabValue> extends PrimitiveProps {
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
export type TabsRootEmits<T extends TabValue = TabValue> = {
  /** Event handler called when the value changes */
  'update:modelValue': [payload: T]
}

export const [injectTabsRootContext, provideTabsRootContext]
  = createContext<TabsRootContext>('TabsRoot')
</script>

<script setup lang="ts" generic="T extends TabValue = TabValue">
import { ref, shallowRef, toRefs } from 'vue'
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<TabsRootProps<T>>(), {
  orientation: 'horizontal',
  activationMode: 'automatic',
  unmountOnHide: true,
})
const emits = defineEmits<TabsRootEmits<T>>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { orientation, unmountOnHide, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
useForwardExpose()

const modelValue = useVModel<TabsRootProps<T>, 'modelValue', 'update:modelValue'>(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: (props.modelValue === undefined) as false,
})

const tabsList = ref<HTMLElement>()
const contentIds = shallowRef<Set<TabValue>>(new Set())

provideTabsRootContext({
  modelValue,
  changeModelValue: (value: TabValue) => {
    modelValue.value = value as T
  },
  orientation,
  dir,
  unmountOnHide,
  activationMode: props.activationMode,
  baseId: useId(undefined, 'reka-tabs'),
  tabsList,
  contentIds,
  registerContent: (value: TabValue) => {
    contentIds.value = new Set([...contentIds.value, value])
  },
  unregisterContent: (value: TabValue) => {
    const newSet = new Set(contentIds.value)
    newSet.delete(value)
    contentIds.value = newSet
  },
})
</script>

<template>
  <Primitive
    :dir="dir"
    :data-orientation="orientation"
    :as-child="asChild"
    :as="as"
  >
    <slot :model-value="modelValue" />
  </Primitive>
</template>
