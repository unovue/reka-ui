<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import { YearPickerCell, YearPickerCellTrigger, YearPickerGrid, YearPickerGridBody, YearPickerGridRow, YearPickerHeader, YearPickerHeading, YearPickerNext, YearPickerPrev, YearPickerRoot } from 'reka-ui'
import './styles.css'

const date = new CalendarDate(2024, 1, 1)
</script>

<template>
  <YearPickerRoot
    v-slot="{ grid }"
    :default-value="date"
    class="YearPicker"
  >
    <YearPickerHeader class="YearPickerHeader">
      <YearPickerPrev class="YearPickerNavButton">
        <Icon
          icon="radix-icons:chevron-left"
          class="Icon"
        />
      </YearPickerPrev>
      <YearPickerHeading class="YearPickerHeading" />
      <YearPickerNext class="YearPickerNavButton">
        <Icon
          icon="radix-icons:chevron-right"
          class="Icon"
        />
      </YearPickerNext>
    </YearPickerHeader>
    <div class="YearPickerWrapper">
      <YearPickerGrid class="YearPickerGrid">
        <YearPickerGridBody class="YearPickerGridWrapper">
          <YearPickerGridRow
            v-for="(years, index) in grid.rows"
            :key="`year-${index}`"
            class="YearPickerGridRow"
          >
            <YearPickerCell
              v-for="year in years"
              :key="year.toString()"
              :date="year"
              class="YearPickerCell"
            >
              <YearPickerCellTrigger
                :year="year"
                class="YearPickerCellTrigger"
              />
            </YearPickerCell>
          </YearPickerGridRow>
        </YearPickerGridBody>
      </YearPickerGrid>
    </div>
  </YearPickerRoot>
</template>
