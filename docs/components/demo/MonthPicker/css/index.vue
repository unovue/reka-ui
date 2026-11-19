<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import { MonthPickerCell, MonthPickerCellTrigger, MonthPickerGrid, MonthPickerGridBody, MonthPickerGridRow, MonthPickerHeader, MonthPickerHeading, MonthPickerNext, MonthPickerPrev, MonthPickerRoot } from 'reka-ui'
import './styles.css'

const date = new CalendarDate(2024, 10, 1)
</script>

<template>
  <MonthPickerRoot
    v-slot="{ grid }"
    :default-value="date"
    class="MonthPicker"
  >
    <MonthPickerHeader class="MonthPickerHeader">
      <MonthPickerPrev class="MonthPickerNavButton">
        <Icon
          icon="radix-icons:chevron-left"
          class="Icon"
        />
      </MonthPickerPrev>
      <MonthPickerHeading class="MonthPickerHeading" />
      <MonthPickerNext class="MonthPickerNavButton">
        <Icon
          icon="radix-icons:chevron-right"
          class="Icon"
        />
      </MonthPickerNext>
    </MonthPickerHeader>
    <div class="MonthPickerWrapper">
      <MonthPickerGrid class="MonthPickerGrid">
        <MonthPickerGridBody class="MonthPickerGridWrapper">
          <MonthPickerGridRow
            v-for="(months, index) in grid.rows"
            :key="`month-${index}`"
            class="MonthPickerGridRow"
          >
            <MonthPickerCell
              v-for="month in months"
              :key="month.toString()"
              :date="month"
              class="MonthPickerCell"
            >
              <MonthPickerCellTrigger
                :month="month"
                class="MonthPickerCellTrigger"
              />
            </MonthPickerCell>
          </MonthPickerGridRow>
        </MonthPickerGridBody>
      </MonthPickerGrid>
    </div>
  </MonthPickerRoot>
</template>
