<script setup lang="ts">
import type { TimeRangeFieldRootProps } from '..'
import type { TimeValue } from '@/shared/date'
import { Label } from '@/Label'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from '..'

const props = defineProps<{ timeFieldProps?: TimeRangeFieldRootProps, emits?: { 'onUpdate:modelValue'?: (data: TimeValue) => void } }>()
</script>

<template>
  <Label
    for="time-field"
    data-testid="label"
  >
    Label</Label>
  <TimeRangeFieldRoot
    v-bind="props.timeFieldProps"
    id="time-field"
    v-slot="{ segments, modelValue }"
    data-testid="input"
    v-on="{ 'update:modelValue': props.emits?.['onUpdate:modelValue'] }"
  >
    <TimeRangeFieldInput
      v-for="item in segments.start"
      :key="item.part"
      :part="item.part"
      :data-testid="item.part === 'literal' ? undefined : `start-${item.part}`"
      type="start"
    >
      {{ item.value }}
    </TimeRangeFieldInput>
    <TimeRangeFieldInput
      v-for="item in segments.end"
      :key="item.part"
      :part="item.part"
      :data-testid="item.part === 'literal' ? undefined : `end-${item.part}`"
      type="end"
    >
      {{ item.value }}
    </TimeRangeFieldInput>

    <span
      data-testid="value"
      tabindex="-1"
      disabled
    >{{ modelValue }}</span>
  </TimeRangeFieldRoot>
</template>
