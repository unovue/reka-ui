<script lang="ts">
import type { MenuGroupProps } from '@/Menu'

export interface MenubarGroupProps extends MenuGroupProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { MenuGroup } from '@/Menu'
import { useForwardExpose } from '@/shared'

const props = defineProps<MenubarGroupProps>()
useForwardExpose()
</script>

<template>
  <MenuGroup v-bind="props">
    <slot />
  </MenuGroup>
</template>
