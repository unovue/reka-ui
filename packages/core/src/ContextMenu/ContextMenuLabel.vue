<script lang="ts">
import type { MenuLabelProps } from '@/Menu'

export interface ContextMenuLabelProps extends MenuLabelProps {}
</script>

<script setup lang="ts">
import { MenuLabel } from '@/Menu'
import { useForwardElement } from '@/shared'

const props = defineProps<ContextMenuLabelProps>()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <MenuLabel
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </MenuLabel>
</template>
