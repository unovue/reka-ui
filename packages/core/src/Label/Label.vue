<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface LabelProps extends PrimitiveProps {
  /** The id of the element the label is associated with. */
  for?: string
}
</script>

<script setup lang="ts">
import { mergeProps, useAttrs } from 'vue'
import { useRender } from '@/Primitive'
import { useLabel } from './useLabel'

// Attrs are folded into `renderProps` below so they reach the element on both
// the default path and the `#render` path (where the root is a fragment and Vue
// cannot apply fallthrough attrs). Disabling inheritance keeps them applied once.
defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<LabelProps>(), {
  as: 'label',
})
const attrs = useAttrs()
const { root } = useLabel({ for: () => props.for })

const { tag, renderProps, state, elementRef, expose } = useRender({
  defaultTagName: 'label',
  as: () => props.as,
  asChild: () => props.asChild,
  // Consumer attrs merge last so their listeners chain after Label's own.
  props: () => mergeProps(root.attrs.value, attrs),
})
defineExpose(expose)
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
