<script lang="ts">
import type { MenuItemEmits, MenuItemProps } from '@/Menu'

export type DropdownMenuItemEmits = MenuItemEmits

export interface DropdownMenuItemProps extends MenuItemProps {}
</script>

<script setup lang="ts">
import { MenuItem } from '@/Menu'
import { useEmitAsProps, useForwardElement } from '@/shared'

const props = defineProps<DropdownMenuItemProps>()
const emits = defineEmits<DropdownMenuItemEmits>()

const emitsAsProps = useEmitAsProps(emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <MenuItem
    :ref="forwardRef"
    v-bind="{ ...props, ...emitsAsProps }"
  >
    <slot />
  </MenuItem>
</template>
