<script setup lang="ts">
import Dialog from './_Dialog.vue'
</script>

<template>
  <Story
    title="Dialog/Demo"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <Dialog />
    </Variant>
  </Story>
</template>
