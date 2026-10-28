<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerCloseProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { getDrawerCloseSurface } from './useDrawer'

const props = withDefaults(defineProps<DrawerCloseProps>(), { as: 'button' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectDrawerRootContext()
// `onClick` → `onOpenChange(false, 'close-press')` from the shared surface builder.
const close = getDrawerCloseSurface(rootContext)
</script>

<template>
  <component
    :is="renderAs(props.as, props.asChild)"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="close.attrs.value"
  >
    <slot />
  </component>
</template>
