<script lang="ts">
import type { BaseSeparatorProps } from '@/shared/component/BaseSeparator.vue'

export interface SeparatorProps extends BaseSeparatorProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'
import BaseSeparator from '@/shared/component/BaseSeparator.vue'

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: 'horizontal',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <BaseSeparator
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </BaseSeparator>
</template>
