<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SelectSeparatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'

const props = defineProps<SelectSeparatorProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    aria-hidden="true"
    v-bind="props"
  >
    <slot />
  </Primitive>
</template>
