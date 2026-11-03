<script lang="ts">
import type { DateValue } from '@/date'
import type { PrimitiveProps } from '@/Primitive'

export interface RangeCalendarCellProps extends PrimitiveProps {
  /** The date value for the cell */
  value: DateValue
}
</script>

<script setup lang="ts">
import type { Component } from 'vue'
import { h, useSlots } from 'vue'
import { Primitive } from '@/Primitive'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectRangeCalendarGridContext } from './RangeCalendarGrid.vue'
import { injectRangeCalendarRootContext } from './RangeCalendarRoot.vue'
import { getRangeCalendarCellSurface } from './useRangeCalendar'

const props = withDefaults(defineProps<RangeCalendarCellProps>(), { as: 'td' })

const rootContext = injectRangeCalendarRootContext()
const gridContext = injectRangeCalendarGridContext(null)

const surface = getRangeCalendarCellSurface(rootContext, () => props.value, () => gridContext?.value.value)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const slots = useSlots()

// The slot content goes straight into the element: no `<slot>` fragment, so
// no empty anchor text nodes (this part renders once per calendar cell).
function renderRoot() {
  // `Primitive` only for a consumer's `#render`, which it honours; `slots` hold it.
  return slots.render
    ? h(Primitive, { ref: forwardRef, as: props.as, asChild: props.asChild, ...surface.attrs.value }, slots)
    : h(renderAs(props.as, props.asChild) as Component, { ref: forwardRef, ...surface.attrs.value }, slots)
}
</script>

<template>
  <component :is="renderRoot()" />
</template>
