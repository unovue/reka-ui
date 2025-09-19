<script setup lang="ts">
import { TimeFieldInput, TimeFieldRoot } from '..'
</script>

<template>
  <Story
    title="Time Field/Locales"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Gregorian">
      <TimeFieldRoot
        v-slot="{ segments }"
        granularity="second"
        class="flex select-none bg-white items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500"
      >
        <template
          v-for="item in segments"
          :key="item.part"
        >
          <TimeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
          >
            {{ item.value }}
          </TimeFieldInput>
          <TimeFieldInput
            v-else
            :part="item.part"
            class="rounded-5px px-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholderdata-[placeholder]:text-green9"
          >
            {{ item.value }}
          </TimeFieldInput>
        </template>
      </TimeFieldRoot>
    </Variant>

    <Variant title="Japanese">
      <TimeFieldRoot
        v-slot="{ segments }"
        granularity="second"
        locale="ja"
        class="flex select-none bg-white items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500"
      >
        <template
          v-for="item in segments"
          :key="item.part"
        >
          <TimeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
          >
            {{ item.value }}
          </TimeFieldInput>
          <TimeFieldInput
            v-else
            :part="item.part"
            class="rounded-5px px-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
          >
            {{ item.value }}
          </TimeFieldInput>
        </template>
      </TimeFieldRoot>
    </Variant>

    <Variant title="Persian">
      <TimeFieldRoot
        v-slot="{ segments }"
        granularity="second"
        locale="fa-IR"
        class="flex select-none bg-white items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500"
      >
        <template
          v-for="item in segments"
          :key="item.part"
        >
          <TimeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
          >
            {{ item.value }}
          </TimeFieldInput>
          <TimeFieldInput
            v-else
            :part="item.part"
            class="rounded-5px px-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
          >
            {{ item.value }}
          </TimeFieldInput>
        </template>
      </TimeFieldRoot>
    </Variant>

    <Variant title="Taiwan">
      <TimeFieldRoot
        v-slot="{ segments }"
        granularity="second"
        locale="zh-TW"
        class="flex select-none bg-white items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500"
      >
        <template
          v-for="item in segments"
          :key="item.part"
        >
          <TimeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
          >
            {{ item.value }}
          </TimeFieldInput>
          <TimeFieldInput
            v-else
            :part="item.part"
            class="rounded-5px px-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
          >
            {{ item.value }}
          </TimeFieldInput>
        </template>
      </TimeFieldRoot>
    </Variant>

    <Variant title="Hebrew">
      <TimeFieldRoot
        v-slot="{ segments }"
        granularity="second"
        locale="he"
        class="flex select-none bg-white items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500"
      >
        <template
          v-for="item in segments"
          :key="item.part"
        >
          <TimeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
          >
            {{ item.value }}
          </TimeFieldInput>
          <TimeFieldInput
            v-else
            :part="item.part"
            class="rounded-5px px-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
          >
            {{ item.value }}
          </TimeFieldInput>
        </template>
      </TimeFieldRoot>
    </Variant>

    <Variant title="Buddhist">
      <TimeFieldRoot
        v-slot="{ segments }"
        granularity="second"
        locale="th"
        class="flex select-none bg-white items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500"
      >
        <template
          v-for="item in segments"
          :key="item.part"
        >
          <TimeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
          >
            {{ item.value }}
          </TimeFieldInput>
          <TimeFieldInput
            v-else
            :part="item.part"
            class="rounded-5px px-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
          >
            {{ item.value }}
          </TimeFieldInput>
        </template>
      </TimeFieldRoot>
    </Variant>
  </Story>
</template>
