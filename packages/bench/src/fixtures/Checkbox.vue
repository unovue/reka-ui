<script setup>
// Checkbox: N instances of a typical composition (closed/default state)
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <CheckboxRoot><CheckboxIndicator>✓</CheckboxIndicator></CheckboxRoot>
  </div>
</template>
