<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { disabledAttr, useForwardExpose, useTranslations } from '@/shared'

export interface PaginationListItemProps extends PrimitiveProps {
  /** Value for the page */
  value: number
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { injectPaginationRootContext } from './PaginationRoot.vue'

const props = withDefaults(defineProps<PaginationListItemProps>(), { as: 'button' })

const t = useTranslations()

useForwardExpose()

const rootContext = injectPaginationRootContext()
const isSelected = computed(() => rootContext.page.value === props.value)

const disabled = computed((): boolean => rootContext.disabled.value)
</script>

<template>
  <Primitive
    v-bind="props"
    data-type="page"
    :aria-label="t('paginationPage', { page: value })"
    :aria-current="isSelected ? 'page' : undefined"
    :data-selected="isSelected ? 'true' : undefined"
    :disabled="disabledAttr(disabled, props.as, props.asChild)"
    :type="as === 'button' ? 'button' : undefined"
    @click="!disabled && rootContext.onPageChange(value)"
  >
    <slot>{{ value }}</slot>
  </Primitive>
</template>
