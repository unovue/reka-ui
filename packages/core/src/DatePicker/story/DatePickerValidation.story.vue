<script setup lang="ts">
import type { DateValue } from '@/date'

import DatePicker from './_DummyDatePicker.vue'

const defaultValue = new Temporal.PlainDate(2024, 2, 20)

const minValue = new Temporal.PlainDate(2024, 2, 14)
const maxValue = new Temporal.PlainDate(2024, 2, 28)

function isDateUnavailable(date: DateValue) {
  return date.dayOfWeek >= 6
}

function isDateDisabled(date: DateValue) {
  return date.day <= 12
}
</script>

<template>
  <Story
    title="Date Picker/Validation"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Min date">
      <DatePicker
        :default-value="defaultValue"
        :min-value="minValue"
      />
    </Variant>

    <Variant title="Max date">
      <DatePicker
        :default-value="defaultValue"
        :max-value="maxValue"
      />
    </Variant>

    <Variant title="Unavailable">
      <DatePicker
        :default-value="defaultValue"
        :is-date-unavailable="isDateUnavailable"
      />
    </Variant>

    <Variant title="Disabled">
      <DatePicker
        :default-value="defaultValue"
        :is-date-disabled="isDateDisabled"
      />
    </Variant>
  </Story>
</template>
