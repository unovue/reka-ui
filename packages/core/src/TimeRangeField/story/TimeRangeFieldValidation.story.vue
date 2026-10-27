<script setup lang="ts">
import type { Matcher } from '@/date'
import TimeRangeField from './_DummyTimeRangeField.vue'

const defaultValue = { start: new Temporal.PlainTime(10, 0), end: new Temporal.PlainTime(12, 0) }
const minValue = new Temporal.PlainTime(9, 0)
const maxValue = new Temporal.PlainTime(18, 0)

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
