<script lang="ts">
import type { TeleportProps } from '@/Teleport'
import { DialogContent, DialogOverlay } from '@/Dialog'
import AlertDialogContent from './AlertDialogContent.vue'
import AlertDialogOverlay from './AlertDialogOverlay.vue'

export interface AlertDialogPortalProps extends TeleportProps {}

// The parts that render nothing while the popup is closed (see `createPortalGate`).
const gatedParts = [AlertDialogOverlay, AlertDialogContent, DialogOverlay, DialogContent]
</script>

<script setup lang="ts">
import { injectDialogRootContext } from '@/Dialog/DialogRoot.vue'
import { TeleportPrimitive } from '@/Teleport'
import { createPortalGate } from '@/Teleport/portalGate'

const props = defineProps<AlertDialogPortalProps>()

// A closed popup renders no portal until it first opens (or its content is
// force-mounted); afterwards the portal stays.
const rootContext = injectDialogRootContext(null)
const shouldRender = createPortalGate(rootContext, () => !!rootContext && (rootContext.open.value || !rootContext.unmountOnHide.value), gatedParts)
</script>

<template>
  <TeleportPrimitive
    v-if="shouldRender(forceMount, $slots.default)"
    v-bind="props"
  >
    <slot />
  </TeleportPrimitive>
</template>
