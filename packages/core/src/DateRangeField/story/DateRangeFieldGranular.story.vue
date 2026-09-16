<script setup lang="ts">
import { Temporal } from 'temporal-polyfill'
import DateRangeField from './_DummyDateRangeField.vue'

const defaultValue = {
  start: Temporal.PlainDateTime.from({ year: 2024, month: 2, day: 20, hour: 9, minute: 15, second: 30 }),
  end: Temporal.PlainDateTime.from({ year: 2024, month: 2, day: 27, hour: 17, minute: 45, second: 50 }),
}
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
