<script setup lang="ts">
import Autocomplete from './_Autocomplete.vue'
</script>

<template>
  <Story
    title="Autocomplete/Default"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <Autocomplete />
    </Variant>
  </Story>
</template>
