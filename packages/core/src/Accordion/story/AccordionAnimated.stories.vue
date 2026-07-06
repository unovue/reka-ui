<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import { ref, watch } from 'vue'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '..'

const values = ['One', 'Two', 'Three', 'Four']
const count = ref(1)
const hasDynamicContent = ref(false)
const timer = ref(0)

watch(hasDynamicContent, () => {
  if (hasDynamicContent.value) {
    timer.value = window.setInterval(() => {
      const nextCount = count.value < 5 ? count.value + 1 : count.value
      if (nextCount === 5)
        hasDynamicContent.value = false
      count.value = nextCount
    }, 3000)
  }
  else {
    clearInterval(timer.value)
  }
})

const selectedValue = ref(['One', 'Two', 'Three', 'Four'])

const { Story } = defineMeta({
  title: 'Accordion/Animated',
})
</script>

<template>
  <Story
    name="Closed by default"
    as-child
  >
    <div class="mb-4 text-sm text-white">
      modelValue: <input
        v-model="hasDynamicContent"
        type="checkbox"
      >
    </div>

    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="single"
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
            Per erat orci nostra luctus sociosqu mus risus penatibus, duis
            elit vulputate viverra integer ullamcorper congue curabitur
            sociis, nisi malesuada scelerisque quam suscipit habitant sed.
          </div>
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <Story
    name="Open by default"
    as-child
  >
    <div class="mb-4 text-sm text-white">
      modelValue: <input
        v-model="hasDynamicContent"
        type="checkbox"
      >
    </div>

    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="single"
      default-value="One"
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
            Per erat orci nostra luctus sociosqu mus risus penatibus, duis
            elit vulputate viverra integer ullamcorper congue curabitur
            sociis, nisi malesuada scelerisque quam suscipit habitant sed.
          </div>
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <Story
    name="Animated 2D"
    as-child
  >
    <AccordionRoot
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="single"
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
          class="accordion-animated-content overflow-hidden data-[state=open]:animate-open2D data-[state=closed]:animate-close2D"
        >
          <div class="px-5 py-4 overflow-hidden">
            <div :style="{ width: 'calc(20em - 20px)', height: 100 }">
              Per erat orci nostra luctus sociosqu mus risus penatibus, duis
              elit vulputate viverra integer ullamcorper congue curabitur
              sociis, nisi malesuada scelerisque quam suscipit habitant sed.
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>

  <Story
    name="Animated Controlled"
    as-child
  >
    <AccordionRoot
      v-model="selectedValue"
      class="w-[300px] rounded-md bg-[--line-color] shadow-lg"
      type="multiple"
    >
      <AccordionItem
        class="accordion-item"
        value="One"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            one
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent
          class="accordion-animated-content data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp"
        >
          <div class="px-5 py-4">
            Yes. It adheres to the WAI-ARIA design pattern.
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        class="accordion-item"
        value="Two"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            Two
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent
          class="accordion-animated-content data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp"
        >
          <div class="px-5 py-4">
            Yes. It's unstyled by default, giving you freedom over the look
            and feel.
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        class="accordion-item"
        value="Three"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            Three
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent
          class="accordion-animated-content data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp"
        >
          <div class="px-5 py-4">
            Yes! You can use the transition prop to configure the animation.
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        class="accordion-item"
        value="Four"
      >
        <AccordionHeader class="flex">
          <AccordionTrigger class="accordion-trigger">
            Four
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent
          class="accordion-animated-content data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp"
        >
          <div class="px-5 py-4">
            Yes! You can use the transition prop to configure the animation.
          </div>
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </Story>
</template>
