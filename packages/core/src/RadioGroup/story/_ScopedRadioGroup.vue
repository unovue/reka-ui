<script setup lang="ts">
import { RadioGroupItem, RadioGroupRoot } from '..'
</script>

<template>
  <!-- `marker` receives this SFC's scoped-style id; the RadioGroupItem control must
       receive the same id (forwarded manually) even though it wraps the multi-root
       `Radio` and sets `inheritAttrs: false`. -->
  <span class="marker" />
  <RadioGroupRoot
    default-value="default"
    name="test"
  >
    <RadioGroupItem
      value="default"
      aria-label="scoped"
      class="scoped-radio"
    />
  </RadioGroupRoot>
</template>

<style scoped>
.marker {
  color: red;
}
.scoped-radio {
  color: rgb(1, 2, 3);
}
</style>
