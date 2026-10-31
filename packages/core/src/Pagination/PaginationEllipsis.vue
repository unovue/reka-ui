<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface PaginationEllipsisProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { getPaginationEllipsisSurface } from './usePagination'

defineProps<PaginationEllipsisProps>()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const surface = getPaginationEllipsisSurface()
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="surface.attrs.value"
  >
    <slot>&#8230;</slot>
  </component>
</template>
