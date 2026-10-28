<script setup>
// DateField: N instances of a typical composition (closed/default state)
import { DateFieldInput, DateFieldRoot } from 'reka-ui'

import { startDate } from '../date.js'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <DateFieldRoot
      v-slot="{ segments }"
      :default-value="startDate"
      locale="en-US"
    >
      <DateFieldInput
        v-for="item in segments"
        :key="item.part"
        :part="item.part"
      >
        {{ item.value }}
      </DateFieldInput>
    </DateFieldRoot>
  </div>
</template>
