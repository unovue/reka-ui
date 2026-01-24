<script setup lang="ts">
import { Temporal } from 'temporal-polyfill'
import Calendar from './_DummyCalendar.vue'

const baseDate = Temporal.PlainDate.from({ year: 2024, month: 8, day: 31 })

const gregorian = baseDate
const persian = baseDate.withCalendar('persian')
const japanese = baseDate.withCalendar('japanese')
const buddhist = baseDate.withCalendar('buddhist')
const taiwan = baseDate.withCalendar('roc')
const hebrew = baseDate.withCalendar('hebrew')
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
