<script setup>
// RadioGroup: N instances of a typical composition (closed/default state)
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <RadioGroupRoot default-value="a">
      <RadioGroupItem
        v-for="v in ['a', 'b', 'c']"
        :key="v"
        :value="v"
      >
        <RadioGroupIndicator />
      </RadioGroupItem>
    </RadioGroupRoot>
  </div>
</template>
