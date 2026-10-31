<script lang="ts">
import type { TeleportProps } from '@/Teleport'
import SelectContent from './SelectContent.vue'

export interface SelectPortalProps extends TeleportProps {}

// The parts that render nothing while the select is closed (see `createPortalGate`).
const gatedParts = [SelectContent]
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '@/Teleport'
import { createPortalGate } from '@/Teleport/portalGate'
import { injectSelectRootContext } from './SelectRoot.vue'

const props = defineProps<SelectPortalProps>()

// A closed select renders no portal until it first opens (or its content is
// force-mounted); afterwards the portal stays. While closed, the content still
// renders its items into a detached fragment when their labels are needed
// (see `SelectClosedItems`): that needs no portal, so the slot renders in place
// and the content teleports the items into the fragment itself.
const rootContext = injectSelectRootContext(null)
const shouldRender = createPortalGate(rootContext, () => !!rootContext?.open.value, gatedParts)
</script>

<template>
  <TeleportPrimitive
    v-if="shouldRender(forceMount, $slots.default)"
    v-bind="props"
  >
    <slot />
  </TeleportPrimitive>
  <slot v-else-if="rootContext?.closedItems?.render.value" />
</template>
