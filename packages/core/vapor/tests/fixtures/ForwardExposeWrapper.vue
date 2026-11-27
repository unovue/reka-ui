<script setup vapor lang="ts">
import { useForwardExpose } from '#reka'
import ForwardExposeChild from './ForwardExposeChild.vue'

// Its own exposed `label` and `toString`, and a forwarded child that exposes a `label` too
defineExpose({ label: 'own', ownOnly: 'own-only', toString: () => 'own-to-string' })
const { forwardRef } = useForwardExpose()
</script>

<template>
  <ForwardExposeChild :ref="forwardRef" />
</template>
