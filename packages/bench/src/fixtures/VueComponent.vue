<script setup>
// VueComponent (reference row): an empty Vue component rendering a <div>
import { defineComponent, h } from 'vue'

defineProps({ n: { type: Number, default: 100 } })
const Plain = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <Plain>x</Plain>
  </div>
</template>
