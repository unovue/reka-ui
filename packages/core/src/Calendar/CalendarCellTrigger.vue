<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { CalendarUnit } from '@/date'
import type { PrimitiveProps } from '@/Primitive'

export interface CalendarCellTriggerProps extends PrimitiveProps {
  /** The date value of the cell: a day, the first day of a month, or the first day of a year */
  value: DateValue
}

export interface CalendarCellTriggerSlot {
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
    /** The unit the cell renders */
    view: CalendarUnit
  }) => any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectCalendarGridContext } from './CalendarGrid.vue'
import { injectCalendarRootContext } from './CalendarRoot.vue'
import { injectCalendarViewContext } from './CalendarView.vue'
import { getCalendarCellTriggerSurface } from './useCalendar'

const props = withDefaults(defineProps<CalendarCellTriggerProps>(), { as: 'div' })
defineSlots<CalendarCellTriggerSlot>()

const { forwardRef } = useForwardExpose()
const rootContext = injectCalendarRootContext()
const viewContext = injectCalendarViewContext(null)
const gridContext = injectCalendarGridContext(null)

// Selection, keyboard navigation, aria and data attributes all come from the
// shared surface builder (single source with `useCalendar()`). The unit comes
// from the enclosing `CalendarView`, else the root's active view; the page
// from the enclosing `CalendarGrid`.
const surface = getCalendarCellTriggerSurface(
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
