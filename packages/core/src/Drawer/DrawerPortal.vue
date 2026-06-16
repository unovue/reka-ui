<script lang="ts">
import type { TeleportProps } from '@/Teleport'

export interface DrawerPortalProps extends TeleportProps {}
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '@/Teleport'

defineProps<DrawerPortalProps>()
</script>

<template>
  <TeleportPrimitive v-bind="$props">
    <slot />
  </TeleportPrimitive>
</template>
