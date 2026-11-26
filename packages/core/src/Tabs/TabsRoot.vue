<script lang="ts">
import type { Ref } from 'vue'
import type { DataOrientation, Direction, StringOrNumber } from '../shared/types'
import type { PrimitiveProps } from '@/Primitive'
import type { KeyedSelector } from '@/shared/createKeyedSelector'
import { useVModel } from '@vueuse/core'
import { createRekaContext, useDirection, useForwardExpose, useId } from '@/shared'

export interface TabsRootContext {
  modelValue: Ref<StringOrNumber | undefined>
  /**
   * Whether a tab value is the selected one. A trigger or a content that reads it re-renders only
   * when its own tab is entered or left, where reading `modelValue` re-evaluates on every change.
   */
  selection: KeyedSelector<StringOrNumber>
  changeModelValue: (value: StringOrNumber) => void
  orientation: Ref<DataOrientation>
  dir: Ref<Direction>
  unmountOnHide: Ref<boolean>
  activationMode: 'automatic' | 'manual'
  baseId: string
  tabsList: Ref<HTMLElement | undefined>
  contentIds: Ref<Set<StringOrNumber>>
  registerContent: (value: StringOrNumber) => void
  unregisterContent: (value: StringOrNumber) => void
  /** Ids of triggers that render an id other than the generated one, by tab value. */
  triggerIds: Ref<Map<StringOrNumber, string>>
  /** Ids of contents that render an id other than the generated one, by tab value. */
  renderedContentIds: Ref<Map<StringOrNumber, string>>
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
  /** Event handler called when the value changes */
  'update:modelValue': [payload: T]
}

export const [injectTabsRootContext, provideTabsRootContext]
  = createRekaContext<TabsRootContext>('TabsRoot')
</script>

<script setup lang="ts" generic="T extends StringOrNumber = StringOrNumber">
import { ref, shallowRef, toRefs } from 'vue'
import { Primitive } from '@/Primitive'
import { createKeyedSelector } from '@/shared/createKeyedSelector'
import { useLazySlotProps } from '@/shared/lazySlotProps'
import { useAgentRegistration } from '@/shared/useAgentRegistration'

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
const contentIds = shallowRef<Set<StringOrNumber>>(new Set())
const triggerIds = ref(new Map<StringOrNumber, string>())
const renderedContentIds = ref(new Map<StringOrNumber, string>())

const agentContext = provideTabsRootContext({
  modelValue,
  selection: createKeyedSelector<StringOrNumber>(() => modelValue.value),
  changeModelValue: (value: StringOrNumber) => {
    modelValue.value = value as T
  },
  orientation,
  dir,
  unmountOnHide,
  activationMode: props.activationMode,
  baseId: useId(undefined, 'reka-tabs'),
  tabsList,
  contentIds,
  registerContent: (value: StringOrNumber) => {
    contentIds.value = new Set([...contentIds.value, value])
  },
  unregisterContent: (value: StringOrNumber) => {
    const newSet = new Set(contentIds.value)
    newSet.delete(value)
    contentIds.value = newSet
  },
  triggerIds,
  renderedContentIds,
})
useAgentRegistration('tabs', agentContext, props)

// Read when a consumer slot uses it, not where the slot is rendered: the slot is rendered by this
// root's element, and a value read there re-renders it, and through it every trigger and content,
// on each tab change.
const slotProps = useLazySlotProps({ modelValue: () => modelValue.value })
</script>

<template>
  <Primitive
    :dir="dir"
    :data-orientation="orientation"
    :as-child="asChild"
    :as="as"
  >
    <slot v-bind="slotProps()" />
  </Primitive>
</template>
