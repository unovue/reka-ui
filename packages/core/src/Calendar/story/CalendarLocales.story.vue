<script setup lang="ts">
import Calendar from './_DummyCalendar.vue'

const gregorian = new Temporal.PlainDate(2024, 2, 20)

const persian = Temporal.PlainDate.from({ calendar: 'persian', year: 1403, month: 12, day: 1 })
const japanese = Temporal.PlainDate.from({ calendar: 'japanese', era: 'heisei', eraYear: 31, month: 4, day: 30 })
const buddhist = Temporal.PlainDate.from({ calendar: 'buddhist', year: 2563, month: 4, day: 30 })
const taiwan = Temporal.PlainDate.from({ calendar: 'roc', year: 109, month: 4, day: 30 })

const hebrew = Temporal.PlainDate.from({ calendar: 'hebrew', year: 5781, month: 5, day: 1 })
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
