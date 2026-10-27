<script lang="ts">
import type {
  MenuCheckboxItemEmits,
  MenuCheckboxItemProps,
} from '@/Menu'
import type { CheckedState } from '@/Menu/utils'

export type ContextMenuCheckboxItemEmits = MenuCheckboxItemEmits

export interface ContextMenuCheckboxItemProps extends MenuCheckboxItemProps {}
</script>

<script setup lang="ts">
import { MenuCheckboxItem } from '@/Menu'
import { useEmitAsProps, useForwardElement } from '@/shared'

const props = defineProps<ContextMenuCheckboxItemProps>()
const emits = defineEmits<ContextMenuCheckboxItemEmits>()

defineSlots<{
  default?: (props: {
    /** Current checked state */
    checked: CheckedState
    /** Current modelValue state */
    modelValue: CheckedState
  }) => any
}>()

const emitsAsProps = useEmitAsProps(emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <MenuCheckboxItem
    :ref="forwardRef"
    v-slot="slotProps"
    v-bind="{ ...props, ...emitsAsProps }"
  >
    <slot v-bind="slotProps" />
  </MenuCheckboxItem>
</template>
