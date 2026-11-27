<script setup vapor lang="ts">
defineExpose({ label: 'child', childOnly: 'child-only' })
</script>

<template>
  <span data-testid="expose-child">Child</span>
</template>
