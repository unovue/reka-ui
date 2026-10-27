<script lang="ts">
import type { RangeCalendarCellProps } from '..'
import { RangeCalendarCell } from '..'

export interface DateRangePickerCellProps extends RangeCalendarCellProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerCellProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <RangeCalendarCell
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </RangeCalendarCell>
</template>
