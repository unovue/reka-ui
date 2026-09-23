<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot } from 'reka-ui'
import { getWeekNumber } from 'reka-ui/date'
</script>

<template>
  <CalendarRoot
    v-slot="{ weekDays, grid }"
    class="Calendar"
    fixed-weeks
  >
    <CalendarHeader class="CalendarHeader">
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
              class="CalendarHeadCell"
            >
              Wk
            </CalendarHeadCell>
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
            <div
              class="CalendarWeek"
              :row-index="index"
            >
              {{ getWeekNumber(weekDates[0]) }}
            </div>
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
