<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerOverlayImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useBodyScrollLock, useForwardExpose } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { DRAWER_CSS_VARS } from './utils'

defineProps<DrawerOverlayImplProps>()
const rootContext = injectDrawerRootContext()

useBodyScrollLock(true)
useForwardExpose()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    :style="{
      pointerEvents: 'auto',
      userSelect: 'none',
      [DRAWER_CSS_VARS.swipeProgress]: '0',
      [DRAWER_CSS_VARS.swipeStrength]: '1',
    }"
  >
    <slot />
  </Primitive>
</template>
