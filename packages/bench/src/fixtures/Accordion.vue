<script setup>
// Accordion: N instances of a typical composition (closed/default state)
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <AccordionRoot
      type="single"
      collapsible
    >
      <AccordionItem
        v-for="k in 3"
        :key="k"
        :value="`item-${k}`"
      >
        <AccordionHeader><AccordionTrigger>Section {{ k }}</AccordionTrigger></AccordionHeader>
        <AccordionContent>Body {{ k }}</AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </div>
</template>
