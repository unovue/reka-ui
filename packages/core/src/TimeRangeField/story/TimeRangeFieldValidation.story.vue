<script setup lang="ts">
import type { Matcher } from '@/date'
import { Temporal } from '@/temporal'
import TimeRangeField from './_DummyTimeRangeField.vue'

const defaultValue = {
  start: Temporal.PlainTime.from({ hour: 10, minute: 0, second: 0 }),
  end: Temporal.PlainTime.from({ hour: 12, minute: 0, second: 0 }),
}
const minValue = Temporal.PlainTime.from({ hour: 9, minute: 0, second: 0 })
const maxValue = Temporal.PlainTime.from({ hour: 18, minute: 0, second: 0 })

const isDisabledTime: Matcher = (time) => {
  return 'minute' in time && time.minute === 30
}
</script>

<template>
  <Story
    title="Time Range Field/Validation"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Min Time">
      <TimeRangeField
        :default-value="defaultValue"
        :min-value="minValue"
      />
    </Variant>

    <Variant title="Max Time">
      <TimeRangeField
        :default-value="defaultValue"
        :max-value="maxValue"
      />
    </Variant>

    <Variant title="Disabled Times">
      <TimeRangeField
        :default-value="defaultValue"
        :is-time-disabled="isDisabledTime"
      />
    </Variant>
  </Story>
</template>
