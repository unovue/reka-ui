<script lang="ts">
import type { TemporalDate } from '@/temporal/types'
import { toPlainDate } from '@/temporal/comparators'
import { DateFieldRoot } from '..'
import { injectDatePickerRootContext } from './DatePickerRoot.vue'
</script>

<script setup lang="ts">
const rootContext = injectDatePickerRootContext()
</script>

<template>
  <DateFieldRoot
    v-slot="{ segments, modelValue }"
    :ref="rootContext.dateFieldRef"
    :model-value="rootContext.modelValue.value"
    :placeholder="rootContext.placeholder.value"
    v-bind="{
      id: rootContext.id.value,
      name: rootContext.name.value,
      disabled: rootContext.disabled.value,
      minValue: rootContext.minValue.value,
      maxValue: rootContext.maxValue.value,
      readonly: rootContext.readonly.value,
      hourCycle: rootContext.hourCycle.value,
      granularity: rootContext.granularity.value,
      hideTimeZone: rootContext.hideTimeZone.value,
      locale: rootContext.locale.value,
      isDateUnavailable: rootContext.isDateUnavailable,
      required: rootContext.required.value,
      dir: rootContext.dir.value,
      step: rootContext.step.value,
    }"
    @update:model-value="(date: TemporalDate | undefined) => {
      if (date && rootContext.modelValue.value && toPlainDate(date).equals(toPlainDate(rootContext.modelValue.value))) return
      rootContext.onDateChange(date)
    }"
    @update:placeholder="(date: TemporalDate) => {
      if (toPlainDate(date).equals(toPlainDate(rootContext.placeholder.value))) return
      rootContext.onPlaceholderChange(date)
    }"
  >
    <slot
      :segments="segments"
      :model-value="modelValue"
    />
  </DateFieldRoot>
</template>
