<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface PaginationEllipsisProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { getPaginationEllipsisSurface } from './usePagination'

defineProps<PaginationEllipsisProps>()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const surface = getPaginationEllipsisSurface()
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="surface.attrs.value"
  >
    <slot>&#8230;</slot>
  </Primitive>
</template>
