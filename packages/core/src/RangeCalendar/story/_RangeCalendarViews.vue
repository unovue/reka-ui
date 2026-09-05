<script lang="ts" setup>
import type { RangeCalendarRootEmits, RangeCalendarRootProps } from '..'
import { useForwardPropsEmits } from '@/shared'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot, RangeCalendarView, RangeCalendarViewTrigger } from '..'

/** Test/story harness: a range calendar with all three views and a heading that drills up. */
const props = defineProps<RangeCalendarRootProps>()
const emits = defineEmits<RangeCalendarRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <RangeCalendarRoot
    v-bind="forwarded"
    data-testid="calendar"
  >
    <RangeCalendarHeader>
      <RangeCalendarPrev data-testid="prev-button" />
      <RangeCalendarViewTrigger data-testid="view-trigger" />
      <RangeCalendarNext data-testid="next-button" />
    </RangeCalendarHeader>

    <RangeCalendarView
      v-slot="{ grid, weekDays }"
      view="day"
      data-testid="view-day"
    >
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
            :key="`weekDate-${index}`"
          >
            <RangeCalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :value="weekDate"
            >
              <RangeCalendarCellTrigger
                :value="weekDate"
                :data-testid="`day-${weekDate.toString()}`"
              />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </RangeCalendarView>

    <RangeCalendarView
      v-for="unit in (['month', 'year'] as const)"
      :key="unit"
      v-slot="{ grid }"
      :view="unit"
      :data-testid="`view-${unit}`"
    >
      <RangeCalendarGrid
        v-for="page in grid"
        :key="page.value.toString()"
        :value="page.value"
      >
        <RangeCalendarGridBody>
          <RangeCalendarGridRow
            v-for="(row, index) in page.rows"
            :key="`row-${index}`"
          >
            <RangeCalendarCell
              v-for="cell in row"
              :key="cell.toString()"
              :value="cell"
            >
              <RangeCalendarCellTrigger
                :value="cell"
                :data-testid="`${unit}-${cell.toString()}`"
              />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </RangeCalendarView>
  </RangeCalendarRoot>
</template>
