<script setup vapor lang="ts">
import { StepperDescription, StepperIndicator, StepperItem, StepperRoot, StepperSeparator, StepperTitle, StepperTrigger } from '#reka'
import { ref } from 'vue'

const step = ref(1)
const steps = [1, 2, 3]
defineExpose({ step })
</script>

<template>
  <StepperRoot
    id="stepper"
    v-model="step"
    :linear="false"
  >
    <StepperItem
      v-for="s in steps"
      :id="`item-${s}`"
      :key="s"
      :step="s"
    >
      <StepperTrigger :id="`trigger-${s}`">
        <StepperIndicator>{{ s }}</StepperIndicator>
        <StepperTitle>Step {{ s }}</StepperTitle>
        <StepperDescription>About {{ s }}</StepperDescription>
      </StepperTrigger>
      <StepperSeparator v-if="s !== steps.length" />
    </StepperItem>
  </StepperRoot>
  <span id="step">{{ step }}</span>

  <!-- asChild, both forms -->
  <StepperRoot
    :default-value="1"
    :linear="false"
  >
    <StepperItem :step="1">
      <StepperTrigger as-child>
        <button
          id="trigger-adopted"
          aria-label="First"
          data-state="mine"
        >
          1
        </button>
      </StepperTrigger>
    </StepperItem>
    <StepperItem :step="2">
      <!-- @vue-expect-error the slot types don't list `props` yet (see the Vapor guide) -->
      <StepperTrigger
        v-slot="{ props }"
        as-child
      >
        <button
          v-bind="props"
          id="trigger-slotted"
          aria-label="Second"
        >
          2
        </button>
      </StepperTrigger>
    </StepperItem>
  </StepperRoot>
</template>
