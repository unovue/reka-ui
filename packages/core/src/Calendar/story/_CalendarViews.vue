<script lang="ts" setup>
import type { CalendarRootEmits, CalendarRootProps } from '..'
import { useForwardPropsEmits } from '@/shared'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarNext, CalendarPrev, CalendarRoot, CalendarView, CalendarViewTrigger } from '..'

/**
 * Test/story harness: a calendar with all three views and a heading that
 * drills up. Cells carry `data-testid="<view>-<value>"`.
 */
const props = defineProps<CalendarRootProps>()
const emits = defineEmits<CalendarRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <CalendarRoot
    v-bind="forwarded"
    data-testid="calendar"
  >
    <CalendarHeader data-testid="header">
      <CalendarPrev data-testid="prev-button" />
      <CalendarViewTrigger data-testid="view-trigger" />
      <CalendarNext data-testid="next-button" />
    </CalendarHeader>

    <CalendarView
      v-slot="{ grid, weekDays }"
      view="day"
      data-testid="view-day"
    >
      <CalendarGrid
        v-for="month in grid"
        :key="month.value.toString()"
        :value="month.value"
        :data-testid="`grid-${month.value.month}`"
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
            :key="`weekDate-${index}`"
          >
            <CalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :value="weekDate"
            >
              <CalendarCellTrigger
                :value="weekDate"
                :data-testid="`day-${weekDate.toString()}`"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </CalendarView>

    <CalendarView
      v-slot="{ grid }"
      view="month"
      data-testid="view-month"
    >
      <CalendarGrid
        v-for="page in grid"
        :key="page.value.toString()"
        :value="page.value"
        data-testid="grid-months"
      >
        <CalendarGridBody>
          <CalendarGridRow
            v-for="(row, index) in page.rows"
            :key="`row-${index}`"
          >
            <CalendarCell
              v-for="cell in row"
              :key="cell.toString()"
              :value="cell"
            >
              <CalendarCellTrigger
                :value="cell"
                :data-testid="`month-${cell.toString()}`"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </CalendarView>

    <CalendarView
      v-slot="{ grid }"
      view="year"
      data-testid="view-year"
    >
      <CalendarGrid
        v-for="page in grid"
        :key="page.value.toString()"
        :value="page.value"
        data-testid="grid-years"
      >
        <CalendarGridBody>
          <CalendarGridRow
            v-for="(row, index) in page.rows"
            :key="`row-${index}`"
          >
            <CalendarCell
              v-for="cell in row"
              :key="cell.toString()"
              :value="cell"
            >
              <CalendarCellTrigger
                :value="cell"
                :data-testid="`year-${cell.toString()}`"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </CalendarView>
  </CalendarRoot>
</template>
