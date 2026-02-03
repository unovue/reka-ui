<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import type { MonthPickerRootProps } from '..'
import { MonthPickerCell, MonthPickerCellTrigger, MonthPickerGrid, MonthPickerGridBody, MonthPickerGridRow, MonthPickerHeader, MonthPickerHeading, MonthPickerNext, MonthPickerPrev, MonthPickerRoot } from '..'

const props = defineProps<{ pickerProps?: MonthPickerRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateValue) => void } }>()
</script>

<template>
  <MonthPickerRoot
    v-slot="{ grid }"
    v-bind="props.pickerProps"
    data-testid="month-picker"
    v-on="{ 'update:modelValue': props.emits?.['onUpdate:modelValue'] }"
  >
    <MonthPickerHeader data-testid="header">
      <MonthPickerPrev data-testid="prev-button" />
      <MonthPickerHeading data-testid="heading" />
      <MonthPickerNext data-testid="next-button" />
    </MonthPickerHeader>

    <MonthPickerGrid data-testid="grid">
      <MonthPickerGridBody data-testid="grid-body">
        <MonthPickerGridRow
          v-for="(monthRow, rowIndex) in grid.rows"
          :key="`monthRow-${rowIndex}`"
          :data-testid="`grid-row-${rowIndex}`"
        >
          <MonthPickerCell
            v-for="(month, cellIndex) in monthRow"
            :key="month.toString()"
            :data-testid="`cell-${rowIndex}-${cellIndex}`"
            :date="month"
          >
            <MonthPickerCellTrigger
              :month="month"
              :data-testid="`month-${month.month}`"
            />
          </MonthPickerCell>
        </MonthPickerGridRow>
      </MonthPickerGridBody>
    </MonthPickerGrid>
  </MonthPickerRoot>
</template>
