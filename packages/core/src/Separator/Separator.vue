<script lang="ts">
import type { BaseSeparatorProps } from '@/shared/component/BaseSeparator.vue'

export interface SeparatorProps extends BaseSeparatorProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import BaseSeparator from '@/shared/component/BaseSeparator.vue'

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: 'horizontal',
})
</script>

<template>
  <BaseSeparator v-bind="props">
    <slot />
  </BaseSeparator>
</template>
