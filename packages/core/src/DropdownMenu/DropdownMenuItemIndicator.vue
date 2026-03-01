<script lang="ts">
import type { MenuItemIndicatorProps } from '@/Menu'
import { useForwardExpose } from '@/shared'

export interface DropdownMenuItemIndicatorProps extends MenuItemIndicatorProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { MenuItemIndicator } from '@/Menu'

const props = defineProps<DropdownMenuItemIndicatorProps>()
useForwardExpose()
</script>

<template>
  <MenuItemIndicator v-bind="props">
    <slot />
  </MenuItemIndicator>
</template>
