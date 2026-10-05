<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridRow, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot } from 'reka-ui'
import './styles.css'

const date = new CalendarDate(2024, 1, 1)
</script>

<template>
  <CalendarRoot
    v-slot="{ grid }"
    granularity="year"
    :default-value="date"
    class="CalendarYear"
  >
    <CalendarHeader class="CalendarYearHeader">
      <CalendarPrev class="CalendarYearNavButton">
        <Icon
          icon="radix-icons:chevron-left"
          class="Icon"
        />
      </CalendarPrev>
      <CalendarHeading class="CalendarYearHeading" />
      <CalendarNext class="CalendarYearNavButton">
        <Icon
          icon="radix-icons:chevron-right"
          class="Icon"
        />
      </CalendarNext>
    </CalendarHeader>
    <div class="CalendarYearWrapper">
      <CalendarGrid
        v-for="page in grid"
        :key="page.value.toString()"
        :value="page.value"
        class="CalendarYearGrid"
      >
        <CalendarGridBody class="CalendarYearGridWrapper">
          <CalendarGridRow
            v-for="(years, index) in page.rows"
            :key="`year-${index}`"
            class="CalendarYearGridRow"
          >
            <CalendarCell
              v-for="year in years"
              :key="year.toString()"
              :value="year"
              class="CalendarYearCell"
            >
              <CalendarCellTrigger
                :value="year"
                class="CalendarYearCellTrigger"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>
