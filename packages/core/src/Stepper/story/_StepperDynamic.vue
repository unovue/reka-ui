<script setup lang="ts">
import { computed } from 'vue'
import { StepperItem, StepperRoot, StepperTitle, StepperTrigger } from '..'

const props = withDefaults(defineProps<{ visibleSteps?: number }>(), {
  visibleSteps: 5,
})

const allSteps = [1, 2, 3, 4, 5]
const steps = computed(() => allSteps.slice(0, props.visibleSteps))
</script>

<template>
  <StepperRoot
    v-slot="{ totalSteps }"
    data-testid="stepper"
    :default-value="1"
  >
    <span data-testid="total-steps">{{ totalSteps }}</span>

    <StepperItem
      v-for="item in steps"
      :key="item"
      :step="item"
      :data-testid="`stepper-item-${item}`"
    >
      <StepperTrigger :data-testid="`stepper-item-trigger-${item}`">
        <StepperTitle>Step {{ item }}</StepperTitle>
      </StepperTrigger>
    </StepperItem>
  </StepperRoot>
</template>
