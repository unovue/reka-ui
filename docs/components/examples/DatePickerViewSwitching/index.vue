<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { CalendarUnit } from 'reka-ui'
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
  CalendarView,
  CalendarViewTrigger,
} from 'reka-ui'
import { ref } from 'vue'

const selectedDate = ref<DateValue | undefined>(new CalendarDate(2024, 10, 3))
const view = ref<CalendarUnit>('day')

const navButtonClass = 'inline-flex items-center cursor-default text-black justify-center rounded-md bg-transparent w-7 h-7 hover:bg-stone-100 active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-green10 disabled:opacity-50'
const viewTriggerClass = 'rounded-md px-2 py-1 text-sm font-medium text-black transition-colors cursor-default hover:bg-stone-100 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-green10'
const cellTriggerBase = 'relative flex items-center justify-center rounded-md whitespace-nowrap text-sm font-normal text-black outline-none cursor-default focus:shadow-[0_0_0_2px] focus:shadow-green10 hover:bg-green-100 data-[selected]:!bg-green-600 data-[selected]:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-30 data-[unavailable]:pointer-events-none data-[unavailable]:line-through data-[today]:font-semibold'
</script>

<template>
  <div class="rounded-xl bg-white p-4 shadow-sm border w-[280px]">
    <CalendarRoot
      v-model="selectedDate"
      v-model:view="view"
      class="flex flex-col"
      fixed-weeks
    >
      <CalendarHeader class="flex items-center justify-between mb-4">
        <CalendarPrev :class="navButtonClass">
          <Icon
            icon="radix-icons:chevron-left"
            class="w-4 h-4"
          />
        </CalendarPrev>
        <!-- Click the heading to switch day → month → year; select a cell to drill back down. -->
        <CalendarViewTrigger :class="viewTriggerClass" />
        <CalendarNext :class="navButtonClass">
          <Icon
            icon="radix-icons:chevron-right"
            class="w-4 h-4"
          />
        </CalendarNext>
      </CalendarHeader>

      <CalendarView
        v-slot="{ grid, weekDays }"
        view="day"
      >
        <CalendarGrid
          v-for="month in grid"
          :key="month.value.toString()"
          :value="month.value"
          class="w-full border-collapse select-none space-y-1"
        >
          <CalendarGridHead>
            <CalendarGridRow class="mb-1 grid w-full grid-cols-7">
              <CalendarHeadCell
                v-for="day in weekDays"
                :key="day"
                class="rounded-md text-xs text-stone-500 text-center"
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
                :value="weekDate"
                class="relative text-center text-sm"
              >
                <CalendarCellTrigger
                  :value="weekDate"
                  class="w-8 h-8 rounded-full data-[outside-view]:text-black/30"
                  :class="[cellTriggerBase]"
                />
              </CalendarCell>
            </CalendarGridRow>
          </CalendarGridBody>
        </CalendarGrid>
      </CalendarView>

      <CalendarView
        v-for="unit in (['month', 'year'] as const)"
        :key="unit"
        v-slot="{ grid }"
        :view="unit"
      >
        <CalendarGrid
          v-for="page in grid"
          :key="page.value.toString()"
          :value="page.value"
          class="w-full border-collapse select-none"
        >
          <CalendarGridBody class="grid gap-y-1">
            <CalendarGridRow
              v-for="(row, index) in page.rows"
              :key="`row-${index}`"
              class="grid grid-cols-4 gap-x-1"
            >
              <CalendarCell
                v-for="cell in row"
                :key="cell.toString()"
                :value="cell"
                class="relative text-center text-sm"
              >
                <CalendarCellTrigger
                  :value="cell"
                  class="h-12"
                  :class="[cellTriggerBase]"
                />
              </CalendarCell>
            </CalendarGridRow>
          </CalendarGridBody>
        </CalendarGrid>
      </CalendarView>
    </CalendarRoot>
  </div>
</template>
