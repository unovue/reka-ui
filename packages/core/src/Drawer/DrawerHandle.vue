<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerHandleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = withDefaults(defineProps<DrawerHandleProps>(), { as: 'div' })
useForwardExpose()
const rootContext = injectDrawerRootContext()
</script>

<template>
  <Primitive
    v-bind="props"
    aria-hidden="true"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
  >
    <slot />
  </Primitive>
</template>
