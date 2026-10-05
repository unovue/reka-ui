<script lang="ts" setup>
import type { DatePickerRootEmits, DatePickerRootProps } from '..'
import { useForwardPropsEmits } from '@/shared'
import { DatePickerCalendar, DatePickerCell, DatePickerCellTrigger, DatePickerContent, DatePickerField, DatePickerGrid, DatePickerGridBody, DatePickerGridHead, DatePickerGridRow, DatePickerHeadCell, DatePickerHeader, DatePickerInput, DatePickerNext, DatePickerPrev, DatePickerRoot, DatePickerTrigger, DatePickerView, DatePickerViewTrigger } from '..'

/** Test harness: a date picker whose popover calendar drills between the day, month and year views. */
const props = defineProps<DatePickerRootProps>()
const emits = defineEmits<DatePickerRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DatePickerRoot
    v-bind="forwarded"
    data-testid="picker"
  >
    <DatePickerField
      v-slot="{ segments }"
      data-testid="input"
    >
      <DatePickerInput
        v-for="item in segments"
        :key="item.part"
        :part="item.part"
      >
        {{ item.value }}
      </DatePickerInput>
      <DatePickerTrigger data-testid="trigger">
        Open
      </DatePickerTrigger>
    </DatePickerField>

    <DatePickerContent data-testid="popover-content">
      <DatePickerCalendar data-testid="calendar">
        <DatePickerHeader>
          <DatePickerPrev data-testid="prev-button" />
          <DatePickerViewTrigger data-testid="view-trigger" />
          <DatePickerNext data-testid="next-button" />
        </DatePickerHeader>

        <DatePickerView
          v-slot="{ grid, weekDays }"
          view="day"
          data-testid="view-day"
        >
          <DatePickerGrid
            v-for="month in grid"
            :key="month.value.toString()"
            :value="month.value"
          >
            <DatePickerGridHead>
              <DatePickerGridRow>
                <DatePickerHeadCell
                  v-for="day in weekDays"
                  :key="day"
                >
                  {{ day }}
                </DatePickerHeadCell>
              </DatePickerGridRow>
            </DatePickerGridHead>
            <DatePickerGridBody>
              <DatePickerGridRow
                v-for="(weekDates, index) in month.rows"
                :key="`weekDate-${index}`"
              >
                <DatePickerCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  :value="weekDate"
                >
                  <DatePickerCellTrigger
                    :value="weekDate"
                    :data-testid="`day-${weekDate.toString()}`"
                  />
                </DatePickerCell>
              </DatePickerGridRow>
            </DatePickerGridBody>
          </DatePickerGrid>
        </DatePickerView>

        <DatePickerView
          v-for="unit in (['month', 'year'] as const)"
          :key="unit"
          v-slot="{ grid }"
          :view="unit"
          :data-testid="`view-${unit}`"
        >
          <DatePickerGrid
            v-for="page in grid"
            :key="page.value.toString()"
            :value="page.value"
          >
            <DatePickerGridBody>
              <DatePickerGridRow
                v-for="(row, index) in page.rows"
                :key="`row-${index}`"
              >
                <DatePickerCell
                  v-for="cell in row"
                  :key="cell.toString()"
                  :value="cell"
                >
                  <DatePickerCellTrigger
                    :value="cell"
                    :data-testid="`${unit}-${cell.toString()}`"
                  />
                </DatePickerCell>
              </DatePickerGridRow>
            </DatePickerGridBody>
          </DatePickerGrid>
        </DatePickerView>
      </DatePickerCalendar>
    </DatePickerContent>
  </DatePickerRoot>
</template>
