<script lang="ts">
import type { DataOrientation } from '../types'
import type { PrimitiveProps } from '@/Primitive'

export interface BaseSeparatorProps extends PrimitiveProps {
  /**
   * Orientation of the component.
   *
   * Either `vertical` or `horizontal`. Defaults to `horizontal`.
   */
  orientation?: DataOrientation
  /**
   * Whether or not the component is purely decorative. <br>When `true`, accessibility-related attributes
   * are updated so that that the rendered element is removed from the accessibility tree.
   */
  decorative?: boolean
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useSeparator } from '@/Separator/useSeparator'
import { useForwardElement } from '@/shared'

const props = withDefaults(defineProps<BaseSeparatorProps>(), {
  orientation: 'horizontal',
})

const { root } = useSeparator({
  orientation: () => props.orientation,
  decorative: () => props.decorative,
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="root.attrs.value"
  >
    <slot />
  </Primitive>
</template>
