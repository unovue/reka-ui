<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface RangeCalendarGridRowProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import type { Component } from 'vue'
import { h, useSlots } from 'vue'
import { Primitive } from '@/Primitive'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'

const props = withDefaults(defineProps<RangeCalendarGridRowProps>(), { as: 'tr' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const slots = useSlots()

// The slot content goes straight into the element: no `<slot>` fragment, so
// no empty anchor text nodes (this part renders once per week row).
function renderRoot() {
  // `Primitive` only for a consumer's `#render`, which it honours; `slots` hold it.
  return slots.render
    ? h(Primitive, { ref: forwardRef, ...props }, slots)
    : h(renderAs(props.as, props.asChild) as Component, { ref: forwardRef }, slots)
}
</script>

<template>
  <component :is="renderRoot()" />
</template>
