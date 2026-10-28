<script lang="ts">
import type { TeleportProps } from '@/Teleport'
import ComboboxContent from './ComboboxContent.vue'

export interface ComboboxPortalProps extends TeleportProps {}

// The parts that render nothing while the popup is closed (see `createPortalGate`).
const gatedParts = [ComboboxContent]
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '@/Teleport'
import { createPortalGate } from '@/Teleport/portalGate'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

const props = defineProps<ComboboxPortalProps>()

// A closed popup renders no portal until it first opens (or its content is
// force-mounted); afterwards the portal stays.
const rootContext = injectComboboxRootContext(null)
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
