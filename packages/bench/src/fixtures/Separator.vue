<script setup>
// Separator: N instances of a typical composition (closed/default state)
import { Separator } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <Separator />
  </div>
</template>
