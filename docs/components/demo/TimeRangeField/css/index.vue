<script setup lang="ts">
import { Label, TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import './styles.css'
</script>

<template>
  <div class="TimeFieldWrapper">
    <Label
      class="TimeFieldLabel"
      for="time-field"
    >Input label</Label>

    <TimeRangeFieldRoot
      id="time-field"
      v-slot="{ segments }"
      granularity="second"
      class="TimeField"
    >
      <template
        v-for="(item, index) in segments.start"
        :key="`${item.part}-${index}`"
      >
        <TimeRangeFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          class="TimeFieldLiteral"
          type="start"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
        <TimeRangeFieldInput
          v-else
          :part="item.part"
          class="TimeFieldSegment"
          type="start"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
      </template>
      -
      <template
        v-for="(item, index) in segments.end"
        :key="`${item.part}-${index}`"
      >
        <TimeRangeFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          class="TimeFieldLiteral"
          type="end"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
        <TimeRangeFieldInput
          v-else
          :part="item.part"
          class="TimeFieldSegment"
          type="end"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
      </template>
    </TimeRangeFieldRoot>
  </div>
</template>
