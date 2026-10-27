<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface PaginationFirstProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectPaginationRootContext } from './PaginationRoot.vue'
import { getPaginationNavigationSurface } from './usePagination'

withDefaults(defineProps<PaginationFirstProps>(), { as: 'button' })

const rootContext = injectPaginationRootContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// aria-label, disabled and the click handler come from the shared surface builder.
const surface = getPaginationNavigationSurface(rootContext, 'first')
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot>First page</slot>
  </Primitive>
</template>
