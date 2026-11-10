<script lang="ts">
import type { RangeCalendarHeaderProps } from '@/RangeCalendar'
import { RangeCalendarHeader } from '@/RangeCalendar'

export interface DateRangePickerHeaderProps extends RangeCalendarHeaderProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerHeaderProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <RangeCalendarHeader
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </RangeCalendarHeader>
</template>
