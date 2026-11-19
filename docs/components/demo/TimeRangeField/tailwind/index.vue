<script setup lang="ts">
import { Label, TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
</script>

<template>
  <div class="flex flex-col gap-2">
    <Label
      for="booking"
      class="text-stone-700 dark:text-white"
    >
      Booking
    </Label>

    <TimeRangeFieldRoot
      id="booking"
      v-slot="{ segments }"
      class="flex select-none bg-white items-center rounded-lg text-center text-green10 border shadow-sm p-1 data-[invalid]:border-red-500"
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
          class="rounded p-0.5  focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
          type="start"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
      </template>
      <span class="mx-2">

        -
      </span>
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
          class="rounded p-0.5  focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
          type="end"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
      </template>
    </TimeRangeFieldRoot>
  </div>
</template>
