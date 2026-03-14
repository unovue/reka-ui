<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import { MonthRangePickerCell, MonthRangePickerCellTrigger, MonthRangePickerGrid, MonthRangePickerGridBody, MonthRangePickerGridRow, MonthRangePickerHeader, MonthRangePickerHeading, MonthRangePickerNext, MonthRangePickerPrev, MonthRangePickerRoot } from 'reka-ui'

const defaultValue = {
  start: new CalendarDate(2024, 3, 1),
  end: new CalendarDate(2024, 6, 1),
}
</script>

<template>
  <MonthRangePickerRoot
    v-slot="{ grid }"
    :default-value="defaultValue"
    class="mt-6 rounded-xl bg-white p-4 shadow-sm border"
  >
    <MonthRangePickerHeader class="flex items-center justify-between">
      <MonthRangePickerPrev
        class="inline-flex items-center cursor-pointer text-black justify-center rounded-md bg-transparent size-8 hover:bg-stone-50 active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-green10"
      >
        <Icon
          icon="radix-icons:chevron-left"
          class="size-4"
        />
      </MonthRangePickerPrev>
      <MonthRangePickerHeading class="text-sm text-black font-medium" />
      <MonthRangePickerNext
        class="inline-flex items-center cursor-pointer justify-center text-black rounded-md bg-transparent size-8 hover:bg-stone-50 active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-green10"
      >
        <Icon
          icon="radix-icons:chevron-right"
          class="size-4"
        />
      </MonthRangePickerNext>
    </MonthRangePickerHeader>
    <div class="pt-4">
      <MonthRangePickerGrid class="w-full border-collapse select-none">
        <MonthRangePickerGridBody class="grid gap-y-1">
          <MonthRangePickerGridRow
            v-for="(months, index) in grid.rows"
            :key="`month-${index}`"
            class="grid grid-cols-4 gap-x-1"
          >
            <MonthRangePickerCell
              v-for="month in months"
              :key="month.toString()"
              :date="month"
              class="relative text-center text-sm"
            >
              <MonthRangePickerCellTrigger
                :month="month"
                class="relative flex items-center justify-center whitespace-nowrap text-sm font-normal text-black size-12 rounded-lg outline-none focus:shadow-[0_0_0_2px] focus:shadow-green10 data-[disabled]:text-black/30 data-[selected]:!bg-green10 data-[selected]:text-white data-[highlighted]:bg-green5 hover:bg-green5 data-[unavailable]:pointer-events-none data-[unavailable]:text-black/30 data-[unavailable]:line-through before:absolute before:top-1 before:hidden before:rounded-full before:size-1 before:bg-white data-[today]:before:block data-[today]:before:bg-green9 data-[selection-start]:rounded-l-lg data-[selection-end]:rounded-r-lg"
              />
            </MonthRangePickerCell>
          </MonthRangePickerGridRow>
        </MonthRangePickerGridBody>
      </MonthRangePickerGrid>
    </div>
  </MonthRangePickerRoot>
</template>
