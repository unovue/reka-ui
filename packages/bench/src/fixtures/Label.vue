<script setup>
// Label: N instances of a typical composition (closed/default state)
import { Label } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <Label for="x">Name</Label>
  </div>
</template>
