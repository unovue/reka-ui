<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface MenuSeparatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'

defineProps<MenuSeparatorProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    role="separator"
    aria-orientation="horizontal"
  >
    <slot />
  </component>
</template>
