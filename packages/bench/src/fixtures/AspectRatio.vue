<script setup>
// AspectRatio: N instances of a typical composition (closed/default state)
import { AspectRatio } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <AspectRatio :ratio="16 / 9">
      <span>media</span>
    </AspectRatio>
  </div>
</template>
