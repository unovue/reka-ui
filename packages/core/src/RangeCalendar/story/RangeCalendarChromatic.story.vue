<script setup lang="ts">
import type { Ref } from 'vue'
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill/full'
import { ref } from 'vue'
import RangeCalendar from './_DummyRangeCalendar.vue'

const defaultValue = {
  start: Temporal.PlainDate.from({ year: 2024, month: 2, day: 20 }),
  end: Temporal.PlainDate.from({ year: 2024, month: 2, day: 27 }),
}
const persianCalendar = ref({
  start: defaultValue.start.withCalendar('persian'),
  end: defaultValue.end.withCalendar('persian'),
}) as Ref<{ start: TemporalDate, end: TemporalDate }>
const modelValue = ref(defaultValue) as Ref<{ start: TemporalDate, end: TemporalDate }>

const placeholder = ref(Temporal.PlainDate.from({ year: 2024, month: 4, day: 1 })) as Ref<TemporalDate>

function paging(date: TemporalDate, sign: -1 | 1) {
  if (sign === -1)
    return date.subtract({ years: 1 })
  return date.add({ years: 1 })
}
</script>

<template>
  <Story
    title="Range Calendar/Chromatic"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Uncontrolled (modelValue)">
      <RangeCalendar :default-value="defaultValue" />
    </Variant>

    <Variant title="Controlled (modelValue)">
      <RangeCalendar v-model="modelValue" />
    </Variant>

    <Variant title="Uncontrolled (placeholder)">
      <RangeCalendar
        :default-value="defaultValue"
        :default-placeholder="placeholder"
      />
    </Variant>

    <Variant title="Controlled (placeholder)">
      <RangeCalendar v-model:placeholder="placeholder" />
    </Variant>

    <Variant title="Empty default">
      <RangeCalendar />
    </Variant>

    <Variant title="Default value">
      <RangeCalendar :default-value="defaultValue" />
    </Variant>

    <Variant title="Disabled">
      <RangeCalendar :disabled="true" />
    </Variant>

    <Variant title="Fixed weeks">
      <RangeCalendar
        :default-value="defaultValue"
        fixed-weeks
      />
    </Variant>

    <Variant title="Localization">
      <RangeCalendar
        :default-value="defaultValue"
        locale="de"
      />
    </Variant>

    <Variant title="Prevent deselection">
      <RangeCalendar
        :default-value="defaultValue"
        prevent-deselect
      />
    </Variant>

    <Variant title="Multiple selection">
      <RangeCalendar
        :default-value="defaultValue"
        multiple
      />
    </Variant>

    <Variant title="Different calendar">
      <RangeCalendar :default-value="persianCalendar" />
    </Variant>

    <Variant title="Pagination functions">
      <RangeCalendar
        :default-value="defaultValue"
        :prev-page="(date: TemporalDate) => paging(date, -1)"
        :next-page="(date: TemporalDate) => paging(date, 1)"
      />
    </Variant>
  </Story>
</template>
