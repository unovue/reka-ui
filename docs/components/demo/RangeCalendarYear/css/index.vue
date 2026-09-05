<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridRow, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot } from 'reka-ui'
import './styles.css'

const defaultValue = {
  start: new CalendarDate(2020, 1, 1),
  end: new CalendarDate(2024, 1, 1),
}
</script>

<template>
  <RangeCalendarRoot
    v-slot="{ grid }"
    granularity="year"
    :default-value="defaultValue"
    class="RangeCalendarYear"
  >
    <RangeCalendarHeader class="RangeCalendarYearHeader">
      <RangeCalendarPrev class="RangeCalendarYearNavButton">
        <Icon
          icon="radix-icons:chevron-left"
          class="Icon"
        />
      </RangeCalendarPrev>
      <RangeCalendarHeading class="RangeCalendarYearHeading" />
      <RangeCalendarNext class="RangeCalendarYearNavButton">
        <Icon
          icon="radix-icons:chevron-right"
          class="Icon"
        />
      </RangeCalendarNext>
    </RangeCalendarHeader>
    <div class="RangeCalendarYearWrapper">
      <RangeCalendarGrid
        v-for="page in grid"
        :key="page.value.toString()"
        :value="page.value"
        class="RangeCalendarYearGrid"
      >
        <RangeCalendarGridBody class="RangeCalendarYearGridWrapper">
          <RangeCalendarGridRow
            v-for="(years, index) in page.rows"
            :key="`year-${index}`"
            class="RangeCalendarYearGridRow"
          >
            <RangeCalendarCell
              v-for="year in years"
              :key="year.toString()"
              :value="year"
              class="RangeCalendarYearCell"
            >
              <RangeCalendarCellTrigger
                :value="year"
                class="RangeCalendarYearCellTrigger"
              />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </div>
  </RangeCalendarRoot>
</template>
