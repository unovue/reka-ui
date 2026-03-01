<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface RangeCalendarGridBodyProps extends PrimitiveProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<RangeCalendarGridBodyProps>(), { as: 'tbody' })
</script>

<template>
  <Primitive v-bind="props">
    <slot />
  </Primitive>
</template>
