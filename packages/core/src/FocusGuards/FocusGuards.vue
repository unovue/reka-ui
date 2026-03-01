<script lang="ts">
export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { useFocusGuards } from '@/shared'

useFocusGuards()
</script>

<template>
  <slot />
</template>
