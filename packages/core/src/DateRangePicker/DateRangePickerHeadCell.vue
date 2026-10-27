<script lang="ts">
import type { RangeCalendarHeadCellProps } from '..'
import { RangeCalendarHeadCell } from '..'

export interface DateRangePickerHeadCellProps extends RangeCalendarHeadCellProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerHeadCellProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <RangeCalendarHeadCell
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </RangeCalendarHeadCell>
</template>
