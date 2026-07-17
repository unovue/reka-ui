<script setup lang="ts">
import { Time } from '@internationalized/date'
import { defineMeta } from 'sb-addon-vue-csf'
import TimeRangeField from './_DummyTimeRangeField.vue'

const defaultValue = { start: new Time(10, 30, 45), end: new Time(14, 15, 20) }

const { Story } = defineMeta({
  title: 'Time Range Field/Granular',
})
</script>

<template>
  <Story
    name="Granular (second)"
    as-child
  >
    <TimeRangeField
      :default-value="defaultValue"
      granularity="second"
    />
  </Story>

  <Story
    name="Granular (minute)"
    as-child
  >
    <TimeRangeField
      :default-value="defaultValue"
      granularity="minute"
    />
  </Story>

  <Story
    name="Granular (hour)"
    as-child
  >
    <TimeRangeField
      :default-value="defaultValue"
      granularity="hour"
    />
  </Story>
</template>
