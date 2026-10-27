<script lang="ts">
import type { CalendarGridData, CalendarUnit, DateValue, WeekStartsOn } from '@/date'
import { RangeCalendarRoot } from '..'
import { injectDateRangePickerRootContext } from './DateRangePickerRoot.vue'
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

const rootContext = injectDateRangePickerRootContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// The range calendar is controlled by the picker. Its `beforeUpdate:modelValue`
// runs the picker's change, so a pick emits once, from the picker, and a
// cancel on the picker restores the calendar's last range.
</script>

<template>
  <RangeCalendarRoot
    :ref="forwardRef"
    v-slot="{ weekDays, grid, date, weekStartsOn, locale, fixedWeeks, view }"
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
      maximumLength: rootContext.maximumLength?.value,
      maxView: rootContext.maxView.value,
      yearsPerPage: rootContext.yearsPerPage.value,
      columns: rootContext.columns.value,
    }"
    :model-value="rootContext.modelValue.value"
    :placeholder="rootContext.placeholder.value"
    :view="rootContext.view.value"
    @update:start-value="rootContext.onStartValueChange"
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
  </RangeCalendarRoot>
</template>
