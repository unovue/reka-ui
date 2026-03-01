<script lang="ts">
import type { MenuSeparatorProps } from '@/Menu'
import { useForwardExpose } from '@/shared'

export interface DropdownMenuSeparatorProps extends MenuSeparatorProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { MenuSeparator } from '@/Menu'

const props = defineProps<DropdownMenuSeparatorProps>()
useForwardExpose()
</script>

<template>
  <MenuSeparator v-bind="props">
    <slot />
  </MenuSeparator>
</template>
