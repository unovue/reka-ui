<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import { YearRangePickerCell, YearRangePickerCellTrigger, YearRangePickerGrid, YearRangePickerGridBody, YearRangePickerGridRow, YearRangePickerHeader, YearRangePickerHeading, YearRangePickerNext, YearRangePickerPrev, YearRangePickerRoot } from 'reka-ui'
import './styles.css'

const defaultValue = {
  start: new CalendarDate(2020, 1, 1),
  end: new CalendarDate(2024, 1, 1),
}
</script>

<template>
  <YearRangePickerRoot
    v-slot="{ grid }"
    :default-value="defaultValue"
    class="YearRangePicker"
  >
    <YearRangePickerHeader class="YearRangePickerHeader">
      <YearRangePickerPrev class="YearRangePickerNavButton">
        <Icon
          icon="radix-icons:chevron-left"
          class="Icon"
        />
      </YearRangePickerPrev>
      <YearRangePickerHeading class="YearRangePickerHeading" />
      <YearRangePickerNext class="YearRangePickerNavButton">
        <Icon
          icon="radix-icons:chevron-right"
          class="Icon"
        />
      </YearRangePickerNext>
    </YearRangePickerHeader>
    <div class="YearRangePickerWrapper">
      <YearRangePickerGrid class="YearRangePickerGrid">
        <YearRangePickerGridBody class="YearRangePickerGridWrapper">
          <YearRangePickerGridRow
            v-for="(years, index) in grid.rows"
            :key="`year-${index}`"
            class="YearRangePickerGridRow"
          >
            <YearRangePickerCell
              v-for="year in years"
              :key="year.toString()"
              :date="year"
              class="YearRangePickerCell"
            >
              <YearRangePickerCellTrigger
                :year="year"
                class="YearRangePickerCellTrigger"
              />
            </YearRangePickerCell>
          </YearRangePickerGridRow>
        </YearRangePickerGridBody>
      </YearRangePickerGrid>
    </div>
  </YearRangePickerRoot>
</template>
