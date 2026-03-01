<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CalendarGridBodyProps extends PrimitiveProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<CalendarGridBodyProps>(), { as: 'tbody' })
</script>

<template>
  <Primitive v-bind="props">
    <slot />
  </Primitive>
</template>
