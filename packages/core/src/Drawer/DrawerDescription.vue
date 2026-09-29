<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerDescriptionProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = withDefaults(defineProps<DrawerDescriptionProps>(), { as: 'p' })
useForwardExpose()
const rootContext = injectDrawerRootContext()
</script>

<template>
  <Primitive
    v-bind="props"
    :id="rootContext.descriptionId"
  >
    <slot />
  </Primitive>
</template>
