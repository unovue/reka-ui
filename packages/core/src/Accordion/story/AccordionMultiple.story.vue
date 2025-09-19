<script setup lang="ts">
import { ref } from 'vue'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '..'

const selectedValue = ref(['item-1', 'item-2'])
</script>

<template>
  <Story
    title="Accordion/Multiple"
    :layout="{ type: 'grid', width: '33%' }"
    auto-props-disabled
  >
    <Variant title="Uncontrolled">
      <AccordionRoot
        class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
        type="multiple"
      >
        <AccordionItem
          class="accordion-item"
          value="item-1"
        >
          <AccordionHeader class="flex">
            <AccordionTrigger class="accordion-trigger">
              Is it accessible?
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent class="accordion-content">
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          class="accordion-item"
          value="item-2"
        >
          <AccordionHeader class="flex">
            <AccordionTrigger class="accordion-trigger">
              Is it unstyled?
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent class="accordion-content">
            Yes. It's unstyled by default, giving you freedom over the look and
            feel.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          class="accordion-item"
          value="item-3"
        >
          <AccordionHeader class="flex">
            <AccordionTrigger class="accordion-trigger">
              Can it be animated?
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent class="accordion-content">
            Yes! You can use the transition prop to configure the animation.
          </AccordionContent>
        </AccordionItem>
      </AccordionRoot>
    </Variant>

    <Variant title="Controlled">
      <template #controls>
        modelValue: <input
          v-model="selectedValue"
          type="text"
        >
      </template>

      <AccordionRoot
        v-model="selectedValue"
        class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
        type="multiple"
      >
        <AccordionItem
          class="accordion-item"
          value="item-1"
        >
          <AccordionHeader class="flex">
            <AccordionTrigger class="accordion-trigger">
              Is it accessible?
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent class="accordion-content">
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          class="accordion-item"
          value="item-2"
        >
          <AccordionHeader class="flex">
            <AccordionTrigger class="accordion-trigger">
              Is it unstyled?
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent class="accordion-content">
            Yes. It's unstyled by default, giving you freedom over the look and
            feel.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          class="accordion-item"
          value="item-3"
        >
          <AccordionHeader class="flex">
            <AccordionTrigger class="accordion-trigger">
              Can it be animated?
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent class="accordion-content">
            Yes! You can use the transition prop to configure the animation.
          </AccordionContent>
        </AccordionItem>
      </AccordionRoot>
    </Variant>
  </Story>
</template>
