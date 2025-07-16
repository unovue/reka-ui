<script setup lang="ts">
import { DateRangeFieldInput, DateRangeFieldRoot, Label } from 'reka-ui'
import './styles.css'
</script>

<template>
  <div class="DateFieldWrapper">
    <Label
      class="DateFieldLabel"
      for="date-field"
    >Input label</Label>

    <DateRangeFieldRoot
      id="date-field"
      v-slot="{ segments }"
      :is-date-unavailable="date => date.day === 19"
      granularity="second"
      class="DateField"
    >
      <template
        v-for="item in segments.start"
        :key="item.part"
      >
        <DateRangeFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          class="DateFieldLiteral"
          type="start"
        >
          {{ item.value }}
        </DateRangeFieldInput>
        <DateRangeFieldInput
          v-else
          :part="item.part"
          class="DateFieldSegment"
          type="start"
        >
          {{ item.value }}
        </DateRangeFieldInput>
      </template>
      -
      <template
        v-for="item in segments.end"
        :key="item.part"
      >
        <DateRangeFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          class="DateFieldLiteral"
          type="end"
        >
          {{ item.value }}
        </DateRangeFieldInput>
        <DateRangeFieldInput
          v-else
          :part="item.part"
          class="DateFieldSegment"
          type="end"
        >
          {{ item.value }}
        </DateRangeFieldInput>
      </template>
    </DateRangeFieldRoot>
  </div>
</template>
