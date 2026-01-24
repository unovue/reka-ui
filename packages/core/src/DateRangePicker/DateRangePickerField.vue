<script lang="ts">
import { isSameDay, toPlainDate } from '@/temporal/comparators'
import { DateRangeFieldRoot } from '..'
import { injectDateRangePickerRootContext } from './DateRangePickerRoot.vue'
</script>

<script setup lang="ts">
const rootContext = injectDateRangePickerRootContext()
</script>

<template>
  <DateRangeFieldRoot
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
    @update:model-value="(date) => {
      if (date.start && rootContext.modelValue.value.start && date.end && rootContext.modelValue.value.end && toPlainDate(date.start).equals(toPlainDate(rootContext.modelValue.value.start)) && toPlainDate(date.end).equals(toPlainDate(rootContext.modelValue.value.end))) return
      rootContext.onDateChange(date)
    }"
    @update:placeholder="(date) => {
      if (isSameDay(date, rootContext.placeholder.value)) return
      rootContext.onPlaceholderChange(date)
    }"
  >
    <slot
      :segments="segments"
      :model-value="modelValue"
    />
  </DateRangeFieldRoot>
</template>
