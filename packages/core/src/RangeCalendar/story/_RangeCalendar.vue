<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import type { RangeCalendarRootProps } from '..'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot } from '..'

const props = defineProps<{
  calendarProps?: RangeCalendarRootProps
  emits?: { 'onUpdate:modelValue'?: (data: DateValue) => void }
}>()

function pagingFunc(date: DateValue, sign: -1 | 1) {
  if (sign === -1)
    return date.subtract({ years: 1 })
  return date.add({ years: 1 })
}
</script>

<template>
  <RangeCalendarRoot
    v-slot="{ weekDays, grid }"
    v-bind="props.calendarProps"
    data-testid="calendar"
    v-on="{ 'update:modelValue': props.emits?.['onUpdate:modelValue'] }"
  >
    <RangeCalendarHeader data-testid="header">
      <RangeCalendarPrev
        data-testid="prev-year-button"
        :prev-page="(date: DateValue) => pagingFunc(date, -1)"
      />
      <RangeCalendarPrev
        data-testid="prev-button"
      />
      <RangeCalendarHeading data-testid="heading" />
      <RangeCalendarNext
        data-testid="next-button"
      />
      <RangeCalendarNext
        data-testid="next-year-button"
        :next-page="(date: DateValue) => pagingFunc(date, 1)"
      />
    </RangeCalendarHeader>

    <RangeCalendarGrid
      v-for="(month, gridIndex) in grid"
      :key="month.value.toString()"
      :data-testid="`grid-${month.value.month}`"
    >
      <RangeCalendarGridHead :data-testid="`grid-head-${month.value.month}`">
        <RangeCalendarGridRow>
          <RangeCalendarHeadCell
            v-for="(day, i) in weekDays"
            :key="day"
            :data-testid="`weekday-${month.value.month}-${i}`"
          >
            {{ day }}
          </RangeCalendarHeadCell>
        </RangeCalendarGridRow>
      </RangeCalendarGridHead>
      <RangeCalendarGridBody :data-testid="`grid-body-${month.value.month}`">
        <RangeCalendarGridRow
          v-for="(weekDates, index) in month.rows"
          :key="`weekDate-${index}`"
          data-week
          :data-testid="`grid-row-${month.value.month}-${index}`"
        >
          <RangeCalendarCell
            v-for="(weekDate, d) in weekDates"
            :key="weekDate.toString()"
            :data-testid="`cell-${weekDate.month}-${d}`"
            :date="weekDate"
          >
            <RangeCalendarCellTrigger
              :day="weekDate"
              :month="month.value"
              :data-testid="`date-${props.calendarProps?.numberOfMonths ?? 1 > 1 ? `${gridIndex}-` : ''}${weekDate.month}-${weekDate.day}`"
            />
          </RangeCalendarCell>
        </RangeCalendarGridRow>
      </RangeCalendarGridBody>
    </RangeCalendarGrid>
  </RangeCalendarRoot>
</template>
