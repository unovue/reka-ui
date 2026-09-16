<script lang="ts" setup>
import type { CalendarRootEmits, CalendarRootProps } from '..'
import { useForwardPropsEmits } from '@/shared'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridRow, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot } from '..'

/**
 * Test/story harness for a single-view picker (`granularity="month"` or
 * `"year"`): no `CalendarView`, the grid sits straight under the root, which
 * is how a v2 `MonthPicker` / `YearPicker` migrates. Cells carry
 * `data-testid="cell-<value>"`.
 */
const props = defineProps<CalendarRootProps>()
const emits = defineEmits<CalendarRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <CalendarRoot
    v-slot="{ grid }"
    v-bind="forwarded"
    data-testid="calendar"
  >
    <CalendarHeader>
      <CalendarPrev data-testid="prev-button" />
      <CalendarHeading data-testid="heading" />
      <CalendarNext data-testid="next-button" />
    </CalendarHeader>
    <CalendarGrid
      v-for="page in grid"
      :key="page.value.toString()"
      :value="page.value"
      data-testid="grid"
    >
      <CalendarGridBody>
        <CalendarGridRow
          v-for="(row, index) in page.rows"
          :key="`row-${index}`"
          data-row
        >
          <CalendarCell
            v-for="cell in row"
            :key="cell.toString()"
            :value="cell"
          >
            <CalendarCellTrigger
              :value="cell"
              :data-testid="`cell-${cell.toString()}`"
            />
          </CalendarCell>
        </CalendarGridRow>
      </CalendarGridBody>
    </CalendarGrid>
  </CalendarRoot>
</template>
