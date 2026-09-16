<script setup lang="ts">
import type { Ref } from 'vue'
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { ref } from 'vue'
import DatePicker from './_DummyDatePicker.vue'

const defaultValue = Temporal.PlainDate.from({ year: 2024, month: 2, day: 20 })
const modelValue = ref(defaultValue) as Ref<TemporalDate>
</script>

<template>
  <Story
    title="Date Picker/Chromatic"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Empty default">
      <DatePicker />
    </Variant>

    <Variant title="With default">
      <DatePicker :default-value="defaultValue" />
    </Variant>

    <Variant title="Uncontrolled">
      <DatePicker :default-value="defaultValue" />
    </Variant>

    <Variant title="Controlled">
      <DatePicker v-model="modelValue" />
    </Variant>

    <Variant title="Disabled">
      <DatePicker
        :default-value="defaultValue"
        disabled
      />
    </Variant>

    <Variant title="Prevent deselect">
      <DatePicker
        :default-value="defaultValue"
        prevent-deselect
      />
    </Variant>

    <Variant title="Locale awareness">
      <DatePicker
        :default-value="defaultValue"
        locale="de"
      />
    </Variant>

    <Variant title="Fixed weeks">
      <DatePicker
        :default-value="defaultValue"
        fixed-weeks
      />
    </Variant>

    <Variant title="Multiple months">
      <DatePicker
        :default-value="defaultValue"
        :number-of-months="2"
      />
    </Variant>

    <Variant title="Multiple months (Paged navigation)">
      <DatePicker
        :default-value="defaultValue"
        :number-of-months="2"
        paged-navigation
      />
    </Variant>
  </Story>
</template>
