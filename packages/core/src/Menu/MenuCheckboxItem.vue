<script lang="ts">
import type {
  MenuItemEmits,
  MenuItemProps,
} from './MenuItem.vue'
import type { CheckedState, MenuCheckboxItemChangeReason } from './utils'
import type { ChangeEventDetails } from '@/shared'
import { selectionState, useControllableState, useForwardElement, useForwardProps } from '@/shared'

export type MenuCheckboxItemEmits = MenuItemEmits & {
  /** Event handler called before the checked state changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [payload: boolean, details: ChangeEventDetails<MenuCheckboxItemChangeReason>]
  /** Event handler called when the checked state changes. */
  'update:modelValue': [payload: boolean, details: ChangeEventDetails<MenuCheckboxItemChangeReason>]
}

export interface MenuCheckboxItemProps extends MenuItemProps {
  /** The controlled checked state of the item. Can be used as `v-model`. */
  modelValue?: CheckedState
}
</script>

<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import MenuItem from './MenuItem.vue'
import { provideMenuItemIndicatorContext } from './MenuItemIndicator.vue'
import { getItemSelectOriginalEvent, isIndeterminate } from './utils'

const props = withDefaults(defineProps<MenuCheckboxItemProps>(), {
  modelValue: false,
})
const emits = defineEmits<MenuCheckboxItemEmits>()

defineSlots<{
  default?: (props: {
    /** Current checked state */
    checked: typeof modelValue.value
    /** Current modelValue state */
    modelValue: typeof modelValue.value
  }) => any
}>()

const delegatedProps = reactiveOmit(props, ['modelValue'])
const forwarded = useForwardProps(delegatedProps)

// `modelValue` defaults to `false`, so the item is always controlled: a press
// emits `beforeUpdate:modelValue` / `update:modelValue` and the parent writes
// the new state (v2 behaviour, now with change details, #2828).
const { state: modelValue, setState } = useControllableState<CheckedState, MenuCheckboxItemChangeReason>({
  prop: () => props.modelValue,
  defaultValue: false,
  name: 'modelValue',
  emit: emits,
})

function onSelect(event: Event) {
  emits('select', event)
  setState(isIndeterminate(modelValue.value) ? true : !modelValue.value, 'item-press', getItemSelectOriginalEvent(event))
}

provideMenuItemIndicatorContext({ modelValue })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <MenuItem
    :ref="forwardRef"
    role="menuitemcheckbox"
    v-bind="forwarded"
    :aria-checked="isIndeterminate(modelValue) ? 'mixed' : modelValue"
    :data-state="selectionState(modelValue)"
    @select="onSelect"
  >
    <slot
      :checked="modelValue"
      :model-value="modelValue"
    />
  </MenuItem>
</template>
