<script setup lang="ts">
import type { DateValue } from '@internationalized/date'

import type { Ref } from 'vue'
import { CalendarDate } from '@internationalized/date'
import { defineMeta } from 'sb-addon-vue-csf'
import { ref } from 'vue'
import Calendar from './_DummyCalendar.vue'

const defaultValue = new CalendarDate(2024, 2, 20)
const modelValue = ref(defaultValue) as Ref<DateValue>

const placeholder = ref(new CalendarDate(2024, 4, 1)) as Ref<CalendarDate>

function paging(date: DateValue, sign: -1 | 1) {
  if (sign === -1)
    return date.subtract({ years: 1 })
  return date.add({ years: 1 })
}

const { Story } = defineMeta({
  title: 'Calendar/Chromatic',
})
</script>

<template>
  <Story
    name="Uncontrolled (modelValue)"
    :as-child="true"
  >
    <Calendar :default-value="defaultValue" />
  </Story>

  <Story
    name="Controlled (modelValue)"
    :as-child="true"
  >
    <Calendar v-model="modelValue" />
  </Story>

  <Story
    name="Uncontrolled (placeholder)"
    :as-child="true"
  >
    <Calendar
      :default-value="defaultValue"
      :default-placeholder="placeholder"
    />
  </Story>

  <Story
    name="Controlled (placeholder)"
    :as-child="true"
  >
    <Calendar
      v-model:placeholder="placeholder"
      :default-value="defaultValue"
    />
  </Story>

  <Story
    name="Empty default"
    :as-child="true"
  >
    <Calendar />
  </Story>

  <Story
    name="Default value"
    :as-child="true"
  >
    <Calendar :default-value="defaultValue" />
  </Story>

  <Story
    name="Disabled"
    :as-child="true"
  >
    <Calendar :disabled="true" />
  </Story>

  <Story
    name="Fixed weeks"
    :as-child="true"
  >
    <Calendar
      :default-value="defaultValue"
      fixed-weeks
    />
  </Story>

  <Story
    name="Localization"
    :as-child="true"
  >
    <Calendar
      :default-value="defaultValue"
      locale="de"
    />
  </Story>

  <Story
    name="Prevent deselection"
    :as-child="true"
  >
    <Calendar
      :default-value="defaultValue"
      prevent-deselect
    />
  </Story>

  <Story
    name="Multiple selection"
    :as-child="true"
  >
    <Calendar
      :default-value="defaultValue"
      multiple
    />
  </Story>

  <Story
    name="Pagination functions"
    :as-child="true"
  >
    <Calendar
      :default-value="defaultValue"
      :next-page="(date: DateValue) => paging(date, 1)"
      :prev-page="(date: DateValue) => paging(date, -1)"
    />
  </Story>
</template>
