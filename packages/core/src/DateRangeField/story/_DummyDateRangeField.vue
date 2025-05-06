<script setup lang="ts">
import type { DateRangeFieldRootEmits, DateRangeFieldRootProps } from '..'
import { useForwardPropsEmits } from '@/shared'
import { DateRangeFieldInput, DateRangeFieldRoot } from '..'

const props = defineProps<DateRangeFieldRootProps>()
const emits = defineEmits<DateRangeFieldRootEmits>()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DateRangeFieldRoot
    v-slot="{ segments }"
    v-bind="forwarded"
    class="flex select-none bg-white items-center rounded-lg text-center text-green10 placeholder:text-mauve5 border border-gray9 p-1 data-[invalid]:border-red-500"
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
        class="rounded-5px p-1 hover:bg-grass4 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
        type="start"
      >
        {{ item.value }}
      </DateRangeFieldInput>
    </template>
    -
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
        class="rounded-5px p-1 hover:bg-grass4 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
        type="end"
      >
        {{ item.value }}
      </DateRangeFieldInput>
    </template>
  </DateRangeFieldRoot>
</template>
