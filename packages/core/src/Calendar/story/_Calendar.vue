<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import type { CalendarRootProps } from '..'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot } from '..'

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
      v-for="(month, gridIndex) in grid"
      :key="month.value.toString()"
      :data-testid="`grid-${month.value.month}`"
    >
      <CalendarGridHead :data-testid="`grid-head-${month.value.month}`">
        <CalendarGridRow>
          <CalendarHeadCell
            v-for="(day, i) in weekDays"
            :key="day"
            :data-testid="`weekday-${month.value.month}-${i}`"
          >
            {{ day }}
          </CalendarHeadCell>
        </CalendarGridRow>
      </CalendarGridHead>
      <CalendarGridBody :data-testid="`grid-body-${month.value.month}`">
        <CalendarGridRow
          v-for="(weekDates, index) in month.rows"
          :key="`weekDate-${index}`"
          data-week
          :data-testid="`grid-row-${month.value.month}-${index}`"
        >
          <CalendarCell
            v-for="(weekDate, d) in weekDates"
            :key="weekDate.toString()"
            :data-testid="`cell-${weekDate.month}-${d}`"
            :date="weekDate"
          >
            <CalendarCellTrigger
              :day="weekDate"
              :month="month.value"
              :data-testid="`date-${props.calendarProps?.numberOfMonths ?? 1 > 1 ? `${gridIndex}-` : ''}${weekDate.month}-${weekDate.day}`"
            />
          </CalendarCell>
        </CalendarGridRow>
      </CalendarGridBody>
    </CalendarGrid>
  </CalendarRoot>
</template>
