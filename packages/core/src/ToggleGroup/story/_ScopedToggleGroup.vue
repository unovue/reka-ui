<script setup lang="ts">
import { ToggleGroupItem, ToggleGroupRoot } from '..'
</script>

<template>
  <!-- `marker` receives this SFC's scoped-style id; the ToggleGroupItem control must
       receive the same id (forwarded manually) even though it wraps the multi-root
       `Toggle`. -->
  <span class="marker" />
  <ToggleGroupRoot
    type="single"
    default-value="a"
  >
    <ToggleGroupItem
      value="a"
      aria-label="scoped"
      class="scoped-toggle"
    />
  </ToggleGroupRoot>
</template>

<style scoped>
.marker {
  color: red;
}
.scoped-toggle {
  color: rgb(1, 2, 3);
}
</style>
