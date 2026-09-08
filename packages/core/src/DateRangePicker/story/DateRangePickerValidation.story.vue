<script setup lang="ts">
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { isWeekend } from '@/temporal/comparators'

import DateRangePicker from './_DummyDateRangePicker.vue'

const defaultValue = {
  start: Temporal.PlainDate.from({ year: 2024, month: 2, day: 20 }),
  end: Temporal.PlainDate.from({ year: 2024, month: 2, day: 27 }),
}

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
