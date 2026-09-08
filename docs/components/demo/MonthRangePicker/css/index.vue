<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { MonthRangePickerCell, MonthRangePickerCellTrigger, MonthRangePickerGrid, MonthRangePickerGridBody, MonthRangePickerGridRow, MonthRangePickerHeader, MonthRangePickerHeading, MonthRangePickerNext, MonthRangePickerPrev, MonthRangePickerRoot } from 'reka-ui'
import { Temporal } from 'temporal-polyfill'
import './styles.css'

const defaultValue = {
  start: Temporal.PlainDate.from({ year: 2024, month: 3, day: 1 }),
  end: Temporal.PlainDate.from({ year: 2024, month: 6, day: 1 }),
}
</script>

<template>
  <MonthRangePickerRoot
    v-slot="{ grid }"
    :default-value="defaultValue"
    class="MonthRangePicker"
  >
    <MonthRangePickerHeader class="MonthRangePickerHeader">
      <MonthRangePickerPrev class="MonthRangePickerNavButton">
        <Icon
          icon="radix-icons:chevron-left"
          class="Icon"
        />
      </MonthRangePickerPrev>
      <MonthRangePickerHeading class="MonthRangePickerHeading" />
      <MonthRangePickerNext class="MonthRangePickerNavButton">
        <Icon
          icon="radix-icons:chevron-right"
          class="Icon"
        />
      </MonthRangePickerNext>
    </MonthRangePickerHeader>
    <div class="MonthRangePickerWrapper">
      <MonthRangePickerGrid class="MonthRangePickerGrid">
        <MonthRangePickerGridBody class="MonthRangePickerGridWrapper">
          <MonthRangePickerGridRow
            v-for="(months, index) in grid.rows"
            :key="`month-${index}`"
            class="MonthRangePickerGridRow"
          >
            <MonthRangePickerCell
              v-for="month in months"
              :key="month.toString()"
              :date="month"
              class="MonthRangePickerCell"
            >
              <MonthRangePickerCellTrigger
                :month="month"
                class="MonthRangePickerCellTrigger"
              />
            </MonthRangePickerCell>
          </MonthRangePickerGridRow>
        </MonthRangePickerGridBody>
      </MonthRangePickerGrid>
    </div>
  </MonthRangePickerRoot>
</template>
