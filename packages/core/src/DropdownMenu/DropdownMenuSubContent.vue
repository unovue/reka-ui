<script lang="ts">
import type {
  MenuSubContentEmits,
  MenuSubContentProps,
} from '@/Menu'
import { useForwardElement } from '@/shared'

export type DropdownMenuSubContentEmits = MenuSubContentEmits

export interface DropdownMenuSubContentProps extends MenuSubContentProps {}
</script>

<script setup lang="ts">
import { MenuSubContent } from '@/Menu'
import { useForwardPropsEmits } from '..'

const props = defineProps<DropdownMenuSubContentProps>()
const emits = defineEmits<DropdownMenuSubContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <MenuSubContent
    :ref="forwardRef"
    v-bind="forwarded"
    :style="{
      '--reka-dropdown-menu-content-transform-origin':
        'var(--reka-popper-transform-origin)',
      '--reka-dropdown-menu-content-available-width':
        'var(--reka-popper-available-width)',
      '--reka-dropdown-menu-content-available-height':
        'var(--reka-popper-available-height)',
      '--reka-dropdown-menu-trigger-width': 'var(--reka-popper-anchor-width)',
      '--reka-dropdown-menu-trigger-height':
        'var(--reka-popper-anchor-height)',
    }"
  >
    <slot />
  </MenuSubContent>
</template>
