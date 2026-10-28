<script setup>
// NumberField: N instances of a typical composition (closed/default state)
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <NumberFieldRoot
      :default-value="5"
      locale="en-US"
    >
      <NumberFieldDecrement>-</NumberFieldDecrement><NumberFieldInput /><NumberFieldIncrement class="inc">
        +
      </NumberFieldIncrement>
    </NumberFieldRoot>
  </div>
</template>
