<script setup lang="ts">
import Wrapper from './Wrapper.vue'

defineProps<{ listeners: Record<string, any> }>()
</script>

<template>
  <Wrapper
    label="x"
    v-on="listeners"
  />
</template>
