<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { PrimitiveProps } from '@/Primitive'

export interface CalendarCellProps extends PrimitiveProps {
  /** The date value for the cell */
  value: DateValue
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectCalendarGridContext } from './CalendarGrid.vue'
import { injectCalendarRootContext } from './CalendarRoot.vue'
import { getCalendarCellSurface } from './useCalendar'

const props = withDefaults(defineProps<CalendarCellProps>(), { as: 'td' })

const rootContext = injectCalendarRootContext()
const gridContext = injectCalendarGridContext(null)

const surface = getCalendarCellSurface(rootContext, () => props.value, () => gridContext?.value.value)
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="surface.attrs.value"
  >
    <slot />
  </Primitive>
</template>
