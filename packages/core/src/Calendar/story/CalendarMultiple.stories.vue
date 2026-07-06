<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import { defineMeta } from 'sb-addon-vue-csf'
import Calendar from './_DummyCalendar.vue'

const defaultValue = new CalendarDate(2024, 2, 20)

const { Story } = defineMeta({
  title: 'Calendar/Multiple',
})
</script>

<template>
  <Story
    name="2 months"
    as-child
  >
    <Calendar
      :default-value="defaultValue"
      :number-of-months="2"
    />
  </Story>

  <Story
    name="2 months (Paged navigation)"
    as-child
  >
    <Calendar
      :default-value="defaultValue"
      :number-of-months="2"
      paged-navigation
    />
  </Story>

  <Story
    name="3 months"
    as-child
  >
    <Calendar
      :default-value="defaultValue"
      :number-of-months="3"
    />
  </Story>

  <Story
    name="3 months (Paged navigation)"
    as-child
  >
    <Calendar
      :default-value="defaultValue"
      :number-of-months="3"
      paged-navigation
    />
  </Story>

  <Story
    name="3 months (Fixed week)"
    as-child
  >
    <Calendar
      :default-value="defaultValue"
      :number-of-months="3"
      fixed-weeks
    />
  </Story>
</template>
