<script setup lang="ts">
import type { DateValue } from '@internationalized/date'

import { CalendarDate, isWeekend } from '@internationalized/date'
import { defineMeta } from 'addon-vue-csf'

import DatePicker from './_DummyDatePicker.vue'

const defaultValue = new CalendarDate(2024, 2, 20)

const minValue = new CalendarDate(2024, 2, 14)
const maxValue = new CalendarDate(2024, 2, 28)

function isDateUnavailable(date: DateValue) {
  return isWeekend(date, 'en')
}

function isDateDisabled(date: DateValue) {
  return date.day <= 12
}

const { Story } = defineMeta({
  title: 'Date Picker/Validation',
})
</script>

<template>
  <Story
    name="Min date"
    :as-child="true"
  >
    <DatePicker
      :default-value="defaultValue"
      :min-value="minValue"
    />
  </Story>

  <Story
    name="Max date"
    :as-child="true"
  >
    <DatePicker
      :default-value="defaultValue"
      :max-value="maxValue"
    />
  </Story>

  <Story
    name="Unavailable"
    :as-child="true"
  >
    <DatePicker
      :default-value="defaultValue"
      :is-date-unavailable="isDateUnavailable"
    />
  </Story>

  <Story
    name="Disabled"
    :as-child="true"
  >
    <DatePicker
      :default-value="defaultValue"
      :is-date-disabled="isDateDisabled"
    />
  </Story>
</template>
