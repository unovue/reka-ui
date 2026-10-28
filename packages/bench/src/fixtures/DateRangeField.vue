<script setup>
// DateRangeField: N instances of a typical composition (closed/default state)
import { DateRangeFieldInput, DateRangeFieldRoot } from 'reka-ui'

import { endDate, startDate } from '../date.js'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <DateRangeFieldRoot
      v-slot="{ segments }"
      :default-value="{ start: startDate, end: endDate }"
      locale="en-US"
    >
      <DateRangeFieldInput
        v-for="item in segments.start"
        :key="`s-${item.part}`"
        :part="item.part"
        type="start"
      >
        {{ item.value }}
      </DateRangeFieldInput>
      <DateRangeFieldInput
        v-for="item in segments.end"
        :key="`e-${item.part}`"
        :part="item.part"
        type="end"
      >
        {{ item.value }}
      </DateRangeFieldInput>
    </DateRangeFieldRoot>
  </div>
</template>
