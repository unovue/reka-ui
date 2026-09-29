<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
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
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
  MonthPickerCell,
  MonthPickerCellTrigger,
  MonthPickerGrid,
  MonthPickerGridBody,
  MonthPickerGridRow,
  MonthPickerHeader,
  MonthPickerHeading,
  MonthPickerNext,
  MonthPickerPrev,
  MonthPickerRoot,
  YearPickerCell,
  YearPickerCellTrigger,
  YearPickerGrid,
  YearPickerGridBody,
  YearPickerGridRow,
  YearPickerHeader,
  YearPickerHeading,
  YearPickerNext,
  YearPickerPrev,
  YearPickerRoot,
} from 'reka-ui'
import { computed, nextTick, ref, watch } from 'vue'

type View = 'day' | 'month' | 'year'

const view = ref<View>('day')
const selectedDate = ref<DateValue>(new CalendarDate(2024, 10, 3))
const placeholder = ref<DateValue>(new CalendarDate(2024, 10, 1))
const containerRef = ref<HTMLElement | null>(null)

function openMonthView() {
  view.value = 'month'
}

function openYearView() {
  view.value = 'year'
}

function onMonthSelect(month: DateValue) {
  placeholder.value = month
  view.value = 'day'
}

function onYearSelect(year: DateValue) {
  placeholder.value = year
  view.value = 'month'
}

watch(selectedDate, (val) => {
  if (val)
    placeholder.value = val
})

function focusFirstCell(nextView: View) {
  const root = containerRef.value
  if (!root)
    return

  const selector = nextView === 'day'
    ? '[data-reka-calendar-cell-trigger]'
    : nextView === 'month'
      ? '[data-reka-month-picker-cell-trigger]'
      : '[data-reka-year-picker-cell-trigger]'

  const focused = root.querySelector<HTMLElement>(`${selector}[data-focused]`)
  const first = root.querySelector<HTMLElement>(`${selector}:not([data-disabled]):not([data-unavailable])`)
  ;(focused || first)?.focus()
}

watch(view, async (nextView) => {
  await nextTick()
  focusFirstCell(nextView)
})

const monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const monthLabel = computed(() => monthLabels[placeholder.value.month - 1])
const yearLabel = computed(() => String(placeholder.value.year))

const navButtonClass = 'inline-flex items-center cursor-default text-black justify-center rounded-md bg-transparent w-7 h-7 hover:bg-stone-100 active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-green10 disabled:opacity-50'
const headingGroupClass = 'flex items-center gap-2'
const monthButtonClass = 'rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide text-black transition-colors cursor-default focus-visible:outline-none focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-green10'
const yearButtonClass = 'rounded-md px-2 py-1 text-sm font-medium text-black transition-colors cursor-default focus-visible:outline-none focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-green10'
const cellTriggerBase = 'relative flex items-center justify-center rounded-md whitespace-nowrap text-sm font-normal text-black outline-none cursor-default focus:shadow-[0_0_0_2px] focus:shadow-green10 hover:bg-green-100 data-[selected]:!bg-green-600 data-[selected]:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-30 data-[unavailable]:pointer-events-none data-[unavailable]:line-through data-[today]:font-semibold'
</script>

<template>
  <div
    ref="containerRef"
    class="rounded-xl bg-white p-4 shadow-sm border w-[280px]"
  >
    <!-- Day View (Calendar) -->
    <CalendarRoot
      v-if="view === 'day'"
      v-slot="{ weekDays, grid }"
      v-model="selectedDate"
      v-model:placeholder="placeholder"
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
        <CalendarHeading :class="headingGroupClass">
          <button
            type="button"
            :class="[
              monthButtonClass,
              view !== 'month' && 'hover:bg-stone-100',
            ]"
            :aria-pressed="view === 'month'"
            aria-label="Select month view"
            @click="openMonthView"
          >
            {{ monthLabel }}
          </button>
          <button
            type="button"
            :class="[
              yearButtonClass,
              view !== 'year' && 'hover:bg-stone-100',
            ]"
            :aria-pressed="view === 'year'"
            aria-label="Select year view"
            @click="openYearView"
          >
            {{ yearLabel }}
          </button>
        </CalendarHeading>
        <CalendarNext :class="navButtonClass">
          <Icon
            icon="radix-icons:chevron-right"
            class="w-4 h-4"
          />
        </CalendarNext>
      </CalendarHeader>

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
              :date="weekDate"
              class="relative text-center text-sm"
            >
              <CalendarCellTrigger
                :day="weekDate"
                :month="month.value"
                class="w-8 h-8 rounded-full data-[outside-view]:text-black/30"
                :class="[cellTriggerBase]"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </CalendarRoot>

    <!-- Month View (MonthPicker) -->
    <MonthPickerRoot
      v-else-if="view === 'month'"
      v-slot="{ grid }"
      v-model:placeholder="placeholder"
      class="flex flex-col"
      @update:model-value="onMonthSelect"
    >
      <MonthPickerHeader class="flex items-center justify-between mb-4">
        <MonthPickerPrev :class="navButtonClass">
          <Icon
            icon="radix-icons:chevron-left"
            class="w-4 h-4"
          />
        </MonthPickerPrev>
        <MonthPickerHeading :class="headingGroupClass">
          <button
            type="button"
            :class="[
              monthButtonClass,
              view !== 'month' && 'hover:bg-stone-100',
            ]"
            :aria-pressed="view === 'month'"
            aria-label="Select month view"
            @click="openMonthView"
          >
            {{ monthLabel }}
          </button>
          <button
            type="button"
            :class="[
              yearButtonClass,
              view !== 'year' && 'hover:bg-stone-100',
            ]"
            :aria-pressed="view === 'year'"
            aria-label="Select year view"
            @click="openYearView"
          >
            {{ yearLabel }}
          </button>
        </MonthPickerHeading>
        <MonthPickerNext :class="navButtonClass">
          <Icon
            icon="radix-icons:chevron-right"
            class="w-4 h-4"
          />
        </MonthPickerNext>
      </MonthPickerHeader>

      <MonthPickerGrid class="w-full">
        <MonthPickerGridBody>
          <MonthPickerGridRow
            v-for="(monthRow, rowIndex) in grid.rows"
            :key="`monthRow-${rowIndex}`"
            class="grid grid-cols-4 gap-1"
          >
            <MonthPickerCell
              v-for="month in monthRow"
              :key="month.toString()"
              :date="month"
            >
              <MonthPickerCellTrigger
                :month="month"
                class="w-full py-2"
                :class="[cellTriggerBase]"
              />
            </MonthPickerCell>
          </MonthPickerGridRow>
        </MonthPickerGridBody>
      </MonthPickerGrid>
    </MonthPickerRoot>

    <!-- Year View (YearPicker) -->
    <YearPickerRoot
      v-else
      v-slot="{ grid }"
      v-model:placeholder="placeholder"
      class="flex flex-col"
      @update:model-value="onYearSelect"
    >
      <YearPickerHeader class="flex items-center justify-between mb-4">
        <YearPickerPrev :class="navButtonClass">
          <Icon
            icon="radix-icons:chevron-left"
            class="w-4 h-4"
          />
        </YearPickerPrev>
        <YearPickerHeading :class="headingGroupClass">
          <button
            type="button"
            :class="[
              monthButtonClass,
              view !== 'month' && 'hover:bg-stone-100',
            ]"
            :aria-pressed="view === 'month'"
            aria-label="Select month view"
            @click="openMonthView"
          >
            {{ monthLabel }}
          </button>
          <button
            type="button"
            :class="[
              yearButtonClass,
              view !== 'year' && 'hover:bg-stone-100',
            ]"
            :aria-pressed="view === 'year'"
            aria-label="Select year view"
            @click="openYearView"
          >
            {{ yearLabel }}
          </button>
        </YearPickerHeading>
        <YearPickerNext :class="navButtonClass">
          <Icon
            icon="radix-icons:chevron-right"
            class="w-4 h-4"
          />
        </YearPickerNext>
      </YearPickerHeader>

      <YearPickerGrid class="w-full">
        <YearPickerGridBody>
          <YearPickerGridRow
            v-for="(yearRow, rowIndex) in grid.rows"
            :key="`yearRow-${rowIndex}`"
            class="grid grid-cols-4 gap-1"
          >
            <YearPickerCell
              v-for="year in yearRow"
              :key="year.toString()"
              :date="year"
            >
              <YearPickerCellTrigger
                :year="year"
                class="w-full py-2"
                :class="[cellTriggerBase]"
              />
            </YearPickerCell>
          </YearPickerGridRow>
        </YearPickerGridBody>
      </YearPickerGrid>
    </YearPickerRoot>
  </div>
</template>
