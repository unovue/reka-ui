<script lang="ts" setup>
import type { YearRangePickerRootProps } from '..'
import type { DateRange } from '@/shared/date'
import { YearRangePickerCell, YearRangePickerCellTrigger, YearRangePickerGrid, YearRangePickerGridBody, YearRangePickerGridRow, YearRangePickerHeader, YearRangePickerHeading, YearRangePickerNext, YearRangePickerPrev, YearRangePickerRoot } from '..'

const props = defineProps<{ pickerProps?: YearRangePickerRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateRange) => void } }>()
</script>

<template>
  <YearRangePickerRoot
    v-slot="{ grid }"
    v-bind="props.pickerProps"
    data-testid="year-range-picker"
    v-on="{ 'update:modelValue': props.emits?.['onUpdate:modelValue'] }"
  >
    <YearRangePickerHeader data-testid="header">
      <YearRangePickerPrev data-testid="prev-button" />
      <YearRangePickerHeading data-testid="heading" />
      <YearRangePickerNext data-testid="next-button" />
    </YearRangePickerHeader>

    <YearRangePickerGrid data-testid="grid">
      <YearRangePickerGridBody data-testid="grid-body">
        <YearRangePickerGridRow
          v-for="(yearRow, rowIndex) in grid.rows"
          :key="`yearRow-${rowIndex}`"
          :data-testid="`grid-row-${rowIndex}`"
        >
          <YearRangePickerCell
            v-for="(year, cellIndex) in yearRow"
            :key="year.toString()"
            :data-testid="`cell-${rowIndex}-${cellIndex}`"
            :date="year"
          >
            <YearRangePickerCellTrigger
              :year="year"
              :data-testid="`year-${year.year}`"
            />
          </YearRangePickerCell>
        </YearRangePickerGridRow>
      </YearRangePickerGridBody>
    </YearRangePickerGrid>
  </YearRangePickerRoot>
</template>
