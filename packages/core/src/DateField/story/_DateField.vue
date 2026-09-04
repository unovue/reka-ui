<script setup lang="ts">
import type { DateFieldRootProps } from '..'
import type { TemporalDate } from '@/temporal/types'
import { Label } from '@/Label'
import { DateFieldInput, DateFieldRoot } from '..'

const props = defineProps<{ dateFieldProps?: DateFieldRootProps, emits?: { 'onUpdate:modelValue'?: (data: TemporalDate) => void } }>()
</script>

<template>
  <Label
    for="date-field"
    data-testid="label"
  >Label</Label>
  <DateFieldRoot
    v-bind="props.dateFieldProps"
    id="date-field"
    v-slot="{ segments, modelValue }"
    data-testid="input"
    v-on="{ 'update:modelValue': props.emits?.['onUpdate:modelValue'] }"
  >
    <DateFieldInput
      v-for="item in segments"
      :key="item.part"
      :part="item.part"
      :data-testid="item.part === 'literal' ? undefined : item.part"
    >
      {{ item.value }}
    </DateFieldInput>

    <span
      data-testid="value"
      tabindex="-1"
      disabled
    >{{ modelValue }}</span>
  </DateFieldRoot>
</template>
