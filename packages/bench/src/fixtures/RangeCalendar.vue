<script setup>
// RangeCalendar: N instances of a typical composition (closed/default state)
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot } from 'reka-ui'

import { startDate } from '../date.js'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <RangeCalendarRoot
      v-slot="{ weekDays, grid }"
      :default-placeholder="startDate"
      locale="en-US"
    >
      <RangeCalendarHeader>
        <RangeCalendarPrev>Prev</RangeCalendarPrev><RangeCalendarHeading /><RangeCalendarNext class="cal-next">
          Next
        </RangeCalendarNext>
      </RangeCalendarHeader>
      <RangeCalendarGrid
        v-for="month in grid"
        :key="month.value.toString()"
        :value="month.value"
      >
        <RangeCalendarGridHead>
          <RangeCalendarGridRow>
            <RangeCalendarHeadCell
              v-for="day in weekDays"
              :key="day"
            >
              {{ day }}
            </RangeCalendarHeadCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridHead>
        <RangeCalendarGridBody>
          <RangeCalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="`w-${index}`"
          >
            <RangeCalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :value="weekDate"
            >
              <RangeCalendarCellTrigger :value="weekDate" />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </RangeCalendarRoot>
  </div>
</template>
