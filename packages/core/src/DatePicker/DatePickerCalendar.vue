<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { CalendarModelValue } from '..'
import { isEqualDay } from '@internationalized/date'
import { CalendarRoot } from '..'
import { injectDatePickerRootContext } from './DatePickerRoot.vue'
</script>

<script setup lang="ts">
const rootContext = injectDatePickerRootContext()
</script>

<template>
  <CalendarRoot
    v-slot="{ weekDays, grid, date, weekStartsOn, locale, fixedWeeks, view }"
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
      maxView: rootContext.maxView.value,
      yearsPerPage: rootContext.yearsPerPage.value,
      columns: rootContext.columns.value,
    }"
    :model-value="rootContext.modelValue.value"
    :placeholder="rootContext.placeholder.value"
    :view="rootContext.view.value"
    :multiple="false"
    @update:model-value="(value: CalendarModelValue) => {
      // `multiple` is pinned to false above, so the model is never an array.
      const date = Array.isArray(value) ? value.at(-1) : value
      if (date && rootContext.modelValue.value && isEqualDay(date, rootContext.modelValue.value)) return
      rootContext.onDateChange(date)
    }"
    @update:placeholder="(date: DateValue) => {
      if (isEqualDay(date, rootContext.placeholder.value)) return
      rootContext.onPlaceholderChange(date)
    }"
    @update:view="(next) => rootContext.onViewChange(next)"
  >
    <slot
      :date="date"
      :grid="grid"
      :week-days="weekDays"
      :week-starts-on="weekStartsOn"
      :locale="locale"
      :fixed-weeks="fixedWeeks"
      :view="view"
    />
  </CalendarRoot>
</template>
