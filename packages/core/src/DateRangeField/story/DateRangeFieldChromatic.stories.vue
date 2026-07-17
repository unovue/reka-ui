<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { Ref } from 'vue'
import { CalendarDateTime, getLocalTimeZone, now } from '@internationalized/date'
import { defineMeta } from 'sb-addon-vue-csf'
import { ref } from 'vue'
import DateRangeField from './_DummyDateRangeField.vue'

const defaultValue = { start: new CalendarDateTime(2024, 2, 20), end: new CalendarDateTime(2024, 2, 27) }
const modelValue = ref(defaultValue) as Ref<{ start: DateValue, end: DateValue }>

const defaultPlaceholder = new CalendarDateTime(2023, 10, 11, 12, 30)
const localTimezonePlaceholder = now(getLocalTimeZone())

const { Story } = defineMeta({
  title: 'Date Range Field/Chromatic',
})
</script>

<template>
  <Story
    name="Empty default"
    as-child
  >
    <DateRangeField />
  </Story>

  <Story
    name="With default"
    as-child
  >
    <DateRangeField :default-value="defaultValue" />
  </Story>

  <Story
    name="Uncontrolled"
    as-child
  >
    <DateRangeField :default-value="defaultValue" />
  </Story>

  <Story
    name="Controlled"
    as-child
  >
    <DateRangeField v-model="modelValue" />
  </Story>

  <Story
    name="Disabled"
    as-child
  >
    <DateRangeField
      :default-value="defaultValue"
      disabled
    />
  </Story>

  <Story
    name="Locale awareness"
    as-child
  >
    <DateRangeField
      :default-value="defaultValue"
      locale="de"
    />
  </Story>

  <Story
    name="Placeholder"
    as-child
  >
    <DateRangeField :default-placeholder="defaultPlaceholder" />
  </Story>

  <Story
    name="Locale timezone"
    as-child
  >
    <DateRangeField :default-placeholder="localTimezonePlaceholder" />
  </Story>
</template>
