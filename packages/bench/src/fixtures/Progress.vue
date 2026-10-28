<script setup>
// Progress: N instances of a typical composition (closed/default state)
import { ProgressIndicator, ProgressRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ProgressRoot :model-value="40">
      <ProgressIndicator />
    </ProgressRoot>
  </div>
</template>
