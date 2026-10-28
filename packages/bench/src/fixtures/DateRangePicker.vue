<script setup>
// DateRangePicker: N instances of a typical composition (closed/default state)
import { DateRangePickerCalendar, DateRangePickerCell, DateRangePickerCellTrigger, DateRangePickerContent, DateRangePickerField, DateRangePickerGrid, DateRangePickerGridBody, DateRangePickerGridHead, DateRangePickerGridRow, DateRangePickerHeadCell, DateRangePickerHeader, DateRangePickerHeading, DateRangePickerInput, DateRangePickerNext, DateRangePickerPrev, DateRangePickerRoot, DateRangePickerTrigger } from 'reka-ui'

import { startDate } from '../date.js'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <DateRangePickerRoot
      locale="en-US"
      :default-placeholder="startDate"
    >
      <DateRangePickerField v-slot="{ segments }">
        <DateRangePickerInput
          v-for="item in segments.start"
          :key="`s-${item.part}`"
          :part="item.part"
          type="start"
        >
          {{ item.value }}
        </DateRangePickerInput>
        <DateRangePickerInput
          v-for="item in segments.end"
          :key="`e-${item.part}`"
          :part="item.part"
          type="end"
        >
          {{ item.value }}
        </DateRangePickerInput>
        <DateRangePickerTrigger class="trg">
          Open
        </DateRangePickerTrigger>
      </DateRangePickerField>
      <DateRangePickerContent>
        <DateRangePickerCalendar v-slot="{ weekDays, grid }">
          <DateRangePickerHeader><DateRangePickerPrev>Prev</DateRangePickerPrev><DateRangePickerHeading /><DateRangePickerNext>Next</DateRangePickerNext></DateRangePickerHeader>
          <DateRangePickerGrid
            v-for="month in grid"
            :key="month.value.toString()"
            :value="month.value"
          >
            <DateRangePickerGridHead>
              <DateRangePickerGridRow>
                <DateRangePickerHeadCell
                  v-for="day in weekDays"
                  :key="day"
                >
                  {{ day }}
                </DateRangePickerHeadCell>
              </DateRangePickerGridRow>
            </DateRangePickerGridHead>
            <DateRangePickerGridBody>
              <DateRangePickerGridRow
                v-for="(weekDates, index) in month.rows"
                :key="`w-${index}`"
              >
                <DateRangePickerCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  :value="weekDate"
                >
                  <DateRangePickerCellTrigger :value="weekDate" />
                </DateRangePickerCell>
              </DateRangePickerGridRow>
            </DateRangePickerGridBody>
          </DateRangePickerGrid>
        </DateRangePickerCalendar>
      </DateRangePickerContent>
    </DateRangePickerRoot>
  </div>
</template>
