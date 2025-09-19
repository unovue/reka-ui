<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { Ref } from 'vue'
import { CalendarDate, PersianCalendar, toCalendar } from '@internationalized/date'
import { ref } from 'vue'
import RangeCalendar from './_DummyRangeCalendar.vue'

const defaultValue = { start: new CalendarDate(2024, 2, 20), end: new CalendarDate(2024, 2, 27) }
const persianCalendar = ref({ start: toCalendar(defaultValue.start, new PersianCalendar()), end: toCalendar(defaultValue.end, new PersianCalendar()) }) as Ref<{ start: DateValue, end: DateValue }>
const modelValue = ref(defaultValue) as Ref<{ start: DateValue, end: DateValue }>

const placeholder = ref(new CalendarDate(2024, 4, 1)) as Ref<CalendarDate>

function paging(date: DateValue, sign: -1 | 1) {
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
        :prev-page="(date: DateValue) => paging(date, -1)"
        :next-page="(date:DateValue) => paging(date, 1)"
      />
    </Variant>
  </Story>
</template>
