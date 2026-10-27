<script lang="ts">
import type { MenuSeparatorProps } from '@/Menu'

export interface ContextMenuSeparatorProps extends MenuSeparatorProps {}
</script>

<script setup lang="ts">
import { MenuSeparator } from '@/Menu'
import { useForwardElement } from '@/shared'

const props = defineProps<ContextMenuSeparatorProps>()
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
