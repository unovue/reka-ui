<script setup lang="ts">
import { Temporal } from '@/temporal'
import TimeRangeField from './_DummyTimeRangeField.vue'

const defaultValue = {
  start: Temporal.PlainTime.from({ hour: 10, minute: 30, second: 45 }),
  end: Temporal.PlainTime.from({ hour: 14, minute: 15, second: 20 }),
}
</script>

<template>
  <Story
    title="Time Range Field/Granular"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Granular (second)">
      <TimeRangeField
        :default-value="defaultValue"
        granularity="second"
      />
    </Variant>

    <Variant title="Granular (minute)">
      <TimeRangeField
        :default-value="defaultValue"
        granularity="minute"
      />
    </Variant>

    <Variant title="Granular (hour)">
      <TimeRangeField
        :default-value="defaultValue"
        granularity="hour"
      />
    </Variant>
  </Story>
</template>
