<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import type { CalendarRootProps } from '..'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot } from '..'
import CalendarWeek from '../CalendarWeek.vue'

const props = defineProps<{ calendarProps?: CalendarRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateValue) => void } }>()

function pagingFunc(date: DateValue, sign: -1 | 1) {
  if (sign === -1)
    return date.subtract({ years: 1 })
  return date.add({ years: 1 })
}
</script>

<template>
  <CalendarRoot
    v-slot="{ weekDays, grid }"
    v-bind="props.calendarProps"
    data-testid="calendar"
    v-on="{ 'update:modelValue': props.emits?.['onUpdate:modelValue'] }"
  >
    <CalendarHeader data-testid="header">
      <CalendarPrev
        :prev-page="(date: DateValue) => pagingFunc(date, -1)"
        data-testid="prev-year-button"
      />
      <CalendarPrev
        data-testid="prev-button"
      />
      <CalendarHeading data-testid="heading" />
      <CalendarNext
        data-testid="next-button"
      />
      <CalendarNext
        :next-page="(date: DateValue) => pagingFunc(date, 1)"
        data-testid="next-year-button"
      />
    </CalendarHeader>

    <CalendarGrid
      v-for="(month) in grid"
      :key="month.value.toString()"
    >
      <CalendarGridHead>
        <CalendarGridRow>
          <CalendarHeadCell
            v-for="(day) in weekDays"
            :key="day"
          >
            {{ day }}
          </CalendarHeadCell>
        </CalendarGridRow>
      </CalendarGridHead>
      <CalendarGridBody>
        <CalendarGridRow
          v-for="(weekDates, index) in month.rows"
          :key="`weekDate-${index}`"
          data-week
        >
          <CalendarWeek
            :data-testid="`week-${index}`"
            :row-index="index"
          />
          <CalendarCell
            v-for="(weekDate) in weekDates"
            :key="weekDate.toString()"

            :date="weekDate"
          >
            <CalendarCellTrigger
              :day="weekDate"
              :month="month.value"
            />
          </CalendarCell>
        </CalendarGridRow>
      </CalendarGridBody>
    </CalendarGrid>
  </CalendarRoot>
</template>
