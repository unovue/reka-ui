<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { CalendarRootProps } from 'reka-ui'
import { Icon } from '@iconify/vue'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot } from 'reka-ui'
import './styles.css'

const isDateUnavailable: CalendarRootProps['isDateUnavailable'] = (date) => {
  return date.day === 17 || date.day === 18
}

function pagingFunc(date: DateValue, sign: -1 | 1) {
  if (sign === -1)
    return date.subtract({ years: 1 })
  return date.add({ years: 1 })
}
</script>

<template>
  <CalendarRoot
    v-slot="{ weekDays, grid }"
    :is-date-unavailable="isDateUnavailable"
    class="Calendar"
    fixed-weeks
  >
    <CalendarHeader class="CalendarHeader">
      <CalendarPrev
        class="CalendarNavButton"
        :prev-page="(date: DateValue) => pagingFunc(date, -1)"
      >
        <Icon
          icon="radix-icons:double-arrow-left"
          class="Icon"
        />
      </CalendarPrev>
      <CalendarPrev
        class="CalendarNavButton"
      >
        <Icon
          icon="radix-icons:chevron-left"
          class="Icon"
        />
      </CalendarPrev>
      <CalendarHeading class="CalendarHeading" />
      <CalendarNext
        class="CalendarNavButton"
      >
        <Icon
          icon="radix-icons:chevron-right"
          class="Icon"
        />
      </CalendarNext>

      <CalendarNext
        class="CalendarNavButton"
        :next-page="(date: DateValue) => pagingFunc(date, 1)"
      >
        <Icon
          icon="radix-icons:double-arrow-right"
          class="Icon"
        />
      </CalendarNext>
    </CalendarHeader>
    <div
      class="CalendarWrapper"
    >
      <CalendarGrid
        v-for="month in grid"
        :key="month.value.toString()"
        class="CalendarGrid"
      >
        <CalendarGridHead>
          <CalendarGridRow class="CalendarGridRow">
            <CalendarHeadCell
              v-for="day in weekDays"
              :key="day"
              class="CalendarHeadCell"
            >
              {{ day }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>
        <CalendarGridBody class="CalendarGridWrapper">
          <CalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="`weekDate-${index}`"
            class="CalendarGridRow"
          >
            <CalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
              class="CalendarCell"
            >
              <CalendarCellTrigger
                :day="weekDate"
                :month="month.value"
                class="CalendarCellTrigger"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>
