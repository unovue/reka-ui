<script setup lang="ts">
import type { DateValue } from '@internationalized/date'

import type { Ref } from 'vue'
import { CalendarDateTime } from '@internationalized/date'
import { defineMeta } from 'addon-vue-csf'
import { ref } from 'vue'
import DateRangePicker from './_DummyDateRangePicker.vue'

const defaultValue = { start: new CalendarDateTime(2024, 2, 20), end: new CalendarDateTime(2024, 2, 27) }
const modelValue = ref(defaultValue) as Ref<{ start: DateValue, end: DateValue }>

const { Story } = defineMeta({
  title: 'Date Range Picker/Chromatic',
})
</script>

<template>
  <Story
    name="Empty default"
    :as-child="true"
  >
    <DateRangePicker />
  </Story>

  <Story
    name="With default"
    :as-child="true"
  >
    <DateRangePicker :default-value="defaultValue" />
  </Story>

  <Story
    name="Uncontrolled"
    :as-child="true"
  >
    <DateRangePicker :default-value="defaultValue" />
  </Story>

  <Story
    name="Controlled"
    :as-child="true"
  >
    <DateRangePicker v-model="modelValue" />
  </Story>

  <Story
    name="Disabled"
    :as-child="true"
  >
    <DateRangePicker
      :default-value="defaultValue"
      disabled
    />
  </Story>

  <Story
    name="Prevent deselect"
    :as-child="true"
  >
    <DateRangePicker
      :default-value="defaultValue"
      prevent-deselect
    />
  </Story>

  <Story
    name="Locale awareness"
    :as-child="true"
  >
    <DateRangePicker
      :default-value="defaultValue"
      locale="de"
    />
  </Story>

  <Story
    name="Fixed weeks"
    :as-child="true"
  >
    <DateRangePicker
      :default-value="defaultValue"
      fixed-weeks
    />
  </Story>

  <Story
    name="Multiple months"
    :as-child="true"
  >
    <DateRangePicker
      :default-value="defaultValue"
      :number-of-months="2"
    />
  </Story>

  <Story
    name="Multiple months (Paged navigation)"
    :as-child="true"
  >
    <DateRangePicker
      :default-value="defaultValue"
      :number-of-months="2"
      paged-navigation
    />
  </Story>
</template>
