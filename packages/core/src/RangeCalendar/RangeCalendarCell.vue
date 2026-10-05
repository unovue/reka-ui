<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { PrimitiveProps } from '@/Primitive'

export interface RangeCalendarCellProps extends PrimitiveProps {
  /** The date value for the cell */
  value: DateValue
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectRangeCalendarGridContext } from './RangeCalendarGrid.vue'
import { injectRangeCalendarRootContext } from './RangeCalendarRoot.vue'
import { getRangeCalendarCellSurface } from './useRangeCalendar'

const props = withDefaults(defineProps<RangeCalendarCellProps>(), { as: 'td' })

const rootContext = injectRangeCalendarRootContext()
const gridContext = injectRangeCalendarGridContext(null)

const surface = getRangeCalendarCellSurface(rootContext, () => props.value, () => gridContext?.value.value)
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
