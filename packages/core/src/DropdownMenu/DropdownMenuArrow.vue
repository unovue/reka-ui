<script lang="ts">
import type { MenuArrowProps } from '@/Menu'
import { useForwardElement } from '@/shared'

export interface DropdownMenuArrowProps extends MenuArrowProps {}
</script>

<script setup lang="ts">
import { MenuArrow } from '@/Menu'

const props = withDefaults(defineProps<DropdownMenuArrowProps>(), {
  width: 10,
  height: 5,
  as: 'svg',
})
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <MenuArrow
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </MenuArrow>
</template>
