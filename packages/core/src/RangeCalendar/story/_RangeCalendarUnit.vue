<script lang="ts" setup>
import type { RangeCalendarRootEmits, RangeCalendarRootProps } from '..'
import { useForwardPropsEmits } from '@/shared'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridRow, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot } from '..'

/**
 * Test/story harness for a single-view range picker (`granularity="month"` or
 * `"year"`), which is how a v2 `MonthRangePicker` / `YearRangePicker` migrates.
 * Cells carry `data-testid="cell-<value>"`.
 */
const props = defineProps<RangeCalendarRootProps>()
const emits = defineEmits<RangeCalendarRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <RangeCalendarRoot
    v-slot="{ grid }"
    v-bind="forwarded"
    data-testid="calendar"
  >
    <RangeCalendarHeader>
      <RangeCalendarPrev data-testid="prev-button" />
      <RangeCalendarHeading data-testid="heading" />
      <RangeCalendarNext data-testid="next-button" />
    </RangeCalendarHeader>
    <RangeCalendarGrid
      v-for="page in grid"
      :key="page.value.toString()"
      :value="page.value"
      data-testid="grid"
    >
      <RangeCalendarGridBody>
        <RangeCalendarGridRow
          v-for="(row, index) in page.rows"
          :key="`row-${index}`"
          data-row
        >
          <RangeCalendarCell
            v-for="cell in row"
            :key="cell.toString()"
            :value="cell"
          >
            <RangeCalendarCellTrigger
              :value="cell"
              :data-testid="`cell-${cell.toString()}`"
            />
          </RangeCalendarCell>
        </RangeCalendarGridRow>
      </RangeCalendarGridBody>
    </RangeCalendarGrid>
  </RangeCalendarRoot>
</template>
