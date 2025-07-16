<script setup lang="ts">
import type { DateRange } from 'reka-ui'
import { Icon } from '@iconify/vue'
import { getLocalTimeZone, today } from '@internationalized/date'
import { DateRangeFieldInput, DateRangeFieldRoot, RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot, useDateFormatter } from 'reka-ui'
import { ref } from 'vue'

const formatter = useDateFormatter('en-UK')

const selectedRange = ref<DateRange>()

const quickOptions = [
  {
    label: 'Today',
    action: () => {
      const _today = today(getLocalTimeZone())
      selectedRange.value = {
        start: _today,
        end: _today,
      }
    },
  },
  {
    label: 'Yesterday',
    action: () => {
      const yesterday = today(getLocalTimeZone()).subtract({ days: 1 })
      selectedRange.value = {
        start: yesterday,
        end: yesterday,
      }
    },
  },
  {
    label: 'Last 7 days',
    action: () => {
      selectedRange.value = {
        start: today(getLocalTimeZone()).subtract({ days: 6 }),
        end: today(getLocalTimeZone()),
      }
    },
  },
  {
    label: 'Last 30 days',
    action: () => {
      selectedRange.value = {
        start: today(getLocalTimeZone()).subtract({ days: 29 }),
        end: today(getLocalTimeZone()),
      }
    },
  },
  {
    label: 'This month',
    action: () => {
      const now = today(getLocalTimeZone())
      const startOfMonth = now.set({ day: 1 })
      selectedRange.value = {
        start: startOfMonth,
        end: now,
      }
    },
  },
  {
    label: 'Last month',
    action: () => {
      const now = today(getLocalTimeZone())
      const lastMonth = now.subtract({ months: 1 })
      const startOfLastMonth = lastMonth.set({ day: 1 })
      const endOfLastMonth = startOfLastMonth.add({ months: 1 }).subtract({ days: 1 })
      selectedRange.value = {
        start: startOfLastMonth,
        end: endOfLastMonth,
      }
    },
  },
  {
    label: 'This quarter',
    action: () => {
      const now = today(getLocalTimeZone())
      const currentMonth = now.month
      const startMonth = currentMonth - (currentMonth % 3)
      const startOfQuarter = now.set({ month: startMonth, day: 1 })
      selectedRange.value = {
        start: startOfQuarter,
        end: now,
      }
    },
  },
  {
    label: 'Last quarter',
    action: () => {
      const now = today(getLocalTimeZone())
      const currentMonth = now.month
      const currentQuarter = Math.floor(currentMonth / 3)

      // If we're in the first quarter, we need to go back to last year
      let startOfLastQuarter
      if (currentQuarter === 0) {
        startOfLastQuarter = now
          .subtract({ years: 1 })
          .set({ month: 10, day: 1 }) // October 1st of previous year
      }
      else {
      // Otherwise, just go back 3 months from the start of current quarter
        startOfLastQuarter = now
          .set({ month: currentQuarter * 3 - 2, day: 1 })
      }

      const endOfLastQuarter = startOfLastQuarter.add({ months: 3 }).subtract({ days: 1 })

      selectedRange.value = {
        start: startOfLastQuarter,
        end: endOfLastQuarter,
      }
    },
  },
  {
    label: 'This year',
    action: () => {
      const now = today(getLocalTimeZone())
      const startOfYear = now.set({ month: 1, day: 1 })
      selectedRange.value = {
        start: startOfYear,
        end: now,
      }
    },
  },
  {
    label: 'Last year',
    action: () => {
      const now = today(getLocalTimeZone())
      const lastYear = now.subtract({ years: 1 })
      const startOfLastYear = lastYear.set({ month: 1, day: 1 })
      const endOfLastYear = startOfLastYear.add({ years: 1 }).subtract({ days: 1 })

      selectedRange.value = {
        start: startOfLastYear,
        end: endOfLastYear,
      }
    },
  },
]
</script>

<template>
  <div class="rounded-xl bg-white shadow-sm border flex flex-col-reverse lg:flex-row">
    <div class="lg:w-40 lg:border-r border-gray-100 p-4">
      <button
        v-for="option in quickOptions"
        :key="option.label"
        class="flex w-full rounded-md bg-transparent hover:bg-gray-100 transition px-3 py-2 text-left text-[13px]"
        @click="option.action"
      >
        {{ option.label }}
      </button>
    </div>
    <div>
      <RangeCalendarRoot
        v-slot="{ weekDays, grid }"
        v-model="selectedRange"
        class="flex space-y-4 flex-col lg:flex-row lg:space-y-0 p-4"
        fixed-weeks
        :number-of-months="2"
        locale="en-UK"
      >
        <div
          v-for="(month, index) in grid"
          :key="month.value.toString()"
          :class="{ 'mr-4': index === 0 }"
        >
          <div
            v-if="index === 0"
            class="flex items-center"
          >
            <RangeCalendarPrev
              class="inline-flex items-center cursor-pointer text-black justify-center rounded-md bg-transparent w-7 h-7 hover:bg-stone-50 active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
            >
              <Icon
                icon="radix-icons:chevron-left"
                class="w-4 h-4"
              />
            </RangeCalendarPrev>
            <span class="font-semibold flex-1 text-center">{{ formatter.custom(month.value.toDate(getLocalTimeZone()), { month: 'long', year: 'numeric' }) }}</span>
            <span class="w-7" />
          </div>
          <div
            v-if="index === (grid.length - 1)"
            class="flex items-center"
          >
            <span class="w-7" />
            <span class="font-semibold flex-1 text-center">{{ formatter.custom(month.value.toDate(getLocalTimeZone()), { month: 'long', year: 'numeric' }) }}</span>
            <RangeCalendarNext
              class="place-self-end inline-flex items-center cursor-pointer justify-center text-black rounded-md bg-transparent w-7 h-7 hover:bg-stone-50 active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
            >
              <Icon
                icon="radix-icons:chevron-right"
                class="w-4 h-4"
              />
            </RangeCalendarNext>
          </div>
          <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <RangeCalendarGrid
              class="w-full border-collapse select-none space-y-1"
            >
              <RangeCalendarGridHead>
                <RangeCalendarGridRow class="mb-1 grid w-full grid-cols-7">
                  <RangeCalendarHeadCell
                    v-for="day in weekDays"
                    :key="day"
                    class="rounded-md text-xs text-green8"
                  >
                    {{ day }}
                  </RangeCalendarHeadCell>
                </RangeCalendarGridRow>
              </RangeCalendarGridHead>
              <RangeCalendarGridBody class="grid">
                <RangeCalendarGridRow
                  v-for="(weekDates, rowIndex) in month.rows"
                  :key="`weekDate-${rowIndex}`"
                  class="grid grid-cols-7"
                >
                  <RangeCalendarCell
                    v-for="weekDate in weekDates"
                    :key="weekDate.toString()"
                    :date="weekDate"
                    class="aspect-square lg:w-[34px] my-0.5 p-0 first:[&:has([data-selected])]:rounded-l-full last:[&:has([data-selected])]:rounded-r-full [&:has([data-selected][data-selection-end])]:rounded-r-full [&:not(:has([data-highlighted])):has([data-selected][data-selection-start])]:rounded-l-full
                first:[&:has([data-highlighted])]:rounded-l-full last:[&:has([data-highlighted])]:rounded-r-full [&:has([data-highlighted-end])]:rounded-r-full [&:has([data-highlighted-start])]:rounded-l-full
                  [&:has([data-selected])]:bg-green3  [&:has([data-highlighted])]:bg-green3
                "
                  >
                    <RangeCalendarCellTrigger
                      :day="weekDate"
                      :month="month.value"
                      class="relative flex items-center  rounded-full justify-center whitespace-nowrap text-sm font-normal w-full h-full text-black outline-none focus:shadow-[0_0_0_2px] transition duration-100 focus:shadow-black hover:bg-green10 hover:text-white data-[selection-start]:bg-green10 data-[selection-end]:bg-green10 data-[selection-start]:text-white data-[selection-end]:text-white data-[highlighted-start]:bg-green10 data-[highlighted-start]:text-white data-[highlighted-end]:bg-green10 data-[highlighted-end]:text-white data-[unavailable]:pointer-events-none data-[unavailable]:text-black/30 data-[unavailable]:line-through before:absolute before:bottom-[3px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-white data-[today]:before:block data-[today]:before:bg-green9 data-[outside-month]:opacity-25"
                    />
                  </RangeCalendarCell>
                </RangeCalendarGridRow>
              </RangeCalendarGridBody>
            </RangeCalendarGrid>
          </div>
        </div>
      </RangeCalendarRoot>

      <DateRangeFieldRoot
        v-slot="{ segments }"
        v-model="selectedRange"
        locale="en-UK"
        class="p-4 border-t border-gray-100 flex items-center select-none"
      >
        <div class="flex items-center border rounded-md p-1 shadow-sm [[data-invalid]_&]:border-red-500">
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
              class="text-center rounded p-0.5  focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
              :class="[item.part === 'year' ? 'w-10' : 'w-8']"
              type="start"
            >
              {{ item.value }}
            </DateRangeFieldInput>
          </template>
        </div>

        <span class="mx-2">-</span>

        <div class="flex items-center border rounded-md p-1 shadow-sm [[data-invalid]_&]:border-red-500">
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
              class="text-center rounded p-0.5  focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
              :class="[item.part === 'year' ? 'w-10' : 'w-8']"
              type="end"
            >
              {{ item.value }}
            </DateRangeFieldInput>
          </template>
        </div>

        <span class="ml-4 text-red-500 font-semibold text-sm [[data-invalid]_&]:block hidden">Invalid date</span>
      </DateRangeFieldRoot>
    </div>
  </div>
</template>
