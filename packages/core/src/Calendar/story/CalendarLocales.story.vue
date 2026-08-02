<script setup lang="ts">
import { Temporal } from 'temporal-polyfill/full'
import Calendar from './_DummyCalendar.vue'

const baseDate = Temporal.PlainDate.from({ year: 2024, month: 2, day: 20 })

const gregorian = baseDate
const persian = baseDate.withCalendar('persian')
const japanese = baseDate.withCalendar('japanese')
const buddhist = baseDate.withCalendar('buddhist')
const taiwan = baseDate.withCalendar('roc')
const hebrew = baseDate.withCalendar('hebrew')
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
