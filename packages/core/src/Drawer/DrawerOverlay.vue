<script lang="ts">
import type { DrawerOverlayImplProps } from './DrawerOverlayImpl.vue'

export interface DrawerOverlayProps extends DrawerOverlayImplProps {
  /** Keep mounted for animation control. */
  forceMount?: boolean
  /** Render even when inside a nested drawer. @default false */
  forceRender?: boolean
}
</script>

<script setup lang="ts">
import { Presence } from '@/Presence'
import { useForwardExpose } from '@/shared'
import DrawerOverlayImpl from './DrawerOverlayImpl.vue'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = withDefaults(defineProps<DrawerOverlayProps>(), {
  forceMount: false,
  forceRender: false,
})

const rootContext = injectDrawerRootContext()
const isNested = !!rootContext.notifyParentHasNestedDrawer
const { forwardRef } = useForwardExpose()
</script>

<template>
  <Presence
    v-if="rootContext.modal.value && (!isNested || forceRender)"
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
