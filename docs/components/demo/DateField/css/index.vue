<script setup lang="ts">
import { DateFieldInput, DateFieldRoot, Label } from 'reka-ui'
import './styles.css'
</script>

<template>
  <div class="DateFieldWrapper">
    <Label
      class="DateFieldLabel"
      for="date-field"
    >Birthday</Label>
    <DateFieldRoot
      id="date-field"
      v-slot="{ segments }"
      :is-date-unavailable="date => date.day === 19"
      granularity="second"
      class="DateField"
    >
      <template
        v-for="item in segments"
        :key="item.part"
      >
        <DateFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          class="DateFieldLiteral"
        >
          {{ item.value }}
        </DateFieldInput>
        <DateFieldInput
          v-else
          :part="item.part"
          class="DateFieldSegment"
        >
          {{ item.value }}
        </DateFieldInput>
      </template>
    </DateFieldRoot>
  </div>
</template>
