<script setup lang="ts">
import type { DateValue } from '@/date'

import DateRangePicker from './_DummyDateRangePicker.vue'

const defaultValue = { start: new Temporal.PlainDateTime(2024, 2, 20), end: new Temporal.PlainDateTime(2024, 2, 27) }

const minValue = new Temporal.PlainDateTime(2024, 2, 14)
const maxValue = new Temporal.PlainDateTime(2024, 2, 28)

function isDateUnavailable(date: DateValue) {
  return date.dayOfWeek >= 6
}

function isDateDisabled(date: DateValue) {
  return date.day <= 12
}
</script>

<template>
  <Story
    title="Date Range Picker/Validation"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Min date">
      <DateRangePicker
        :default-value="defaultValue"
        :min-value="minValue"
      />
    </Variant>

    <Variant title="Max date">
      <DateRangePicker
        :default-value="defaultValue"
        :max-value="maxValue"
      />
    </Variant>

    <Variant title="Unavailable">
      <DateRangePicker
        :default-value="defaultValue"
        :is-date-unavailable="isDateUnavailable"
      />
    </Variant>

    <Variant title="Disabled">
      <DateRangePicker
        :default-value="defaultValue"
        :is-date-disabled="isDateDisabled"
      />
    </Variant>
  </Story>
</template>
