<script lang="ts">
import type { DateValue } from '@/date'
import type { DateFieldChangeReason } from '@/DateField'
import type { ChangeEventDetails } from '@/shared'
import type { SegmentPart } from '@/shared/date'
import { DateFieldRoot } from '..'
import { injectDatePickerRootContext } from './DatePickerRoot.vue'
</script>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { useForwardElement } from '@/shared'

defineSlots<{
  default?: (props: {
    /** The current date of the field */
    modelValue: DateValue | undefined
    /** The date field segment contents */
    segments: { part: SegmentPart, value: string }[]
  }) => any
}>()

const rootContext = injectDatePickerRootContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

function setFieldRef(el: Element | ComponentPublicInstance | null) {
  rootContext.dateFieldRef.value = (el ?? undefined) as typeof rootContext.dateFieldRef.value
  forwardRef(el)
}

// The field is controlled by the picker (`null` while empty). Its
// `beforeUpdate:modelValue` runs the picker's change, so the picker emits once
// with the field's reason. A cancel on the picker keeps the last committed
// value; the typed segments stay as they are, so typing can continue.
</script>

<template>
  <DateFieldRoot
    v-slot="{ segments, modelValue }"
    :ref="setFieldRef"
    :model-value="rootContext.modelValue.value ?? null"
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
    @update:placeholder="(date: DateValue, details: ChangeEventDetails<DateFieldChangeReason>) => rootContext.setPlaceholder(date, details.reason, details.event)"
  >
    <slot
      :segments="segments"
      :model-value="modelValue"
    />
  </DateFieldRoot>
</template>
