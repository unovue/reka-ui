<script setup>
// Toggle: N instances of a typical composition (closed/default state)
import { Toggle } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <Toggle aria-label="Bold">
      B
    </Toggle>
  </div>
</template>
