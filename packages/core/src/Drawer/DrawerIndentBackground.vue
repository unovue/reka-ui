<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerIndentBackgroundProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectDrawerProviderContext } from './DrawerProvider.vue'

withDefaults(defineProps<DrawerIndentBackgroundProps>(), { as: 'div' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const providerContext = injectDrawerProviderContext(null)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    :data-active="providerContext?.active.value ? '' : undefined"
    :data-inactive="!providerContext?.active.value ? '' : undefined"
  >
    <slot />
  </component>
</template>
