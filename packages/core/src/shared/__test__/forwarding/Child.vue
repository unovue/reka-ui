<script setup lang="ts">
const emit = defineEmits<{ 'select': [v: number], 'highlight': [v: number], 'update:modelValue': [v: number] }>()
defineExpose({ emit })
</script>

<template>
  <div />
</template>
