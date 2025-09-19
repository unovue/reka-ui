<script setup lang="ts">
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '..'
</script>

<template>
  <Story
    title="Accordion/Horizontal"
    :layout="{ type: 'grid', width: '33%' }"
    auto-props-disabled
  >
    <Variant title="Horizontal Orientation">
      <AccordionRoot
        class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
        type="single"
        orientation="horizontal"
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
            Odio placerat <a href="#">quisque</a> sapien sagittis non sociis
            ligula penatibus dignissim vitae, enim vulputate nullam semper
            potenti etiam volutpat libero.
            <button>Cool</button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          class="accordion-item"
          value="item-3"
          disabled
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
