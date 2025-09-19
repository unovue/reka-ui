<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { Ref } from 'vue'
import { CalendarDateTime, getLocalTimeZone, now } from '@internationalized/date'
import { ref } from 'vue'
import DateRangeField from './_DummyDateRangeField.vue'

const defaultValue = { start: new CalendarDateTime(2024, 2, 20), end: new CalendarDateTime(2024, 2, 27) }
const modelValue = ref(defaultValue) as Ref<{ start: DateValue, end: DateValue }>

const defaultPlaceholder = new CalendarDateTime(2023, 10, 11, 12, 30)
const localTimezonePlaceholder = now(getLocalTimeZone())
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
