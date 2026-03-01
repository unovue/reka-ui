<script lang="ts">
import type { TeleportProps } from '@/Teleport'

export interface HoverCardPortalProps extends TeleportProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '@/Teleport'

const props = defineProps<HoverCardPortalProps>()
</script>

<template>
  <TeleportPrimitive v-bind="props">
    <slot />
  </TeleportPrimitive>
</template>
