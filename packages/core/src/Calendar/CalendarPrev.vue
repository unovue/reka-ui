<script lang="ts">
import type { CalendarPageFunction } from '@/date'
import type { PrimitiveProps } from '@/Primitive'

export interface CalendarPrevProps extends PrimitiveProps {
  /** The function to be used for the prev page. Overwrites the `prevPage` function set on the `CalendarRoot`. Receives the placeholder and the active view. */
  prevPage?: CalendarPageFunction
}

export interface CalendarPrevSlot {
  default?: (props: {
    /** Current disable state */
    disabled: boolean
  }) => any
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectCalendarRootContext } from './CalendarRoot.vue'
import { getCalendarNavSurface } from './useCalendar'

const props = withDefaults(defineProps<CalendarPrevProps>(), { as: 'button' })
defineSlots<CalendarPrevSlot>()

const rootContext = injectCalendarRootContext()
const surface = getCalendarNavSurface(rootContext, 'prev', () => props.prevPage)
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    :type="props.as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot :disabled="surface.state.value.disabled">
      Prev page
    </slot>
  </Primitive>
</template>
