<script lang="ts">
import type { TeleportProps } from '@/Teleport'

export interface DialogPortalProps extends TeleportProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '@/Teleport'

const props = defineProps<DialogPortalProps>()
</script>

<template>
  <TeleportPrimitive v-bind="props">
    <slot />
  </TeleportPrimitive>
</template>
