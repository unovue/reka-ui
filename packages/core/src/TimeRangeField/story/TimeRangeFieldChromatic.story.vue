<script setup lang="ts">
import type { Ref } from 'vue'
import type { TimeValue } from '@/shared/date'
import { ref } from 'vue'
import { Temporal } from '@/temporal'
import TimeRangeField from './_DummyTimeRangeField.vue'

const defaultValue = {
  start: Temporal.PlainTime.from({ hour: 10, minute: 0, second: 0 }),
  end: Temporal.PlainTime.from({ hour: 11, minute: 0, second: 0 }),
}
const modelValue = ref(defaultValue) as Ref<{ start: TimeValue, end: TimeValue }>

const defaultPlaceholder = Temporal.PlainTime.from({ hour: 12, minute: 30, second: 0 })
</script>

<template>
  <Story
    title="Time Range Field/Chromatic"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Empty default">
      <TimeRangeField />
    </Variant>

    <Variant title="With default value">
      <TimeRangeField :default-value="defaultValue" />
    </Variant>

    <Variant title="Uncontrolled">
      <TimeRangeField :default-value="defaultValue" />
    </Variant>

    <Variant title="Controlled">
      <TimeRangeField v-model="modelValue" />
    </Variant>

    <Variant title="Disabled">
      <TimeRangeField
        :default-value="defaultValue"
        disabled
      />
    </Variant>

    <Variant title="Locale awareness">
      <TimeRangeField
        :default-value="defaultValue"
        locale="de"
      />
    </Variant>

    <Variant title="Placeholder">
      <TimeRangeField :default-placeholder="defaultPlaceholder" />
    </Variant>

    <Variant title="Timezone example">
      <TimeRangeField :default-placeholder="defaultPlaceholder" />
    </Variant>
  </Story>
</template>
