<script setup>
// CheckboxGroup: N instances of a typical composition (closed/default state)
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <CheckboxGroupRoot :default-value="['b']">
      <CheckboxRoot
        v-for="v in ['a', 'b', 'c']"
        :key="v"
        :value="v"
      >
        <CheckboxIndicator>✓</CheckboxIndicator>
      </CheckboxRoot>
    </CheckboxGroupRoot>
  </div>
</template>
