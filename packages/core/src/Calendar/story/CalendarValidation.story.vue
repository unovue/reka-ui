<script setup lang="ts">
import type { CalendarRootProps } from '..'
import Calendar from './_DummyCalendar.vue'

const isDateUnavailable: CalendarRootProps['isDateUnavailable'] = (date) => {
  return date.dayOfWeek >= 6
}
const isDateDisabled: CalendarRootProps['isDateUnavailable'] = (date) => {
  return date.day > 20
}

const defaultValue = new Temporal.PlainDate(2024, 2, 14)
const minValue = new Temporal.PlainDate(2024, 2, 12)
const maxValue = new Temporal.PlainDate(2024, 2, 20)
</script>

<template>
  <Story
    title="Calendar/Validation"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Unavailable">
      <Calendar
        :default-value="defaultValue"
        :is-date-unavailable="isDateUnavailable"
      />
    </Variant>

    <Variant title="Disabled">
      <Calendar
        :default-value="defaultValue"
        :is-date-disabled="isDateDisabled"
      />
    </Variant>

    <Variant title="Min">
      <Calendar
        :default-value="defaultValue"
        :min-value="minValue"
      />
    </Variant>

    <Variant title="Max">
      <Calendar
        :default-value="defaultValue"
        :max-value="maxValue"
      />
    </Variant>

    <Variant title="Min Max">
      <Calendar
        :default-value="defaultValue"
        :min-value="minValue"
        :max-value="maxValue"
      />
    </Variant>
  </Story>
</template>
