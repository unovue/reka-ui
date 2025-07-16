<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { StepperDescription, StepperIndicator, StepperItem, StepperRoot, StepperSeparator, StepperTitle, StepperTrigger } from 'reka-ui'

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
    class="flex gap-2 w-full max-w-[32rem]"
  >
    <StepperItem
      v-for="item in steps"
      :key="item.step"
      class="w-full flex justify-center gap-2 cursor-pointer group relative px-4"
      :step="item.step"
    >
      <StepperTrigger class="inline-flex border-2 shadow-sm items-center text-white bg-green9 border-green9 group-data-[state=inactive]:border-gray-200 group-data-[state=inactive]:bg-white group-data-[state=inactive]:text-stone-700 group-data-[disabled]:opacity-50 group-data-[disabled]:cursor-not-allowed justify-center rounded-full w-10 h-10 shrink-0 focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none">
        <StepperIndicator>
          <Icon
            :icon="item.icon"
            class="w-5 h-5"
          />
        </StepperIndicator>
      </StepperTrigger>

      <StepperSeparator
        v-if="item.step !== steps[steps.length - 1].step"
        class="absolute block top-5 left-[calc(50%+30px)] right-[calc(-50%+20px)] h-0.5 rounded-full bg-stone-300/50 shrink-0"
      />

      <div class="absolute text-center top-full left-0 w-full mt-2 text-stone-700 dark:text-white group-data-[disabled]:opacity-50">
        <StepperTitle class="font-medium">
          {{ item.title }}
        </StepperTitle>
        <StepperDescription class="hidden sm:block text-xs">
          {{ item.description }}
        </StepperDescription>
      </div>
    </StepperItem>
  </StepperRoot>
</template>
