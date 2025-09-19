<script setup lang="ts">
import type { RangeCalendarRootProps } from 'reka-ui'
import { Icon } from '@iconify/vue'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot } from 'reka-ui'

import './styles.css'

const isDateUnavailable: RangeCalendarRootProps['isDateUnavailable'] = (date) => {
  return date.day === 17 || date.day === 18
}
</script>

<template>
  <RangeCalendarRoot
    v-slot="{ weekDays, grid }"
    :is-date-unavailable="isDateUnavailable"
    class="Calendar"
    fixed-weeks
  >
    <RangeCalendarHeader class="flex items-center justify-between">
      <RangeCalendarPrev
        class="CalendarNavButton"
      >
        <Icon
          icon="radix-icons:chevron-left"
          class="Icon"
        />
      </RangeCalendarPrev>
      <RangeCalendarHeading class="CalendarHeading" />
      <RangeCalendarNext
        class="CalendarNavButton"
      >
        <Icon
          icon="radix-icons:chevron-right"
          class="Icon"
        />
      </RangeCalendarNext>
    </RangeCalendarHeader>
    <div
      class="CalendarWrapper"
    >
      <RangeCalendarGrid
        v-for="month in grid"
        :key="month.value.toString()"
        class="CalendarGrid"
      >
        <RangeCalendarGridHead>
          <RangeCalendarGridRow class="CalendarGridRow">
            <RangeCalendarHeadCell
              v-for="day in weekDays"
              :key="day"
              class="CalendarHeadCell"
            >
              {{ day }}
            </RangeCalendarHeadCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridHead>
        <RangeCalendarGridBody class="grid">
          <RangeCalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="`weekDate-${index}`"
            class="CalendarGridRow"
          >
            <RangeCalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
              class="CalendarCell"
            >
              <RangeCalendarCellTrigger
                :day="weekDate"
                :month="month.value"
                class="CalendarCellTrigger"
              />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </div>
  </RangeCalendarRoot>
</template>
