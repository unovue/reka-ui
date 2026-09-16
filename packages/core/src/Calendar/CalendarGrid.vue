<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { ComputedRef } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { createContext } from '@/shared'

export interface CalendarGridProps extends PrimitiveProps {
  /**
   * The page this grid renders (`page.value` from the `grid` slot prop): a month
   * in the day view, a year in the month view. Cells outside it are marked
   * `data-outside-view`.
   */
  value?: DateValue
}

export interface CalendarGridContext {
  value: ComputedRef<DateValue | undefined>
}

export const [injectCalendarGridContext, provideCalendarGridContext]
  = createContext<CalendarGridContext>('CalendarGrid')
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { injectCalendarRootContext } from './CalendarRoot.vue'
import { getCalendarGridSurface } from './useCalendar'

const props = withDefaults(defineProps<CalendarGridProps>(), { as: 'table' })

const rootContext = injectCalendarRootContext()
provideCalendarGridContext({ value: computed(() => props.value) })

const surface = getCalendarGridSurface(rootContext)
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
