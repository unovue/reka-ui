<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface LabelProps extends PrimitiveProps {
  /** The id of the element the label is associated with. */
  for?: string
}
</script>

<script setup lang="ts">
import { useRender } from '@/Primitive'

const props = withDefaults(defineProps<LabelProps>(), {
  as: 'label',
})

function onMousedown(event: MouseEvent) {
  // prevent text selection when double clicking label
  if (!event.defaultPrevented && event.detail > 1)
    event.preventDefault()
}

const { tag, renderProps, state, elementRef } = useRender({
  defaultTagName: 'label',
  as: () => props.as,
  asChild: () => props.asChild,
  props: () => ({ for: props.for, onMousedown }),
})
</script>

<template>
  <slot
    v-if="$slots.render"
    name="render"
    :props="renderProps"
    :state="state"
    :forward-ref="elementRef"
  />
  <component
    :is="tag"
    v-else
    v-bind="renderProps"
    :ref="elementRef"
  >
    <slot />
  </component>
</template>
