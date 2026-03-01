<script lang="ts">
import type { DateFieldInputProps } from '..'
import { DateFieldInput } from '..'

export interface DatePickerInputProps extends DateFieldInputProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerInputProps>()
</script>

<template>
  <DateFieldInput v-bind="props">
    <slot />
  </DateFieldInput>
</template>
