<script lang="ts">
import type { TeleportProps } from '@/Teleport'
import DialogContent from './DialogContent.vue'
import DialogOverlay from './DialogOverlay.vue'

export interface DialogPortalProps extends TeleportProps {}

// The parts that render nothing while the popup is closed (see `createPortalGate`).
const gatedParts = [DialogOverlay, DialogContent]
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '@/Teleport'
import { createPortalGate } from '@/Teleport/portalGate'
import { injectDialogRootContext } from './DialogRoot.vue'

const props = defineProps<DialogPortalProps>()

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
