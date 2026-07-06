<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import { DateFieldInput, DateFieldRoot } from '..'

const { Story } = defineMeta({
  title: 'Date Field/Locales',
})
</script>

<template>
  <Story
    name="Gregorian"
    as-child
  >
    <DateFieldRoot
      v-slot="{ segments }"
      granularity="second"
      class="flex select-none bg-white items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500"
    >
      <template
        v-for="item in segments"
        :key="item.part"
      >
        <DateFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
        >
          {{ item.value }}
        </DateFieldInput>
        <DateFieldInput
          v-else
          :part="item.part"
          class="rounded-5px px-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholderdata-[placeholder]:text-green9"
        >
          {{ item.value }}
        </DateFieldInput>
      </template>
    </DateFieldRoot>
  </Story>

  <Story
    name="Japanese"
    as-child
  >
    <DateFieldRoot
      v-slot="{ segments }"
      granularity="second"
      locale="ja"
      class="flex select-none bg-white items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500"
    >
      <template
        v-for="item in segments"
        :key="item.part"
      >
        <DateFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
        >
          {{ item.value }}
        </DateFieldInput>
        <DateFieldInput
          v-else
          :part="item.part"
          class="rounded-5px px-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
        >
          {{ item.value }}
        </DateFieldInput>
      </template>
    </DateFieldRoot>
  </Story>

  <Story
    name="Persian"
    as-child
  >
    <DateFieldRoot
      v-slot="{ segments }"
      granularity="second"
      locale="fa-IR"
      class="flex select-none bg-white items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500"
    >
      <template
        v-for="item in segments"
        :key="item.part"
      >
        <DateFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
        >
          {{ item.value }}
        </DateFieldInput>
        <DateFieldInput
          v-else
          :part="item.part"
          class="rounded-5px px-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
        >
          {{ item.value }}
        </DateFieldInput>
      </template>
    </DateFieldRoot>
  </Story>

  <Story
    name="Taiwan"
    as-child
  >
    <DateFieldRoot
      v-slot="{ segments }"
      granularity="second"
      locale="zh-TW"
      class="flex select-none bg-white items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500"
    >
      <template
        v-for="item in segments"
        :key="item.part"
      >
        <DateFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
        >
          {{ item.value }}
        </DateFieldInput>
        <DateFieldInput
          v-else
          :part="item.part"
          class="rounded-5px px-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
        >
          {{ item.value }}
        </DateFieldInput>
      </template>
    </DateFieldRoot>
  </Story>

  <Story
    name="Hebrew"
    as-child
  >
    <DateFieldRoot
      v-slot="{ segments }"
      granularity="second"
      locale="he"
      class="flex select-none bg-white items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500"
    >
      <template
        v-for="item in segments"
        :key="item.part"
      >
        <DateFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
        >
          {{ item.value }}
        </DateFieldInput>
        <DateFieldInput
          v-else
          :part="item.part"
          class="rounded-5px px-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
        >
          {{ item.value }}
        </DateFieldInput>
      </template>
    </DateFieldRoot>
  </Story>

  <Story
    name="Buddhist"
    as-child
  >
    <DateFieldRoot
      v-slot="{ segments }"
      granularity="second"
      locale="th"
      class="flex select-none bg-white items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500"
    >
      <template
        v-for="item in segments"
        :key="item.part"
      >
        <DateFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
        >
          {{ item.value }}
        </DateFieldInput>
        <DateFieldInput
          v-else
          :part="item.part"
          class="rounded-5px px-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
        >
          {{ item.value }}
        </DateFieldInput>
      </template>
    </DateFieldRoot>
  </Story>
</template>
