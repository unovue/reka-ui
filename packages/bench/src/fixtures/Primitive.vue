<script setup>
// Primitive (reference row): <Primitive as="div">
import { Primitive } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <Primitive as="div">
      x
    </Primitive>
  </div>
</template>
