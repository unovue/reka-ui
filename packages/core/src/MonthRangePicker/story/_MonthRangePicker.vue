<script lang="ts" setup>
import type { MonthRangePickerRootProps } from '..'
import type { DateRange } from '@/shared/date'
import { MonthRangePickerCell, MonthRangePickerCellTrigger, MonthRangePickerGrid, MonthRangePickerGridBody, MonthRangePickerGridRow, MonthRangePickerHeader, MonthRangePickerHeading, MonthRangePickerNext, MonthRangePickerPrev, MonthRangePickerRoot } from '..'

const props = defineProps<{ pickerProps?: MonthRangePickerRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateRange) => void } }>()
</script>

<template>
  <MonthRangePickerRoot
    v-slot="{ grid }"
    v-bind="props.pickerProps"
    data-testid="month-range-picker"
    v-on="{ 'update:modelValue': props.emits?.['onUpdate:modelValue'] }"
  >
    <MonthRangePickerHeader data-testid="header">
      <MonthRangePickerPrev data-testid="prev-button" />
      <MonthRangePickerHeading data-testid="heading" />
      <MonthRangePickerNext data-testid="next-button" />
    </MonthRangePickerHeader>

    <MonthRangePickerGrid data-testid="grid">
      <MonthRangePickerGridBody data-testid="grid-body">
        <MonthRangePickerGridRow
          v-for="(monthRow, rowIndex) in grid.rows"
          :key="`monthRow-${rowIndex}`"
          :data-testid="`grid-row-${rowIndex}`"
        >
          <MonthRangePickerCell
            v-for="(month, cellIndex) in monthRow"
            :key="month.toString()"
            :data-testid="`cell-${rowIndex}-${cellIndex}`"
            :date="month"
          >
            <MonthRangePickerCellTrigger
              :month="month"
              :data-testid="`month-${month.month}`"
            />
          </MonthRangePickerCell>
        </MonthRangePickerGridRow>
      </MonthRangePickerGridBody>
    </MonthRangePickerGrid>
  </MonthRangePickerRoot>
</template>
