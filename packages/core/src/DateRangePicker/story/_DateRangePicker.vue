<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import type { DateRangePickerRootProps } from '..'
import { Label } from '@/Label'
import {
  DateRangePickerCalendar,
  DateRangePickerCell,
  DateRangePickerCellTrigger,
  DateRangePickerContent,
  DateRangePickerField,
  DateRangePickerGrid,
  DateRangePickerGridBody,
  DateRangePickerGridHead,
  DateRangePickerGridRow,
  DateRangePickerHeadCell,
  DateRangePickerHeader,
  DateRangePickerHeading,
  DateRangePickerInput,
  DateRangePickerNext,
  DateRangePickerPrev,
  DateRangePickerRoot,
  DateRangePickerTrigger,
} from '..'

const props = defineProps<{ dateFieldProps?: DateRangePickerRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateValue) => void } }>()
</script>

<template>
  <Label
    data-testid="label"
    for="date-picker-field"
  >Input label</Label>
  <DateRangePickerRoot
    id="date-picker-field"
    :is-date-unavailable="(date:DateValue) => date.day === 19"
    v-bind="props.dateFieldProps"
    data-testid="picker"
    v-on="{ 'update:modelValue': props.emits?.['onUpdate:modelValue'] }"
  >
    <DateRangePickerField
      v-slot="{ segments }"
      data-testid="input"
    >
      <DateRangePickerInput
        v-for="item in segments.start"
        :key="item.part"
        type="start"
        :part="item.part"
        :data-testid="item.part === 'literal' ? undefined : `start-${item.part}`"
      >
        {{ item.value }}
      </DateRangePickerInput>
      -
      <DateRangePickerInput
        v-for="item in segments.end"
        :key="item.part"
        type="end"
        :part="item.part"
        :data-testid="item.part === 'literal' ? undefined : `end-${item.part}`"
      >
        {{ item.value }}
      </DateRangePickerInput>
      <DateRangePickerTrigger data-testid="trigger">
        Open
      </DateRangePickerTrigger>
    </DateRangePickerField>

    <DateRangePickerContent data-testid="popover-content">
      <DateRangePickerCalendar
        v-slot="{ weekDays, grid }"
        data-testid="calendar"
      >
        <DateRangePickerHeader data-testid="header">
          <DateRangePickerPrev data-testid="prev-button" />
          <DateRangePickerHeading data-testid="heading" />
          <DateRangePickerNext data-testid="next-button" />
        </DateRangePickerHeader>

        <DateRangePickerGrid
          v-for="month in grid"
          :key="month.value.toString()"
          :data-testid="`grid-${month.value.month}`"
        >
          <DateRangePickerGridHead :data-testid="`grid-head-${month.value.month}`">
            <DateRangePickerGridRow>
              <DateRangePickerHeadCell
                v-for="(day, i) in weekDays"
                :key="day"
                :data-testid="`weekday-${month.value.month}-${i}`"
              >
                {{ day }}
              </DateRangePickerHeadCell>
            </DateRangePickerGridRow>
          </DateRangePickerGridHead>
          <DateRangePickerGridBody>
            <DateRangePickerGridRow
              v-for="(weekDates, index) in month.rows"
              :key="`weekDate-${index}`"
              :data-testid="`grid-body-${month.value.month}`"
            >
              <DateRangePickerCell
                v-for="(weekDate, d) in weekDates"
                :key="weekDate.toString()"
                :date="weekDate"
                :data-testid="`cell-${weekDate.month}-${d}`"
              >
                <DateRangePickerCellTrigger
                  :day="weekDate"
                  :month="month.value"
                  :data-testid="`date-${weekDate.month}-${weekDate.day}`"
                />
              </DateRangePickerCell>
            </DateRangePickerGridRow>
          </DateRangePickerGridBody>
        </DateRangePickerGrid>
      </DateRangePickerCalendar>
    </DateRangePickerContent>
  </DateRangePickerRoot>
</template>
