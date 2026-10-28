<script setup>
// Collapsible: N instances of a typical composition (closed/default state)
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <CollapsibleRoot><CollapsibleTrigger>Toggle</CollapsibleTrigger><CollapsibleContent>Hidden body</CollapsibleContent></CollapsibleRoot>
  </div>
</template>
