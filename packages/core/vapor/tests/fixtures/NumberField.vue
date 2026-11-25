<script setup vapor lang="ts">
import { Label, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from '#reka'
import { ref } from 'vue'

const value = ref(5)
const other = ref(1)
defineExpose({ value })
</script>

<template>
  <form
    id="form"
    @submit.prevent
  >
    <Label for="input">Quantity</Label>
    <NumberFieldRoot
      id="qty"
      v-model="value"
      name="qty"
      :min="0"
      :max="10"
    >
      <NumberFieldDecrement id="dec">
        -
      </NumberFieldDecrement>
      <NumberFieldInput id="input" />
      <NumberFieldIncrement id="inc">
        +
      </NumberFieldIncrement>
    </NumberFieldRoot>
  </form>
  <span id="value">{{ value }}</span>

  <NumberFieldRoot v-model="other">
    <!-- asChild, both forms -->
    <NumberFieldDecrement as-child>
      <button
        id="dec-adopted"
        aria-label="Less"
        data-state="mine"
      >
        less
      </button>
    </NumberFieldDecrement>
    <NumberFieldInput aria-label="Other" />
    <!-- @vue-expect-error the slot types don't list `props` yet (see the Vapor guide) -->
    <NumberFieldIncrement
      v-slot="{ props }"
      as-child
    >
      <button
        v-bind="props"
        id="inc-slotted"
        aria-label="More"
      >
        more
      </button>
    </NumberFieldIncrement>
  </NumberFieldRoot>
  <span id="other">{{ other }}</span>
</template>
