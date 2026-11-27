<script setup vapor lang="ts">
import { useForwardExpose } from '#reka'
import ForwardExposeCounter from './ForwardExposeCounter.vue'

const { forwardRef } = useForwardExpose()
</script>

<template>
  <ForwardExposeCounter :ref="forwardRef" />
</template>
