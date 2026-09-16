<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { Ref } from 'vue'
import type { CalendarUnit } from '@/date'
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import { ref } from 'vue'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot, CalendarView, CalendarViewTrigger } from '..'

const date = ref(new CalendarDate(2026, 9, 5)) as Ref<DateValue | undefined>
const month = ref(new CalendarDate(2026, 9, 1)) as Ref<DateValue | undefined>
const year = ref(new CalendarDate(2026, 1, 1)) as Ref<DateValue | undefined>
const view = ref<CalendarUnit>('day')

const nav = 'inline-flex items-center cursor-pointer text-black justify-center rounded-[9px] bg-transparent w-10 h-10 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black data-[disabled]:text-black/30 data-[disabled]:pointer-events-none'
const cell = 'relative flex items-center justify-center whitespace-nowrap rounded-[9px] border border-transparent bg-transparent text-sm font-normal text-black w-full h-10 outline-none hover:border-black focus:shadow-[0_0_0_2px] focus:shadow-black data-[selected]:bg-black data-[selected]:font-medium data-[selected]:text-white data-[disabled]:text-black/30 data-[unavailable]:pointer-events-none data-[unavailable]:text-black/30 data-[unavailable]:line-through data-[outside-view]:text-black/30 before:absolute before:bottom-[5px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-white data-[today]:before:block data-[today]:before:bg-black data-[selected]:before:bg-white'
</script>

<template>
  <Story
    title="Calendar/Views"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Day, month and year views (drill-down)">
      <p class="mb-2 text-sm text-black/70">
        view: <code>{{ view }}</code>
      </p>
      <CalendarRoot
        v-model="date"
        v-model:view="view"
        class="rounded-xl border border-black bg-white p-4 shadow-md"
      >
        <CalendarHeader class="flex items-center justify-between">
          <CalendarPrev :class="nav">
            <Icon
              icon="radix-icons:chevron-left"
              class="w-6 h-6"
            />
          </CalendarPrev>
          <CalendarViewTrigger class="text-[15px] text-black font-medium rounded-md px-2 py-1 hover:bg-black/5 disabled:hover:bg-transparent" />
          <CalendarNext :class="nav">
            <Icon
              icon="radix-icons:chevron-right"
              class="w-6 h-6"
            />
          </CalendarNext>
        </CalendarHeader>

        <CalendarView
          v-slot="{ grid, weekDays }"
          view="day"
          class="pt-4"
        >
          <CalendarGrid
            v-for="page in grid"
            :key="page.value.toString()"
            :value="page.value"
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
                v-for="(weekDates, index) in page.rows"
                :key="`week-${index}`"
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
                    :class="cell"
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
          class="pt-4"
        >
          <CalendarGrid
            v-for="page in grid"
            :key="page.value.toString()"
            :value="page.value"
            class="w-full border-collapse select-none space-y-1"
          >
            <CalendarGridBody class="grid gap-1">
              <CalendarGridRow
                v-for="(row, index) in page.rows"
                :key="`row-${index}`"
                class="grid grid-cols-4 gap-1"
              >
                <CalendarCell
                  v-for="item in row"
                  :key="item.toString()"
                  :value="item"
                  class="relative text-center text-sm"
                >
                  <CalendarCellTrigger
                    :value="item"
                    :class="cell"
                  />
                </CalendarCell>
              </CalendarGridRow>
            </CalendarGridBody>
          </CalendarGrid>
        </CalendarView>
      </CalendarRoot>
    </Variant>

    <Variant title="Month picker (granularity=month)">
      <p class="mb-2 text-sm text-black/70">
        value: <code>{{ month?.toString() }}</code>
      </p>
      <CalendarRoot
        v-slot="{ grid }"
        v-model="month"
        granularity="month"
        class="rounded-xl border border-black bg-white p-4 shadow-md"
      >
        <CalendarHeader class="flex items-center justify-between">
          <CalendarPrev :class="nav">
            <Icon
              icon="radix-icons:chevron-left"
              class="w-6 h-6"
            />
          </CalendarPrev>
          <CalendarHeading class="text-[15px] text-black font-medium" />
          <CalendarNext :class="nav">
            <Icon
              icon="radix-icons:chevron-right"
              class="w-6 h-6"
            />
          </CalendarNext>
        </CalendarHeader>
        <CalendarGrid
          v-for="page in grid"
          :key="page.value.toString()"
          :value="page.value"
          class="w-full border-collapse select-none pt-4"
        >
          <CalendarGridBody class="grid gap-1">
            <CalendarGridRow
              v-for="(row, index) in page.rows"
              :key="`row-${index}`"
              class="grid grid-cols-4 gap-1"
            >
              <CalendarCell
                v-for="item in row"
                :key="item.toString()"
                :value="item"
                class="relative text-center text-sm"
              >
                <CalendarCellTrigger
                  :value="item"
                  :class="cell"
                />
              </CalendarCell>
            </CalendarGridRow>
          </CalendarGridBody>
        </CalendarGrid>
      </CalendarRoot>
    </Variant>

    <Variant title="Year picker (granularity=year, 3 columns, 9 per page)">
      <p class="mb-2 text-sm text-black/70">
        value: <code>{{ year?.toString() }}</code>
      </p>
      <CalendarRoot
        v-slot="{ grid }"
        v-model="year"
        granularity="year"
        :years-per-page="9"
        :columns="3"
        :min-value="new CalendarDate(2015, 1, 1)"
        :max-value="new CalendarDate(2035, 12, 31)"
        class="rounded-xl border border-black bg-white p-4 shadow-md"
      >
        <CalendarHeader class="flex items-center justify-between">
          <CalendarPrev :class="nav">
            <Icon
              icon="radix-icons:chevron-left"
              class="w-6 h-6"
            />
          </CalendarPrev>
          <CalendarHeading class="text-[15px] text-black font-medium" />
          <CalendarNext :class="nav">
            <Icon
              icon="radix-icons:chevron-right"
              class="w-6 h-6"
            />
          </CalendarNext>
        </CalendarHeader>
        <CalendarGrid
          v-for="page in grid"
          :key="page.value.toString()"
          :value="page.value"
          class="w-full border-collapse select-none pt-4"
        >
          <CalendarGridBody class="grid gap-1">
            <CalendarGridRow
              v-for="(row, index) in page.rows"
              :key="`row-${index}`"
              class="grid grid-cols-3 gap-1"
            >
              <CalendarCell
                v-for="item in row"
                :key="item.toString()"
                :value="item"
                class="relative text-center text-sm"
              >
                <CalendarCellTrigger
                  :value="item"
                  :class="cell"
                />
              </CalendarCell>
            </CalendarGridRow>
          </CalendarGridBody>
        </CalendarGrid>
      </CalendarRoot>
    </Variant>
  </Story>
</template>
