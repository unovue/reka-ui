<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerCloseProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
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
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="close.attrs.value"
  >
    <slot />
  </Primitive>
</template>
