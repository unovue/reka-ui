<script lang="ts">
import type { RangeCalendarHeadingProps } from '..'
import { RangeCalendarHeading } from '..'

export interface DateRangePickerHeadingProps extends RangeCalendarHeadingProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerHeadingProps>()
defineSlots<{
  default?: (props: {
    /** Heading of the active view: `September 2026`, `2026`, `2020 - 2031` */
    headingValue: string
  }) => any
}>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <RangeCalendarHeading
    :ref="forwardRef"
    v-slot="{ headingValue }"
    v-bind="props"
  >
    <slot :heading-value="headingValue">
      {{ headingValue }}
    </slot>
  </RangeCalendarHeading>
</template>
