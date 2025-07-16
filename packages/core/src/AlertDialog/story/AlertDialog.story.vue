<script setup lang="ts">
import AlertDialog from './_AlertDialog.vue'
</script>

<template>
  <Story
    title="Alert Dialog/Demo"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="default">
      <AlertDialog />
    </Variant>
  </Story>
</template>
