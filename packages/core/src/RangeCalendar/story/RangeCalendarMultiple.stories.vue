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
    export-name="TwoMonths"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      :number-of-months="2"
    />
  </Story>

  <Story
    name="2 months (Paged navigation)"
    export-name="TwoMonthsPagedNavigation"
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
    export-name="ThreeMonths"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      :number-of-months="3"
    />
  </Story>

  <Story
    name="3 months (Paged navigation)"
    export-name="ThreeMonthsPagedNavigation"
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
    export-name="ThreeMonthsFixedWeek"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      :number-of-months="3"
      fixed-weeks
    />
  </Story>
</template>
