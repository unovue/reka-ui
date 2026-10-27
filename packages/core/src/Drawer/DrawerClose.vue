<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerCloseProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = withDefaults(defineProps<DrawerCloseProps>(), { as: 'button' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectDrawerRootContext()
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="props"
    :type="as === 'button' ? 'button' : undefined"
    @click="rootContext.onOpenChange(false, 'close-press')"
  >
    <slot />
  </Primitive>
</template>
