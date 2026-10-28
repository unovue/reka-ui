<script setup>
// Switch: N instances of a typical composition (closed/default state)
import { SwitchRoot, SwitchThumb } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <SwitchRoot><SwitchThumb /></SwitchRoot>
  </div>
</template>
