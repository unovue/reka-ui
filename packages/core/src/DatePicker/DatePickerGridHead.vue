<script lang="ts">
import type { CalendarGridHeadProps } from '..'
import { CalendarGridHead } from '..'

export interface DatePickerGridHeadProps extends CalendarGridHeadProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerGridHeadProps>()
</script>

<template>
  <CalendarGridHead v-bind="props">
    <slot />
  </CalendarGridHead>
</template>
