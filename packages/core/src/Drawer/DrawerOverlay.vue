<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerOverlayProps extends PrimitiveProps {
  /** Keep mounted for animation control. */
  forceMount?: boolean
  /** Render even when inside a nested drawer. @default false */
  forceRender?: boolean
}
</script>

<script setup lang="ts">
import { Presence } from '@/Presence'
import { Primitive } from '@/Primitive'
import { useBodyScrollLock, useForwardExpose } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { DRAWER_CSS_VARS } from './utils'

const props = withDefaults(defineProps<DrawerOverlayProps>(), {
  forceMount: false,
  forceRender: false,
})

const rootContext = injectDrawerRootContext()
// notifyParentHasNestedDrawer is only set when this drawer is inside another drawer
const isNested = !!rootContext.notifyParentHasNestedDrawer
const { forwardRef } = useForwardExpose()

if (rootContext.modal.value)
  useBodyScrollLock(true)
</script>

<template>
  <Presence :present="forceMount || rootContext.open.value">
    <Primitive
      v-if="rootContext.modal.value && (!isNested || forceRender)"
      v-bind="$attrs"
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :data-state="rootContext.open.value ? 'open' : 'closed'"
      :style="{
        pointerEvents: rootContext.open.value ? 'auto' : 'none',
        userSelect: 'none',
        [DRAWER_CSS_VARS.swipeProgress]: '0',
        [DRAWER_CSS_VARS.swipeStrength]: '1',
      }"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
