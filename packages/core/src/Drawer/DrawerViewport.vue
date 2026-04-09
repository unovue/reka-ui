<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerViewportProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'

/**
 * Optional scrollable viewport wrapper. Mirrors Base UI's `Drawer.Viewport`.
 *
 * In Base UI the viewport owns the gesture state machine; in this port the
 * gesture logic lives on `DrawerContent` / `DrawerContentImpl` directly, so
 * this component is currently a passthrough that carries the `data-drawer-viewport`
 * attribute for downstream selectors. It exists primarily for API parity.
 */
const props = withDefaults(defineProps<DrawerViewportProps>(), { as: 'div' })
const { forwardRef } = useForwardExpose()
const rootContext = injectDrawerRootContext()
</script>

<template>
  <Primitive
    v-bind="props"
    :ref="forwardRef"
    data-drawer-viewport=""
    :data-state="rootContext.open.value ? 'open' : 'closed'"
  >
    <slot />
  </Primitive>
</template>
