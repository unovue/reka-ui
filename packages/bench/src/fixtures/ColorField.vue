<script setup>
// ColorField: N instances of a typical composition (closed/default state)
import { ColorFieldInput, ColorFieldRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ColorFieldRoot default-value="#3366cc">
      <ColorFieldInput />
    </ColorFieldRoot>
  </div>
</template>
