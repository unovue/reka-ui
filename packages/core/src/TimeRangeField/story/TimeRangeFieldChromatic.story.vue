<script setup lang="ts">
import type { Ref } from 'vue'
import type { TimeValue } from '@/shared/date'
import { Time } from '@internationalized/date'
import { ref } from 'vue'
import TimeRangeField from './_DummyTimeRangeField.vue'

const defaultValue = { start: new Time(10, 0, 0), end: new Time(11, 0, 0) }
const modelValue = ref(defaultValue) as Ref<{ start: TimeValue, end: TimeValue }>

const defaultPlaceholder = new Time(12, 30)
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
