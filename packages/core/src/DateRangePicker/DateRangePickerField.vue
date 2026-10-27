<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { DateRangeFieldChangeReason } from '@/DateRangeField'
import type { ChangeEventDetails } from '@/shared'
import { DateRangeFieldRoot } from '..'
import { injectDateRangePickerRootContext } from './DateRangePickerRoot.vue'
</script>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { useForwardElement } from '@/shared'

const rootContext = injectDateRangePickerRootContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

function setFieldRef(el: Element | ComponentPublicInstance | null) {
  rootContext.dateFieldRef.value = (el ?? undefined) as typeof rootContext.dateFieldRef.value
  forwardRef(el)
}

// The field is controlled by the picker. Its `beforeUpdate:modelValue` runs
// the picker's change, so the picker emits once with the field's reason. A
// cancel on the picker keeps the last committed range; the typed segments
// stay as they are.
</script>

<template>
  <DateRangeFieldRoot
    v-slot="{ segments, modelValue }"
    :ref="setFieldRef"
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
      stepSnapping: rootContext.stepSnapping.value,
    }"
    @before-update:model-value="rootContext.onFieldBeforeUpdate"
    @update:placeholder="(date: DateValue, details: ChangeEventDetails<DateRangeFieldChangeReason>) => rootContext.setPlaceholder(date, details.reason, details.event)"
  >
    <slot
      :segments="segments"
      :model-value="modelValue"
    />
  </DateRangeFieldRoot>
</template>
