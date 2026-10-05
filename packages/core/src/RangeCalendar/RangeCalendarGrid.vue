<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { ComputedRef } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { createContext } from '@/shared'

export interface RangeCalendarGridProps extends PrimitiveProps {
  /**
   * The page this grid renders (`page.value` from the `grid` slot prop): a month
   * in the day view, a year in the month view. Cells outside it are marked
   * `data-outside-view`.
   */
  value?: DateValue
}

export interface RangeCalendarGridContext {
  value: ComputedRef<DateValue | undefined>
}

export const [injectRangeCalendarGridContext, provideRangeCalendarGridContext]
  = createContext<RangeCalendarGridContext>('RangeCalendarGrid')
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { getCalendarGridSurface } from '@/Calendar/useCalendar'
import { Primitive } from '@/Primitive'
import { injectRangeCalendarRootContext } from './RangeCalendarRoot.vue'

const props = withDefaults(defineProps<RangeCalendarGridProps>(), { as: 'table' })

const rootContext = injectRangeCalendarRootContext()
provideRangeCalendarGridContext({ value: computed(() => props.value) })

const surface = getCalendarGridSurface(rootContext)
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="surface.attrs.value"
    @mouseleave="rootContext.setFocusedValue(undefined)"
  >
    <slot />
  </Primitive>
</template>
