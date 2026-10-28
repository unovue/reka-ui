<script lang="ts">
import type { TeleportProps } from '@/Teleport'
import DrawerContent from './DrawerContent.vue'
import DrawerOverlay from './DrawerOverlay.vue'

export interface DrawerPortalProps extends TeleportProps {}

// The parts that render nothing while the popup is closed (see `createPortalGate`).
const gatedParts = [DrawerOverlay, DrawerContent]
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '@/Teleport'
import { createPortalGate } from '@/Teleport/portalGate'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = defineProps<DrawerPortalProps>()

// A closed popup renders no portal until it first opens (or its content is
// force-mounted); afterwards the portal stays.
const rootContext = injectDrawerRootContext(null)
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
