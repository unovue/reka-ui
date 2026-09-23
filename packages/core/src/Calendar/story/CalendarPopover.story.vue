<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { Ref } from 'vue'
import { Icon } from '@iconify/vue'
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import { ref } from 'vue'

import { createDecade, createYear, toDate } from '@/date'
import { useDateFormatter } from '@/shared'

import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot } from '..'
import CalendarPopover from './_CalendarPopover.vue'

const value = ref(new CalendarDate(2024, 3, 20)) as Ref<DateValue>

const placeholder = ref(today(getLocalTimeZone())) as Ref<DateValue>
const formatter = useDateFormatter('en')
</script>

<template>
  <Story
    title="Calendar/Popover"
    :layout="{ type: 'single' }"
  >
    <Variant title="default">
      <CalendarRoot
        v-slot="{ weekDays, grid, date }"
        v-model="value"
        v-model:placeholder="placeholder"
        class="mt-6 rounded-[15px] border border-black bg-white p-[22px] shadow-md"
        fixed-weeks
      >
        <CalendarHeader class="flex items-center justify-between">
          <CalendarPrev
            class="inline-flex items-center cursor-pointer text-black justify-center rounded-[9px] bg-transparent w-10 h-10 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
          >
            <Icon
              icon="radix-icons:chevron-left"
              class="w-6 h-6"
            />
          </CalendarPrev>
          <CalendarHeading class="text-[15px] text-black font-medium flex justify-center gap-2">
            <CalendarPopover>
              <template #trigger>
                <span class="cursor-pointer">{{ formatter.fullMonth(toDate(date)) }}</span>
              </template>
              <div class="grid grid-cols-4 bg-white rounded-[9px]">
                <div
                  v-for="month in createYear({ dateObj: date })"
                  :key="month.toString()"
                  class="relative cursor-pointer flex items-center justify-center whitespace-nowrap rounded-[9px] border border-transparent bg-transparent text-sm font-normal text-black p-2 outline-none focus:shadow-[0_0_0_2px] focus:shadow-black hover:border-black"
                  :class="{ 'before:absolute before:top-[5px] before:rounded-full before:w-1 before:h-1 before:block before:bg-grass9': placeholder.month === month.month }"
                  @click="placeholder = month.copy()"
                >
                  <span class="cursor-pointer">{{ formatter.custom(toDate(month), { month: 'short' }) }}</span>
                </div>
              </div>
            </CalendarPopover>
            <CalendarPopover>
              <template #trigger>
                <span class="cursor-pointer">{{ formatter.fullYear(toDate(date)) }}</span>
              </template>
              <div class="grid grid-cols-4 bg-white rounded-[9px] gap-4">
                <div
                  v-for="yearValue in createDecade({ dateObj: date, startIndex: -10, endIndex: 10 })"
                  :key="yearValue.toString()"
                  class="relative cursor-pointer flex items-center justify-center whitespace-nowrap rounded-[9px] border border-transparent bg-transparent text-sm font-normal text-black p-2 outline-none focus:shadow-[0_0_0_2px] focus:shadow-black hover:border-black"
                  :class="{ 'before:absolute before:top-[5px] before:rounded-full before:w-1 before:h-1 before:block before:bg-grass9': placeholder.year === yearValue.year }"
                  @click="placeholder = yearValue.copy()"
                >
                  {{ formatter.fullYear(toDate(yearValue)) }}
                </div>
              </div>
            </CalendarPopover>
          </CalendarHeading>

          <CalendarNext
            class="inline-flex items-center cursor-pointer text-black justify-center rounded-[9px] bg-transparent w-10 h-10 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
          >
            <Icon
              icon="radix-icons:chevron-right"
              class="w-6 h-6"
            />
          </CalendarNext>
        </CalendarHeader>
        <div
          class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0"
        >
          <CalendarGrid
            v-for="month in grid"
            :key="month.value.toString()"
            class="w-full border-collapse select-none space-y-1"
          >
            <CalendarGridHead>
              <CalendarGridRow class="mb-1 grid w-full grid-cols-7">
                <CalendarHeadCell
                  v-for="day in weekDays"
                  :key="day"
                  class="rounded-md text-xs !font-normal text-black"
                >
                  {{ day }}
                </CalendarHeadCell>
              </CalendarGridRow>
            </CalendarGridHead>
            <CalendarGridBody class="grid">
              <CalendarGridRow
                v-for="(weekDates, index) in month.rows"
                :key="`weekDate-${index}`"
                class="grid grid-cols-7"
              >
                <CalendarCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  :date="weekDate"
                  class="relative text-center text-sm"
                >
                  <CalendarCellTrigger
                    :day="weekDate"
                    :month="month.value"
                    class="relative flex items-center justify-center whitespace-nowrap rounded-[9px] border border-transparent bg-transparent text-sm font-normal text-black p-2 outline-none focus:shadow-[0_0_0_2px] focus:shadow-black hover:border-black data-[selected]:bg-black data-[selected]:font-medium data-[outside-view]:text-black/30 data-[selected]:text-white data-[unavailable]:text-black/30 data-[unavailable]:line-through before:absolute before:top-[5px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-white data-[today]:before:block data-[today]:before:bg-grass9 data-[selected]:before:bg-white"
                  />
                </CalendarCell>
              </CalendarGridRow>
            </CalendarGridBody>
          </CalendarGrid>
        </div>
      </CalendarRoot>
    </Variant>
  </Story>
</template>
