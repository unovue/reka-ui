<script setup lang="ts">
import { Label } from '@/Label'
import { TimeFieldInput, TimeFieldRoot } from '..'
</script>

<template>
  <Story
    title="Time Field/Invalid"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Default">
      <div class="flex flex-col gap-2">
        <Label
          class="text-sm text-gray9"
          for="time-field"
        >
          Appointment
        </Label>
        <TimeFieldRoot
          id="time-field"
          v-slot="{ segments, isInvalid }"
          granularity="second"
          class="flex select-none bg-white items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500 data-[invalid]:outline data-[invalid]:outline-red-500"
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

          <span
            v-if="isInvalid"
            class="text-red-500"
          >Invalid</span>
        </TimeFieldRoot>
      </div>
    </Variant>
  </Story>
</template>
