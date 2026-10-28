<script setup lang="ts">
import type { PropType } from 'vue'
import type { DateValue } from '@/date'
import { defineComponent, h } from 'vue'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridRow, RangeCalendarRoot } from '@/RangeCalendar'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridRow, CalendarRoot } from '..'

// Test fixture: a calendar (or range calendar) whose cell triggers report each
// render, by cell value. The trigger sits in a component of its own so the
// counting slot reads no `v-for` variable: a slot that does is compiled as
// dynamic and re-renders its component on every parent render, which would
// count the fixture's renders rather than the cell's.
const props = withDefaults(defineProps<{
  range?: boolean
  rootProps?: Record<string, unknown>
  showSlot?: boolean
  onCellRender?: (key: string) => void
}>(), { showSlot: true })

const Root = props.range ? RangeCalendarRoot : CalendarRoot
const Grid = props.range ? RangeCalendarGrid : CalendarGrid
const Body = props.range ? RangeCalendarGridBody : CalendarGridBody
const Row = props.range ? RangeCalendarGridRow : CalendarGridRow
const Cell = props.range ? RangeCalendarCell : CalendarCell
const Trigger = props.range ? RangeCalendarCellTrigger : CalendarCellTrigger

const CountedTrigger = defineComponent({
  props: { value: { type: Object as PropType<DateValue>, required: true } },
  setup(p) {
    return () => h(Trigger, { value: p.value }, {
      default: ({ cellValue }: { cellValue: string }) => {
        props.onCellRender?.(p.value.toString())
        return props.showSlot ? h('span', cellValue) : undefined
      },
    })
  },
})
</script>

<template>
  <component
    :is="Root"
    v-slot="{ grid }"
    v-bind="props.rootProps"
    data-testid="calendar"
  >
    <component
      :is="Grid"
      v-for="month in grid"
      :key="month.value.toString()"
      :value="month.value"
    >
      <component :is="Body">
        <component
          :is="Row"
          v-for="(weekDates, index) in month.rows"
          :key="index"
        >
          <component
            :is="Cell"
            v-for="weekDate in weekDates"
            :key="weekDate.toString()"
            :value="weekDate"
          >
            <CountedTrigger :value="weekDate" />
          </component>
        </component>
      </component>
    </component>
  </component>
</template>
