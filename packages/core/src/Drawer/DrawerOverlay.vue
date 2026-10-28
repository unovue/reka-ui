<script lang="ts">
import type { DrawerOverlayImplProps } from './DrawerOverlayImpl.vue'

export interface DrawerBackdropProps extends DrawerOverlayImplProps {
  /** Keep mounted for animation control. */
  forceMount?: boolean
  /** Render even when inside a nested drawer. @default false */
  forceRender?: boolean
}
/** @deprecated Use `DrawerBackdropProps`; `DrawerOverlay` is a deprecated alias of `DrawerBackdrop`. */
export type DrawerOverlayProps = DrawerBackdropProps
</script>

<script setup lang="ts">
import { Presence } from '@/Presence'
import { useForwardElement } from '@/shared'
import { isPortalOpening } from '@/Teleport/portalGate'
import DrawerOverlayImpl from './DrawerOverlayImpl.vue'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = withDefaults(defineProps<DrawerBackdropProps>(), {
  forceMount: false,
  forceRender: false,
})

const rootContext = injectDrawerRootContext()
const isNested = !!rootContext.notifyParentHasNestedDrawer
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Presence
    v-if="rootContext.modal.value && (!isNested || forceRender)"
    :appear="isPortalOpening(rootContext)"
    :present="forceMount || rootContext.open.value"
  >
    <DrawerOverlayImpl
      v-bind="$attrs"
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
    >
      <slot />
    </DrawerOverlayImpl>
  </Presence>
</template>
