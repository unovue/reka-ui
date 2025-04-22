<script setup lang="ts">
import { BuddhistCalendar, CalendarDate, HebrewCalendar, JapaneseCalendar, PersianCalendar, TaiwanCalendar } from '@internationalized/date'
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
</script>

<template>
  <Story
    title="Calendar/Fixed Weeks For Locales"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Gregorian">
      <Calendar
        :default-value="gregorian"
        fixed-weeks
        locale="en"
      />
    </Variant>

    <Variant title="Japanese">
      <Calendar
        :default-value="japanese"
        fixed-weeks
        locale="ja"
      />
    </Variant>

    <Variant title="Persian">
      <Calendar
        :default-value="persian"
        fixed-weeks
        locale="fa-IR"
      />
    </Variant>

    <Variant title="Taiwan">
      <Calendar
        :default-value="taiwan"
        fixed-weeks
        locale="zh-TW"
      />
    </Variant>

    <Variant title="Buddhist">
      <Calendar
        :default-value="buddhist"
        fixed-weeks
        locale="th"
      />
    </Variant>

    <Variant title="Hebrew">
      <Calendar
        :default-value="hebrew"
        fixed-weeks
        locale="he"
      />
    </Variant>
  </Story>
</template>
