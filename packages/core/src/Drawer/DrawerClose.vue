<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerCloseProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = withDefaults(defineProps<DrawerCloseProps>(), { as: 'button' })
useForwardExpose()
const rootContext = injectDrawerRootContext()
</script>

<template>
  <Primitive
    v-bind="props"
    :type="as === 'button' ? 'button' : undefined"
    @click="rootContext.onOpenChange(false, 'close-press')"
  >
    <slot />
  </Primitive>
</template>
