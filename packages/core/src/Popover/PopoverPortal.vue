<script lang="ts">
import type { TeleportProps } from '@/Teleport'
import PopoverContent from './PopoverContent.vue'

export interface PopoverPortalProps extends TeleportProps {}

// The parts that render nothing while the popup is closed (see `createPortalGate`).
const gatedParts = [PopoverContent]
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '@/Teleport'
import { createPortalGate } from '@/Teleport/portalGate'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = defineProps<PopoverPortalProps>()

// A closed popup renders no portal until it first opens (or its content is
// force-mounted); afterwards the portal stays.
const rootContext = injectPopoverRootContext(null)
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
