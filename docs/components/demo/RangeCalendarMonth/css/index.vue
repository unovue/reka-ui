<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridRow, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot } from 'reka-ui'
import './styles.css'

const defaultValue = {
  start: new CalendarDate(2024, 3, 1),
  end: new CalendarDate(2024, 6, 1),
}
</script>

<template>
  <RangeCalendarRoot
    v-slot="{ grid }"
    granularity="month"
    :default-value="defaultValue"
    class="RangeCalendarMonth"
  >
    <RangeCalendarHeader class="RangeCalendarMonthHeader">
      <RangeCalendarPrev class="RangeCalendarMonthNavButton">
        <Icon
          icon="radix-icons:chevron-left"
          class="Icon"
        />
      </RangeCalendarPrev>
      <RangeCalendarHeading class="RangeCalendarMonthHeading" />
      <RangeCalendarNext class="RangeCalendarMonthNavButton">
        <Icon
          icon="radix-icons:chevron-right"
          class="Icon"
        />
      </RangeCalendarNext>
    </RangeCalendarHeader>
    <div class="RangeCalendarMonthWrapper">
      <RangeCalendarGrid
        v-for="page in grid"
        :key="page.value.toString()"
        :value="page.value"
        class="RangeCalendarMonthGrid"
      >
        <RangeCalendarGridBody class="RangeCalendarMonthGridWrapper">
          <RangeCalendarGridRow
            v-for="(months, index) in page.rows"
            :key="`month-${index}`"
            class="RangeCalendarMonthGridRow"
          >
            <RangeCalendarCell
              v-for="month in months"
              :key="month.toString()"
              :value="month"
              class="RangeCalendarMonthCell"
            >
              <RangeCalendarCellTrigger
                :value="month"
                class="RangeCalendarMonthCellTrigger"
              />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </div>
  </RangeCalendarRoot>
</template>
