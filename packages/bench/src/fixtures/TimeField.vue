<script setup>
// TimeField: N instances of a typical composition (closed/default state)
import { TimeFieldInput, TimeFieldRoot } from 'reka-ui'

import { startTime } from '../date.js'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <TimeFieldRoot
      v-slot="{ segments }"
      :default-value="startTime"
      locale="en-US"
    >
      <TimeFieldInput
        v-for="item in segments"
        :key="item.part"
        :part="item.part"
      >
        {{ item.value }}
      </TimeFieldInput>
    </TimeFieldRoot>
  </div>
</template>
