<script setup>
// Stepper: N instances of a typical composition (closed/default state)
import { StepperDescription, StepperIndicator, StepperItem, StepperRoot, StepperSeparator, StepperTitle, StepperTrigger } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <StepperRoot :default-value="1">
      <StepperItem
        v-for="s in 3"
        :key="s"
        :step="s"
      >
        <StepperTrigger><StepperIndicator>{{ s }}</StepperIndicator></StepperTrigger>
        <StepperTitle>Step {{ s }}</StepperTitle>
        <StepperDescription>Desc</StepperDescription>
        <StepperSeparator v-if="s !== 3" />
      </StepperItem>
    </StepperRoot>
  </div>
</template>
