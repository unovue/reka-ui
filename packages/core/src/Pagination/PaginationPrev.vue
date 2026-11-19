<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { disabledAttr, useForwardExpose } from '@/shared'

export interface PaginationPrevProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { injectPaginationRootContext } from './PaginationRoot.vue'

const props = withDefaults(defineProps<PaginationPrevProps>(), { as: 'button' })

useForwardExpose()
const rootContext = injectPaginationRootContext()

const disabled = computed((): boolean => rootContext.page.value === 1 || rootContext.disabled.value)
</script>

<template>
  <Primitive
    v-bind="props"
    aria-label="Previous Page"
    :type="as === 'button' ? 'button' : undefined"
    :disabled="disabledAttr(disabled, props.as, props.asChild)"
    @click="!disabled && rootContext.onPageChange(rootContext.page.value - 1)"
  >
    <slot>Prev page</slot>
  </Primitive>
</template>
