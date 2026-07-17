<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import { ref } from 'vue'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '..'

const selectedValue = ref('item-2')

const { Story } = defineMeta({
  title: 'Accordion/Single',
})
</script>

<template>
  <Story
    name="Uncontrolled"
    as-child
  >
    <AccordionRoot
      type="single"
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
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
  </Story>

  <Story
    name="Controlled"
    as-child
  >
    <div class="mb-4 text-sm text-white">
      modelValue: <input
        v-model="selectedValue"
        type="text"
        class="text-black"
      >
    </div>

    <AccordionRoot
      v-model="selectedValue"
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
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
  </Story>

  <Story
    name="Collapsible"
    as-child
  >
    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="single"
      :collapsible="true"
      default-value="item-2"
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
  </Story>
</template>
