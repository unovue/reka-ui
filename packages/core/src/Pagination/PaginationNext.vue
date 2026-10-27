<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface PaginationNextProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectPaginationRootContext } from './PaginationRoot.vue'
import { getPaginationNavigationSurface } from './usePagination'

withDefaults(defineProps<PaginationNextProps>(), { as: 'button' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectPaginationRootContext()

// aria-label, disabled and the click handler come from the shared surface builder.
const surface = getPaginationNavigationSurface(rootContext, 'next')
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot>Next page</slot>
  </Primitive>
</template>
