<script setup lang="ts">
import type { DateValue } from '@internationalized/date'

import { CalendarDateTime, isWeekend } from '@internationalized/date'
import { defineMeta } from 'sb-addon-vue-csf'

import DateRangePicker from './_DummyDateRangePicker.vue'

const defaultValue = { start: new CalendarDateTime(2024, 2, 20), end: new CalendarDateTime(2024, 2, 27) }

const minValue = new CalendarDateTime(2024, 2, 14)
const maxValue = new CalendarDateTime(2024, 2, 28)

function isDateUnavailable(date: DateValue) {
  return isWeekend(date, 'en')
}

function isDateDisabled(date: DateValue) {
  return date.day <= 12
}

const { Story } = defineMeta({
  title: 'Date Range Picker/Validation',
})
</script>

<template>
  <Story
    name="Min date"
    :as-child="true"
  >
    <DateRangePicker
      :default-value="defaultValue"
      :min-value="minValue"
    />
  </Story>

  <Story
    name="Max date"
    :as-child="true"
  >
    <DateRangePicker
      :default-value="defaultValue"
      :max-value="maxValue"
    />
  </Story>

  <Story
    name="Unavailable"
    :as-child="true"
  >
    <DateRangePicker
      :default-value="defaultValue"
      :is-date-unavailable="isDateUnavailable"
    />
  </Story>

  <Story
    name="Disabled"
    :as-child="true"
  >
    <DateRangePicker
      :default-value="defaultValue"
      :is-date-disabled="isDateDisabled"
    />
  </Story>
</template>
