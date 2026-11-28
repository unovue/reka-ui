<script setup vapor lang="ts">
import { AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '#reka'
</script>

<template>
  <AccordionRoot type="single">
    <AccordionItem
      value="a"
      disabled
    >
      <AccordionHeader>
        <AccordionTrigger as-child>
          <span id="disabled-trigger">A</span>
        </AccordionTrigger>
      </AccordionHeader>
    </AccordionItem>
  </AccordionRoot>
</template>
