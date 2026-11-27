<script setup vapor lang="ts">
import { ref } from 'vue'
import ForwardExposeWrapper from './ForwardExposeWrapper.vue'

const wrapper = ref<Record<string, unknown>>()
defineExpose({ read: (key: string) => wrapper.value?.[key] })
</script>

<template>
  <ForwardExposeWrapper ref="wrapper" />
</template>
