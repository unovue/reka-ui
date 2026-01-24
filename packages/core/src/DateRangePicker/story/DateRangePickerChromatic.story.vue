<script setup lang="ts">
import type { Ref } from 'vue'
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { ref } from 'vue'
import DateRangePicker from './_DummyDateRangePicker.vue'

const defaultValue = {
  start: Temporal.PlainDate.from({ year: 2024, month: 2, day: 20 }),
  end: Temporal.PlainDate.from({ year: 2024, month: 2, day: 27 }),
}
const modelValue = ref(defaultValue) as Ref<{ start: TemporalDate, end: TemporalDate }>
</script>

<template>
  <Story
    title="Date Range Picker/Chromatic"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Empty default">
      <DateRangePicker />
    </Variant>

    <Variant title="With default">
      <DateRangePicker :default-value="defaultValue" />
    </Variant>

    <Variant title="Uncontrolled">
      <DateRangePicker :default-value="defaultValue" />
    </Variant>

    <Variant title="Controlled">
      <DateRangePicker v-model="modelValue" />
    </Variant>

    <Variant title="Disabled">
      <DateRangePicker
        :default-value="defaultValue"
        disabled
      />
    </Variant>

    <Variant title="Prevent deselect">
      <DateRangePicker
        :default-value="defaultValue"
        prevent-deselect
      />
    </Variant>

    <Variant title="Locale awareness">
      <DateRangePicker
        :default-value="defaultValue"
        locale="de"
      />
    </Variant>

    <Variant title="Fixed weeks">
      <DateRangePicker
        :default-value="defaultValue"
        fixed-weeks
      />
    </Variant>

    <Variant title="Multiple months">
      <DateRangePicker
        :default-value="defaultValue"
        :number-of-months="2"
      />
    </Variant>

    <Variant title="Multiple months (Paged navigation)">
      <DateRangePicker
        :default-value="defaultValue"
        :number-of-months="2"
        paged-navigation
      />
    </Variant>
  </Story>
</template>
