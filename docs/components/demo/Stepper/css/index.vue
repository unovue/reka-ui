<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { StepperDescription, StepperIndicator, StepperItem, StepperRoot, StepperSeparator, StepperTitle, StepperTrigger } from 'reka-ui'
import './styles.css'

const steps = [{
  step: 1,
  title: 'Address',
  description: 'Add your address here',
  icon: 'radix-icons:home',
}, {
  step: 2,
  title: 'Shipping',
  description: 'Set your preferred shipping method',
  icon: 'radix-icons:archive',
}, {
  step: 3,
  title: 'Checkout',
  description: 'Confirm your order',
  icon: 'radix-icons:check',
}]
</script>

<template>
  <StepperRoot
    :default-value="2"
    class="StepperList"
  >
    <StepperItem
      v-for="item in steps"
      :key="item.step"
      class="StepperItem"
      :step="item.step"
    >
      <StepperTrigger class="StepperTrigger">
        <StepperIndicator
          class="StepperIndicator"
        >
          <Icon
            :icon="item.icon"
            class="StepperIndicatorIcon"
          />
        </StepperIndicator>
        <div class="StepperItemText">
          <StepperTitle class="StepperTitle">
            {{ item.title }}
          </StepperTitle>
          <StepperDescription class="StepperDescription">
            {{ item.description }}
          </StepperDescription>
        </div>
      </StepperTrigger>
      <StepperSeparator
        v-if="item.step !== steps[steps.length - 1].step"
        class="StepperSeparator"
      />
    </StepperItem>
  </StepperRoot>
</template>
