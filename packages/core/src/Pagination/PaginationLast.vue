<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface PaginationLastProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { injectPaginationRootContext } from './PaginationRoot.vue'
import { getPaginationNavigationSurface } from './usePagination'

withDefaults(defineProps<PaginationLastProps>(), { as: 'button' })

const rootContext = injectPaginationRootContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// aria-label, disabled and the click handler come from the shared surface builder.
const surface = getPaginationNavigationSurface(rootContext, 'last')
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot>Last page</slot>
  </component>
</template>
