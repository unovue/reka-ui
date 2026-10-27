<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerHandleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { getDrawerHandleSurface } from './useDrawer'

const props = withDefaults(defineProps<DrawerHandleProps>(), { as: 'div' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectDrawerRootContext()
const handle = getDrawerHandleSurface(rootContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    v-bind="handle.attrs.value"
  >
    <slot />
  </Primitive>
</template>
