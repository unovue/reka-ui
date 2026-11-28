<script setup vapor lang="ts">
import { ref } from 'vue'
import ForwardExposeOuter from './ForwardExposeOuter.vue'

const wrapper = ref<Record<string, unknown>>()
defineExpose({ read: (key: string) => wrapper.value?.[key] })
</script>

<template>
  <ForwardExposeOuter ref="wrapper" />
</template>
