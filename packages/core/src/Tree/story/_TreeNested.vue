<script setup lang="ts">
import { TreeRoot } from '..'

defineProps<{
  paths: string[]
}>()
</script>

<template>
  <TreeRoot
    class="w-64 h-80 bg-white text-blackA11 rounded-lg text-sm font-medium"
    :paths="paths"
    initial-expansion="open"
  />
</template>
