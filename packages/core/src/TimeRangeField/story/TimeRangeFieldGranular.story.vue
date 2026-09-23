<script setup lang="ts">
import { Time } from '@internationalized/date'
import TimeRangeField from './_DummyTimeRangeField.vue'

const defaultValue = { start: new Time(10, 30, 45), end: new Time(14, 15, 20) }
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
