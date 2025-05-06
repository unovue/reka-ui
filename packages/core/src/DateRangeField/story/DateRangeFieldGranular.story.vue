<script setup lang="ts">
import { CalendarDateTime } from '@internationalized/date'
import DateRangeField from './_DummyDateRangeField.vue'

const defaultValue = { start: new CalendarDateTime(2024, 2, 20), end: new CalendarDateTime(2024, 2, 27) }
</script>

<template>
  <Story
    title="Date Range Field/Granular"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Granular (second)">
      <DateRangeField
        :default-value="defaultValue"
        granularity="second"
      />
    </Variant>

    <Variant title="Granular (minute)">
      <DateRangeField
        :default-value="defaultValue"
        granularity="minute"
      />
    </Variant>

    <Variant title="Granular (hour)">
      <DateRangeField
        :default-value="defaultValue"
        granularity="hour"
      />
    </Variant>

    <Variant title="Granular (day)">
      <DateRangeField
        :default-value="defaultValue"
        granularity="day"
      />
    </Variant>
  </Story>
</template>
