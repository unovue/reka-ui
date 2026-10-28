<script setup>
// ColorSwatch: N instances of a typical composition (closed/default state)
import { ColorSwatch } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ColorSwatch color="#3366cc" />
  </div>
</template>
