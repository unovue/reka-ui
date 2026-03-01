<script lang="ts">
import type { MenuSubTriggerProps } from '@/Menu'
import { useForwardExpose } from '@/shared'

export interface DropdownMenuSubTriggerProps extends MenuSubTriggerProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { MenuSubTrigger } from '@/Menu'

const props = defineProps<DropdownMenuSubTriggerProps>()
useForwardExpose()
</script>

<template>
  <MenuSubTrigger v-bind="props">
    <slot />
  </MenuSubTrigger>
</template>
