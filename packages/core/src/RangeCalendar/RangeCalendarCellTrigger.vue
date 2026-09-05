<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { CalendarUnit } from '@/date'
import type { PrimitiveProps } from '@/Primitive'

export interface RangeCalendarCellTriggerProps extends PrimitiveProps {
  /** The date value of the cell: a day, the first day of a month, or the first day of a year */
  value: DateValue
}

export interface RangeCalendarCellTriggerSlot {
  default?: (props: {
    /** Formatted cell text: `5`, `Sep`, `2026` */
    cellValue: string
    /** Current disable state */
    disabled: boolean
    /** Current selected state */
    selected: boolean
    /** Whether the cell is today / the current month / the current year */
    today: boolean
    /** Whether the cell belongs to a neighbouring page (a leading/trailing day) */
    outsideView: boolean
    /** Whether the cell's unit is outside the rendered page(s) */
    outsideVisibleView: boolean
    /** Current unavailable state */
    unavailable: boolean
    /** Current highlighted state */
    highlighted: boolean
    /** Current highlighted start state */
    highlightedStart: boolean
    /** Current highlighted end state */
    highlightedEnd: boolean
    /** Current selection start state */
    selectionStart: boolean
    /** Current selection end state */
    selectionEnd: boolean
    /** The unit the cell renders */
    view: CalendarUnit
  }) => any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectRangeCalendarGridContext } from './RangeCalendarGrid.vue'
import { injectRangeCalendarRootContext } from './RangeCalendarRoot.vue'
import { injectRangeCalendarViewContext } from './RangeCalendarView.vue'
import { getRangeCalendarCellTriggerSurface } from './useRangeCalendar'

const props = withDefaults(defineProps<RangeCalendarCellTriggerProps>(), { as: 'div' })
defineSlots<RangeCalendarCellTriggerSlot>()

const { forwardRef } = useForwardExpose()
const rootContext = injectRangeCalendarRootContext()
const viewContext = injectRangeCalendarViewContext(null)
const gridContext = injectRangeCalendarGridContext(null)

const surface = getRangeCalendarCellTriggerSurface(
  rootContext,
  () => props.value,
  () => gridContext?.value.value,
  () => viewContext?.unit.value,
)

const slotProps = computed(() => {
  const state = surface.state.value
  return {
    cellValue: surface.cellValue.value,
    disabled: state.disabled,
    selected: state.selected,
    today: state.today,
    outsideView: state.outsideView,
    outsideVisibleView: state.outsideVisibleView,
    unavailable: state.unavailable,
    highlighted: state.highlighted,
    highlightedStart: state.highlightedStart,
    highlightedEnd: state.highlightedEnd,
    selectionStart: state.selectionStart,
    selectionEnd: state.selectionEnd,
    view: state.view,
  }
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    v-bind="surface.attrs.value"
  >
    <slot v-bind="slotProps">
      {{ surface.cellValue.value }}
    </slot>
  </Primitive>
</template>
