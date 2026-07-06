<script setup lang="ts">
import type { Ref } from 'vue'
import type { TimeValue } from '@/shared/date'
import { Time } from '@internationalized/date'
import { defineMeta } from 'sb-addon-vue-csf'
import { ref } from 'vue'
import TimeRangeField from './_DummyTimeRangeField.vue'

const defaultValue = { start: new Time(10, 0, 0), end: new Time(11, 0, 0) }
const modelValue = ref(defaultValue) as Ref<{ start: TimeValue, end: TimeValue }>

const defaultPlaceholder = new Time(12, 30)

const { Story } = defineMeta({
  title: 'Time Range Field/Chromatic',
})
</script>

<template>
  <Story
    name="Empty default"
    as-child
  >
    <TimeRangeField />
  </Story>

  <Story
    name="With default value"
    as-child
  >
    <TimeRangeField :default-value="defaultValue" />
  </Story>

  <Story
    name="Uncontrolled"
    as-child
  >
    <TimeRangeField :default-value="defaultValue" />
  </Story>

  <Story
    name="Controlled"
    as-child
  >
    <TimeRangeField v-model="modelValue" />
  </Story>

  <Story
    name="Disabled"
    as-child
  >
    <TimeRangeField
      :default-value="defaultValue"
      disabled
    />
  </Story>

  <Story
    name="Locale awareness"
    as-child
  >
    <TimeRangeField
      :default-value="defaultValue"
      locale="de"
    />
  </Story>

  <Story
    name="Placeholder"
    as-child
  >
    <TimeRangeField :default-placeholder="defaultPlaceholder" />
  </Story>

  <Story
    name="Timezone example"
    as-child
  >
    <TimeRangeField :default-placeholder="defaultPlaceholder" />
  </Story>
</template>
