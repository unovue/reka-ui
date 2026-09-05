<script lang="ts">
import type { CalendarPageFunction } from '@/date'
import type { PrimitiveProps } from '@/Primitive'

export interface RangeCalendarPrevProps extends PrimitiveProps {
  /** The function to be used for the prev page. Overwrites the `prevPage` function set on the `RangeCalendarRoot`. Receives the placeholder and the active view. */
  prevPage?: CalendarPageFunction
}

export interface RangeCalendarPrevSlot {
  default?: (props: {
    /** Current disable state */
    disabled: boolean
  }) => any
}
</script>

<script setup lang="ts">
import { getCalendarNavSurface } from '@/Calendar/useCalendar'
import { Primitive } from '@/Primitive'
import { injectRangeCalendarRootContext } from './RangeCalendarRoot.vue'

const props = withDefaults(defineProps<RangeCalendarPrevProps>(), { as: 'button' })
defineSlots<RangeCalendarPrevSlot>()

const rootContext = injectRangeCalendarRootContext()
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
