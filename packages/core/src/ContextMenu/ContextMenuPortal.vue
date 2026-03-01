<script lang="ts">
export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import type { MenuPortalProps } from '@/Menu'
import { MenuPortal } from '@/Menu'

export interface ContextMenuPortalProps extends MenuPortalProps {}
const props = defineProps<ContextMenuPortalProps>()
</script>

<template>
  <MenuPortal v-bind="props">
    <slot />
  </MenuPortal>
</template>
