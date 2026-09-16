<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridRow, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot } from 'reka-ui'
import './styles.css'

const date = new CalendarDate(2024, 10, 1)
</script>

<template>
  <CalendarRoot
    v-slot="{ grid }"
    granularity="month"
    :default-value="date"
    class="CalendarMonth"
  >
    <CalendarHeader class="CalendarMonthHeader">
      <CalendarPrev class="CalendarMonthNavButton">
        <Icon
          icon="radix-icons:chevron-left"
          class="Icon"
        />
      </CalendarPrev>
      <CalendarHeading class="CalendarMonthHeading" />
      <CalendarNext class="CalendarMonthNavButton">
        <Icon
          icon="radix-icons:chevron-right"
          class="Icon"
        />
      </CalendarNext>
    </CalendarHeader>
    <div class="CalendarMonthWrapper">
      <CalendarGrid
        v-for="page in grid"
        :key="page.value.toString()"
        :value="page.value"
        class="CalendarMonthGrid"
      >
        <CalendarGridBody class="CalendarMonthGridWrapper">
          <CalendarGridRow
            v-for="(months, index) in page.rows"
            :key="`month-${index}`"
            class="CalendarMonthGridRow"
          >
            <CalendarCell
              v-for="month in months"
              :key="month.toString()"
              :value="month"
              class="CalendarMonthCell"
            >
              <CalendarCellTrigger
                :value="month"
                class="CalendarMonthCellTrigger"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>
