<script setup vapor lang="ts">
import { PinInputInput, PinInputRoot } from '#reka'
import { ref } from 'vue'

const value = ref<string[]>([])
const completed = ref('')
const other = ref<string[]>([])
defineExpose({ value })
</script>

<template>
  <form
    id="form"
    @submit.prevent
  >
    <PinInputRoot
      id="pin"
      v-model="value"
      name="code"
      @complete="v => completed = v.join('')"
    >
      <PinInputInput
        v-for="(_, i) in 3"
        :id="`pin-${i}`"
        :key="i"
        :index="i"
        :aria-label="`Digit ${i + 1}`"
      />
    </PinInputRoot>
  </form>
  <span id="value">{{ value.join('') }}</span>
  <span id="completed">{{ completed }}</span>

  <PinInputRoot v-model="other">
    <!-- asChild, both forms -->
    <PinInputInput
      as-child
      :index="0"
    >
      <input
        id="pin-adopted"
        aria-label="First"
        data-state="mine"
      >
    </PinInputInput>
    <PinInputInput
      v-slot="{ props }"
      as-child
      :index="1"
    >
      <input
        v-bind="props"
        id="pin-slotted"
        aria-label="Second"
      >
    </PinInputInput>
  </PinInputRoot>
</template>
