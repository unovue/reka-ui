<script lang="ts">
import type { MenuItemEmits, MenuItemProps } from '@/Menu'

export type MenubarItemEmits = MenuItemEmits

export interface MenubarItemProps extends MenuItemProps {}
</script>

<script setup lang="ts">
import { MenuItem } from '@/Menu'
import { useEmitAsProps, useForwardElement } from '@/shared'

const props = defineProps<MenubarItemProps>()
const emits = defineEmits<MenubarItemEmits>()

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
