<script setup lang="ts">
import type {
  AccordionRootEmits,
  AccordionRootProps,
} from '..'
import { ref } from 'vue'
import { useEmitAsProps } from '@/shared'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '..'

withDefaults(defineProps<{ type?: AccordionRootProps['type'] }>(), { type: 'single' })
const emits = defineEmits<AccordionRootEmits>()
const values = ['One', 'Two', 'Three', 'Four']
const count = ref(1)
</script>

<template>
  <AccordionRoot
    class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
    v-bind="useEmitAsProps(emits)"
    :type="type"
  >
    <AccordionItem
      v-for="value in values"
      :key="value"
      class="accordion-item"
      :value="value"
    >
      <AccordionHeader class="flex">
        <AccordionTrigger class="accordion-trigger">
          {{ value }}
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent
        v-for="i in count"
        :key="i"
        class="accordion-animated-content data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp"
      >
        <div class="px-5 py-4">
          Content {{ value }}
        </div>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
