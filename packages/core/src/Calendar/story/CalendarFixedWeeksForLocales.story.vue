<script setup lang="ts">
import Calendar from './_DummyCalendar.vue'

const gregorian = new Temporal.PlainDate(2024, 8, 31)

const persian = Temporal.PlainDate.from({ calendar: 'persian', year: 1404, month: 5, day: 31 })
const japanese = Temporal.PlainDate.from({ calendar: 'japanese', era: 'heisei', eraYear: 31, month: 4, day: 30 })
const buddhist = Temporal.PlainDate.from({ calendar: 'buddhist', year: 2563, month: 10, day: 31 })
const taiwan = Temporal.PlainDate.from({ calendar: 'roc', year: 109, month: 10, day: 31 })

const hebrew = Temporal.PlainDate.from({ calendar: 'hebrew', year: 5781, month: 6, day: 29 })
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
