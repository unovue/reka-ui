<script setup lang="ts">
import { Temporal } from 'temporal-polyfill'
import RangeCalendar from './_DummyRangeCalendar.vue'

const defaultValue = {
  start: Temporal.PlainDate.from({ year: 2024, month: 2, day: 20 }),
  end: Temporal.PlainDate.from({ year: 2024, month: 2, day: 27 }),
}
</script>

<template>
  <Story
    title="Range Calendar/Multiple"
    :layout="{ type: 'grid', width: '100%', iframe: false }"
  >
    <Variant title="2 months">
      <RangeCalendar
        :default-value="defaultValue"
        :number-of-months="2"
      />
    </Variant>

    <Variant title="2 months (Paged navigation)">
      <RangeCalendar
        :default-value="defaultValue"
        :number-of-months="2"
        paged-navigation
      />
    </Variant>

    <Variant title="3 months">
      <RangeCalendar
        :default-value="defaultValue"
        :number-of-months="3"
      />
    </Variant>

    <Variant title="3 months (Paged navigation)">
      <RangeCalendar
        :default-value="defaultValue"
        :number-of-months="3"
        paged-navigation
      />
    </Variant>

    <Variant title="3 months (Fixed week)">
      <RangeCalendar
        :default-value="defaultValue"
        :number-of-months="3"
        fixed-weeks
      />
    </Variant>
  </Story>
</template>
