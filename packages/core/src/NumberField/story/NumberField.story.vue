<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from '..'
</script>

<template>
  <Story
    title="NumberField/Basic"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="default">
      <NumberFieldRoot
        class="text-sm  text-white"
        :min="0"
        :default-value="18"
      >
        <div class="mt-1 flex items-center border bg-blackA7 border-blackA9 rounded-md">
          <NumberFieldDecrement class="p-2 disabled:opacity-20">
            <Icon icon="radix-icons:minus" />
          </NumberFieldDecrement>
          <NumberFieldInput class="bg-transparent w-20 tabular-nums focus:outline-0 p-1" />
          <NumberFieldIncrement class="p-2 disabled:opacity-20">
            <Icon icon="radix-icons:plus" />
          </NumberFieldIncrement>
        </div>
      </NumberFieldRoot>
    </Variant>
  </Story>
</template>
