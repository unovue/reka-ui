<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

/**
 * The visual grab bar of the popup (decorative, `aria-hidden`). Base UI has no
 * part for it; it was `DrawerHandle`, a name kept free for the detached-trigger
 * handle (`createDrawerHandle`), as Base UI's `Drawer.Handle` is.
 */
export interface DrawerGrabberProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { getDrawerGrabberSurface } from './useDrawer'

const props = withDefaults(defineProps<DrawerGrabberProps>(), { as: 'div' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectDrawerRootContext()
const handle = getDrawerGrabberSurface(rootContext)
</script>

<template>
  <component
    :is="renderAs(props.as, props.asChild)"
    :ref="forwardRef"
    v-bind="handle.attrs.value"
  >
    <slot />
  </component>
</template>
