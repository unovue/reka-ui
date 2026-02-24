<script setup lang="ts">
import type { DateValue } from '@internationalized/date'

import { CalendarDate, isWeekend } from '@internationalized/date'
import { defineMeta } from 'sb-addon-vue-csf'
import RangeCalendar from './_DummyRangeCalendar.vue'

function isDateUnavailable(date: DateValue) {
  return isWeekend(date, 'en')
}
function isDateDisabled(date: DateValue) {
  return date.day > 20
}

const defaultValue = { start: new CalendarDate(2024, 2, 20), end: new CalendarDate(2024, 2, 24) }
const minValue = new CalendarDate(2024, 2, 12)
const maxValue = new CalendarDate(2024, 2, 20)

const { Story } = defineMeta({
  title: 'Range Calendar/Validation',
})
</script>

<template>
  <Story
    name="Unavailable"
    :as-child="true"
  >
    <RangeCalendar
      :default-value="defaultValue"
      :is-date-unavailable="isDateUnavailable"
    />
  </Story>

  <Story
    name="Disabled"
    :as-child="true"
  >
    <RangeCalendar
      :default-value="defaultValue"
      :is-date-disabled="isDateDisabled"
    />
  </Story>

  <Story
    name="Min"
    :as-child="true"
  >
    <RangeCalendar
      :default-value="defaultValue"
      :min-value="minValue"
    />
  </Story>

  <Story
    name="Max"
    :as-child="true"
  >
    <RangeCalendar
      :default-value="defaultValue"
      :max-value="maxValue"
    />
  </Story>

  <Story
    name="Min Max"
    :as-child="true"
  >
    <RangeCalendar
      :default-value="defaultValue"
      :min-value="minValue"
      :max-value="maxValue"
    />
  </Story>

  <Story
    name="Maximum Days"
    :as-child="true"
  >
    <RangeCalendar
      :default-value="defaultValue"
      :maximum-days="5"
    />
  </Story>
</template>
