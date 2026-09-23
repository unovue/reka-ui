<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerIndentBackgroundProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectDrawerProviderContext } from './DrawerProvider.vue'

const props = withDefaults(defineProps<DrawerIndentBackgroundProps>(), { as: 'div' })
const { forwardRef } = useForwardExpose()
const providerContext = injectDrawerProviderContext(null)
</script>

<template>
  <Primitive
    v-bind="props"
    :ref="forwardRef"
    :data-active="providerContext?.active.value ? '' : undefined"
    :data-inactive="!providerContext?.active.value ? '' : undefined"
  >
    <slot />
  </Primitive>
</template>
