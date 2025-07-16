<script setup lang="ts">
import { Time } from '@internationalized/date'
import { ref } from 'vue'
import { TimeFieldInput, TimeFieldRoot } from '..'

const modelValue = ref<Time>()
const defaultValue = new Time(10, 0, 0)
const minValue = new Time(9)
const maxValue = new Time(18)
</script>

<template>
  <Story
    title="Time Field/Chromatic"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Empty default">
      <TimeFieldRoot
        v-slot="{ segments }"
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

    <Variant title="With default">
      <TimeFieldRoot
        v-slot="{ segments }"
        :default-value="defaultValue"
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

    <Variant title="Uncontrolled">
      <TimeFieldRoot
        v-slot="{ segments }"
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

    <Variant title="Controlled">
      <TimeFieldRoot
        v-slot="{ segments }"
        v-model="modelValue"
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

    <Variant title="Min value">
      <TimeFieldRoot
        v-slot="{ segments }"
        :min-value="minValue"
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

    <Variant title="Max value">
      <TimeFieldRoot
        v-slot="{ segments }"
        :max-value="maxValue"
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

    <Variant title="Disabled">
      <TimeFieldRoot
        v-slot="{ segments }"
        :disabled="true"
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

    <Variant title="Locale awareness">
      <TimeFieldRoot
        v-slot="{ segments }"
        locale="de"
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
