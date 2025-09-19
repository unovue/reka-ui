<script setup lang="ts">
import { Label, TimeFieldInput, TimeFieldRoot } from 'reka-ui'

import './styles.css'
</script>

<template>
  <div class="TimeFieldWrapper">
    <Label
      class="TimeFieldLabel"
      for="time-field"
    >Appointment</Label>
    <TimeFieldRoot
      id="time-field"
      v-slot="{ segments }"
      granularity="second"
      class="TimeField"
    >
      <template
        v-for="item in segments"
        :key="item.part"
      >
        <TimeFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          class="TimeFieldLiteral"
        >
          {{ item.value }}
        </TimeFieldInput>
        <TimeFieldInput
          v-else
          :part="item.part"
          class="TimeFieldSegment"
        >
          {{ item.value }}
        </TimeFieldInput>
      </template>
    </TimeFieldRoot>
  </div>
</template>
