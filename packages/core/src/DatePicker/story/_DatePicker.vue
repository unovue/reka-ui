<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import type { DatePickerRootProps } from '..'
import { Label } from '@/Label'
import {
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerContent,
  DatePickerField,
  DatePickerGrid,
  DatePickerGridBody,
  DatePickerGridHead,
  DatePickerGridRow,
  DatePickerHeadCell,
  DatePickerHeader,
  DatePickerHeading,
  DatePickerInput,
  DatePickerNext,
  DatePickerPrev,
  DatePickerRoot,
  DatePickerTrigger,
} from '..'

const props = defineProps<{ datePickerProps?: DatePickerRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateValue) => void } }>()
</script>

<template>
  <Label
    data-testid="label"
    for="date-picker-field"
  >Input label</Label>
  <DatePickerRoot
    id="date-picker-field"
    :is-date-unavailable="(date:DateValue) => date.day === 19"
    granularity="second"
    v-bind="props.datePickerProps"
    data-testid="picker"
    v-on="{ 'update:modelValue': props.emits?.['onUpdate:modelValue'] }"
  >
    <DatePickerField
      v-slot="{ segments }"
      data-testid="input"
    >
      <DatePickerInput
        v-for="item in segments"
        :key="item.part"
        :part="item.part"
        :data-testid="item.part === 'literal' ? undefined : item.part"
      >
        {{ item.value }}
      </DatePickerInput>
      <DatePickerTrigger data-testid="trigger">
        Open
      </DatePickerTrigger>
    </DatePickerField>

    <DatePickerContent data-testid="popover-content">
      <DatePickerCalendar
        v-slot="{ weekDays, grid }"
        data-testid="calendar"
      >
        <DatePickerHeader data-testid="header">
          <DatePickerPrev data-testid="prev-button" />
          <DatePickerHeading data-testid="heading" />
          <DatePickerNext data-testid="next-button" />
        </DatePickerHeader>

        <DatePickerGrid
          v-for="month in grid"
          :key="month.value.toString()"
          :data-testid="`grid-${month.value.month}`"
        >
          <DatePickerGridHead :data-testid="`grid-head-${month.value.month}`">
            <DatePickerGridRow>
              <DatePickerHeadCell
                v-for="(day, i) in weekDays"
                :key="day"
                :data-testid="`weekday-${month.value.month}-${i}`"
              >
                {{ day }}
              </DatePickerHeadCell>
            </DatePickerGridRow>
          </DatePickerGridHead>
          <DatePickerGridBody>
            <DatePickerGridRow
              v-for="(weekDates, index) in month.rows"
              :key="`weekDate-${index}`"
              :data-testid="`grid-body-${month.value.month}`"
            >
              <DatePickerCell
                v-for="(weekDate, d) in weekDates"
                :key="weekDate.toString()"
                :date="weekDate"
                :data-testid="`cell-${weekDate.month}-${d}`"
              >
                <DatePickerCellTrigger
                  :day="weekDate"
                  :month="month.value"
                  :data-testid="`date-${weekDate.month}-${weekDate.day}`"
                />
              </DatePickerCell>
            </DatePickerGridRow>
          </DatePickerGridBody>
        </DatePickerGrid>
      </DatePickerCalendar>
    </DatePickerContent>
  </DatePickerRoot>
</template>
