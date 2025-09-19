<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui'

const accordionItems = [
  {
    value: 'item-1',
    title: 'Is it accessible?',
    content: 'Yes. It adheres to the WAI-ARIA design pattern.',
  },
  {
    value: 'item-2',
    title: 'Is it unstyled?',
    content: 'Yes. It\'s unstyled by default, giving you freedom over the look and feel.',
  },
  {
    value: 'item-3',
    title: 'Can it be animated?',
    content: 'Yes! You can use the transition prop to configure the animation.',
  },
]
</script>

<template>
  <AccordionRoot
    class="bg-mauve6 w-[300px] rounded-lg shadow-[0_2px_10px] shadow-black/5 border"
    default-value="item-1"
    type="single"
    :collapsible="true"
  >
    <template
      v-for="item in accordionItems"
      :key="item.value"
    >
      <AccordionItem
        class="focus-within:shadow-mauve12 mt-px overflow-hidden first:mt-0 first:rounded-t-[7px] last:rounded-b-[7px] focus-within:relative focus-within:z-10 focus-within:shadow-[0_0_0_2px]"
        :value="item.value"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="text-grass11 shadow-mauve6 hover:bg-mauve2 flex h-[45px] flex-1 cursor-default items-center justify-between bg-white px-5 text-sm leading-none shadow-[0_1px_0] outline-none group">
            <span>{{ item.title }}</span>
            <Icon
              icon="radix-icons:chevron-down"
              class="text-green10 ease-[cubic-bezier(0.87,_0,_0.13,_1)] transition-transform duration-300 group-data-[state=open]:rotate-180"
              aria-label="Expand/Collapse"
            />
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="text-mauve11 bg-mauve2 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden text-sm">
          <div class="px-5 py-4">
            {{ item.content }}
          </div>
        </AccordionContent>
      </AccordionItem>
    </template>
  </AccordionRoot>
</template>
