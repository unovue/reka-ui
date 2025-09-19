<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { DateRangeFieldRootProps } from '..'
import { Label } from '@/Label'
import { DateRangeFieldInput, DateRangeFieldRoot } from '..'

const props = defineProps<{ dateFieldProps?: DateRangeFieldRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateValue) => void } }>()
</script>

<template>
  <Label
    for="date-field"
    data-testid="label"
  >Label</Label>
  <DateRangeFieldRoot
    v-bind="props.dateFieldProps"
    id="date-field"
    v-slot="{ segments }"
    data-testid="input"
    v-on="{ 'update:modelValue': props.emits?.['onUpdate:modelValue'] }"
  >
    <DateRangeFieldInput
      v-for="item in segments.start"
      :key="item.part"
      :part="item.part"
      :data-testid="item.part === 'literal' ? undefined : `start-${item.part}`"
      type="start"
    >
      {{ item.value }}
    </DateRangeFieldInput>
    <DateRangeFieldInput
      v-for="item in segments.end"
      :key="item.part"
      :part="item.part"
      :data-testid="item.part === 'literal' ? undefined : `end-${item.part}`"
      type="end"
    >
      {{ item.value }}
    </DateRangeFieldInput>
  </DateRangeFieldRoot>
</template>
