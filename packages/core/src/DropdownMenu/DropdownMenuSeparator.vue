<script lang="ts">
import type { MenuSeparatorProps } from '@/Menu'
import { useForwardElement } from '@/shared'

export interface DropdownMenuSeparatorProps extends MenuSeparatorProps {}
</script>

<script setup lang="ts">
import { MenuSeparator } from '@/Menu'

const props = defineProps<DropdownMenuSeparatorProps>()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <MenuSeparator
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </MenuSeparator>
</template>
