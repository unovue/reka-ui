<script setup lang="ts">
import type { Matcher } from '@/shared/date'

import { CalendarDate } from '@internationalized/date'
import { defineMeta } from 'addon-vue-csf'
import DateRangeField from './_DummyDateRangeField.vue'

const defaultValue = { start: new CalendarDate(2024, 2, 20), end: new CalendarDate(2024, 2, 27) }
const minValue = new CalendarDate(2024, 2, 15)
const maxValue = new CalendarDate(2024, 2, 28)

const isFirstOrFifteenth: Matcher = (date) => {
  return date.day === 1 || date.day === 15
}

const { Story } = defineMeta({
  title: 'Date Range Field/Validation',
})
</script>

<template>
  <Story
    name="Unavailable"
    :as-child="true"
  >
    <DateRangeField
      :default-value="defaultValue"
      :is-date-unavailable="isFirstOrFifteenth"
    />
  </Story>

  <Story
    name="Disabled"
    :as-child="true"
  >
    <DateRangeField
      :default-value="defaultValue"
      :is-date-disabled="isFirstOrFifteenth"
    />
  </Story>

  <Story
    name="Min"
    :as-child="true"
  >
    <DateRangeField
      :default-value="defaultValue"
      :min-value="minValue"
    />
  </Story>

  <Story
    name="Max"
    :as-child="true"
  >
    <DateRangeField
      :default-value="defaultValue"
      :max-value="maxValue"
    />
  </Story>
</template>
