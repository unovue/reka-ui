<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import { defineMeta } from 'sb-addon-vue-csf'
import RangeCalendar from './_DummyRangeCalendar.vue'

const defaultValue = { start: new CalendarDate(2024, 2, 20), end: new CalendarDate(2024, 2, 27) }

const { Story } = defineMeta({
  title: 'Range Calendar/Multiple',
})
</script>

<template>
  <Story
    name="2 months"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      :number-of-months="2"
    />
  </Story>

  <Story
    name="2 months (Paged navigation)"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      :number-of-months="2"
      paged-navigation
    />
  </Story>

  <Story
    name="3 months"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      :number-of-months="3"
    />
  </Story>

  <Story
    name="3 months (Paged navigation)"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      :number-of-months="3"
      paged-navigation
    />
  </Story>

  <Story
    name="3 months (Fixed week)"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      :number-of-months="3"
      fixed-weeks
    />
  </Story>
</template>
