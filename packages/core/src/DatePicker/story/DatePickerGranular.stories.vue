<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'

import DatePicker from './_DummyDatePicker.vue'

const { Story } = defineMeta({
  title: 'Date Picker/Granular',
})
</script>

<template>
  <Story
    name="Granular (second)"
    :as-child="true"
  >
    <DatePicker granularity="second" />
  </Story>

  <Story
    name="Granular (minute)"
    :as-child="true"
  >
    <DatePicker granularity="minute" />
  </Story>

  <Story
    name="Granular (hour)"
    :as-child="true"
  >
    <DatePicker granularity="hour" />
  </Story>

  <Story
    name="Granular (day)"
    :as-child="true"
  >
    <DatePicker granularity="day" />
  </Story>
</template>
