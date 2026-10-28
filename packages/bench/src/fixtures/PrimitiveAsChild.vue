<script setup>
// PrimitiveAsChild (reference row): <Primitive as-child> around a <div>
import { Primitive } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <Primitive as-child>
      <div>x</div>
    </Primitive>
  </div>
</template>
