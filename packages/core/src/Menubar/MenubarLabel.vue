<script lang="ts">
import type { MenuLabelProps } from '@/Menu'
import { useForwardElement } from '@/shared'

export interface MenubarLabelProps extends MenuLabelProps {}
</script>

<script setup lang="ts">
import { MenuLabel } from '@/Menu'

const props = defineProps<MenubarLabelProps>()
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
