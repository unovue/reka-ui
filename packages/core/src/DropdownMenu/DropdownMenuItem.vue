<script lang="ts">
import type { MenuItemEmits, MenuItemProps } from '@/Menu'

export type DropdownMenuItemEmits = MenuItemEmits

export interface DropdownMenuItemProps extends MenuItemProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { MenuItem } from '@/Menu'
import { useEmitAsProps, useForwardExpose } from '@/shared'

const props = defineProps<DropdownMenuItemProps>()
const emits = defineEmits<DropdownMenuItemEmits>()

const emitsAsProps = useEmitAsProps(emits)
useForwardExpose()
</script>

<template>
  <MenuItem v-bind="{ ...props, ...emitsAsProps }">
    <slot />
  </MenuItem>
</template>
