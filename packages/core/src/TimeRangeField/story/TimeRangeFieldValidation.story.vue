<script setup lang="ts">
import type { Matcher } from '@/date'
import { Time } from '@internationalized/date'
import TimeRangeField from './_DummyTimeRangeField.vue'

const defaultValue = { start: new Time(10, 0), end: new Time(12, 0) }
const minValue = new Time(9, 0)
const maxValue = new Time(18, 0)

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
