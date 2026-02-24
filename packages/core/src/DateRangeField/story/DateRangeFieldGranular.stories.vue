<script setup lang="ts">
import { CalendarDateTime } from '@internationalized/date'

import { defineMeta } from 'addon-vue-csf'
import DateRangeField from './_DummyDateRangeField.vue'

const defaultValue = { start: new CalendarDateTime(2024, 2, 20), end: new CalendarDateTime(2024, 2, 27) }

const { Story } = defineMeta({
  title: 'Date Range Field/Granular',
})
</script>

<template>
  <Story
    name="Granular (second)"
    :as-child="true"
  >
    <DateRangeField
      :default-value="defaultValue"
      granularity="second"
    />
  </Story>

  <Story
    name="Granular (minute)"
    :as-child="true"
  >
    <DateRangeField
      :default-value="defaultValue"
      granularity="minute"
    />
  </Story>

  <Story
    name="Granular (hour)"
    :as-child="true"
  >
    <DateRangeField
      :default-value="defaultValue"
      granularity="hour"
    />
  </Story>

  <Story
    name="Granular (day)"
    :as-child="true"
  >
    <DateRangeField
      :default-value="defaultValue"
      granularity="day"
    />
  </Story>
</template>
