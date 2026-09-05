<script lang="ts">
import type { CalendarPageFunction } from '@/date'
import type { PrimitiveProps } from '@/Primitive'

export interface CalendarNextProps extends PrimitiveProps {
  /** The function to be used for the next page. Overwrites the `nextPage` function set on the `CalendarRoot`. Receives the placeholder and the active view. */
  nextPage?: CalendarPageFunction
}

export interface CalendarNextSlot {
  default?: (props: {
    /** Current disable state */
    disabled: boolean
  }) => any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { injectCalendarRootContext } from './CalendarRoot.vue'
import { getCalendarNavSurface } from './useCalendar'

const props = withDefaults(defineProps<CalendarNextProps>(), { as: 'button' })
defineSlots<CalendarNextSlot>()

const rootContext = injectCalendarRootContext()
const surface = getCalendarNavSurface(rootContext, 'next', computed(() => props.nextPage))
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
