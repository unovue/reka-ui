<script setup lang="ts">
import { Icon } from '@iconify/vue'

import { defineMeta } from 'addon-vue-csf'
import { ref } from 'vue'
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from '..'

const value = ref(5)

const { Story } = defineMeta({
  title: 'NumberField/Chromatic',
})
</script>

<template>
  <Story
    name="Uncontrolled"
    as-child
  >
    <NumberFieldRoot
      class="text-sm flex items-center border bg-blackA7 border-blackA9 rounded-md text-white"
      :default-value="5"
    >
      <NumberFieldDecrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:minus" />
      </NumberFieldDecrement>
      <NumberFieldInput class="bg-transparent w-20 tabular-nums focus:outline-0 p-1" />
      <NumberFieldIncrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:plus" />
      </NumberFieldIncrement>
    </NumberFieldRoot>
  </Story>

  <Story
    name="Controlled"
    as-child
  >
    <NumberFieldRoot
      v-model="value"
      class="text-sm flex items-center border bg-blackA7 border-blackA9 rounded-md text-white"
    >
      <NumberFieldDecrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:minus" />
      </NumberFieldDecrement>
      <NumberFieldInput class="bg-transparent w-20 tabular-nums focus:outline-0 p-1" />
      <NumberFieldIncrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:plus" />
      </NumberFieldIncrement>
    </NumberFieldRoot>
  </Story>

  <Story
    name="Decimal"
    as-child
  >
    <NumberFieldRoot
      :default-value="0"
      :format-options="{
        signDisplay: 'exceptZero',
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      }"
      class="text-sm flex items-center border bg-blackA7 border-blackA9 rounded-md text-white"
    >
      <NumberFieldDecrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:minus" />
      </NumberFieldDecrement>
      <NumberFieldInput class="bg-transparent w-20 tabular-nums focus:outline-0 p-1" />
      <NumberFieldIncrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:plus" />
      </NumberFieldIncrement>
    </NumberFieldRoot>
  </Story>

  <Story
    name="Percentage"
    as-child
  >
    <NumberFieldRoot
      :default-value="0.05"
      :step="0.01"
      :format-options="{
        style: 'percent',
      }"
      class="text-sm flex items-center border bg-blackA7 border-blackA9 rounded-md text-white"
    >
      <NumberFieldDecrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:minus" />
      </NumberFieldDecrement>
      <NumberFieldInput class="bg-transparent w-20 tabular-nums focus:outline-0 p-1" />
      <NumberFieldIncrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:plus" />
      </NumberFieldIncrement>
    </NumberFieldRoot>
  </Story>

  <Story
    name="Currency values"
    as-child
  >
    <NumberFieldRoot
      :default-value="5"
      :format-options="{
        style: 'currency',
        currency: 'EUR',
        currencyDisplay: 'code',
        currencySign: 'accounting',
      }"
      class="text-sm flex items-center border bg-blackA7 border-blackA9 rounded-md text-white"
    >
      <NumberFieldDecrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:minus" />
      </NumberFieldDecrement>
      <NumberFieldInput class="bg-transparent w-20 tabular-nums focus:outline-0 p-1" />
      <NumberFieldIncrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:plus" />
      </NumberFieldIncrement>
    </NumberFieldRoot>
  </Story>

  <Story
    name="Units"
    as-child
  >
    <NumberFieldRoot
      :default-value="5"
      :format-options="{
        style: 'unit',
        unit: 'inch',
        unitDisplay: 'long',
      }"
      class="text-sm flex items-center border bg-blackA7 border-blackA9 rounded-md text-white"
    >
      <NumberFieldDecrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:minus" />
      </NumberFieldDecrement>
      <NumberFieldInput class="bg-transparent w-20 tabular-nums focus:outline-0 p-1" />
      <NumberFieldIncrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:plus" />
      </NumberFieldIncrement>
    </NumberFieldRoot>
  </Story>

  <Story
    name="Minimum"
    as-child
  >
    <NumberFieldRoot
      :default-value="5"
      :min="0"
      class="text-sm flex items-center border bg-blackA7 border-blackA9 rounded-md text-white"
    >
      <NumberFieldDecrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:minus" />
      </NumberFieldDecrement>
      <NumberFieldInput class="bg-transparent w-20 tabular-nums focus:outline-0 p-1" />
      <NumberFieldIncrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:plus" />
      </NumberFieldIncrement>
    </NumberFieldRoot>
  </Story>

  <Story
    name="Maximum"
    as-child
  >
    <NumberFieldRoot
      :default-value="5"
      :max="20"
      class="text-sm flex items-center border bg-blackA7 border-blackA9 rounded-md text-white"
    >
      <NumberFieldDecrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:minus" />
      </NumberFieldDecrement>
      <NumberFieldInput class="bg-transparent w-20 tabular-nums focus:outline-0 p-1" />
      <NumberFieldIncrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:plus" />
      </NumberFieldIncrement>
    </NumberFieldRoot>
  </Story>

  <Story
    name="Step (3)"
    as-child
  >
    <NumberFieldRoot
      :step="3"
      class="text-sm flex items-center border bg-blackA7 border-blackA9 rounded-md text-white"
    >
      <NumberFieldDecrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:minus" />
      </NumberFieldDecrement>
      <NumberFieldInput class="bg-transparent w-20 tabular-nums focus:outline-0 p-1" />
      <NumberFieldIncrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:plus" />
      </NumberFieldIncrement>
    </NumberFieldRoot>
  </Story>

  <Story
    name="Step (3) + Minimum (2)"
    as-child
  >
    <NumberFieldRoot
      :min="2"
      :step="3"
      class="text-sm flex items-center border bg-blackA7 border-blackA9 rounded-md text-white"
    >
      <NumberFieldDecrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:minus" />
      </NumberFieldDecrement>
      <NumberFieldInput class="bg-transparent w-20 tabular-nums focus:outline-0 p-1" />
      <NumberFieldIncrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:plus" />
      </NumberFieldIncrement>
    </NumberFieldRoot>
  </Story>

  <Story
    name="Step (3) + Minimum (2) + Maximum (21)"
    as-child
  >
    <NumberFieldRoot
      :min="2"
      :max="21"
      :step="3"
      class="text-sm flex items-center border bg-blackA7 border-blackA9 rounded-md text-white"
    >
      <NumberFieldDecrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:minus" />
      </NumberFieldDecrement>
      <NumberFieldInput class="bg-transparent w-20 tabular-nums focus:outline-0 p-1" />
      <NumberFieldIncrement class="p-2 disabled:opacity-20">
        <Icon icon="radix-icons:plus" />
      </NumberFieldIncrement>
    </NumberFieldRoot>
  </Story>
</template>
