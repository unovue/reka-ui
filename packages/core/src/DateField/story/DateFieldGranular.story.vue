<script setup lang="ts">
import { Label } from '@/Label'
import { DateFieldInput, DateFieldRoot } from '..'
</script>

<template>
  <Story
    title="Date Field/Granular"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Granular (second)">
      <div class="flex flex-col gap-2">
        <Label
          class="text-sm text-gray9"
          for="date-field"
        >Birthday</Label>
        <DateFieldRoot
          id="date-field"
          v-slot="{ segments }"
          :is-date-unavailable="date => date.day === 19"
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
              class="rounded-5px px-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
            >
              {{ item.value }}
            </DateFieldInput>
          </template>
        </DateFieldRoot>
      </div>
    </Variant>

    <Variant title="Granular (minute)">
      <div class="flex flex-col gap-2">
        <Label
          class="text-sm text-gray9"
          for="date-field"
        >Birthday</Label>
        <DateFieldRoot
          id="date-field"
          v-slot="{ segments }"
          :is-date-unavailable="date => date.day === 19"
          granularity="minute"
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
      </div>
    </Variant>

    <Variant title="Granular (hour)">
      <div class="flex flex-col gap-2">
        <Label
          class="text-sm text-gray9"
          for="date-field"
        >Birthday</Label>
        <DateFieldRoot
          id="date-field"
          v-slot="{ segments }"
          :is-date-unavailable="date => date.day === 19"
          granularity="hour"
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
      </div>
    </Variant>

    <Variant title="Granular (day)">
      <div class="flex flex-col gap-2">
        <Label
          class="text-sm text-gray9"
          for="date-field"
        >Birthday</Label>
        <DateFieldRoot
          id="date-field"
          v-slot="{ segments }"
          :is-date-unavailable="date => date.day === 19"
          granularity="day"
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
      </div>
    </Variant>
  </Story>
</template>
