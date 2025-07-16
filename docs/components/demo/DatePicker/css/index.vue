<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  DatePickerArrow,
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
  Label,
} from 'reka-ui'

import './styles.css'
</script>

<template>
  <div class="DateFieldWrapper">
    <Label
      class="DateFieldLabel"
      for="date-field"
    >Birthday</Label>
    <DatePickerRoot
      id="date-field"
      :is-date-unavailable="date => date.day === 19"
      granularity="second"
    >
      <DatePickerField
        v-slot="{ segments }"
        class="DateField"
      >
        <template
          v-for="item in segments"
          :key="item.part"
        >
          <DatePickerInput
            v-if="item.part === 'literal'"
            :part="item.part"
            class="DateFieldLiteral"
          >
            {{ item.value }}
          </DatePickerInput>
          <DatePickerInput
            v-else
            :part="item.part"
            class="DateFieldSegment"
          >
            {{ item.value }}
          </DatePickerInput>
        </template>

        <DatePickerTrigger class="PopoverTrigger">
          <Icon
            icon="radix-icons:calendar"
            class="Icon"
          />
        </DatePickerTrigger>
      </DatePickerField>

      <DatePickerContent
        align="end"
        :side-offset="16"
        class="PopoverContent"
      >
        <DatePickerArrow class="PopoverArrow" />
        <DatePickerCalendar
          v-slot="{ weekDays, grid }"
          class="Calendar"
        >
          <DatePickerHeader class="CalendarHeader">
            <DatePickerPrev
              class="CalendarNavButton"
            >
              <Icon
                icon="radix-icons:chevron-left"
                class="Icon"
              />
            </DatePickerPrev>

            <DatePickerHeading class="CalendarHeading" />
            <DatePickerNext
              class="CalendarNavButton"
            >
              <Icon
                icon="radix-icons:chevron-right"
                class="Icon"
              />
            </DatePickerNext>
          </DatePickerHeader>
          <div
            class="CalendarWrapper"
          >
            <DatePickerGrid
              v-for="month in grid"
              :key="month.value.toString()"
              class="CalendarGrid"
            >
              <DatePickerGridHead>
                <DatePickerGridRow class="CalendarGridRow">
                  <DatePickerHeadCell
                    v-for="day in weekDays"
                    :key="day"
                    class="CalendarHeadCell"
                  >
                    {{ day }}
                  </DatePickerHeadCell>
                </DatePickerGridRow>
              </DatePickerGridHead>
              <DatePickerGridBody>
                <DatePickerGridRow
                  v-for="(weekDates, index) in month.rows"
                  :key="`weekDate-${index}`"
                  class="CalendarGridRow"
                >
                  <DatePickerCell
                    v-for="weekDate in weekDates"
                    :key="weekDate.toString()"
                    :date="weekDate"
                    class="CalendarCell"
                  >
                    <DatePickerCellTrigger
                      :day="weekDate"
                      :month="month.value"
                      class="CalendarCellTrigger"
                    />
                  </DatePickerCell>
                </DatePickerGridRow>
              </DatePickerGridBody>
            </DatePickerGrid>
          </div>
        </DatePickerCalendar>
      </DatePickerContent>
    </DatePickerRoot>
  </div>
</template>
