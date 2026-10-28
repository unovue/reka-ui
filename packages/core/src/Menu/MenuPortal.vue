<script lang="ts">
import type { TeleportProps } from '@/Teleport'
import MenuContent from './MenuContent.vue'
import MenuSubContent from './MenuSubContent.vue'

export interface MenuPortalProps extends TeleportProps {}

// The parts that render nothing while the popup is closed (see `createPortalGate`).
const gatedParts = [MenuContent, MenuSubContent]
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '@/Teleport'
import { createPortalGate } from '@/Teleport/portalGate'
import { injectMenuContext } from './MenuRoot.vue'

const props = defineProps<MenuPortalProps>()

// A closed popup renders no portal until it first opens (or its content is
// force-mounted); afterwards the portal stays.
const rootContext = injectMenuContext(null)
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
