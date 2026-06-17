<script setup lang="ts">
import { CheckboxRoot } from '..'
</script>

<template>
  <!-- `marker` receives this SFC's scoped-style id; the Checkbox root must receive
       the same id (forwarded manually) even though it is now a multi-root component. -->
  <span class="marker" />
  <CheckboxRoot
    name="test"
    aria-label="scoped"
    class="scoped-checkbox"
  />
</template>

<style scoped>
.marker {
  color: red;
}
.scoped-checkbox {
  color: rgb(1, 2, 3);
}
</style>
