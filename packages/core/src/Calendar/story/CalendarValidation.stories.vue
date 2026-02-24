<script setup lang="ts">
import type { CalendarRootProps } from '..'

import { CalendarDate, isWeekend } from '@internationalized/date'
import { defineMeta } from 'sb-addon-vue-csf'
import Calendar from './_DummyCalendar.vue'

const isDateUnavailable: CalendarRootProps['isDateUnavailable'] = (date) => {
  return isWeekend(date, 'en')
}
const isDateDisabled: CalendarRootProps['isDateUnavailable'] = (date) => {
  return date.day > 20
}

const defaultValue = new CalendarDate(2024, 2, 14)
const minValue = new CalendarDate(2024, 2, 12)
const maxValue = new CalendarDate(2024, 2, 20)

const { Story } = defineMeta({
  title: 'Calendar/Validation',
})
</script>

<template>
  <Story
    name="Unavailable"
    :as-child="true"
  >
    <Calendar
      :default-value="defaultValue"
      :is-date-unavailable="isDateUnavailable"
    />
  </Story>

  <Story
    name="Disabled"
    :as-child="true"
  >
    <Calendar
      :default-value="defaultValue"
      :is-date-disabled="isDateDisabled"
    />
  </Story>

  <Story
    name="Min"
    :as-child="true"
  >
    <Calendar
      :default-value="defaultValue"
      :min-value="minValue"
    />
  </Story>

  <Story
    name="Max"
    :as-child="true"
  >
    <Calendar
      :default-value="defaultValue"
      :max-value="maxValue"
    />
  </Story>

  <Story
    name="Min Max"
    :as-child="true"
  >
    <Calendar
      :default-value="defaultValue"
      :min-value="minValue"
      :max-value="maxValue"
    />
  </Story>
</template>
