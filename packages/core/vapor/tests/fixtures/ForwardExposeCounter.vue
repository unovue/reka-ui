<script setup vapor lang="ts">
let count = 0
defineExpose({
  ready: true,
  get next() { return ++count },
})
</script>

<template>
  <span data-testid="expose-counter">Counter</span>
</template>
