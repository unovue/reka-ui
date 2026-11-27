<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { Grid, WeekStartsOn } from '@/date'
import { isEqualDay } from '@internationalized/date'
import { RangeCalendarRoot } from '..'
import { injectDateRangePickerRootContext } from './DateRangePickerRoot.vue'
</script>

<script setup lang="ts">
defineSlots<{
  default?: (props: {
    /** The current date of the placeholder */
    date: DateValue
    /** The grid of dates */
    grid: Grid<DateValue>[]
    /** The days of the week */
    weekDays: string[]
    /** The start of the week */
    weekStartsOn: WeekStartsOn
    /** The calendar locale */
    locale: string
    /** Whether or not to always display 6 weeks in the calendar */
    fixedWeeks: boolean
  }) => any
}>()

const rootContext = injectDateRangePickerRootContext()
</script>

<template>
  <RangeCalendarRoot
    v-slot="{ weekDays, grid, date, weekStartsOn, locale, fixedWeeks }"
    v-bind="{
      allowNonContiguousRanges: rootContext.allowNonContiguousRanges.value,
      isDateDisabled: rootContext.isDateDisabled,
      isDateUnavailable: rootContext.isDateUnavailable,
      isDateHighlightable: rootContext.isDateHighlightable,
      locale: rootContext.locale.value,
      disabled: rootContext.disabled.value,
      pagedNavigation: rootContext.pagedNavigation.value,
      weekStartsOn: rootContext.weekStartsOn.value,
      weekdayFormat: rootContext.weekdayFormat.value,
      fixedWeeks: rootContext.fixedWeeks.value,
      numberOfMonths: rootContext.numberOfMonths.value,
      readonly: rootContext.readonly.value,
      preventDeselect: rootContext.preventDeselect.value,
      minValue: rootContext.minValue.value,
      maxValue: rootContext.maxValue.value,
      dir: rootContext.dir.value,
      fixedDate: rootContext.fixedDate.value,
      maximumDays: rootContext.maximumDays?.value,
    }"
    :model-value="rootContext.modelValue.value"
    :placeholder="rootContext.placeholder.value"
    @update:start-value="(date) => {
      rootContext.onStartValueChange(date)
    }"
    @update:model-value="(date) => {
      if (date.start && rootContext.modelValue.value?.start && date.end && rootContext.modelValue.value?.end && isEqualDay(date.start, rootContext.modelValue.value?.start) && isEqualDay(date.end, rootContext.modelValue.value?.end)) return
      rootContext.onDateChange(date)
    }"
    @update:placeholder="(date) => {
      if (isEqualDay(date, rootContext.placeholder.value)) return
      rootContext.onPlaceholderChange(date)
    }"
  >
    <slot
      :date="date"
      :grid="grid"
      :week-days="weekDays"
      :week-starts-on="weekStartsOn"
      :locale="locale"
      :fixed-weeks="fixedWeeks"
    />
  </RangeCalendarRoot>
</template>
