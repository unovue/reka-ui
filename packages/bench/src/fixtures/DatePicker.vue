<script setup>
// DatePicker: N instances of a typical composition (closed/default state)
import { DatePickerCalendar, DatePickerCell, DatePickerCellTrigger, DatePickerContent, DatePickerField, DatePickerGrid, DatePickerGridBody, DatePickerGridHead, DatePickerGridRow, DatePickerHeadCell, DatePickerHeader, DatePickerHeading, DatePickerInput, DatePickerNext, DatePickerPrev, DatePickerRoot, DatePickerTrigger } from 'reka-ui'

import { startDate } from '../date.js'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <DatePickerRoot
      locale="en-US"
      :default-placeholder="startDate"
    >
      <DatePickerField v-slot="{ segments }">
        <DatePickerInput
          v-for="item in segments"
          :key="item.part"
          :part="item.part"
        >
          {{ item.value }}
        </DatePickerInput>
        <DatePickerTrigger class="trg">
          Open
        </DatePickerTrigger>
      </DatePickerField>
      <DatePickerContent>
        <DatePickerCalendar v-slot="{ weekDays, grid }">
          <DatePickerHeader><DatePickerPrev>Prev</DatePickerPrev><DatePickerHeading /><DatePickerNext>Next</DatePickerNext></DatePickerHeader>
          <DatePickerGrid
            v-for="month in grid"
            :key="month.value.toString()"
            :value="month.value"
          >
            <DatePickerGridHead>
              <DatePickerGridRow>
                <DatePickerHeadCell
                  v-for="day in weekDays"
                  :key="day"
                >
                  {{ day }}
                </DatePickerHeadCell>
              </DatePickerGridRow>
            </DatePickerGridHead>
            <DatePickerGridBody>
              <DatePickerGridRow
                v-for="(weekDates, index) in month.rows"
                :key="`w-${index}`"
              >
                <DatePickerCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  :value="weekDate"
                >
                  <DatePickerCellTrigger :value="weekDate" />
                </DatePickerCell>
              </DatePickerGridRow>
            </DatePickerGridBody>
          </DatePickerGrid>
        </DatePickerCalendar>
      </DatePickerContent>
    </DatePickerRoot>
  </div>
</template>
