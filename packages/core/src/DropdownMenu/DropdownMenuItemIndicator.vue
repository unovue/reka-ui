<script lang="ts">
import type { MenuItemIndicatorProps } from '@/Menu'
import { useForwardElement } from '@/shared'

export interface DropdownMenuItemIndicatorProps extends MenuItemIndicatorProps {}
</script>

<script setup lang="ts">
import { MenuItemIndicator } from '@/Menu'

const props = defineProps<DropdownMenuItemIndicatorProps>()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <MenuItemIndicator
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </MenuItemIndicator>
</template>
