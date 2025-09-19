<script setup lang="ts">
import { DateRangeFieldInput, DateRangeFieldRoot, Label } from 'reka-ui'
</script>

<template>
  <div class="flex flex-col gap-2">
    <Label
      for="booking"
      class="text-stone-700 dark:text-white"
    >
      Booking
    </Label>

    <DateRangeFieldRoot
      id="booking"
      v-slot="{ segments }"
      :is-date-unavailable="date => date.day === 19"

      class="flex select-none bg-white items-center rounded-lg text-center text-green10 border shadow-sm p-1 data-[invalid]:border-red-500"
    >
      <template
        v-for="item in segments.start"
        :key="item.part"
      >
        <DateRangeFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          type="start"
        >
          {{ item.value }}
        </DateRangeFieldInput>
        <DateRangeFieldInput
          v-else
          :part="item.part"
          class="rounded p-0.5  focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
          type="start"
        >
          {{ item.value }}
        </DateRangeFieldInput>
      </template>
      <span class="mx-2">

        -
      </span>
      <template
        v-for="item in segments.end"
        :key="item.part"
      >
        <DateRangeFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          type="end"
        >
          {{ item.value }}
        </DateRangeFieldInput>
        <DateRangeFieldInput
          v-else
          :part="item.part"
          class="rounded p-0.5  focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
          type="end"
        >
          {{ item.value }}
        </DateRangeFieldInput>
      </template>
    </DateRangeFieldRoot>
  </div>
</template>
