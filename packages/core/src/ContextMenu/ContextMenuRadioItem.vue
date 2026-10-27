<script lang="ts">
import type {
  MenuItemEmits,
  MenuRadioItemProps,
} from '@/Menu'

export type ContextMenuRadioItemEmits = MenuItemEmits

export interface ContextMenuRadioItemProps extends MenuRadioItemProps {}
</script>

<script setup lang="ts">
import { MenuRadioItem } from '@/Menu'
import { useEmitAsProps, useForwardElement } from '@/shared'

const props = defineProps<ContextMenuRadioItemProps>()
const emits = defineEmits<ContextMenuRadioItemEmits>()

defineSlots<{
  default?: (props: {
    /** Current checked state */
    checked: boolean
  }) => any
}>()

const emitsAsProps = useEmitAsProps(emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <MenuRadioItem
    :ref="forwardRef"
    v-slot="slotProps"
    v-bind="{ ...props, ...emitsAsProps }"
  >
    <slot v-bind="slotProps" />
  </MenuRadioItem>
</template>
