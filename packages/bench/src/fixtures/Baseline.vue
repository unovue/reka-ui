<script setup>
// Baseline (reference row): a plain <div>, no component
defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <div>x</div>
  </div>
</template>
