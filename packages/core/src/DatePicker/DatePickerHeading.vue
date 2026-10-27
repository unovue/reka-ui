<script lang="ts">
import type { CalendarHeadingProps } from '..'
import { CalendarHeading } from '..'

export interface DatePickerHeadingProps extends CalendarHeadingProps {}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerHeadingProps>()
defineSlots<{
  default?: (props: {
    /** Heading of the active view: `September 2026`, `2026`, `2020 - 2031` */
    headingValue: string
  }) => any
}>()
</script>

<template>
  <CalendarHeading
    v-slot="{ headingValue }"
    v-bind="props"
  >
    <slot :heading-value="headingValue">
      {{ headingValue }}
    </slot>
  </CalendarHeading>
</template>
