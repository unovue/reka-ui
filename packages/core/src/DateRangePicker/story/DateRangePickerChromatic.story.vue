<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { Ref } from 'vue'
import { CalendarDateTime } from '@internationalized/date'
import { ref } from 'vue'
import DateRangePicker from './_DummyDateRangePicker.vue'

const defaultValue = { start: new CalendarDateTime(2024, 2, 20), end: new CalendarDateTime(2024, 2, 27) }
const modelValue = ref(defaultValue) as Ref<{ start: DateValue, end: DateValue }>
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
