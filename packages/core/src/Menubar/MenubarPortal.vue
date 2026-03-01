<script lang="ts">
import type { MenuPortalProps } from '@/Menu'

export interface MenubarPortalProps extends MenuPortalProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { MenuPortal } from '@/Menu'

const props = defineProps<MenubarPortalProps>()
</script>

<template>
  <MenuPortal v-bind="props">
    <slot />
  </MenuPortal>
</template>
