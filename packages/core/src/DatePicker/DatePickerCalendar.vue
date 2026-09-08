<script lang="ts">
import type { TemporalDate } from '@/temporal/types'
import { isSameDay } from '@/temporal/comparators'
import { CalendarRoot } from '..'
import { injectDatePickerRootContext } from './DatePickerRoot.vue'
</script>

<script setup lang="ts">
const rootContext = injectDatePickerRootContext()
</script>

<template>
  <CalendarRoot
    v-slot="{ weekDays, grid, date, weekStartsOn, locale, fixedWeeks }"
    v-bind="{
      isDateDisabled: rootContext.isDateDisabled,
      isDateUnavailable: rootContext.isDateUnavailable,
      minValue: rootContext.minValue.value,
      maxValue: rootContext.maxValue.value,
      locale: rootContext.locale.value,
      disabled: rootContext.disabled.value,
      pagedNavigation: rootContext.pagedNavigation.value,
      weekStartsOn: rootContext.weekStartsOn.value,
      weekdayFormat: rootContext.weekdayFormat.value,
      fixedWeeks: rootContext.fixedWeeks.value,
      numberOfMonths: rootContext.numberOfMonths.value,
      readonly: rootContext.readonly.value,
      preventDeselect: rootContext.preventDeselect.value,
      dir: rootContext.dir.value,
    }"
    :model-value="rootContext.modelValue.value"
    :placeholder="rootContext.placeholder.value"
    :multiple="false"
    @update:model-value="(date: TemporalDate | TemporalDate[] | undefined) => {
      const singleDate = Array.isArray(date) ? date[0] : date
      if (singleDate && rootContext.modelValue.value && isSameDay(singleDate, rootContext.modelValue.value)) return
      rootContext.onDateChange(singleDate)
    }"
    @update:placeholder="(date: TemporalDate) => {
      if (isSameDay(date, rootContext.placeholder.value)) return
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
  </CalendarRoot>
</template>
