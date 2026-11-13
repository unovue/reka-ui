<script lang="ts">
import type { RangeCalendarGridProps } from '@/RangeCalendar'
import { RangeCalendarGrid } from '@/RangeCalendar'

export interface DateRangePickerGridProps extends RangeCalendarGridProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerGridProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <RangeCalendarGrid
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </RangeCalendarGrid>
</template>
