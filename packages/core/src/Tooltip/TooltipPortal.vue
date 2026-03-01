<script lang="ts">
import type { TeleportProps } from '@/Teleport'

export interface TooltipPortalProps extends TeleportProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '@/Teleport'

const props = defineProps<TooltipPortalProps>()
</script>

<template>
  <TeleportPrimitive v-bind="props">
    <slot />
  </TeleportPrimitive>
</template>
