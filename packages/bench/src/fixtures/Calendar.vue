<script setup>
// Calendar: N instances of a typical composition (closed/default state)
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot } from 'reka-ui'

import { startDate } from '../date.js'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <CalendarRoot
      v-slot="{ weekDays, grid }"
      :default-placeholder="startDate"
      locale="en-US"
    >
      <CalendarHeader>
        <CalendarPrev>Prev</CalendarPrev><CalendarHeading /><CalendarNext class="cal-next">
          Next
        </CalendarNext>
      </CalendarHeader>
      <CalendarGrid
        v-for="month in grid"
        :key="month.value.toString()"
        :value="month.value"
      >
        <CalendarGridHead>
          <CalendarGridRow>
            <CalendarHeadCell
              v-for="day in weekDays"
              :key="day"
            >
              {{ day }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>
        <CalendarGridBody>
          <CalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="`w-${index}`"
          >
            <CalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :value="weekDate"
            >
              <CalendarCellTrigger :value="weekDate" />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </CalendarRoot>
  </div>
</template>
