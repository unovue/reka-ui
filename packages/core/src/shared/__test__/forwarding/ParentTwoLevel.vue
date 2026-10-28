<script setup lang="ts">
import Outer from './Outer.vue'

defineProps<{ enabled: boolean, pick: (v: number) => void }>()
</script>

<template>
  <Outer v-bind="{ onSelect: enabled ? pick : undefined }" />
</template>
