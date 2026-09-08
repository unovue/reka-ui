<script setup lang="ts">
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { isWeekend } from '@/temporal/comparators'
import RangeCalendar from './_DummyRangeCalendar.vue'

function isDateUnavailable(date: TemporalDate) {
  return isWeekend(date)
}
function isDateDisabled(date: TemporalDate) {
  return date.day > 20
}

const defaultValue = {
  start: Temporal.PlainDate.from({ year: 2024, month: 2, day: 20 }),
  end: Temporal.PlainDate.from({ year: 2024, month: 2, day: 24 }),
}
const minValue = Temporal.PlainDate.from({ year: 2024, month: 2, day: 12 })
const maxValue = Temporal.PlainDate.from({ year: 2024, month: 2, day: 20 })
</script>

<template>
  <Story
    title="Range Calendar/Validation"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Unavailable">
      <RangeCalendar
        :default-value="defaultValue"
        :is-date-unavailable="isDateUnavailable"
      />
    </Variant>

    <Variant title="Disabled">
      <RangeCalendar
        :default-value="defaultValue"
        :is-date-disabled="isDateDisabled"
      />
    </Variant>

    <Variant title="Min">
      <RangeCalendar
        :default-value="defaultValue"
        :min-value="minValue"
      />
    </Variant>

    <Variant title="Max">
      <RangeCalendar
        :default-value="defaultValue"
        :max-value="maxValue"
      />
    </Variant>

    <Variant title="Min Max">
      <RangeCalendar
        :default-value="defaultValue"
        :min-value="minValue"
        :max-value="maxValue"
      />
    </Variant>

    <Variant title="Maximum Days">
      <RangeCalendar
        :default-value="defaultValue"
        :maximum-days="5"
      />
    </Variant>
  </Story>
</template>
..
