<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '..'

const items = ['One', 'Two', 'Three', 'Four']

const { Story } = defineMeta({
  title: 'Accordion/Chromatic',
})
</script>

<template>
  <Story
    name="Uncontrolled (Single closed)"
    :as-child="true"
  >
    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="single"
    >
      <AccordionItem
        v-for="item in items"
        :key="item"
        class="accordion-item"
        :value="item"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            {{ item }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="accordion-content">
          {{ item }}: Per erat orci nostra luctus sociosqu mus risus
          penatibus, duis elit vulputate viverra integer ullamcorper congue
          curabitur sociis, nisi malesuada scelerisque quam suscipit habitant
          sed.
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <Story
    name="Uncontrolled (Single open)"
    :as-child="true"
  >
    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="single"
      default-value="Two"
    >
      <AccordionItem
        v-for="item in items"
        :key="item"
        class="accordion-item"
        :value="item"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            {{ item }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="accordion-content">
          {{ item }}: Per erat orci nostra luctus sociosqu mus risus
          penatibus, duis elit vulputate viverra integer ullamcorper congue
          curabitur sociis, nisi malesuada scelerisque quam suscipit habitant
          sed.
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <Story
    name="Uncontrolled (Multiple closed)"
    :as-child="true"
  >
    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="multiple"
    >
      <AccordionItem
        v-for="item in items"
        :key="item"
        class="accordion-item"
        :value="item"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            {{ item }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="accordion-content">
          {{ item }}: Per erat orci nostra luctus sociosqu mus risus
          penatibus, duis elit vulputate viverra integer ullamcorper congue
          curabitur sociis, nisi malesuada scelerisque quam suscipit habitant
          sed.
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <Story
    name="Uncontrolled (Multiple open)"
    :as-child="true"
  >
    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="multiple"
      :default-value="['One', 'Two']"
    >
      <AccordionItem
        v-for="item in items"
        :key="item"
        class="accordion-item"
        :value="item"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            {{ item }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="accordion-content">
          {{ item }}: Per erat orci nostra luctus sociosqu mus risus
          penatibus, duis elit vulputate viverra integer ullamcorper congue
          curabitur sociis, nisi malesuada scelerisque quam suscipit habitant
          sed.
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <Story
    name="Controlled (Single open)"
    :as-child="true"
  >
    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="single"
      model-value="Three"
    >
      <AccordionItem
        v-for="item in items"
        :key="item"
        class="accordion-item"
        :value="item"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            {{ item }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="accordion-content">
          {{ item }}: Per erat orci nostra luctus sociosqu mus risus
          penatibus, duis elit vulputate viverra integer ullamcorper congue
          curabitur sociis, nisi malesuada scelerisque quam suscipit habitant
          sed.
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <Story
    name="Controlled (Multiple open)"
    :as-child="true"
  >
    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="multiple"
      :model-value="['Two', 'Three']"
    >
      <AccordionItem
        v-for="item in items"
        :key="item"
        class="accordion-item"
        :value="item"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            {{ item }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="accordion-content">
          {{ item }}: Per erat orci nostra luctus sociosqu mus risus
          penatibus, duis elit vulputate viverra integer ullamcorper congue
          curabitur sociis, nisi malesuada scelerisque quam suscipit habitant
          sed.
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <Story
    name="Disabled (whole)"
    :as-child="true"
  >
    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="single"
      disabled
    >
      <AccordionItem
        v-for="item in items"
        :key="item"
        class="accordion-item"
        :value="item"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            {{ item }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="accordion-content">
          {{ item }}: Per erat orci nostra luctus sociosqu mus risus
          penatibus, duis elit vulputate viverra integer ullamcorper congue
          curabitur sociis, nisi malesuada scelerisque quam suscipit habitant
          sed.
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <Story
    name="Disabled (item)"
    :as-child="true"
  >
    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="single"
    >
      <AccordionItem
        v-for="item in items"
        :key="item"
        class="accordion-item"
        :value="item"
        :disabled="item === 'Two'"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            {{ item }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="accordion-content">
          {{ item }}: Per erat orci nostra luctus sociosqu mus risus
          penatibus, duis elit vulputate viverra integer ullamcorper congue
          curabitur sociis, nisi malesuada scelerisque quam suscipit habitant
          sed.
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <Story
    name="Disabled (with `disabled=false` on top-level)"
    :as-child="true"
  >
    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="single"
      :disabled="false"
    >
      <AccordionItem
        v-for="item in items"
        :key="item"
        class="accordion-item"
        :value="item"
        :disabled="item === 'Two'"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            {{ item }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="accordion-content">
          {{ item }}: Per erat orci nostra luctus sociosqu mus risus
          penatibus, duis elit vulputate viverra integer ullamcorper congue
          curabitur sociis, nisi malesuada scelerisque quam suscipit habitant
          sed.
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <!-- <Story name="Force mounted contents" asChild>
    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="single"
      :disabled="false"
    >
      <AccordionItem
        v-for="item in items"
        :key="item"
        class="accordion-item"
        :value="item"
        :disabled="item === 'Two'"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            {{ item }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="accordion-content" forceMount>
          {{ item }}: Per erat orci nostra luctus sociosqu mus risus
          penatibus, duis elit vulputate viverra integer ullamcorper congue
          curabitur sociis, nisi malesuada scelerisque quam suscipit habitant
          sed.
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story> -->

  <Story
    name="State attributes (Accordion disabled)"
    :as-child="true"
  >
    <AccordionRoot
      class="w-[300px] root-attr"
      type="single"
      disabled
      default-value="Two"
    >
      <AccordionItem
        v-for="item in items"
        :key="item"
        class="item-attr"
        :value="item"
      >
        <AccordionHeader class="header-attr">
          <AccordionTrigger class="trigger-attr">
            {{ item }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="content-attr">
          {{ item }}: Per erat orci nostra luctus sociosqu mus risus
          penatibus, duis elit vulputate viverra integer ullamcorper congue
          curabitur sociis, nisi malesuada scelerisque quam suscipit habitant
          sed.
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <Story
    name="State attributes (Accordion enabled with item override)"
    :as-child="true"
  >
    <AccordionRoot
      class="w-[300px] root-attr"
      type="single"
      :disabled="false"
      default-value="Two"
    >
      <AccordionItem
        v-for="item in items"
        :key="item"
        class="item-attr"
        :value="item"
        :disabled="['Two', 'Four'].includes(item)"
      >
        <AccordionHeader class="header-attr">
          <AccordionTrigger class="trigger-attr">
            {{ item }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="content-attr">
          {{ item }}: Per erat orci nostra luctus sociosqu mus risus
          penatibus, duis elit vulputate viverra integer ullamcorper congue
          curabitur sociis, nisi malesuada scelerisque quam suscipit habitant
          sed.
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <Story
    name="State attributes (Accordion disabled with item override)"
    :as-child="true"
  >
    <AccordionRoot
      class="w-[300px] root-attr"
      type="single"
      disabled
      default-value="Two"
    >
      <AccordionItem
        v-for="item in items"
        :key="item"
        class="item-attr"
        :value="item"
        :disabled="['Two', 'Four'].includes(item) ? false : undefined"
      >
        <AccordionHeader class="header-attr">
          <AccordionTrigger class="trigger-attr">
            {{ item }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="content-attr">
          {{ item }}: Per erat orci nostra luctus sociosqu mus risus
          penatibus, duis elit vulputate viverra integer ullamcorper congue
          curabitur sociis, nisi malesuada scelerisque quam suscipit habitant
          sed.
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>
</template>
