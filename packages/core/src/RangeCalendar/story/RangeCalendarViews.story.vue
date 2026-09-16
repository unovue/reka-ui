<script setup lang="ts">
import type { Ref } from 'vue'
import type { CalendarUnit } from '@/date'
import type { DateRange } from '@/shared/date'
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import { ref } from 'vue'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot, RangeCalendarView, RangeCalendarViewTrigger } from '..'

const days = ref({ start: new CalendarDate(2026, 9, 5), end: new CalendarDate(2026, 9, 12) }) as Ref<DateRange>
const months = ref({ start: new CalendarDate(2026, 3, 1), end: new CalendarDate(2026, 6, 1) }) as Ref<DateRange>
const years = ref({ start: undefined, end: undefined }) as Ref<DateRange>
const view = ref<CalendarUnit>('day')

const nav = 'inline-flex items-center cursor-pointer text-black justify-center rounded-[9px] bg-transparent w-10 h-10 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black data-[disabled]:text-black/30 data-[disabled]:pointer-events-none'
const cell = 'relative flex items-center justify-center whitespace-nowrap rounded-[9px] border border-transparent bg-transparent text-sm font-normal text-black w-full h-10 outline-none hover:border-black focus:shadow-[0_0_0_2px] focus:shadow-black data-[selected]:bg-black data-[selected]:text-white data-[highlighted]:bg-black/10 data-[selection-start]:rounded-r-none data-[selection-end]:rounded-l-none data-[disabled]:text-black/30 data-[unavailable]:pointer-events-none data-[unavailable]:text-black/30 data-[unavailable]:line-through data-[outside-view]:text-black/30'
</script>

<template>
  <Story
    title="Range Calendar/Views"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Day, month and year views (drill-down)">
      <p class="mb-2 text-sm text-black/70">
        view: <code>{{ view }}</code> · range: <code>{{ days.start?.toString() }} → {{ days.end?.toString() }}</code>
      </p>
      <RangeCalendarRoot
        v-model="days"
        v-model:view="view"
        class="rounded-xl border border-black bg-white p-4 shadow-md"
      >
        <RangeCalendarHeader class="flex items-center justify-between">
          <RangeCalendarPrev :class="nav">
            <Icon
              icon="radix-icons:chevron-left"
              class="w-6 h-6"
            />
          </RangeCalendarPrev>
          <RangeCalendarViewTrigger class="text-[15px] text-black font-medium rounded-md px-2 py-1 hover:bg-black/5 disabled:hover:bg-transparent" />
          <RangeCalendarNext :class="nav">
            <Icon
              icon="radix-icons:chevron-right"
              class="w-6 h-6"
            />
          </RangeCalendarNext>
        </RangeCalendarHeader>

        <RangeCalendarView
          v-slot="{ grid, weekDays }"
          view="day"
          class="pt-4"
        >
          <RangeCalendarGrid
            v-for="page in grid"
            :key="page.value.toString()"
            :value="page.value"
            class="w-full border-collapse select-none space-y-1"
          >
            <RangeCalendarGridHead>
              <RangeCalendarGridRow class="mb-1 grid w-full grid-cols-7">
                <RangeCalendarHeadCell
                  v-for="day in weekDays"
                  :key="day"
                  class="rounded-md text-xs !font-normal text-black"
                >
                  {{ day }}
                </RangeCalendarHeadCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridHead>
            <RangeCalendarGridBody class="grid">
              <RangeCalendarGridRow
                v-for="(weekDates, index) in page.rows"
                :key="`week-${index}`"
                class="grid grid-cols-7"
              >
                <RangeCalendarCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  :value="weekDate"
                  class="relative text-center text-sm"
                >
                  <RangeCalendarCellTrigger
                    :value="weekDate"
                    :class="cell"
                  />
                </RangeCalendarCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridBody>
          </RangeCalendarGrid>
        </RangeCalendarView>

        <RangeCalendarView
          v-for="unit in (['month', 'year'] as const)"
          :key="unit"
          v-slot="{ grid }"
          :view="unit"
          class="pt-4"
        >
          <RangeCalendarGrid
            v-for="page in grid"
            :key="page.value.toString()"
            :value="page.value"
            class="w-full border-collapse select-none"
          >
            <RangeCalendarGridBody class="grid gap-1">
              <RangeCalendarGridRow
                v-for="(row, index) in page.rows"
                :key="`row-${index}`"
                class="grid grid-cols-4 gap-1"
              >
                <RangeCalendarCell
                  v-for="item in row"
                  :key="item.toString()"
                  :value="item"
                  class="relative text-center text-sm"
                >
                  <RangeCalendarCellTrigger
                    :value="item"
                    :class="cell"
                  />
                </RangeCalendarCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridBody>
          </RangeCalendarGrid>
        </RangeCalendarView>
      </RangeCalendarRoot>
    </Variant>

    <Variant title="Month range picker (granularity=month, maximumLength=6)">
      <p class="mb-2 text-sm text-black/70">
        range: <code>{{ months.start?.toString() }} → {{ months.end?.toString() }}</code>
      </p>
      <RangeCalendarRoot
        v-slot="{ grid }"
        v-model="months"
        granularity="month"
        :maximum-length="6"
        class="rounded-xl border border-black bg-white p-4 shadow-md"
      >
        <RangeCalendarHeader class="flex items-center justify-between">
          <RangeCalendarPrev :class="nav">
            <Icon
              icon="radix-icons:chevron-left"
              class="w-6 h-6"
            />
          </RangeCalendarPrev>
          <RangeCalendarHeading class="text-[15px] text-black font-medium" />
          <RangeCalendarNext :class="nav">
            <Icon
              icon="radix-icons:chevron-right"
              class="w-6 h-6"
            />
          </RangeCalendarNext>
        </RangeCalendarHeader>
        <RangeCalendarGrid
          v-for="page in grid"
          :key="page.value.toString()"
          :value="page.value"
          class="w-full border-collapse select-none pt-4"
        >
          <RangeCalendarGridBody class="grid gap-1">
            <RangeCalendarGridRow
              v-for="(row, index) in page.rows"
              :key="`row-${index}`"
              class="grid grid-cols-4 gap-1"
            >
              <RangeCalendarCell
                v-for="item in row"
                :key="item.toString()"
                :value="item"
                class="relative text-center text-sm"
              >
                <RangeCalendarCellTrigger
                  :value="item"
                  :class="cell"
                />
              </RangeCalendarCell>
            </RangeCalendarGridRow>
          </RangeCalendarGridBody>
        </RangeCalendarGrid>
      </RangeCalendarRoot>
    </Variant>

    <Variant title="Year range picker (granularity=year)">
      <p class="mb-2 text-sm text-black/70">
        range: <code>{{ years.start?.toString() }} → {{ years.end?.toString() }}</code>
      </p>
      <RangeCalendarRoot
        v-slot="{ grid }"
        v-model="years"
        granularity="year"
        class="rounded-xl border border-black bg-white p-4 shadow-md"
      >
        <RangeCalendarHeader class="flex items-center justify-between">
          <RangeCalendarPrev :class="nav">
            <Icon
              icon="radix-icons:chevron-left"
              class="w-6 h-6"
            />
          </RangeCalendarPrev>
          <RangeCalendarHeading class="text-[15px] text-black font-medium" />
          <RangeCalendarNext :class="nav">
            <Icon
              icon="radix-icons:chevron-right"
              class="w-6 h-6"
            />
          </RangeCalendarNext>
        </RangeCalendarHeader>
        <RangeCalendarGrid
          v-for="page in grid"
          :key="page.value.toString()"
          :value="page.value"
          class="w-full border-collapse select-none pt-4"
        >
          <RangeCalendarGridBody class="grid gap-1">
            <RangeCalendarGridRow
              v-for="(row, index) in page.rows"
              :key="`row-${index}`"
              class="grid grid-cols-4 gap-1"
            >
              <RangeCalendarCell
                v-for="item in row"
                :key="item.toString()"
                :value="item"
                class="relative text-center text-sm"
              >
                <RangeCalendarCellTrigger
                  :value="item"
                  :class="cell"
                />
              </RangeCalendarCell>
            </RangeCalendarGridRow>
          </RangeCalendarGridBody>
        </RangeCalendarGrid>
      </RangeCalendarRoot>
    </Variant>
  </Story>
</template>
