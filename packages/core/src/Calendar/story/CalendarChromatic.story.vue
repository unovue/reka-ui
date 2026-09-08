<script setup lang="ts">
import type { Ref } from 'vue'
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { ref } from 'vue'
import Calendar from './_DummyCalendar.vue'

const defaultValue = Temporal.PlainDate.from({ year: 2024, month: 2, day: 20 })
const modelValue = ref(defaultValue) as Ref<TemporalDate>

const placeholder = ref(Temporal.PlainDate.from({ year: 2024, month: 4, day: 1 })) as Ref<TemporalDate>

function paging(date: TemporalDate, sign: -1 | 1) {
  if (sign === -1)
    return date.subtract({ years: 1 })
  return date.add({ years: 1 })
}
</script>

<template>
  <Story
    title="Calendar/Chromatic"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Uncontrolled (modelValue)">
      <Calendar :default-value="defaultValue" />
    </Variant>

    <Variant title="Controlled (modelValue)">
      <Calendar v-model="modelValue" />
    </Variant>

    <Variant title="Uncontrolled (placeholder)">
      <Calendar
        :default-value="defaultValue"
        :default-placeholder="placeholder"
      />
    </Variant>

    <Variant title="Controlled (placeholder)">
      <Calendar
        v-model:placeholder="placeholder"
        :default-value="defaultValue"
      />
    </Variant>

    <Variant title="Empty default">
      <Calendar />
    </Variant>

    <Variant title="Default value">
      <Calendar :default-value="defaultValue" />
    </Variant>

    <Variant title="Disabled">
      <Calendar :disabled="true" />
    </Variant>

    <Variant title="Fixed weeks">
      <Calendar
        :default-value="defaultValue"
        fixed-weeks
      />
    </Variant>

    <Variant title="Localization">
      <Calendar
        :default-value="defaultValue"
        locale="de"
      />
    </Variant>

    <Variant title="Prevent deselection">
      <Calendar
        :default-value="defaultValue"
        prevent-deselect
      />
    </Variant>

    <Variant title="Multiple selection">
      <Calendar
        :default-value="defaultValue"
        multiple
      />
    </Variant>

    <Variant title="Pagination functions">
      <Calendar
        :default-value="defaultValue"
        :next-page="(date: TemporalDate) => paging(date, 1)"
        :prev-page="(date: TemporalDate) => paging(date, -1)"
      />
    </Variant>
  </Story>
</template>
