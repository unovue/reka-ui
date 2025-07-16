<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from 'reka-ui'
</script>

<template>
  <NumberFieldRoot
    id="age"
    :min="0"
    :default-value="18"
  >
    <label
      for="age"
      class="text-stone-700 dark:text-white"
    >
      Age
    </label>
    <div class="mt-1 flex items-center border bg-white hover:bg-stone-50 rounded-lg shadow-sm h-9 focus-within:shadow-[0_0_0_2px] focus-within:shadow-stone-800">
      <NumberFieldDecrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:minus" />
      </NumberFieldDecrement>
      <NumberFieldInput class="bg-transparent w-20 tabular-nums text-center focus:outline-0 p-1" />
      <NumberFieldIncrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:plus" />
      </NumberFieldIncrement>
    </div>
  </NumberFieldRoot>
</template>
