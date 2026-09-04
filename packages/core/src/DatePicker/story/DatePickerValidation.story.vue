<script setup lang="ts">
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { isWeekend } from '@/temporal/comparators'

import DatePicker from './_DummyDatePicker.vue'

const defaultValue = Temporal.PlainDate.from({ year: 2024, month: 2, day: 20 })

const minValue = Temporal.PlainDate.from({ year: 2024, month: 2, day: 14 })
const maxValue = Temporal.PlainDate.from({ year: 2024, month: 2, day: 28 })

function isDateUnavailable(date: TemporalDate) {
  return isWeekend(date)
}

function isDateDisabled(date: TemporalDate) {
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
