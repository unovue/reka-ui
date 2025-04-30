<script setup lang="ts">
import { BuddhistCalendar, CalendarDate, HebrewCalendar, JapaneseCalendar, PersianCalendar, TaiwanCalendar } from '@internationalized/date'
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
</script>

<template>
  <Story
    title="Calendar/Locales"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Gregorian">
      <Calendar
        :default-value="gregorian"
        locale="en"
      />
    </Variant>

    <Variant title="Japanese">
      <Calendar
        locale="ja"
        :default-value="japanese"
      />
    </Variant>

    <Variant title="Persian">
      <Calendar
        locale="fa-IR"
        :default-value="persian"
      />
    </Variant>

    <Variant title="Taiwan">
      <Calendar
        locale="zh-TW"
        :default-value="taiwan"
      />
    </Variant>

    <Variant title="Buddhist">
      <Calendar
        locale="th"
        :default-value="buddhist"
      />
    </Variant>

    <Variant title="Hebrew">
      <Calendar
        locale="he"
        :default-value="hebrew"
      />
    </Variant>
  </Story>
</template>
