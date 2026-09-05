<script lang="ts">
import type { CalendarPageFunction } from '@/date'
import type { PrimitiveProps } from '@/Primitive'

export interface RangeCalendarNextProps extends PrimitiveProps {
  /** The function to be used for the next page. Overwrites the `nextPage` function set on the `RangeCalendarRoot`. Receives the placeholder and the active view. */
  nextPage?: CalendarPageFunction
}

export interface RangeCalendarNextSlot {
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

const props = withDefaults(defineProps<RangeCalendarNextProps>(), { as: 'button' })
defineSlots<RangeCalendarNextSlot>()

const rootContext = injectRangeCalendarRootContext()
const surface = getCalendarNavSurface(rootContext, 'next', () => props.nextPage)
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    :type="props.as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot :disabled="surface.state.value.disabled">
      Next page
    </slot>
  </Primitive>
</template>
