<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface MenuSeparatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'

const props = defineProps<MenuSeparatorProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="props"
    role="separator"
    aria-orientation="horizontal"
  >
    <slot />
  </Primitive>
</template>
