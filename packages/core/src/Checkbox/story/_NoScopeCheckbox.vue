<script setup lang="ts">
import { CheckboxRoot } from '..'
</script>

<template>
  <!-- This parent has no `<style scoped>`, so there is no scope id to forward. -->
  <CheckboxRoot
    name="test"
    aria-label="no-scope"
    class="plain-checkbox"
  />
</template>
