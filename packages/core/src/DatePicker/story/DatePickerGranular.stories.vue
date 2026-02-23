<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import DatePicker from './_DummyDatePicker.vue'

const { Story } = defineMeta({
  title: 'Date Picker/Granular',
})
</script>

<template>
  <Story
    name="Granular (second)"
    as-child
  >
    <DatePicker granularity="second" />
  </Story>

  <Story
    name="Granular (minute)"
    as-child
  >
    <DatePicker granularity="minute" />
  </Story>

  <Story
    name="Granular (hour)"
    as-child
  >
    <DatePicker granularity="hour" />
  </Story>

  <Story
    name="Granular (day)"
    as-child
  >
    <DatePicker granularity="day" />
  </Story>
</template>
