<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridRow, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot } from 'reka-ui'

const defaultValue = {
  start: new CalendarDate(2020, 1, 1),
  end: new CalendarDate(2024, 1, 1),
}
</script>

<template>
  <RangeCalendarRoot
    v-slot="{ grid }"
    granularity="year"
    :default-value="defaultValue"
    class="mt-6 rounded-xl bg-white p-4 shadow-sm border"
  >
    <RangeCalendarHeader class="flex items-center justify-between">
      <RangeCalendarPrev
        class="inline-flex items-center cursor-pointer text-black justify-center rounded-md bg-transparent size-8 hover:bg-stone-50 active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-green10"
      >
        <Icon
          icon="radix-icons:chevron-left"
          class="size-4"
        />
      </RangeCalendarPrev>
      <RangeCalendarHeading class="text-sm text-black font-medium" />
      <RangeCalendarNext
        class="inline-flex items-center cursor-pointer justify-center text-black rounded-md bg-transparent size-8 hover:bg-stone-50 active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-green10"
      >
        <Icon
          icon="radix-icons:chevron-right"
          class="size-4"
        />
      </RangeCalendarNext>
    </RangeCalendarHeader>
    <div class="pt-4">
      <RangeCalendarGrid
        v-for="page in grid"
        :key="page.value.toString()"
        :value="page.value"
        class="w-full border-collapse select-none"
      >
        <RangeCalendarGridBody class="grid gap-y-1">
          <RangeCalendarGridRow
            v-for="(years, index) in page.rows"
            :key="`year-${index}`"
            class="grid grid-cols-4 gap-x-1"
          >
            <RangeCalendarCell
              v-for="year in years"
              :key="year.toString()"
              :value="year"
              class="relative text-center text-sm"
            >
              <RangeCalendarCellTrigger
                :value="year"
                class="relative flex items-center justify-center whitespace-nowrap text-sm font-normal text-black size-12 rounded-lg outline-none focus:shadow-[0_0_0_2px] focus:shadow-green10 data-[disabled]:text-black/30 data-[selected]:!bg-green10 data-[selected]:text-white data-[highlighted]:bg-green5 hover:bg-green5 data-[unavailable]:pointer-events-none data-[unavailable]:text-black/30 data-[unavailable]:line-through before:absolute before:top-1 before:hidden before:rounded-full before:size-1 before:bg-white data-[today]:before:block data-[today]:before:bg-green9 data-[selection-start]:rounded-l-lg data-[selection-end]:rounded-r-lg"
              />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </div>
  </RangeCalendarRoot>
</template>
