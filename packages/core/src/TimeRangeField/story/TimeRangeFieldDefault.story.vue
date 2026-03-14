<script setup lang="ts">
import { TimeRangeFieldInput, TimeRangeFieldRoot } from '..'
</script>

<template>
  <Story title="Time Range Field/Default">
    <Variant title="default">
      <TimeRangeFieldRoot
        id="time-field"
        v-slot="{ segments }"
        class="flex select-none bg-white items-center rounded-lg text-center text-green10 placeholder:text-mauve5 border border-gray9 p-1 data-[invalid]:border-red-500"
      >
        <template
          v-for="(item, index) in segments.start"
          :key="`${item.part}-${index}`"
        >
          <TimeRangeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
            type="start"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
          <TimeRangeFieldInput
            v-else
            :part="item.part"
            class="rounded-5px px-1 py-1 hover:bg-grass4 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
            type="start"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
        </template>
        -
        <template
          v-for="(item, index) in segments.end"
          :key="`${item.part}-${index}`"
        >
          <TimeRangeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
            type="end"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
          <TimeRangeFieldInput
            v-else
            :part="item.part"
            class="rounded-5px px-1 py-1 hover:bg-grass4 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
            type="end"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
        </template>
      </TimeRangeFieldRoot>
    </Variant>
  </Story>
</template>
