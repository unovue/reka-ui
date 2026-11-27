<script setup vapor lang="ts">
import { PaginationRoot } from '#reka'
import { ref } from 'vue'

// `clampPage` starts off with the page past the page count, then turns on after mount
const page = ref(50)
const clamp = ref(false)
defineExpose({ page, clamp })
</script>

<template>
  <PaginationRoot
    v-model:page="page"
    :total="30"
    :items-per-page="10"
    :clamp-page="clamp"
  />
  <span id="page">{{ page }}</span>
</template>
