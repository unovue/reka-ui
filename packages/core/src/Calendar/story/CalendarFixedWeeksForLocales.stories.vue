<script setup lang="ts">
import { BuddhistCalendar, CalendarDate, HebrewCalendar, JapaneseCalendar, PersianCalendar, TaiwanCalendar } from '@internationalized/date'

import { defineMeta } from 'addon-vue-csf'
import Calendar from './_DummyCalendar.vue'

const gregorian = new CalendarDate(2024, 8, 31)

const persian = new CalendarDate(
  new PersianCalendar(),
  1404,
  5,
  31,
)
const japanese = new CalendarDate(
  new JapaneseCalendar(),
  'heisei',
  31,
  4,
  30,

)
const buddhist = new CalendarDate(
  new BuddhistCalendar(),
  2563,
  10,
  31,
)
const taiwan = new CalendarDate(
  new TaiwanCalendar(),
  109,
  10,
  31,
)

const hebrew = new CalendarDate(
  new HebrewCalendar(),
  5781,
  6,
  29,
)

const { Story } = defineMeta({
  title: 'Calendar/Fixed Weeks For Locales',
})
</script>

<template>
  <Story
    name="Gregorian"
    as-child
  >
    <Calendar
      :default-value="gregorian"
      fixed-weeks
      locale="en"
    />
  </Story>

  <Story
    name="Japanese"
    as-child
  >
    <Calendar
      :default-value="japanese"
      fixed-weeks
      locale="ja"
    />
  </Story>

  <Story
    name="Persian"
    as-child
  >
    <Calendar
      :default-value="persian"
      fixed-weeks
      locale="fa-IR"
    />
  </Story>

  <Story
    name="Taiwan"
    as-child
  >
    <Calendar
      :default-value="taiwan"
      fixed-weeks
      locale="zh-TW"
    />
  </Story>

  <Story
    name="Buddhist"
    as-child
  >
    <Calendar
      :default-value="buddhist"
      fixed-weeks
      locale="th"
    />
  </Story>

  <Story
    name="Hebrew"
    as-child
  >
    <Calendar
      :default-value="hebrew"
      fixed-weeks
      locale="he"
    />
  </Story>
</template>
