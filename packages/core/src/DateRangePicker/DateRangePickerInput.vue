<script lang="ts">
import type { DateRangeFieldInputProps } from '..'
import { DateRangeFieldInput } from '..'

export interface DateRangePickerInputProps extends DateRangeFieldInputProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerInputProps>()
</script>

<template>
  <DateRangeFieldInput v-bind="props">
    <slot />
  </DateRangeFieldInput>
</template>
