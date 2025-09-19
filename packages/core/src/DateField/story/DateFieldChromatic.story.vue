<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { CalendarDate } from '@internationalized/date'
import { ref } from 'vue'
import { DateFieldInput, DateFieldRoot } from '..'

const modelValue = ref<DateValue>()
const defaultValue = new CalendarDate(2024, 2, 28)
const minValue = new CalendarDate(2024, 2, 24)
const maxValue = new CalendarDate(2024, 2, 29)
</script>

<template>
  <Story
    title="Date Field/Chromatic"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Empty default">
      <DateFieldRoot
        v-slot="{ segments }"
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
    </Variant>

    <Variant title="With default">
      <DateFieldRoot
        v-slot="{ segments }"
        :default-value="defaultValue"
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
    </Variant>

    <Variant title="Uncontrolled">
      <DateFieldRoot
        v-slot="{ segments }"
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
    </Variant>

    <Variant title="Controlled">
      <DateFieldRoot
        v-slot="{ segments }"
        v-model="modelValue"
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
    </Variant>

    <Variant title="Min date">
      <DateFieldRoot
        v-slot="{ segments }"
        :default-value="defaultValue"
        :min-value="minValue"
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
    </Variant>

    <Variant title="Max date">
      <DateFieldRoot
        v-slot="{ segments }"
        :default-value="defaultValue"
        :max-value="maxValue"
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
    </Variant>

    <Variant title="Disabled">
      <DateFieldRoot
        v-slot="{ segments }"
        :default-value="defaultValue"
        :disabled="true"
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
    </Variant>

    <Variant title="Locale awareness">
      <DateFieldRoot
        v-slot="{ segments }"
        locale="de"
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
    </Variant>
  </Story>
</template>
