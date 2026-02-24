<script setup lang="ts">
import { BuddhistCalendar, CalendarDate, HebrewCalendar, JapaneseCalendar, PersianCalendar, TaiwanCalendar } from '@internationalized/date'

import { defineMeta } from 'sb-addon-vue-csf'
import Calendar from './_DummyCalendar.vue'

const gregorian = new CalendarDate(2024, 2, 20)

const persian = new CalendarDate(
  new PersianCalendar(),
  1403,
  12,
  1,
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
  4,
  30,
)
const taiwan = new CalendarDate(
  new TaiwanCalendar(),
  109,
  4,
  30,
)

const hebrew = new CalendarDate(
  new HebrewCalendar(),
  5781,
  5,
  1,
)

const { Story } = defineMeta({
  title: 'Calendar/Locales',
})
</script>

<template>
  <Story
    name="Gregorian"
    :as-child="true"
  >
    <Calendar
      :default-value="gregorian"
      locale="en"
    />
  </Story>

  <Story
    name="Japanese"
    :as-child="true"
  >
    <Calendar
      locale="ja"
      :default-value="japanese"
    />
  </Story>

  <Story
    name="Persian"
    :as-child="true"
  >
    <Calendar
      locale="fa-IR"
      :default-value="persian"
    />
  </Story>

  <Story
    name="Taiwan"
    :as-child="true"
  >
    <Calendar
      locale="zh-TW"
      :default-value="taiwan"
    />
  </Story>

  <Story
    name="Buddhist"
    :as-child="true"
  >
    <Calendar
      locale="th"
      :default-value="buddhist"
    />
  </Story>

  <Story
    name="Hebrew"
    :as-child="true"
  >
    <Calendar
      locale="he"
      :default-value="hebrew"
    />
  </Story>
</template>
