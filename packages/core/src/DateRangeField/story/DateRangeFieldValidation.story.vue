<script setup lang="ts">
import type { Matcher } from '@/shared/date'
import { CalendarDate } from '@internationalized/date'
import DateRangeField from './_DummyDateRangeField.vue'

const defaultValue = { start: new CalendarDate(2024, 2, 20), end: new CalendarDate(2024, 2, 27) }
const minValue = new CalendarDate(2024, 2, 15)
const maxValue = new CalendarDate(2024, 2, 28)

const isFirstOrFifteenth: Matcher = (date) => {
  return date.day === 1 || date.day === 15
}
</script>

<template>
  <Story
    title="Date Range Field/Validation"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Unavailable">
      <DateRangeField
        :default-value="defaultValue"
        :is-date-unavailable="isFirstOrFifteenth"
      />
    </Variant>

    <Variant title="Disabled">
      <DateRangeField
        :default-value="defaultValue"
        :is-date-disabled="isFirstOrFifteenth"
      />
    </Variant>

    <Variant title="Min">
      <DateRangeField
        :default-value="defaultValue"
        :min-value="minValue"
      />
    </Variant>

    <Variant title="Max">
      <DateRangeField
        :default-value="defaultValue"
        :max-value="maxValue"
      />
    </Variant>
  </Story>
</template>
