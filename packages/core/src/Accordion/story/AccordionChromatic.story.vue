<script setup lang="ts">
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '..'

const items = ['One', 'Two', 'Three', 'Four']
</script>

<template>
  <Story
    title="Accordion/Chromatic"
    :layout="{ type: 'grid', width: '50%' }"
    auto-props-disabled
  >
    <Variant title="Uncontrolled (Single closed)">
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
    </Variant>

    <Variant title="Uncontrolled (Single open)">
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
    </Variant>

    <Variant title="Uncontrolled (Multiple closed)">
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
    </Variant>

    <Variant title="Uncontrolled (Multiple open)">
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
    </Variant>

    <Variant title="Controlled (Single open)">
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
    </Variant>

    <Variant title="Controlled (Multiple open)">
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
    </Variant>

    <Variant title="Disabled (whole)">
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
    </Variant>

    <Variant title="Disabled (item)">
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
    </Variant>

    <Variant title="Disabled (with `disabled=false` on top-level)">
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
    </Variant>

    <!-- <Variant title="Force mounted contents">
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
    </Variant> -->

    <Variant title="State attributes (Accordion disabled)">
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
    </Variant>

    <Variant title="State attributes (Accordion enabled with item override)">
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
    </Variant>

    <Variant title="State attributes (Accordion disabled with item override)">
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
    </Variant>
  </Story>
</template>

<style scoped>
.root-attr,
.item-attr,
.header-attr,
.trigger-attr,
.content-attr {
  background-color: rgba(0, 0, 255, 0.3);
  border: 2px solid blue;
  padding: 10px;

  &[data-state="closed"] {
    border-color: red;
  }
  &[data-state="open"] {
    border-color: green;
  }
  &[data-disabled] {
    border-style: dashed;
  }
  &:disabled {
    opacity: 0.5;
  }
}

.content-attr {
  display: block;
}
</style>
