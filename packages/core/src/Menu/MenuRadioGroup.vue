<script lang="ts">
import type { Ref } from 'vue'
import type { MenuGroupProps } from './MenuGroup.vue'
import type { MenuRadioGroupChangeReason } from './utils'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { AcceptableValue } from '@/shared/types'
import { createContext, useControllableState, useForwardElement, useForwardProps } from '@/shared'

interface MenuRadioGroupContext {
  modelValue: Ref<AcceptableValue>
  /** Request a value change. Returns `false` when the value is unchanged or the change was cancelled. */
  onValueChange: (payload: AcceptableValue, reason?: MenuRadioGroupChangeReason | BaseChangeReason, event?: Event) => boolean
}

export interface MenuRadioGroupProps extends MenuGroupProps {
  /** The value of the selected item in the group. */
  modelValue?: AcceptableValue
}

export type MenuRadioGroupEmits = {
  /** Called before the value changes; `details.cancel()` keeps the current value. */
  'beforeUpdate:modelValue': [payload: AcceptableValue, details: ChangeEventDetails<MenuRadioGroupChangeReason>]
  /** Event handler called when the value changes. */
  'update:modelValue': [payload: AcceptableValue, details: ChangeEventDetails<MenuRadioGroupChangeReason>]
}

export const [injectMenuRadioGroupContext, provideMenuRadioGroupContext]
  = createContext<MenuRadioGroupContext>('MenuRadioGroup')
</script>

<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import MenuGroup from './MenuGroup.vue'

const props = withDefaults(defineProps<MenuRadioGroupProps>(), {
  modelValue: '',
})
const emits = defineEmits<MenuRadioGroupEmits>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const delegatedProps = reactiveOmit(props, ['modelValue'])
const forwarded = useForwardProps(delegatedProps)

// `modelValue` defaults to `''`, so the group is always controlled: a press
// emits `beforeUpdate:modelValue` / `update:modelValue` and the parent writes
// the new value (v2 behaviour, now with change details and only on a real
// change, #2828).
const { state: modelValue, setState } = useControllableState<AcceptableValue, MenuRadioGroupChangeReason>({
  prop: () => props.modelValue,
  defaultValue: '',
  name: 'modelValue',
  emit: emits,
})

provideMenuRadioGroupContext({
  modelValue,
  onValueChange: (payload, reason = 'imperative-action', event) => setState(payload, reason, event),
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <MenuGroup
    :ref="forwardRef"
    v-bind="forwarded"
  >
    <slot :model-value="modelValue" />
  </MenuGroup>
</template>
