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
    title="Accordion/Viewport"
    :layout="{ type: 'grid', width: '50%' }"
    auto-props-disabled
  >
    <Variant title="OutsideViewport">
      <p>Scroll down to see tabs</p>
      <div :style="{ height: '150vh' }" />
      <p>
        When accordion buttons are focused and the user is navigating via
        keyboard, the page should not scroll unless the next tab is entering the
        viewport.
      </p>
      <AccordionRoot
        type="single"
        class=""
      >
        <AccordionItem
          class="accordion-item"
          value="one"
        >
          <AccordionHeader class="flex">
            <AccordionTrigger class="accordion-trigger">
              One
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent class="accordion-content">
            Per erat orci nostra luctus sociosqu mus risus penatibus, duis elit
            vulputate viverra integer ullamcorper congue curabitur sociis, nisi
            malesuada scelerisque quam suscipit habitant sed.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem
          class="accordion-item"
          value="two"
        >
          <AccordionHeader class="flex">
            <AccordionTrigger class="accordion-trigger">
              Two
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent class="accordion-content">
            Cursus sed mattis commodo fermentum conubia ipsum pulvinar sagittis,
            diam eget bibendum porta nascetur ac dictum, leo tellus dis integer
            platea ultrices mi.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem
          class="accordion-item"
          value="three"
          disabled
        >
          <AccordionHeader class="flex">
            <AccordionTrigger class="accordion-trigger">
              Three (disabled)
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent class="accordion-content">
            Sociis hac sapien turpis conubia sagittis justo dui, inceptos
            penatibus feugiat himenaeos euismod magna, nec tempor pulvinar eu
            etiam mattis.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem
          class="accordion-item"
          value="four"
        >
          <AccordionHeader class="flex">
            <AccordionTrigger class="accordion-trigger">
              Four
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent class="accordion-content">
            Odio placerat <a href="#">quisque</a> sapien sagittis non sociis
            ligula penatibus dignissim vitae, enim vulputate nullam semper
            potenti etiam volutpat libero.
            <button>Cool</button>
          </AccordionContent>
        </AccordionItem>
      </AccordionRoot>
      <div :style="{ height: '150vh' }" />
    </Variant>
  </Story>
</template>
