<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { Ref } from 'vue'
import { CalendarDate } from '@internationalized/date'

import { defineMeta } from 'sb-addon-vue-csf'
import { ref } from 'vue'
import DatePicker from './_DummyDatePicker.vue'

const defaultValue = new CalendarDate(2024, 2, 20)
const modelValue = ref(defaultValue) as Ref<DateValue>

const { Story } = defineMeta({
  title: 'Date Picker/Chromatic',
})
</script>

<template>
  <Story
    name="Empty default"
    as-child
  >
    <DatePicker />
  </Story>

  <Story
    name="With default"
    as-child
  >
    <DatePicker :default-value="defaultValue" />
  </Story>

  <Story
    name="Uncontrolled"
    as-child
  >
    <DatePicker :default-value="defaultValue" />
  </Story>

  <Story
    name="Controlled"
    as-child
  >
    <DatePicker v-model="modelValue" />
  </Story>

  <Story
    name="Disabled"
    as-child
  >
    <DatePicker
      :default-value="defaultValue"
      disabled
    />
  </Story>

  <Story
    name="Prevent deselect"
    as-child
  >
    <DatePicker
      :default-value="defaultValue"
      prevent-deselect
    />
  </Story>

  <Story
    name="Locale awareness"
    as-child
  >
    <DatePicker
      :default-value="defaultValue"
      locale="de"
    />
  </Story>

  <Story
    name="Fixed weeks"
    as-child
  >
    <DatePicker
      :default-value="defaultValue"
      fixed-weeks
    />
  </Story>

  <Story
    name="Multiple months"
    as-child
  >
    <DatePicker
      :default-value="defaultValue"
      :number-of-months="2"
    />
  </Story>

  <Story
    name="Multiple months (Paged navigation)"
    as-child
  >
    <DatePicker
      :default-value="defaultValue"
      :number-of-months="2"
      paged-navigation
    />
  </Story>
</template>
