<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import { MonthPickerCell, MonthPickerCellTrigger, MonthPickerGrid, MonthPickerGridBody, MonthPickerGridRow, MonthPickerHeader, MonthPickerHeading, MonthPickerNext, MonthPickerPrev, MonthPickerRoot } from 'reka-ui'

const date = new CalendarDate(2024, 10, 1)
</script>

<template>
  <MonthPickerRoot
    v-slot="{ grid }"
    :default-value="date"
    class="mt-6 rounded-xl bg-white p-4 shadow-sm border"
  >
    <MonthPickerHeader class="flex items-center justify-between">
      <MonthPickerPrev
        class="inline-flex items-center cursor-pointer text-black justify-center rounded-md bg-transparent size-8 hover:bg-stone-50 active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-green10"
      >
        <Icon
          icon="radix-icons:chevron-left"
          class="size-4"
        />
      </MonthPickerPrev>
      <MonthPickerHeading class="text-sm text-black font-medium" />
      <MonthPickerNext
        class="inline-flex items-center cursor-pointer justify-center text-black rounded-md bg-transparent size-8 hover:bg-stone-50 active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-green10"
      >
        <Icon
          icon="radix-icons:chevron-right"
          class="size-4"
        />
      </MonthPickerNext>
    </MonthPickerHeader>
    <div class="pt-4">
      <MonthPickerGrid class="w-full border-collapse select-none">
        <MonthPickerGridBody class="grid gap-y-1">
          <MonthPickerGridRow
            v-for="(months, index) in grid.rows"
            :key="`month-${index}`"
            class="grid grid-cols-4 gap-x-1"
          >
            <MonthPickerCell
              v-for="month in months"
              :key="month.toString()"
              :date="month"
              class="relative text-center text-sm"
            >
              <MonthPickerCellTrigger
                :month="month"
                class="relative flex items-center justify-center whitespace-nowrap text-sm font-normal text-black size-12 rounded-lg outline-none focus:shadow-[0_0_0_2px] focus:shadow-green10 data-[disabled]:text-black/30 data-[selected]:!bg-green10 data-[selected]:text-white hover:bg-green5 data-[unavailable]:pointer-events-none data-[unavailable]:text-black/30 data-[unavailable]:line-through before:absolute before:top-1 before:hidden before:rounded-full before:size-1 before:bg-white data-[today]:before:block data-[today]:before:bg-green9"
              />
            </MonthPickerCell>
          </MonthPickerGridRow>
        </MonthPickerGridBody>
      </MonthPickerGrid>
    </div>
  </MonthPickerRoot>
</template>
