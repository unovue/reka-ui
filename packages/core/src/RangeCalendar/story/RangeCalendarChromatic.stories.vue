<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { Ref } from 'vue'
import { CalendarDate, PersianCalendar, toCalendar } from '@internationalized/date'
import { defineMeta } from 'sb-addon-vue-csf'
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

const { Story } = defineMeta({
  title: 'Range Calendar/Chromatic',
})
</script>

<template>
  <Story
    name="Uncontrolled (modelValue)"
    as-child
  >
    <RangeCalendar :default-value="defaultValue" />
  </Story>

  <Story
    name="Controlled (modelValue)"
    as-child
  >
    <RangeCalendar v-model="modelValue" />
  </Story>

  <Story
    name="Uncontrolled (placeholder)"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      :default-placeholder="placeholder"
    />
  </Story>

  <Story
    name="Controlled (placeholder)"
    as-child
  >
    <RangeCalendar v-model:placeholder="placeholder" />
  </Story>

  <Story
    name="Empty default"
    as-child
  >
    <RangeCalendar />
  </Story>

  <Story
    name="Default value"
    as-child
  >
    <RangeCalendar :default-value="defaultValue" />
  </Story>

  <Story
    name="Disabled"
    as-child
  >
    <RangeCalendar :disabled="true" />
  </Story>

  <Story
    name="Fixed weeks"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      fixed-weeks
    />
  </Story>

  <Story
    name="Localization"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      locale="de"
    />
  </Story>

  <Story
    name="Prevent deselection"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      prevent-deselect
    />
  </Story>

  <Story
    name="Multiple selection"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      multiple
    />
  </Story>

  <Story
    name="Different calendar"
    as-child
  >
    <RangeCalendar :default-value="persianCalendar" />
  </Story>

  <Story
    name="Pagination functions"
    as-child
  >
    <RangeCalendar
      :default-value="defaultValue"
      :prev-page="(date: DateValue) => paging(date, -1)"
      :next-page="(date:DateValue) => paging(date, 1)"
    />
  </Story>
</template>
