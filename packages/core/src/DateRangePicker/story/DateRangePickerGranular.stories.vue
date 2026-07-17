<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import DateRangePicker from './_DummyDateRangePicker.vue'

const { Story } = defineMeta({
  title: 'Date Range Picker/Granular',
})
</script>

<template>
  <Story
    name="Granular (second)"
    as-child
  >
    <DateRangePicker granularity="second" />
  </Story>

  <Story
    name="Granular (minute)"
    as-child
  >
    <DateRangePicker granularity="minute" />
  </Story>

  <Story
    name="Granular (hour)"
    as-child
  >
    <DateRangePicker granularity="hour" />
  </Story>

  <Story
    name="Granular (day)"
    as-child
  >
    <DateRangePicker granularity="day" />
  </Story>
</template>
