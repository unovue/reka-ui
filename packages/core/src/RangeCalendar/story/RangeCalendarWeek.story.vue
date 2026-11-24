<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { getWeekNumber } from '@/date'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot } from '..'
</script>

<template>
  <Story
    title="Range Calendar/With weeks"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="weeks">
      <RangeCalendarRoot
        v-slot="{ weekDays, grid }"
        :number-of-months="2"
        class="mt-6 rounded-[15px] border border-black bg-white p-[22px] shadow-md"
        fixed-weeks
      >
        <RangeCalendarHeader class="flex items-center justify-between">
          <RangeCalendarPrev
            class="inline-flex items-center cursor-pointer text-black justify-center rounded-[9px] bg-transparent w-10 h-10 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
          >
            <Icon
              icon="radix-icons:chevron-left"
              class="w-6 h-6"
            />
          </RangeCalendarPrev>
          <RangeCalendarHeading class="text-[15px] text-black font-medium" />
          <RangeCalendarNext
            class="inline-flex items-center cursor-pointer text-black justify-center rounded-[9px] bg-transparent w-10 h-10 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
          >
            <Icon
              icon="radix-icons:chevron-right"
              class="w-6 h-6"
            />
          </RangeCalendarNext>
        </RangeCalendarHeader>
        <div
          class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0"
        >
          <RangeCalendarGrid
            v-for="(month) in grid"
            :key="month.value.toString()"
            class="w-full border-collapse select-none space-y-1"
          >
            <RangeCalendarGridHead>
              <RangeCalendarGridRow class="grid grid-cols-8">
                <RangeCalendarHeadCell

                  class="w-10 rounded-md text-xs !font-normal text-black"
                >
                  Wk
                </RangeCalendarHeadCell>
                <RangeCalendarHeadCell
                  v-for="day in weekDays"
                  :key="day"
                  class="w-10 rounded-md text-xs !font-normal text-black"
                >
                  <div>{{ day.slice(0, 2) }}</div>
                </RangeCalendarHeadCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridHead>
            <RangeCalendarGridBody>
              <RangeCalendarGridRow
                v-for="(weekDates, index) in month.rows"
                :key="`weekDate-${index}`"
                class="grid grid-cols-8"
              >
                <div class="flex items-center justify-center text-black !p-0 text-center text-sm w-10 h-10">
                  {{ getWeekNumber(weekDates[0]) }}
                </div>
                <RangeCalendarCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  :date="weekDate"
                  class="relative !p-0 text-center text-sm w-10 h-10"
                >
                  <RangeCalendarCellTrigger
                    :day="weekDate"
                    :month="month.value"
                    class="relative flex items-center justify-center whitespace-nowrap rounded-[9px] border border-transparent bg-transparent text-sm font-normal text-black p-2 outline-none focus:shadow-[0_0_0_2px] focus:shadow-black hover:border-black data-[selected]:bg-black data-[selected]:font-medium data-[outside-view]:text-black/30 data-[selected]:text-white data-[highlighted]:bg-grass9/30 data-[highlighted]:rounded-none data-[selection-start]:bg-black data-[selection-start]:rounded-none data-[selection-start]:rounded-l-[9px] data-[selection-end]:rounded-none data-[selection-end]:bg-black data-[selection-end]:rounded-r-[9px] data-[selected]:[&:not([data-selection-start])]:[&:not([data-selection-end])]:rounded-none data-[unavailable]:text-black/30 data-[unavailable]:line-through before:absolute before:top-[5px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-white data-[today]:before:block data-[today]:before:bg-grass9 data-[selected]:before:bg-white"
                  />
                </RangeCalendarCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridBody>
          </RangeCalendarGrid>
        </div>
      </RangeCalendarRoot>
    </Variant>
  </Story>
</template>
..
