<script lang="ts">
import type { CalendarGridData, CalendarUnit, DateValue, WeekStartsOn } from '@/date'
import { CalendarRoot } from '..'
import { injectDatePickerRootContext } from './DatePickerRoot.vue'
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

defineSlots<{
  default?: (props: {
    /** The current date of the placeholder */
    date: DateValue
    /** The rendered page(s) of the active view */
    grid: CalendarGridData[]
    /** The days of the week (day view only) */
    weekDays: string[]
    /** The start of the week */
    weekStartsOn: WeekStartsOn
    /** The calendar locale */
    locale: string
    /** Whether or not to always display 6 weeks in the calendar */
    fixedWeeks: boolean
    /** The active view */
    view: CalendarUnit
  }) => any
}>()

const rootContext = injectDatePickerRootContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// The calendar is controlled by the picker. Its `beforeUpdate:modelValue`
// runs the picker's change, so a pick emits once, from the picker, with the
// calendar's reason (`cell-press`, `cell-keydown`).
</script>

<template>
  <CalendarRoot
    :ref="forwardRef"
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
    :model-value="rootContext.modelValue.value ?? null"
    :placeholder="rootContext.placeholder.value"
    :view="rootContext.view.value"
    :multiple="false"
    @before-update:model-value="rootContext.onCalendarBeforeUpdate"
    @update:placeholder="rootContext.onCalendarPlaceholderChange"
    @update:view="(next, details) => rootContext.onViewChange(next, details)"
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
