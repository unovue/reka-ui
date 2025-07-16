<script setup lang="ts">
import type { TimeFieldRootProps } from '..'
import type { TimeValue } from '@/shared/date'
import { Label } from '@/Label'
import { TimeFieldInput, TimeFieldRoot } from '..'

const props = defineProps<{ timeFieldProps?: TimeFieldRootProps, emits?: { 'onUpdate:modelValue'?: (data: TimeValue) => void } }>()
</script>

<template>
  <Label
    for="time-field"
    data-testid="label"
  >
    Label</Label>
  <TimeFieldRoot
    v-bind="props.timeFieldProps"
    id="time-field"
    v-slot="{ segments, modelValue }"
    data-testid="input"
    v-on="{ 'update:modelValue': props.emits?.['onUpdate:modelValue'] }"
  >
    <TimeFieldInput
      v-for="item in segments"
      :key="item.part"
      :part="item.part"
      :data-testid="item.part === 'literal' ? undefined : item.part"
    >
      {{ item.value }}
    </TimeFieldInput>

    <span
      data-testid="value"
      tabindex="-1"
      disabled
    >{{ modelValue }}</span>
  </TimeFieldRoot>
</template>
