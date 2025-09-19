<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  DateRangePickerArrow,
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
    <DateRangePickerRoot
      id="date-field"
      :is-date-unavailable="date => date.day === 19"
      granularity="second"
    >
      <DateRangePickerField
        v-slot="{ segments }"
        class="DateField"
      >
        <template
          v-for="item in segments.start"
          :key="item.part"
        >
          <DateRangePickerInput
            v-if="item.part === 'literal'"
            :part="item.part"
            class="DateFieldLiteral"
            type="start"
          >
            {{ item.value }}
          </DateRangePickerInput>
          <DateRangePickerInput
            v-else
            :part="item.part"
            class="DateFieldSegment"
            type="start"
          >
            {{ item.value }}
          </DateRangePickerInput>
        </template>
        -
        <template
          v-for="item in segments.end"
          :key="item.part"
        >
          <DateRangePickerInput
            v-if="item.part === 'literal'"
            :part="item.part"
            class="DateFieldLiteral"
            type="end"
          >
            {{ item.value }}
          </DateRangePickerInput>
          <DateRangePickerInput
            v-else
            :part="item.part"
            class="DateFieldSegment"
            type="end"
          >
            {{ item.value }}
          </DateRangePickerInput>
        </template>

        <DateRangePickerTrigger class="PopoverTrigger">
          <Icon
            icon="radix-icons:calendar"
            class="Icon"
          />
        </DateRangePickerTrigger>
      </DateRangePickerField>

      <DateRangePickerContent
        align="end"
        :side-offset="16"
        class="PopoverContent"
      >
        <DateRangePickerArrow class="PopoverArrow" />
        <DateRangePickerCalendar
          v-slot="{ weekDays, grid }"
          class="Calendar"
        >
          <DateRangePickerHeader class="CalendarHeader">
            <DateRangePickerPrev
              class="CalendarNavButton"
            >
              <Icon
                icon="radix-icons:chevron-left"
                class="Icon"
              />
            </DateRangePickerPrev>

            <DateRangePickerHeading class="CalendarHeading" />
            <DateRangePickerNext
              class="CalendarNavButton"
            >
              <Icon
                icon="radix-icons:chevron-right"
                class="Icon"
              />
            </DateRangePickerNext>
          </DateRangePickerHeader>
          <div
            class="CalendarWrapper"
          >
            <DateRangePickerGrid
              v-for="month in grid"
              :key="month.value.toString()"
              class="CalendarGrid"
            >
              <DateRangePickerGridHead>
                <DateRangePickerGridRow class="CalendarGridRow">
                  <DateRangePickerHeadCell
                    v-for="day in weekDays"
                    :key="day"
                    class="CalendarHeadCell"
                  >
                    {{ day }}
                  </DateRangePickerHeadCell>
                </DateRangePickerGridRow>
              </DateRangePickerGridHead>
              <DateRangePickerGridBody>
                <DateRangePickerGridRow
                  v-for="(weekDates, index) in month.rows"
                  :key="`weekDate-${index}`"
                  class="CalendarGridRow"
                >
                  <DateRangePickerCell
                    v-for="weekDate in weekDates"
                    :key="weekDate.toString()"
                    :date="weekDate"
                    class="CalendarCell"
                  >
                    <DateRangePickerCellTrigger
                      :day="weekDate"
                      :month="month.value"
                      class="CalendarCellTrigger"
                    />
                  </DateRangePickerCell>
                </DateRangePickerGridRow>
              </DateRangePickerGridBody>
            </DateRangePickerGrid>
          </div>
        </DateRangePickerCalendar>
      </DateRangePickerContent>
    </DateRangePickerRoot>
  </div>
</template>
