<script lang="ts">
import type { MenuPortalProps } from '@/Menu'
import ContextMenuContent from './ContextMenuContent.vue'
import ContextMenuSubContent from './ContextMenuSubContent.vue'

export interface ContextMenuPortalProps extends MenuPortalProps {}

// The parts that render nothing while the popup is closed (see `createPortalGate`).
const gatedParts = [ContextMenuContent, ContextMenuSubContent]
</script>

<script setup lang="ts">
import { MenuPortal } from '@/Menu'
import { injectMenuContext } from '@/Menu/MenuRoot.vue'
import { createPortalGate } from '@/Teleport/portalGate'

const props = defineProps<ContextMenuPortalProps>()

// A closed popup renders no portal until it first opens (or its content is
// force-mounted); afterwards the portal stays.
const rootContext = injectMenuContext(null)
const shouldRender = createPortalGate(rootContext, () => !!rootContext?.open.value, gatedParts)
</script>

<template>
  <MenuPortal
    v-if="shouldRender(forceMount, $slots.default)"
    v-bind="props"
  >
    <slot />
  </MenuPortal>
</template>
