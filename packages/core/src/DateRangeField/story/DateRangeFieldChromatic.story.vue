<script setup lang="ts">
import type { Ref } from 'vue'
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { ref } from 'vue'
import DateRangeField from './_DummyDateRangeField.vue'

const defaultValue = {
  start: Temporal.PlainDate.from({ year: 2024, month: 2, day: 20 }),
  end: Temporal.PlainDate.from({ year: 2024, month: 2, day: 27 }),
}
const modelValue = ref(defaultValue) as Ref<{ start: TemporalDate, end: TemporalDate }>

const defaultPlaceholder = Temporal.PlainDate.from({ year: 2023, month: 10, day: 11 })
const localTimezonePlaceholder = Temporal.PlainDate.from({ year: 2024, month: 3, day: 15 })
</script>

<template>
  <Story
    title="Date Range Field/Chromatic"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Empty default">
      <DateRangeField />
    </Variant>

    <Variant title="With default">
      <DateRangeField :default-value="defaultValue" />
    </Variant>

    <Variant title="Uncontrolled">
      <DateRangeField :default-value="defaultValue" />
    </Variant>

    <Variant title="Controlled">
      <DateRangeField v-model="modelValue" />
    </Variant>

    <Variant title="Disabled">
      <DateRangeField
        :default-value="defaultValue"
        disabled
      />
    </Variant>

    <Variant title="Locale awareness">
      <DateRangeField
        :default-value="defaultValue"
        locale="de"
      />
    </Variant>

    <Variant title="Placeholder">
      <DateRangeField :default-placeholder="defaultPlaceholder" />
    </Variant>

    <Variant title="Locale timezone">
      <DateRangeField :default-placeholder="localTimezonePlaceholder" />
    </Variant>
  </Story>
</template>
