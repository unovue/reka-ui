<script lang="ts">
import type { TeleportProps } from '@/Teleport'
import HoverCardContent from './HoverCardContent.vue'

export interface HoverCardPortalProps extends TeleportProps {}

// The parts that render nothing while the popup is closed (see `createPortalGate`).
const gatedParts = [HoverCardContent]
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '@/Teleport'
import { createPortalGate } from '@/Teleport/portalGate'
import { injectHoverCardRootContext } from './HoverCardRoot.vue'

const props = defineProps<HoverCardPortalProps>()

// A closed popup renders no portal until it first opens (or its content is
// force-mounted); afterwards the portal stays.
const rootContext = injectHoverCardRootContext(null)
const shouldRender = createPortalGate(rootContext, () => !!rootContext?.open.value, gatedParts)
</script>

<template>
  <TeleportPrimitive
    v-if="shouldRender(forceMount, $slots.default)"
    v-bind="props"
  >
    <slot />
  </TeleportPrimitive>
</template>
