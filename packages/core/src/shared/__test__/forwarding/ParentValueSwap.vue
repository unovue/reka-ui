<script setup lang="ts">
import Wrapper from './Wrapper.vue'

defineProps<{ enabled: boolean, pick: (v: number) => void }>()
</script>

<template>
  <Wrapper
    label="x"
    v-bind="{ onSelect: enabled ? pick : undefined }"
  >
    slot text
  </Wrapper>
</template>
