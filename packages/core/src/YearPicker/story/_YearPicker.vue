<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import type { Component } from 'vue'
import type { YearPickerRootProps } from '..'
import { YearPickerCell, YearPickerCellTrigger, YearPickerGrid, YearPickerGridBody, YearPickerGridRow, YearPickerHeader, YearPickerHeading, YearPickerNext, YearPickerPrev, YearPickerRoot } from '..'

const props = defineProps<{ pickerProps?: YearPickerRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateValue) => void }, triggerAs?: string | Component }>()
</script>

<template>
  <YearPickerRoot
    v-slot="{ grid }"
    v-bind="props.pickerProps"
    data-testid="year-picker"
    v-on="{ 'update:modelValue': props.emits?.['onUpdate:modelValue'] }"
  >
    <YearPickerHeader data-testid="header">
      <YearPickerPrev data-testid="prev-button" />
      <YearPickerHeading data-testid="heading" />
      <YearPickerNext data-testid="next-button" />
    </YearPickerHeader>

    <YearPickerGrid data-testid="grid">
      <YearPickerGridBody data-testid="grid-body">
        <YearPickerGridRow
          v-for="(yearRow, rowIndex) in grid.rows"
          :key="`yearRow-${rowIndex}`"
          :data-testid="`grid-row-${rowIndex}`"
        >
          <YearPickerCell
            v-for="(year, cellIndex) in yearRow"
            :key="year.toString()"
            :data-testid="`cell-${rowIndex}-${cellIndex}`"
            :date="year"
          >
            <YearPickerCellTrigger
              :as="props.triggerAs"
              :year="year"
              :data-testid="`year-${year.year}`"
            />
          </YearPickerCell>
        </YearPickerGridRow>
      </YearPickerGridBody>
    </YearPickerGrid>
  </YearPickerRoot>
</template>
